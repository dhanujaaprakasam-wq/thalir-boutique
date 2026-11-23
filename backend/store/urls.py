from django.urls import path
from .views import (
    CategoryListView, ProductListView, ProductDetailView, ProductRecordView,
    OrderListCreateView, OrderDetailUpdateView,
    CustomerLoginView, CustomerRegisterView, SendOtpView, VerifyOtpView, CustomerForgotPasswordView, GoogleLoginView,
    ReviewListView, AdminMetricsView, CustomerListView, CustomerDetailView,
    LedgerListView, LedgerDetailView, InventoryManagementView,
    SupplierListView, SupplierDetailView, PurchaseOrderListView,
    OfferDiscountListView, OfferDiscountDetailView, ReturnRefundListView, StoreSettingView,
    ToggleOrderStockView, CartView, CartAddView, CartUpdateView, CartRemoveView, CartClearView,
    InstagramFeedListView, InstagramSyncView, InstagramPostManageView,
    RestockNotificationView, BroadcastRecipientListView, BroadcastMessageView,
    RazorpayCreateOrderView, RazorpayVerifyPaymentView,
    CodSendOtpView, CodVerifyOtpView,
    OrderTrackingView, ProductReviewsView, WhatsAppNotificationView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<str:pk_or_code>/view/', ProductRecordView.as_view(), name='product-record-view'),
    path('products/<str:pk_or_code>/reviews/', ProductReviewsView.as_view(), name='product-reviews'),
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<str:order_id>/', OrderDetailUpdateView.as_view(), name='order-detail-update'),
    path('orders/<str:order_id>/toggle-stock/', ToggleOrderStockView.as_view(), name='order-toggle-stock'),
    path('orders/<str:order_id>/tracking/', OrderTrackingView.as_view(), name='order-tracking'),
    path('orders/<str:order_id>/whatsapp-notify/', WhatsAppNotificationView.as_view(), name='order-whatsapp-notify'),
    
    # Razorpay Payment Gateway
    path('payment/razorpay/create-order/', RazorpayCreateOrderView.as_view(), name='razorpay-create-order'),
    path('payment/razorpay/verify/', RazorpayVerifyPaymentView.as_view(), name='razorpay-verify'),
    
    # Cash on Delivery (COD) with SMS OTP Verification
    path('payment/cod/send-otp/', CodSendOtpView.as_view(), name='cod-send-otp'),
    path('payment/cod/verify-otp/', CodVerifyOtpView.as_view(), name='cod-verify-otp'),

    path('auth/login/', CustomerLoginView.as_view(), name='auth-login'),
    path('auth/register/', CustomerRegisterView.as_view(), name='auth-register'),
    path('auth/send-otp/', SendOtpView.as_view(), name='auth-send-otp'),
    path('auth/verify-otp/', VerifyOtpView.as_view(), name='auth-verify-otp'),
    path('auth/forgot-password/', CustomerForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/google-login/', GoogleLoginView.as_view(), name='auth-google-login'),
    path('customers/', CustomerListView.as_view(), name='customer-list'),
    path('customers/<str:user_id>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('reviews/', ReviewListView.as_view(), name='review-list'),
    path('admin-metrics/', AdminMetricsView.as_view(), name='admin-metrics'),
    
    # Cart Database Endpoints
    path('cart/', CartView.as_view(), name='cart-view'),
    path('cart/add/', CartAddView.as_view(), name='cart-add'),
    path('cart/update/', CartUpdateView.as_view(), name='cart-update'),
    path('cart/remove/', CartRemoveView.as_view(), name='cart-remove'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),

    # Instagram Live Feed Endpoints
    path('instagram/feed/', InstagramFeedListView.as_view(), name='instagram-feed'),
    path('instagram/sync/', InstagramSyncView.as_view(), name='instagram-sync'),
    path('instagram/posts/', InstagramPostManageView.as_view(), name='instagram-posts'),
    path('instagram/posts/<int:pk>/', InstagramPostManageView.as_view(), name='instagram-post-detail'),

    # Boutique ERP & Daybook Ledger Routes
    path('ledger/', LedgerListView.as_view(), name='ledger-list'),
    path('ledger/<int:pk>/', LedgerDetailView.as_view(), name='ledger-detail'),
    path('inventory/', InventoryManagementView.as_view(), name='inventory-management'),
    path('restock-requests/', RestockNotificationView.as_view(), name='restock-request-list-create'),
    path('restock-requests/<int:pk>/', RestockNotificationView.as_view(), name='restock-request-detail'),
    path('suppliers/', SupplierListView.as_view(), name='supplier-list'),
    path('suppliers/<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    path('purchases/', PurchaseOrderListView.as_view(), name='purchase-order-list'),
    path('offers/', OfferDiscountListView.as_view(), name='offer-discount-list'),
    path('offers/<int:pk>/', OfferDiscountDetailView.as_view(), name='offer-discount-detail'),
    path('returns/', ReturnRefundListView.as_view(), name='return-refund-list'),
    path('settings/', StoreSettingView.as_view(), name='store-settings'),
    
    # Broadcast / Bulk Messaging (Normal SMS & WhatsApp)
    path('broadcast/recipients/', BroadcastRecipientListView.as_view(), name='broadcast-recipients'),
    path('broadcast/', BroadcastMessageView.as_view(), name='broadcast-message'),
]


