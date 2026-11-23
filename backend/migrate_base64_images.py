import os
import sys
import base64
import uuid
import re
from pathlib import Path

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thalir_project.settings')

import django
django.setup()

from django.conf import settings
from store.models import Product, ProductVariant, OrderItem

def main():
    media_products_dir = Path(settings.MEDIA_ROOT) / 'products'
    media_products_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Target media directory: {media_products_dir}")

    def save_b64(raw_str, prefix="variant"):
        if not raw_str or not raw_str.startswith('data:image'):
            return raw_str
        try:
            match = re.match(r'data:image/([a-zA-Z0-9.+]+);base64,(.+)', raw_str, re.DOTALL)
            if not match:
                return raw_str
            ext = match.group(1).lower()
            if ext == 'jpeg':
                ext = 'jpg'
            elif ext not in ['jpg', 'png', 'webp', 'gif']:
                ext = 'jpg'
            
            b64_data = match.group(2)
            file_bytes = base64.b64decode(b64_data)
            
            filename = f"{prefix}_{uuid.uuid4().hex[:12]}.{ext}"
            filepath = media_products_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(file_bytes)
            
            rel_url = f"/media/products/{filename}"
            return rel_url
        except Exception as e:
            print(f"Error saving base64 image: {e}")
            return raw_str

    # Process ProductVariants
    updated_variants = 0
    for v in ProductVariant.objects.all():
        if v.image_url and v.image_url.startswith('data:image'):
            v_code_clean = re.sub(r'[^a-zA-Z0-9_-]', '', str(v.code or 'var')).lower()
            new_url = save_b64(v.image_url, prefix=f"p{v.product_id}_{v_code_clean}")
            if new_url != v.image_url:
                v.image_url = new_url
                v.save(update_fields=['image_url'])
                updated_variants += 1

    print(f"Successfully migrated {updated_variants} ProductVariant images to files on disk.")

    # Process OrderItems
    updated_items = 0
    for item in OrderItem.objects.all():
        if item.image_url and item.image_url.startswith('data:image'):
            new_url = save_b64(item.image_url, prefix=f"order_{item.id}")
            if new_url != item.image_url:
                item.image_url = new_url
                item.save(update_fields=['image_url'])
                updated_items += 1

    print(f"Successfully migrated {updated_items} OrderItem images to files on disk.")

if __name__ == '__main__':
    main()
