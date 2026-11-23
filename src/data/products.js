export const STORE_INFO = {
  name: "Thalir Boutique",
  tagline: "Trending Sarees & Ethnic Boutique Collections",
  phone: "+91 6382218590",
  rawPhone: "6382218590",
  whatsappNumber: "916382218590",
  upiId: "arunasakthivel02@okaxis",
  upiPayeeName: "Aruna S",
  upiQrImage: "/assets/images/media_1791352967848.jpg",
  address: "5/797, NC Colony, Kumarapalayam Main Road, Veppadai, Namakkal – 638008, Tamil Nadu",
  instagramUrl: "https://www.instagram.com/thalir_boutique_/",
  instagramHandle: "@thalir_boutique_",
  whatsappGroupUrl: "https://chat.whatsapp.com/HzGGxQYeznyINZ8iU0kLLU",
  mapsUrl: "https://share.google/3NL83yY2p69EFp4IO",
  freeDeliveryThreshold: 999999, // Shipping charge extra as requested
  standardDeliveryFee: 60
};

export const CATEGORIES = [
  { id: 'all', label: 'All Collections', icon: 'Sparkles' },
  { id: 'sarees', label: 'Sarees', icon: 'Shirt' },
  { id: 'kurtis', label: 'Kurtis', icon: 'Sparkle' },
  { id: 'blouse-materials', label: 'Blouse Materials', icon: 'Scissors' },
  { id: 'chudi-material', label: 'Chudi Material', icon: 'Layers' },
  { id: 'inskirts', label: 'Inskirts', icon: 'Smile' },
  { id: 'linings', label: 'Linings', icon: 'Layers' },
  { id: 'night-wear', label: 'Night Wear', icon: 'Moon' }
];

export const INITIAL_PRODUCTS = [
  {
    id: "tb-sar-batik-001",
    code: "TB-SAR-BATIK-001",
    name: "Pure Cotton Handcrafted Batik Saree",
    category: "sarees",
    categoryName: "Sarees",
    basePrice: 789,
    originalPrice: 1299,
    discount: "39% OFF",
    tag: "New Launch",
    description: "Authentic handcrafted pure cotton Batik print saree featuring traditional artisanal floral wax-resist motifs and matching blouse piece. Lightweight, breathable, and comfortable for festive, office, and daily wear.",
    fabric: "100% Pure Mul Cotton Batik",
    blouseIncluded: true,
    blouseDetails: "Running Batik printed blouse piece included (0.8m)",
    length: "6.2 Meters (with blouse)",
    care: "First wash gentle hand wash separately",
    defaultColor: "Rani Pink Batik",
    variants: [
      {
        colorName: "Rani Pink Batik",
        colorCode: "#C2185B",
        image: "/assets/images/media_1791353262893.jpg",
        inStock: true,
        stockQty: 12
      },
      {
        colorName: "Charcoal Black Batik",
        colorCode: "#2C3E50",
        image: "/assets/images/media_1791353262899.jpg",
        inStock: true,
        stockQty: 10
      },
      {
        colorName: "Indigo Blue Batik",
        colorCode: "#1E3A8A",
        image: "/assets/images/media_1791353262907.jpg",
        inStock: true,
        stockQty: 10
      },
      {
        colorName: "Mustard Yellow Batik",
        colorCode: "#D97706",
        image: "/assets/images/media_1791353262915.jpg",
        inStock: true,
        stockQty: 10
      }
    ]
  },
  {
    id: "tb-sar-001",
    code: "TB-SAR-001",
    name: "Kanjivaram Silk Zari Border Saree",
    category: "sarees",
    categoryName: "Sarees",
    basePrice: 2499,
    originalPrice: 3999,
    discount: "37% OFF",
    tag: "Trending",
    description: "Luxurious soft silk Kanjivaram saree adorned with intricate rich golden zari weaving, delicate contrast border, and grand pallu. Perfect for weddings, festivities, and special occasions.",
    fabric: "Soft Silk with Gold Zari",
    blouseIncluded: true,
    blouseDetails: "Matching unstitched blouse piece (0.8m) included",
    length: "6.3 Meters (with blouse)",
    care: "Dry clean recommended",
    defaultColor: "Emerald Green",
    variants: [
      {
        colorName: "Emerald Green",
        colorCode: "#0D5C3A",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 8
      },
      {
        colorName: "Rani Pink",
        colorCode: "#C2185B",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 5
      },
      {
        colorName: "Royal Mustard",
        colorCode: "#E5A910",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 6
      },
      {
        colorName: "Wine Maroon",
        colorCode: "#6B1D2F",
        image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 4
      }
    ]
  },
  {
    id: "tb-sar-002",
    code: "TB-SAR-002",
    name: "Banarasi Organza Floral Pastel Saree",
    category: "sarees",
    categoryName: "Sarees",
    basePrice: 1850,
    originalPrice: 2800,
    discount: "34% OFF",
    tag: "Bestseller",
    description: "Feather-light sheer organza silk saree featuring delicate silver zari buttis, scenic hand-painted floral motifs, and scalloped embroidery borders.",
    fabric: "Pure Tissue Organza",
    blouseIncluded: true,
    blouseDetails: "Contrast brocade blouse piece included",
    length: "5.5m Saree + 0.8m Blouse",
    care: "Gentle hand wash / Dry clean",
    defaultColor: "Lavender Blush",
    variants: [
      {
        colorName: "Lavender Blush",
        colorCode: "#9C8EB9",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 10
      },
      {
        colorName: "Mint Green",
        colorCode: "#86B39C",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 7
      },
      {
        colorName: "Powder Peach",
        colorCode: "#E5A48F",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        stockQty: 9
      }
    ]
  },
  {
    id: "tb-kur-001",
    code: "TB-KUR-001",
    name: "Anarkali Embroidered Kurti with Dupatta",
    category: "kurtis",
    categoryName: "Kurtis",
    basePrice: 1299,
    originalPrice: 1999,
    discount: "35% OFF",
    tag: "New Arrival",
    description: "Flared Rayon Anarkali Kurti with intricate neck thread embroidery, bell sleeves, and matching organza printed dupatta. Ultra-comfortable festive wear.",
    fabric: "Premium Heavy Rayon & Organza",
    sizes: ["M", "L", "XL", "XXL", "3XL"],
    care: "Machine wash with like colors",
    defaultColor: "Teal Blue",
    variants: [
      {
        colorName: "Teal Blue",
        colorCode: "#176B87",
        image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Mustard Yellow",
        colorCode: "#D99B26",
        image: "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Coral Red",
        colorCode: "#C84B31",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        inStock: true
      }
    ]
  },
  {
    id: "tb-kur-002",
    code: "TB-KUR-002",
    name: "Straight Cut Cotton Daily Wear Kurti Set",
    category: "kurtis",
    categoryName: "Kurtis",
    basePrice: 849,
    originalPrice: 1399,
    discount: "39% OFF",
    tag: "Popular",
    description: "Breathable 100% pure cotton straight kurti with side slits, wooden button detailing, and paired straight cotton pants. Ideal for office and daily casuals.",
    fabric: "100% Pure Cotton",
    sizes: ["S", "M", "L", "XL", "XXL"],
    care: "Hand wash or gentle cycle",
    defaultColor: "Indigo Navy",
    variants: [
      {
        colorName: "Indigo Navy",
        colorCode: "#1A365D",
        image: "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Sage Olive",
        colorCode: "#556B2F",
        image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80",
        inStock: true
      }
    ]
  },
  {
    id: "tb-blo-001",
    code: "TB-BLO-001",
    name: "Pure Cotton & Soft Silk Blouse Piece (1 Meter)",
    category: "blouse-materials",
    categoryName: "Blouse Materials",
    basePrice: 299,
    originalPrice: 499,
    discount: "40% OFF",
    tag: "Essential",
    description: "Premium quality unstitched pure cotton and soft silk blouse material piece (1.0 meter full cut). Breathable, fast-color, and ideal for regular and festive saree matching.",
    fabric: "100% Pure Combed Cotton & Soft Silk",
    cutLength: "1.0 Meter full cut",
    care: "Gentle machine / hand wash",
    defaultColor: "Bridal Crimson Red",
    variants: [
      {
        colorName: "Bridal Crimson Red",
        colorCode: "#990000",
        image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Deep Royal Blue",
        colorCode: "#0A2647",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Bottle Green",
        colorCode: "#0B4619",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Golden Yellow",
        colorCode: "#D4AF37",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        inStock: true
      }
    ]
  },
  {
    id: "tb-chu-001",
    code: "TB-CHU-001",
    name: "Chanderi Silk Embroidered Chudi Material Set",
    category: "chudi-material",
    categoryName: "Chudi Material",
    basePrice: 1199,
    originalPrice: 1899,
    discount: "37% OFF",
    tag: "Festive Special",
    description: "Unstitched 3-piece luxury chudidhar dress material set: 2.5m Chanderi Silk embroidered top, 2m Santoon bottom/inner fabric, and 2.25m Banarasi zari border woven dupatta.",
    fabric: "Chanderi Silk & Santoon with Woven Zari Dupatta",
    cutLength: "Top: 2.5m | Bottom: 2.0m | Dupatta: 2.25m",
    care: "Dry clean recommended",
    defaultColor: "Peacock Blue",
    variants: [
      {
        colorName: "Peacock Blue",
        colorCode: "#0E8388",
        image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Dusty Pink",
        colorCode: "#D4A5A5",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Royal Mustard",
        colorCode: "#D99B26",
        image: "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80",
        inStock: true
      }
    ]
  },
  {
    id: "tb-ins-001",
    code: "TB-INS-001",
    name: "Pure Cotton 6-Cut Saree Inskirt (Petticoat)",
    category: "inskirts",
    categoryName: "Inskirts",
    basePrice: 299,
    originalPrice: 499,
    discount: "40% OFF",
    tag: "Essential",
    description: "100% pure premium poplin cotton 6-cut saree inskirt (petticoat) with sturdy matching drawstring and interlock stitching. Available in a vast range of vibrant matching colors.",
    fabric: "100% Poplin Cotton",
    sizes: ["Free Size (Waist 28-38\")", "XL (Waist 38-44\")", "XXL (Waist 44-50\")"],
    length: "38 Inches (Standard)",
    care: "Regular hand / machine wash",
    defaultColor: "Emerald Green",
    variants: [
      {
        colorName: "Emerald Green",
        colorCode: "#0D5C3A",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Rani Pink",
        colorCode: "#C2185B",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Mustard Yellow",
        colorCode: "#E5A910",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Pure Black",
        colorCode: "#1A1A1A",
        image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
        inStock: true
      }
    ]
  },
  {
    id: "tb-nit-001",
    code: "TB-NIT-001",
    name: "Pure Cotton Printed Feeding & Comfort Nighty",
    category: "night-wear",
    categoryName: "Night Wear",
    basePrice: 499,
    originalPrice: 750,
    discount: "33% OFF",
    tag: "Daily Essential",
    description: "Super soft, breathable pure cotton nighty with front zip for feeding convenience, side pockets, and shrinkage-proof fast colors. Guarantees supreme comfort.",
    fabric: "100% Pure Combed Cotton",
    sizes: ["L (Bust 42\")", "XL (Bust 44\")", "XXL (Bust 46\")", "Free Size"],
    care: "Regular machine wash",
    defaultColor: "Maroon Floral",
    variants: [
      {
        colorName: "Maroon Floral",
        colorCode: "#781D42",
        image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Navy Paisley",
        colorCode: "#1D267D",
        image: "https://images.unsplash.com/photo-1614088445100-a681329a6744?auto=format&fit=crop&w=800&q=80",
        inStock: true
      },
      {
        colorName: "Teal Botanical",
        colorCode: "#005F73",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        inStock: true
      }
    ]
  }
];

export const REVIEWS = [
  {
    id: 1,
    name: "Priyanka S.",
    location: "Salem, Tamil Nadu",
    rating: 5,
    comment: "The Kanjivaram silk saree color is even more stunning in person than on Instagram! The zari work is neat and lightweight to drape. Delivered to Salem in just 2 days.",
    category: "Saree"
  },
  {
    id: 2,
    name: "Kavitha R.",
    location: "Erode",
    rating: 5,
    comment: "Ordered two Anarkali Kurtis and one feeding cotton nighty. The cotton fabric quality is pure 100%, super soft, and stitching fit is perfect. Highly recommend Thalir Boutique!",
    category: "Kurtis & Nighty"
  },
  {
    id: 3,
    name: "Divya Bharathi",
    location: "Namakkal",
    rating: 5,
    comment: "The heavy aari work blouse piece is absolute bridal perfection. Beautiful golden kundan embellishment and pure raw silk cloth. Loved the fast WhatsApp customer support!",
    category: "Blouse Material"
  }
];
