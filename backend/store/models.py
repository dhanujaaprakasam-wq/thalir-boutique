from django.db import models
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='Sparkles')
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Product(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=50, blank=True, null=True)
    tag = models.CharField(max_length=50, blank=True, null=True) # e.g. Trending, Bestseller
    description = models.TextField(blank=True)
    fabric = models.CharField(max_length=200, blank=True, null=True)
    length = models.CharField(max_length=100, blank=True, null=True)
    care = models.CharField(max_length=200, blank=True, null=True)
    default_color = models.CharField(max_length=100, default='Emerald Green')
    sizes = models.JSONField(default=list, blank=True) # e.g. ["S", "M", "L", "XL"]
    images = models.JSONField(default=list, blank=True) # Multiple photos of the same product (front, pallu, blouse, border)
    views_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_special_event = models.BooleanField(default=False)
    event_name = models.CharField(max_length=150, blank=True, null=True)
    event_end_time = models.DateTimeField(null=True, blank=True)
    event_badge = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    code = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    color_name = models.CharField(max_length=100)
    color_code = models.CharField(max_length=20, default='#0D5C3A')
    image_url = models.URLField(max_length=1000)
    images = models.JSONField(default=list, blank=True) # Multiple pictures of the same variant/color
    in_stock = models.BooleanField(default=True)
    stock_qty = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} - {self.color_name}"


class ProductViewLog(models.Model):
    """Tracks unique customer views per product to prevent duplicate counts and ignore admin views"""
    product = models.ForeignKey(Product, related_name='view_logs', on_delete=models.CASCADE)
    viewer_key = models.CharField(max_length=150, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'viewer_key')

    def __str__(self):
        return f"{self.product.code} viewed by {self.viewer_key}"


class RestockNotificationRequest(models.Model):
    """Customer requests to be notified via WhatsApp/SMS when sold-out sarees are restocked"""
    product = models.ForeignKey(Product, related_name='restock_requests', on_delete=models.CASCADE)
    variant_code = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    color_name = models.CharField(max_length=100, blank=True, null=True)
    customer_name = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=30, default='Pending') # 'Pending' | 'Notified'
    notified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Restock alert for {self.variant_code or self.product.code} - {self.phone} ({self.status})"


class CustomerProfile(models.Model):
    user_id = models.CharField(max_length=100, unique=True)
    google_sub = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=200)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True, db_index=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)
    avatar = models.URLField(max_length=1000, blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    auth_provider = models.CharField(max_length=50, default='password') # password, google, phone_otp
    role = models.CharField(max_length=50, default='Customer') # 'Customer' | 'Admin'
    membership_tier = models.CharField(max_length=50, default='VIP SHOPPER')
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.email or self.phone}) - {self.auth_provider}"


class CustomerAddress(models.Model):
    customer = models.ForeignKey(CustomerProfile, related_name='addresses', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100, default='Namakkal')
    pincode = models.CharField(max_length=20, default='638008')
    landmark = models.CharField(max_length=200, blank=True, null=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.full_name} - {self.city}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending Verification', 'Pending Verification'),
        ('Payment Confirmed', 'Payment Confirmed'),
        ('Dispatched', 'Dispatched'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(CustomerProfile, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, null=True)
    delivery_address = models.TextField()
    city = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    landmark = models.CharField(max_length=200, blank=True, null=True)
    delivery_date = models.CharField(max_length=100, blank=True, null=True)
    delivery_slot = models.CharField(max_length=100, blank=True, null=True)
    order_notes = models.TextField(blank=True, null=True)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)

    channel = models.CharField(max_length=50, default='site') # whatsapp, site
    payment_method = models.CharField(max_length=100, default='UPI QR Payment') # 'UPI QR Payment', 'Razorpay Online', 'Cash on Delivery'
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    cod_verified = models.BooleanField(default=False)
    payment_proof = models.CharField(max_length=255, default='Not attached')
    payment_proof_image = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending Verification')
    is_stock_deducted = models.BooleanField(default=False)

    # Shipping & Courier Tracking
    courier_partner = models.CharField(max_length=100, blank=True, default='') # ST Courier, Delhivery, Professional, Shiprocket
    tracking_number = models.CharField(max_length=100, blank=True, default='', db_index=True)
    tracking_url = models.URLField(max_length=500, blank=True, default='')
    shipping_status = models.CharField(max_length=50, default='Order Placed') # 'Order Placed', 'Packed', 'Dispatched', 'In Transit', 'Delivered'
    dispatched_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.order_id} - {self.customer_name} (₹{self.grand_total})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product_code = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    product_name = models.CharField(max_length=255)
    color = models.CharField(max_length=100)
    size = models.CharField(max_length=50, blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    qty = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"[{self.product_code or 'NO-CODE'}] {self.product_name} ({self.color}) x {self.qty}"


class CustomerReview(models.Model):
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True, default='Tamil Nadu')
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    category = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.TextField(blank=True, null=True) # Photo of customer wearing the saree
    verified_purchase = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.rating} stars) - {self.product.code if self.product else 'Store'}"


class LedgerEntry(models.Model):
    ENTRY_TYPES = [
        ('credit', 'Money In (DR / Income)'),
        ('debit', 'Money Out (CR / Expense)')
    ]

    entry_date = models.CharField(max_length=50, db_index=True)
    particulars = models.CharField(max_length=255)
    description = models.CharField(max_length=255, blank=True, default='')
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES, default='debit', db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100, default='General Expense', db_index=True)
    payment_mode = models.CharField(max_length=50, default='Cash')
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']
        verbose_name_plural = "Ledger Entries"

    def __str__(self):
        sign = "+" if self.entry_type == 'credit' else "-"
        return f"{self.entry_date} | {self.particulars} | {sign}₹{self.amount}"


class Supplier(models.Model):
    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='Elampillai / Erode / Coimbatore')
    category = models.CharField(max_length=100, default='Saree Manufacturer')
    total_purchases = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.city})"


class PurchaseOrder(models.Model):
    po_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, related_name='purchases', on_delete=models.SET_NULL, null=True, blank=True)
    supplier_name = models.CharField(max_length=200)
    invoice_date = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=50, default='Paid') # Paid, Partial, Pending
    items_summary = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.po_number} - {self.supplier_name} (₹{self.total_amount})"


class OfferDiscount(models.Model):
    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=200)
    discount_type = models.CharField(max_length=20, default='percentage') # percentage, flat
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valid_till = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    first_order_only = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.discount_type == 'percentage' else ' OFF'}"


class ReturnRefund(models.Model):
    return_id = models.CharField(max_length=50, unique=True)
    order_id = models.CharField(max_length=50)
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=50, blank=True, default='')
    product_name = models.CharField(max_length=255)
    reason = models.TextField()
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='Pending') # Pending, Approved, Rejected, Refunded
    refund_mode = models.CharField(max_length=50, default='UPI')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.return_id} - {self.customer_name} (₹{self.refund_amount})"


class StoreSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key


class DBCart(models.Model):
    session_key = models.CharField(max_length=150, unique=True, db_index=True)
    user = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='carts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart: {self.session_key} ({self.items.count()} items)"


class DBCartItem(models.Model):
    cart = models.ForeignKey(DBCart, on_delete=models.CASCADE, related_name='items')
    product_id = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    color = models.CharField(max_length=100, default='Standard')
    size = models.CharField(max_length=50, blank=True, null=True)
    image = models.TextField(blank=True, default='')
    qty = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.color}) x {self.qty}"


class InstagramFeedPost(models.Model):
    post_id = models.CharField(max_length=100, unique=True)
    media_url = models.URLField(max_length=1000)
    permalink = models.URLField(max_length=1000, default='https://www.instagram.com/thalir_boutique_/')
    caption = models.TextField(blank=True, default='')
    media_type = models.CharField(max_length=50, default='IMAGE') # IMAGE, VIDEO, CAROUSEL_ALBUM
    timestamp = models.CharField(max_length=100, blank=True, default='')
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"Instagram Post: {self.post_id} - {self.caption[:30]}"


class BroadcastMessage(models.Model):
    title = models.CharField(max_length=200, blank=True, default='')
    channel = models.CharField(max_length=50, default='both') # 'sms', 'whatsapp', 'both'
    message = models.TextField()
    recipient_count = models.IntegerField(default=0)
    recipient_filter = models.CharField(max_length=50, default='all') # 'all', 'registered', 'buyers'
    status = models.CharField(max_length=50, default='sent') # 'sent', 'partial', 'failed', 'simulated'
    gateway = models.CharField(max_length=100, blank=True, default='')
    details = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.channel.upper()} Broadcast ({self.recipient_count} users) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"



