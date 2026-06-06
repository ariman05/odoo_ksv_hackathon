from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegistrationViewSet, UserProfileViewSet, VendorViewSet, RFQViewSet, 
    QuotationViewSet, ApprovalViewSet, PurchaseOrderViewSet, InvoiceViewSet, 
    ActivityLogViewSet, ReportsViewSet
)

router = DefaultRouter()
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'rfqs', RFQViewSet, basename='rfq')
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'approvals', ApprovalViewSet, basename='approval')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'activity', ActivityLogViewSet, basename='activity')

urlpatterns = [
    path('auth/register/', RegistrationViewSet.as_view({'post': 'register'}), name='auth-register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileViewSet.as_view({'get': 'me', 'put': 'me', 'patch': 'me'}), name='auth-me'),
    path('reports/', ReportsViewSet.as_view({'get': 'list'}), name='reports-list'),
    path('', include(router.urls)),
]
