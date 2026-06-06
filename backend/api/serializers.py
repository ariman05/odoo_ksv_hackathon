from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VendorProfile, RFQ, RFQItem, Quotation, QuotationItem, Approval, PurchaseOrder, Invoice, ActivityLog

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'first_name', 'last_name', 
            'role', 'phone', 'company_name', 'address', 'city', 'state', 
            'country', 'additional_info'
        )

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', 'vendor')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # If user is a vendor, auto-create a VendorProfile
        if role == 'vendor':
            VendorProfile.objects.create(
                user=user,
                contact_person=f"{user.first_name} {user.last_name}".strip() or user.username,
                status='pending',
                category='General'
            )
        
        # Log registration activity
        ActivityLog.objects.create(
            user=user,
            action="User Registered",
            description=f"User registered as {role} with company {user.company_name or 'N/A'}"
        )
        return user

class VendorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    company_name = serializers.CharField(source='user.company_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    address = serializers.CharField(source='user.address', read_only=True)
    city = serializers.CharField(source='user.city', read_only=True)
    state = serializers.CharField(source='user.state', read_only=True)
    country = serializers.CharField(source='user.country', read_only=True)

    class Meta:
        model = VendorProfile
        fields = (
            'id', 'user', 'username', 'email', 'company_name', 'phone', 
            'address', 'city', 'state', 'country', 'contact_person', 
            'status', 'rating', 'category', 'joined_at'
        )

class RFQItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQItem
        fields = ('id', 'item_name', 'description', 'quantity', 'target_price')

class RFQSerializer(serializers.ModelSerializer):
    items = RFQItemSerializer(many=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    quotations_count = serializers.IntegerField(source='quotations.count', read_only=True)

    class Meta:
        model = RFQ
        fields = ('id', 'title', 'description', 'deadline', 'status', 'created_by', 'created_by_name', 'created_at', 'items', 'quotations_count')
        read_only_fields = ('created_by', 'status')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        rfq = RFQ.objects.create(**validated_data)
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        return rfq

class QuotationItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='rfq_item.item_name', read_only=True)

    class Meta:
        model = QuotationItem
        fields = ('id', 'rfq_item', 'item_name', 'unit_price', 'total_price')

class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    vendor_name = serializers.SerializerMethodField()
    rfq_title = serializers.CharField(source='rfq.title', read_only=True)

    class Meta:
        model = Quotation
        fields = ('id', 'rfq', 'rfq_title', 'vendor', 'vendor_name', 'delivery_date', 'shipping_cost', 'total_price', 'status', 'comments', 'created_at', 'items')
        read_only_fields = ('vendor', 'status')

    def get_vendor_name(self, obj):
        return obj.vendor.company_name or f"{obj.vendor.first_name} {obj.vendor.last_name}".strip() or obj.vendor.username

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        return quotation

class ApprovalSerializer(serializers.ModelSerializer):
    actioned_by_name = serializers.CharField(source='actioned_by.username', read_only=True)
    rfq_title = serializers.CharField(source='rfq.title', read_only=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    total_price = serializers.DecimalField(source='quotation.total_price', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Approval
        fields = ('id', 'rfq', 'rfq_title', 'quotation', 'vendor_name', 'total_price', 'stage', 'status', 'comments', 'actioned_by', 'actioned_by_name', 'actioned_at', 'created_at')
        read_only_fields = ('actioned_by', 'actioned_at')

    def get_vendor_name(self, obj):
        if obj.quotation:
            return obj.quotation.vendor.company_name or obj.quotation.vendor.username
        return None

class PurchaseOrderSerializer(serializers.ModelSerializer):
    rfq_title = serializers.CharField(source='rfq.title', read_only=True)
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = ('id', 'rfq', 'rfq_title', 'quotation', 'vendor_name', 'po_number', 'status', 'total_amount', 'terms', 'created_at')
        read_only_fields = ('po_number', 'status')

    def get_vendor_name(self, obj):
        return obj.quotation.vendor.company_name or obj.quotation.vendor.username

class InvoiceSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(source='po.po_number', read_only=True)
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ('id', 'po', 'po_number', 'vendor_name', 'invoice_number', 'total_amount', 'status', 'due_date', 'comments', 'created_at')
        read_only_fields = ('status', 'invoice_number')

    def get_vendor_name(self, obj):
        return obj.po.quotation.vendor.company_name or obj.po.quotation.vendor.username

class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'user', 'username', 'action', 'description', 'created_at')
