from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
import random

from .models import VendorProfile, RFQ, RFQItem, Quotation, QuotationItem, Approval, PurchaseOrder, Invoice, ActivityLog
from .serializers import (
    UserSerializer, VendorProfileSerializer, RFQSerializer, 
    QuotationSerializer, ApprovalSerializer, PurchaseOrderSerializer, 
    InvoiceSerializer, ActivityLogSerializer
)

User = get_user_model()

class RegistrationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @decorators.action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Log update activity
            ActivityLog.objects.create(
                user=user,
                action="Profile Updated",
                description="User updated profile information."
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VendorViewSet(viewsets.ModelViewSet):
    queryset = VendorProfile.objects.all().order_by('-joined_at')
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = VendorProfile.objects.all().order_by('-joined_at')
        # Allow filtering by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            return qs.filter(status=status_filter)
        return qs

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role not in ['admin', 'manager']:
            return Response({"detail": "Only admins or managers can approve vendors."}, status=status.HTTP_403_FORBIDDEN)
        
        vendor_profile = self.get_object()
        action_val = request.data.get('action', 'approved') # approved or rejected
        
        if action_val not in ['approved', 'rejected']:
            return Response({"detail": "Invalid action. Use 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)
            
        vendor_profile.status = action_val
        vendor_profile.save()
        
        # Enable or disable user login
        vendor_user = vendor_profile.user
        vendor_user.is_active = (action_val == 'approved')
        vendor_user.save()

        ActivityLog.objects.create(
            user=request.user,
            action=f"Vendor {action_val.capitalize()}",
            description=f"Vendor {vendor_user.company_name} status updated to {action_val}."
        )

        return Response(VendorProfileSerializer(vendor_profile).data)

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all().order_by('-created_at')
    serializer_class = RFQSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = RFQ.objects.all().order_by('-created_at')
        
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        if user.role == 'vendor':
            return qs.filter(status__in=['open', 'closed'])
        return qs

    def perform_create(self, serializer):
        rfq = serializer.save(created_by=self.request.user, status='open')
        ActivityLog.objects.create(
            user=self.request.user,
            action="RFQ Created",
            description=f"Created RFQ-{rfq.id}: '{rfq.title}'"
        )

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by('-created_at')
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Quotation.objects.all().order_by('-created_at')
        if user.role == 'vendor':
            return qs.filter(vendor=user)
        rfq_id = self.request.query_params.get('rfq', None)
        if rfq_id:
            return qs.filter(rfq_id=rfq_id)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != 'vendor':
            return Response({"detail": "Only vendor accounts can submit quotations."}, status=status.HTTP_403_FORBIDDEN)
            
        # Verify if vendor is approved
        try:
            profile = request.user.vendor_profile
            if profile.status != 'approved':
                return Response({"detail": "Your vendor profile must be approved before you can submit quotes."}, status=status.HTTP_403_FORBIDDEN)
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Parse request data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quotation = serializer.save(vendor=request.user)

        ActivityLog.objects.create(
            user=request.user,
            action="Quotation Submitted",
            description=f"Submitted quote for RFQ-{quotation.rfq.id} total: ${quotation.total_price}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=['post'])
    def select(self, request, pk=None):
        if request.user.role not in ['admin', 'manager']:
            return Response({"detail": "Only admins or managers can select quotations."}, status=status.HTTP_403_FORBIDDEN)
        
        quote = self.get_object()
        rfq = quote.rfq

        if rfq.status == 'closed':
            return Response({"detail": "This RFQ has already been completed/closed."}, status=status.HTTP_400_BAD_REQUEST)

        # Mark quote as accepted, reject others
        quote.status = 'accepted'
        quote.save()
        rfq.quotations.exclude(id=quote.id).update(status='rejected')

        rfq.status = 'under_review'
        rfq.save()

        # Create Approval request workflow
        approval = Approval.objects.create(
            rfq=rfq,
            quotation=quote,
            stage='manager_review',
            status='pending',
            comments=f"Select quote from {quote.vendor.company_name} for approval workflow."
        )

        ActivityLog.objects.create(
            user=request.user,
            action="Quotation Selected",
            description=f"Selected quote from {quote.vendor.company_name} for RFQ-{rfq.id}. Approval workflow triggered."
        )

        return Response(ApprovalSerializer(approval).data)

class ApprovalViewSet(viewsets.ModelViewSet):
    queryset = Approval.objects.all().order_by('-created_at')
    serializer_class = ApprovalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Approval.objects.all().order_by('-created_at')
        if user.role == 'vendor':
            return qs.filter(quotation__vendor=user)
        return qs

    @decorators.action(detail=True, methods=['post'])
    def action(self, request, pk=None):
        if request.user.role not in ['admin', 'manager']:
            return Response({"detail": "Only admins or managers can approve or reject workflows."}, status=status.HTTP_403_FORBIDDEN)

        approval = self.get_object()
        action_val = request.data.get('action') # approved or rejected
        comments = request.data.get('comments', '')

        if action_val not in ['approved', 'rejected']:
            return Response({"detail": "Invalid action. Use 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        approval.status = action_val
        approval.comments = comments
        approval.actioned_by = request.user
        approval.actioned_at = timezone.now()
        approval.save()

        rfq = approval.rfq
        quote = approval.quotation

        if action_val == 'approved':
            if approval.stage == 'manager_review':
                # Advance to Final Approval
                # For simplicity, if manager approves, we auto-approve or move to final approval.
                # Let's say final approval is achieved now.
                approval.stage = 'final_approval'
                approval.save()
                
                # Close RFQ and generate PO
                rfq.status = 'closed'
                rfq.save()
                
                # Generate PO
                po_num = f"PO-{timezone.now().strftime('%Y%m%d')}-{random.randint(100, 999)}"
                po = PurchaseOrder.objects.create(
                    rfq=rfq,
                    quotation=quote,
                    po_number=po_num,
                    status='sent',
                    total_amount=quote.total_price,
                    terms="Net 30. Standard procurement terms apply."
                )

                ActivityLog.objects.create(
                    user=request.user,
                    action="Quotation Approved",
                    description=f"Approved quote for RFQ-{rfq.id}. Generated PO-{po_num}."
                )
            else:
                # If already final_approval
                pass
        else:
            # If rejected
            rfq.status = 'open'
            rfq.save()
            quote.status = 'rejected'
            quote.save()

            ActivityLog.objects.create(
                user=request.user,
                action="Quotation Rejected",
                description=f"Rejected quote for RFQ-{rfq.id}. RFQ re-opened."
            )

        return Response(ApprovalSerializer(approval).data)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PurchaseOrder.objects.all().order_by('-created_at')
        if user.role == 'vendor':
            return qs.filter(quotation__vendor=user)
        return qs

    @decorators.action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        if request.user.role != 'vendor':
            return Response({"detail": "Only vendors can acknowledge POs."}, status=status.HTTP_403_FORBIDDEN)
            
        po = self.get_object()
        if po.quotation.vendor != request.user:
            return Response({"detail": "This PO does not belong to you."}, status=status.HTTP_403_FORBIDDEN)

        po.status = 'acknowledged'
        po.save()

        ActivityLog.objects.create(
            user=request.user,
            action="PO Acknowledged",
            description=f"Acknowledged PO-{po.po_number}"
        )

        return Response(PurchaseOrderSerializer(po).data)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.all().order_by('-created_at')
        if user.role == 'vendor':
            return qs.filter(po__quotation__vendor=user)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != 'vendor':
            return Response({"detail": "Only vendors can submit invoices."}, status=status.HTTP_403_FORBIDDEN)

        po_id = request.data.get('po')
        po = get_object_or_404(PurchaseOrder, id=po_id)
        
        if po.quotation.vendor != request.user:
            return Response({"detail": "This PO does not belong to you."}, status=status.HTTP_403_FORBIDDEN)

        inv_num = f"INV-{timezone.now().strftime('%Y%m%d')}-{random.randint(100, 999)}"
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save(invoice_number=inv_num, status='submitted')

        po.status = 'completed'
        po.save()

        ActivityLog.objects.create(
            user=request.user,
            action="Invoice Submitted",
            description=f"Submitted invoice {inv_num} for PO-{po.po_number}"
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        if request.user.role not in ['admin', 'manager']:
            return Response({"detail": "Only admins or managers can approve payments."}, status=status.HTTP_403_FORBIDDEN)

        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.save()

        ActivityLog.objects.create(
            user=request.user,
            action="Invoice Paid",
            description=f"Invoice {invoice.invoice_number} marked as PAID."
        )

        return Response(InvoiceSerializer(invoice).data)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        if request.user.role == 'vendor':
            # Vendor stats
            my_quotes = Quotation.objects.filter(vendor=request.user)
            submitted_count = my_quotes.count()
            accepted_count = my_quotes.filter(status='accepted').count()
            total_earned = PurchaseOrder.objects.filter(quotation__vendor=request.user, status='completed').aggregate(sum=Sum('total_amount'))['sum'] or 0.00
            
            try:
                rating = float(request.user.vendor_profile.rating)
            except Exception:
                rating = 5.00
            
            # Vendor monthly revenue breakdown (last 6 months)
            monthly_revenue_data = []
            now = timezone.now()
            for i in range(5, -1, -1):
                month_date = now - timedelta(days=i*30)
                month_name = month_date.strftime("%B")
                revenue = PurchaseOrder.objects.filter(
                    quotation__vendor=request.user,
                    status='completed',
                    created_at__year=month_date.year,
                    created_at__month=month_date.month
                ).aggregate(sum=Sum('total_amount'))['sum'] or 0.00
                
                monthly_revenue_data.append({
                    "month": month_name,
                    "revenue": float(revenue)
                })

            return Response({
                "role": "vendor",
                "stats": {
                    "submitted_quotes": submitted_count,
                    "accepted_quotes": accepted_count,
                    "total_revenue": total_earned,
                    "rating": rating,
                },
                "monthly_spend": monthly_revenue_data
            })
            
        # Admin / Manager Stats
        total_spend = PurchaseOrder.objects.exclude(status='draft').aggregate(sum=Sum('total_amount'))['sum'] or 0.00
        open_rfqs = RFQ.objects.filter(status='open').count()
        pending_approvals = Approval.objects.filter(status='pending').count()
        active_vendors = VendorProfile.objects.filter(status='approved').count()

        # Calculate live stats
        total_bids = Quotation.objects.count()
        total_pos = PurchaseOrder.objects.count()
        completed_pos = PurchaseOrder.objects.filter(status='completed').count()
        fulfillment_rate = f"{int((completed_pos / total_pos) * 100)}%" if total_pos > 0 else "0%"

        # Spend by Category
        categories = VendorProfile.objects.filter(status='approved').values('category').annotate(
            total_spend=Sum('user__submitted_quotations__purchaseorder__total_amount')
        )
        category_data = []
        for cat in categories:
            if cat['category'] and cat['total_spend']:
                category_data.append({
                    "name": cat['category'],
                    "value": float(cat['total_spend'])
                })

        # Monthly spend (last 6 months)
        monthly_spend_data = []
        now = timezone.now()
        for i in range(5, -1, -1):
            month_date = now - timedelta(days=i*30)
            month_name = month_date.strftime("%B")
            spend = PurchaseOrder.objects.filter(
                created_at__year=month_date.year,
                created_at__month=month_date.month
            ).exclude(status='draft').aggregate(sum=Sum('total_amount'))['sum'] or 0.00
            
            monthly_spend_data.append({
                "month": month_name,
                "spend": float(spend)
            })

        # Top vendors by spend
        top_vendors = VendorProfile.objects.filter(status='approved').annotate(
            spend=Sum('user__submitted_quotations__purchaseorder__total_amount')
        ).order_by('-spend')[:5]
        
        vendor_data = []
        for v in top_vendors:
            if v.spend:
                vendor_data.append({
                    "vendor": v.user.company_name or v.user.username,
                    "spend": float(v.spend),
                    "rfqs": v.user.submitted_quotations.count()
                })

        return Response({
            "role": "admin",
            "stats": {
                "total_spend": float(total_spend),
                "open_rfqs": open_rfqs,
                "pending_approvals": pending_approvals,
                "active_vendors": active_vendors,
                "total_bids": total_bids,
                "fulfillment_rate": fulfillment_rate
            },
            "spend_by_category": category_data,
            "monthly_spend": monthly_spend_data,
            "top_vendors": vendor_data
        })

