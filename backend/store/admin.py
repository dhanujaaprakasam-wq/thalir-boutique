from django.contrib import admin
from .models import Category, Product, ProductVariant, CustomerProfile, CustomerAddress, Order, OrderItem, CustomerReview, BroadcastMessage

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'base_price', 'discount', 'tag', 'is_active']
    list_filter = ['category', 'is_active', 'tag']
    search_fields = ['name', 'code', 'description']
    inlines = [ProductVariantInline]

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'order']
    prepopulated_fields = {'slug': ('name',)}

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'color', 'size', 'qty', 'unit_price', 'total_price']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'customer_name', 'customer_phone', 'grand_total', 'channel', 'status', 'created_at']
    list_filter = ['status', 'channel', 'created_at']
    search_fields = ['order_id', 'customer_name', 'customer_phone', 'delivery_address']
    inlines = [OrderItemInline]

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'auth_provider', 'created_at']
    search_fields = ['name', 'phone', 'email']

@admin.register(CustomerReview)
class CustomerReviewAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'rating', 'category', 'created_at']
    list_filter = ['rating', 'category']

@admin.register(BroadcastMessage)
class BroadcastMessageAdmin(admin.ModelAdmin):
    list_display = ['channel', 'recipient_count', 'recipient_filter', 'status', 'created_at']
    list_filter = ['channel', 'status', 'recipient_filter', 'created_at']
    search_fields = ['message', 'title']

