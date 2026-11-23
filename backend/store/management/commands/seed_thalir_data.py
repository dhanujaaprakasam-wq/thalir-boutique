from django.core.management.base import BaseCommand
from store.models import Category, Product, ProductVariant, CustomerReview, CustomerProfile, Order, OrderItem

class Command(BaseCommand):
    help = 'Seeds Thalir Boutique database with 6 categories, products, and customer reviews'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding for Thalir Boutique...")

        # 1. Categories
        categories_data = [
            {'name': 'Sarees', 'slug': 'sarees', 'icon': 'Shirt', 'order': 1},
            {'name': 'Kurtis', 'slug': 'kurtis', 'icon': 'Sparkle', 'order': 2},
            {'name': 'Blouse Materials', 'slug': 'blouse-materials', 'icon': 'Scissors', 'order': 3},
            {'name': 'Chudi Material', 'slug': 'chudi-material', 'icon': 'Layers', 'order': 4},
            {'name': 'Inskirts', 'slug': 'inskirts', 'icon': 'Smile', 'order': 5},
            {'name': 'Night Wear', 'slug': 'night-wear', 'icon': 'Moon', 'order': 6},
        ]

        cat_map = {}
        for c in categories_data:
            cat_obj, created = Category.objects.update_or_create(
                slug=c['slug'],
                defaults={'name': c['name'], 'icon': c['icon'], 'order': c['order']}
            )
            cat_map[c['slug']] = cat_obj

        self.stdout.write("Created/Updated 6 Boutique Categories.")

        # 2. Products and Variants
        products_data = [
            {
                "code": "tb-sar-batik-001",
                "name": "Pure Cotton Handcrafted Batik Saree",
                "category": cat_map['sarees'],
                "base_price": 789,
                "original_price": 1299,
                "discount": "39% OFF",
                "tag": "New Launch",
                "description": "Authentic handcrafted pure cotton Batik print saree featuring traditional artisanal floral wax-resist motifs and matching blouse piece. Lightweight, breathable, and comfortable for festive, office, and daily wear.",
                "fabric": "100% Pure Mul Cotton Batik",
                "length": "6.2 Meters (with blouse piece)",
                "care": "First wash gentle hand wash separately",
                "default_color": "Rani Pink Batik",
                "variants": [
                    {"color_name": "Rani Pink Batik", "color_code": "#C2185B", "image_url": "/assets/images/media_1791353262893.jpg"},
                    {"color_name": "Charcoal Black Batik", "color_code": "#2C3E50", "image_url": "/assets/images/media_1791353262899.jpg"},
                    {"color_name": "Indigo Blue Batik", "color_code": "#1E3A8A", "image_url": "/assets/images/media_1791353262907.jpg"},
                    {"color_name": "Mustard Yellow Batik", "color_code": "#D97706", "image_url": "/assets/images/media_1791353262915.jpg"}
                ]
            },
            {
                "code": "tb-sar-001",
                "name": "Kanjivaram Silk Zari Border Saree",
                "category": cat_map['sarees'],
                "base_price": 2499,
                "original_price": 3999,
                "discount": "37% OFF",
                "tag": "Trending",
                "description": "Luxurious soft silk Kanjivaram saree adorned with intricate rich golden zari weaving, delicate contrast border, and grand pallu. Perfect for weddings and celebrations.",
                "fabric": "Soft Silk with Gold Zari",
                "length": "6.3 Meters (with blouse)",
                "care": "Dry clean recommended",
                "default_color": "Emerald Green",
                "variants": [
                    {"color_name": "Emerald Green", "color_code": "#0D5C3A", "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Rani Pink", "color_code": "#C2185B", "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Royal Mustard", "color_code": "#E5A910", "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Wine Maroon", "color_code": "#6B1D2F", "image_url": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-sar-002",
                "name": "Banarasi Organza Floral Pastel Saree",
                "category": cat_map['sarees'],
                "base_price": 1850,
                "original_price": 2800,
                "discount": "34% OFF",
                "tag": "Bestseller",
                "description": "Feather-light sheer organza silk saree featuring delicate silver zari buttis, scenic floral motifs, and scalloped embroidery borders.",
                "fabric": "Pure Tissue Organza",
                "length": "5.5m Saree + 0.8m Blouse",
                "care": "Gentle hand wash / Dry clean",
                "default_color": "Lavender Blush",
                "variants": [
                    {"color_name": "Lavender Blush", "color_code": "#9C8EB9", "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Mint Green", "color_code": "#86B39C", "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Powder Peach", "color_code": "#E5A48F", "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-kur-001",
                "name": "Anarkali Embroidered Kurti with Dupatta",
                "category": cat_map['kurtis'],
                "base_price": 1299,
                "original_price": 1999,
                "discount": "35% OFF",
                "tag": "New Arrival",
                "description": "Flared Rayon Anarkali Kurti with intricate neck thread embroidery, bell sleeves, and matching organza printed dupatta.",
                "fabric": "Premium Heavy Rayon & Organza",
                "sizes": ["M", "L", "XL", "XXL", "3XL"],
                "care": "Machine wash with like colors",
                "default_color": "Teal Blue",
                "variants": [
                    {"color_name": "Teal Blue", "color_code": "#176B87", "image_url": "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Mustard Yellow", "color_code": "#D99B26", "image_url": "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Coral Red", "color_code": "#C84B31", "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-kur-002",
                "name": "Straight Cut Cotton Daily Wear Kurti Set",
                "category": cat_map['kurtis'],
                "base_price": 849,
                "original_price": 1399,
                "discount": "39% OFF",
                "tag": "Popular",
                "description": "Breathable 100% pure cotton straight kurti with side slits, wooden button detailing, and paired straight cotton pants.",
                "fabric": "100% Pure Cotton",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "care": "Hand wash or gentle cycle",
                "default_color": "Indigo Navy",
                "variants": [
                    {"color_name": "Indigo Navy", "color_code": "#1A365D", "image_url": "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Sage Olive", "color_code": "#556B2F", "image_url": "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-blo-001",
                "name": "Pure Cotton & Soft Silk Blouse Piece (1 Meter)",
                "category": cat_map['blouse-materials'],
                "base_price": 299,
                "original_price": 499,
                "discount": "40% OFF",
                "tag": "Essential",
                "description": "Premium quality unstitched pure cotton and soft silk blouse material piece (1.0 meter full cut). Breathable, fast-color, and ideal for regular and festive saree matching.",
                "fabric": "100% Pure Combed Cotton & Soft Silk",
                "length": "1.0 Meter full cut",
                "care": "Gentle machine / hand wash",
                "default_color": "Bridal Crimson Red",
                "variants": [
                    {"color_name": "Bridal Crimson Red", "color_code": "#990000", "image_url": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Deep Royal Blue", "color_code": "#0A2647", "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Bottle Green", "color_code": "#0B4619", "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-chu-001",
                "name": "Chanderi Silk Embroidered Chudi Material Set",
                "category": cat_map['chudi-material'],
                "base_price": 1199,
                "original_price": 1899,
                "discount": "37% OFF",
                "tag": "Festive Special",
                "description": "Unstitched 3-piece luxury chudidhar dress material set: 2.5m Chanderi Silk embroidered top, 2m Santoon bottom, and 2.25m Banarasi zari border woven dupatta.",
                "fabric": "Chanderi Silk & Santoon with Woven Zari Dupatta",
                "length": "Top: 2.5m | Bottom: 2.0m | Dupatta: 2.25m",
                "care": "Dry clean recommended",
                "default_color": "Peacock Blue",
                "variants": [
                    {"color_name": "Peacock Blue", "color_code": "#0E8388", "image_url": "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Dusty Pink", "color_code": "#D4A5A5", "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-ins-001",
                "name": "Pure Cotton 6-Cut Saree Inskirt (Petticoat)",
                "category": cat_map['inskirts'],
                "base_price": 299,
                "original_price": 499,
                "discount": "40% OFF",
                "tag": "Essential",
                "description": "100% pure premium poplin cotton 6-cut saree inskirt (petticoat) with sturdy matching drawstring and interlock stitching.",
                "fabric": "100% Poplin Cotton",
                "sizes": ["Free Size", "XL", "XXL"],
                "length": "38 Inches (Standard)",
                "care": "Regular hand / machine wash",
                "default_color": "Emerald Green",
                "variants": [
                    {"color_name": "Emerald Green", "color_code": "#0D5C3A", "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Rani Pink", "color_code": "#C2185B", "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Mustard Yellow", "color_code": "#E5A910", "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"}
                ]
            },
            {
                "code": "tb-nit-001",
                "name": "Pure Cotton Printed Feeding & Comfort Nighty",
                "category": cat_map['night-wear'],
                "base_price": 499,
                "original_price": 750,
                "discount": "33% OFF",
                "tag": "Daily Essential",
                "description": "Super soft, breathable pure cotton nighty with front zip for feeding convenience, side pockets, and shrinkage-proof fast colors.",
                "fabric": "100% Pure Combed Cotton",
                "sizes": ["L", "XL", "XXL", "Free Size"],
                "care": "Regular machine wash",
                "default_color": "Maroon Floral",
                "variants": [
                    {"color_name": "Maroon Floral", "color_code": "#781D42", "image_url": "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80"},
                    {"color_name": "Navy Paisley", "color_code": "#1D267D", "image_url": "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80"}
                ]
            }
        ]

        for p in products_data:
            variants = p.pop('variants')
            prod_obj, created = Product.objects.update_or_create(
                code=p['code'],
                defaults=p
            )
            # Variants
            for v in variants:
                ProductVariant.objects.update_or_create(
                    product=prod_obj,
                    color_name=v['color_name'],
                    defaults=v
                )

        self.stdout.write("Created Products and Multi-Color/Size Variants.")

        # 3. Reviews
        reviews_data = [
            {"name": "Priyanka S.", "location": "Salem, Tamil Nadu", "rating": 5, "comment": "The Kanjivaram silk saree color is even more stunning in person than on Instagram! The zari work is neat and lightweight to drape.", "category": "Saree"},
            {"name": "Kavitha R.", "location": "Erode", "rating": 5, "comment": "Ordered two Anarkali Kurtis and one feeding cotton nighty. The cotton fabric quality is pure 100%, super soft, and stitching fit is perfect.", "category": "Kurtis"},
            {"name": "Divya Bharathi", "location": "Namakkal", "rating": 5, "comment": "The pure cotton blouse piece fabric is top notch. Fast colors, shrink-resistant, and matches perfectly with my handloom sarees.", "category": "Blouse Material"},
        ]

        for r in reviews_data:
            CustomerReview.objects.update_or_create(
                name=r['name'],
                defaults=r
            )

        # 4. Sample Order
        customer_obj, _ = CustomerProfile.objects.get_or_create(
            user_id="usr_demo_sample",
            defaults={
                "phone": "9843000000",
                "name": "Priyanka S.",
                "email": "priyanka.boutique@gmail.com",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                "auth_provider": "google"
            }
        )

        sample_order, _ = Order.objects.get_or_create(
            order_id="TB-108291",
            defaults={
                "customer": customer_obj,
                "customer_name": "Priyanka S.",
                "customer_phone": "9843000000",
                "customer_email": "priyanka.boutique@gmail.com",
                "delivery_address": "12, Gandhi Nagar 2nd Street",
                "city": "Salem",
                "pincode": "636007",
                "landmark": "Near New Bus Stand",
                "delivery_date": "Tomorrow",
                "delivery_slot": "Morning Slot (10:00 AM - 01:00 PM)",
                "subtotal": 2499,
                "delivery_charge": 0,
                "grand_total": 2499,
                "channel": "whatsapp",
                "payment_proof": "gpay_proof_receipt.jpg",
                "status": "Payment Confirmed"
            }
        )

        OrderItem.objects.get_or_create(
            order=sample_order,
            product_name="Kanjivaram Silk Zari Border Saree",
            color="Emerald Green",
            defaults={"qty": 1, "unit_price": 2499, "total_price": 2499}
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded all Thalir Boutique data into Django SQLite!"))
