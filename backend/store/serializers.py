from rest_framework import serializers
from .models import (
    Category, Product, ProductVariant, CustomerProfile, CustomerAddress, 
    Order, OrderItem, CustomerReview, LedgerEntry, Supplier, PurchaseOrder, 
    OfferDiscount, ReturnRefund, StoreSetting, DBCart, DBCartItem, InstagramFeedPost,
    RestockNotificationRequest, BroadcastMessage
)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'code', 'color_name', 'color_code', 'image_url', 'images', 'in_stock', 'stock_qty']


class ProductSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    views_count = serializers.IntegerField(read_only=True)
    is_sold_out = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'code', 'name', 'category', 'category_slug', 'category_name',
            'base_price', 'original_price', 'discount', 'tag', 'description',
            'fabric', 'length', 'care', 'default_color', 'sizes', 'images', 'is_active',
            'is_special_event', 'event_name', 'event_end_time', 'event_badge',
            'views_count', 'is_sold_out', 'total_stock',
            'created_at', 'variants'
        ]

    def get_total_stock(self, obj):
        return sum(v.stock_qty for v in obj.variants.all())

    def get_is_sold_out(self, obj):
        variants = list(obj.variants.all())
        if not variants:
            return True
        return all(v.stock_qty <= 0 or not v.in_stock for v in variants)


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = ['id', 'full_name', 'phone', 'address', 'city', 'pincode', 'landmark', 'is_default']


class CustomerProfileSerializer(serializers.ModelSerializer):
    addresses = CustomerAddressSerializer(many=True, read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'user_id', 'google_sub', 'name', 'username', 'first_name', 'last_name',
            'phone', 'email', 'avatar', 'email_verified', 'is_phone_verified', 'auth_provider',
            'role', 'membership_tier', 'last_login', 'created_at', 'updated_at', 'addresses'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    product_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_code', 'product_name', 'color', 'size', 'image_url', 'qty', 'unit_price', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'customer', 'customer_name', 'customer_phone', 'customer_email',
            'delivery_address', 'city', 'pincode', 'landmark', 'delivery_date', 'delivery_slot',
            'order_notes', 'subtotal', 'coupon_code', 'discount_amount', 'delivery_charge', 'grand_total', 'channel',
            'payment_method', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'cod_verified',
            'payment_proof', 'payment_proof_image', 'status', 'is_stock_deducted',
            'courier_partner', 'tracking_number', 'tracking_url', 'shipping_status', 'dispatched_at', 'delivered_at',
            'created_at', 'items'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        coupon_code = (attrs.get('coupon_code') or '').strip()
        if coupon_code:
            coupon = OfferDiscount.objects.filter(code__iexact=coupon_code, is_active=True).first()
            is_first_order_coupon = False
            if coupon and coupon.first_order_only:
                is_first_order_coupon = True
            elif coupon_code.upper() == 'WELCOME10':
                is_first_order_coupon = True

            if is_first_order_coupon:
                customer = attrs.get('customer')
                customer_phone = (attrs.get('customer_phone') or '').strip()
                customer_email = (attrs.get('customer_email') or '').strip()

                orders_query = Order.objects.exclude(status='Cancelled')
                has_previous = False

                if customer and orders_query.filter(customer=customer).exists():
                    has_previous = True
                if not has_previous and customer_phone and orders_query.filter(customer_phone=customer_phone).exists():
                    has_previous = True
                if not has_previous and customer_email and '@' in customer_email and orders_query.filter(customer_email=customer_email).exists():
                    has_previous = True

                if has_previous:
                    raise serializers.ValidationError({
                        'coupon_code': f'Coupon "{coupon_code.upper()}" is valid only on your first order with Thalir Boutique.'
                    })

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            p_code = item_data.get('product_code')
            p_name = item_data.get('product_name', '').strip()
            p_color = item_data.get('color', '').strip()
            prod = None
            if p_code:
                prod = Product.objects.filter(code__iexact=p_code).first()
            if not prod and p_name:
                prod = Product.objects.filter(name__iexact=p_name).first() or Product.objects.filter(name__icontains=p_name).first()
            
            if prod:
                clean_item_color = p_color.lower().replace('-', ' ').replace('_', ' ')
                matched_v = None
                for v in prod.variants.all():
                    clean_v_color = v.color_name.lower().replace('-', ' ').replace('_', ' ')
                    if clean_v_color == clean_item_color or clean_v_color in clean_item_color or clean_item_color in clean_v_color:
                        matched_v = v
                        break
                if not matched_v:
                    matched_v = prod.variants.first()

                if not p_code:
                    item_data['product_code'] = (matched_v.code if matched_v and matched_v.code else prod.code)
                img = item_data.get('image_url')
                if not img or not str(img).strip():
                    if matched_v and matched_v.image_url:
                        img = matched_v.image_url
                    item_data['image_url'] = img or ''
            
            OrderItem.objects.create(order=order, **item_data)
        return order


class CustomerReviewSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = CustomerReview
        fields = [
            'id', 'product', 'product_code', 'product_name', 'name', 'location', 
            'rating', 'comment', 'category', 'image_url', 'verified_purchase', 
            'is_approved', 'created_at'
        ]


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class OfferDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferDiscount
        fields = '__all__'


class ReturnRefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnRefund
        fields = '__all__'


class StoreSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSetting
        fields = '__all__'


class DBCartItemSerializer(serializers.ModelSerializer):
    stock_qty = serializers.SerializerMethodField()

    class Meta:
        model = DBCartItem
        fields = ['id', 'product_id', 'name', 'price', 'color', 'size', 'image', 'qty', 'stock_qty', 'added_at']

    def get_stock_qty(self, obj):
        try:
            product = None
            if str(obj.product_id).isdigit():
                product = Product.objects.filter(id=int(obj.product_id)).first()
            if not product:
                product = Product.objects.filter(code=str(obj.product_id)).first()
            if not product:
                product = Product.objects.filter(name__iexact=str(obj.name)).first()

            if product:
                if obj.color:
                    variant = product.variants.filter(color_name__iexact=obj.color).first()
                    if variant:
                        return variant.stock_qty
                first_variant = product.variants.first()
                if first_variant:
                    return first_variant.stock_qty
        except Exception:
            pass
        return 1


class DBCartSerializer(serializers.ModelSerializer):
    items = DBCartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = DBCart
        fields = ['id', 'session_key', 'items', 'total_items', 'total_amount', 'updated_at']

    def get_total_items(self, obj):
        return sum(item.qty for item in obj.items.all())

    def get_total_amount(self, obj):
        return float(sum(item.price * item.qty for item in obj.items.all()))


class InstagramFeedPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstagramFeedPost
        fields = '__all__'


class RestockNotificationRequestSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = RestockNotificationRequest
        fields = [
            'id', 'product', 'product_name', 'product_code', 'product_image',
            'variant_code', 'color_name', 'customer_name', 'phone', 'email',
            'status', 'notified_at', 'created_at'
        ]

    def get_product_image(self, obj):
        if obj.product:
            if obj.variant_code:
                v = obj.product.variants.filter(code=obj.variant_code).first()
                if v and v.image_url:
                    return v.image_url
            first_v = obj.product.variants.first()
            if first_v and first_v.image_url:
                return first_v.image_url
        return ''


class BroadcastMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BroadcastMessage
        fields = '__all__'




