// Thalir Boutique - Smart Category Templates & Auto-Fill Presets
// Provides automated product code generation, sizes, fabrics, lengths, care, and descriptions
// according to the boutique product category. All auto-filled values remain fully editable.

export const CATEGORY_TEMPLATES = {
  'sarees': {
    name: 'Sarees',
    codePrefix: 'TB-SAR-',
    defaultName: 'Kanjivaram Soft Silk Saree',
    sizeType: 'free', // 'free' | 'panel' | 'standard' | 'meter'
    sizeLabel: 'Saree Sizing (Universal)',
    sizeDescription: 'Traditional sarees are universal Free Size for all customers.',
    defaultSizes: ['Free Size'],
    sizeOptions: ['Free Size'],
    fabricDefault: 'Kanjivaram Soft Silk with Rich Zari',
    fabricPresets: [
      'Kanjivaram Soft Silk with Rich Zari',
      'Handcrafted Kalamkari Pure Cotton',
      'Geometric Woven Jacquard Soft Silk',
      'Pure Mulmul Cotton (100 Count)',
      'Pure Tissue Silk with Metallic Sheen',
      'Banarasi Munga Silk (Kadwa Weave)',
      'Batik Wax Resist Pure Cotton',
      'Chanderi Silk Cotton with Gold Borders',
      'Premium Sheer Organza Silk',
      'Pure Viscose Georgette'
    ],
    lengthDefault: '6.3m (5.5m saree + 0.8m running blouse piece)',
    lengthPresets: [
      '6.3m (5.5m saree + 0.8m running blouse piece)',
      '6.2m (with attached blouse)',
      '5.5m (without blouse piece)'
    ],
    careDefault: 'First wash dry clean recommended. Gentle cold water hand wash separately. Dry in shade. Medium steam iron.',
    carePresets: [
      'First wash dry clean recommended. Gentle cold water hand wash separately. Dry in shade. Medium steam iron.',
      'Gentle hand wash in cold water with mild liquid detergent. Do not bleach. Air dry in shade.',
      'Dry clean only to maintain rich zari sheen and delicate weave.'
    ],
    descriptionDefault: 'Exquisite handcrafted saree featuring breathable drape, traditional artisanal motifs, and coordinated running blouse piece. Ideal for festive celebrations, weddings, and elegant daily wear.'
  },

  'kurtis': {
    name: 'Kurtis & Sets',
    codePrefix: 'TB-KUR-',
    defaultName: 'Designer Floral Embroidered Kurti',
    sizeType: 'standard',
    sizeLabel: 'Standard Kurti Sizes (XS to 3XL)',
    sizeDescription: 'Standard stitched sizes from XS to 3XL. Select the sizes currently in stock.',
    defaultSizes: ['S', 'M', 'L', 'XL', '2XL'],
    sizeOptions: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    fabricDefault: 'Rayon 140g / Pure Cotton Slub',
    fabricPresets: [
      'Rayon 140g / Pure Cotton Slub',
      'Pure Cotton 60x60',
      'Chanderi Silk with Cotton Lining',
      'Modal Muslin',
      'Georgette with Inner Lining'
    ],
    lengthDefault: '44 inches (Calf Length)',
    lengthPresets: [
      '44 inches (Calf Length)',
      '46 inches (Long Anarkali)',
      '42 inches (Straight Cut)',
      '38 inches (Short Kurti)'
    ],
    careDefault: 'Gentle machine or hand wash with mild detergent. Wash dark colors separately. Warm iron.',
    carePresets: [
      'Gentle machine or hand wash with mild detergent. Wash dark colors separately. Warm iron.',
      'Hand wash in cold water. Do not wring or soak. Warm steam iron on reverse.'
    ],
    descriptionDefault: 'Stunning designer kurti tailored for superior comfort and everyday elegance. Features fine neckline detailing, premium breathable fabric, and durable double-stitched seams.'
  },

  'night-wear': {
    name: 'Night Wear & Loungewear',
    codePrefix: 'TB-NGT-',
    defaultName: 'Pure Cotton Comfort Feeding & Loungewear Nighty',
    sizeType: 'standard',
    sizeLabel: 'Standard Nightwear Sizes (XS to 3XL)',
    sizeDescription: 'Standard sizes from XS to 3XL or Free Size. Select available stock sizes.',
    defaultSizes: ['M', 'L', 'XL', '2XL'],
    sizeOptions: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'],
    fabricDefault: '100% Breathable Combed Cotton',
    fabricPresets: [
      '100% Breathable Combed Cotton',
      'Super Soft Hosiery Cotton',
      'Pure Cotton Mulmul',
      'Satin Silk Loungewear'
    ],
    lengthDefault: '52 inches (Full Length)',
    lengthPresets: [
      '52 inches (Full Length)',
      '50 inches (Standard Length)',
      '48 inches (Ankle Length)'
    ],
    careDefault: 'Machine wash with like colors. Line dry in soft sunlight. Fast color guarantee.',
    carePresets: [
      'Machine wash with like colors. Line dry in soft sunlight. Fast color guarantee.',
      'Gentle cold wash. Avoid bleach. Soft tumble dry.'
    ],
    descriptionDefault: 'Supreme comfort nightwear crafted from ultra-soft, breathable pure cotton. Features convenient front zip closure, side utility pocket, and shrinkage-resistant fabric for restful daily sleep.'
  },

  'inskirts': {
    name: 'Inskirts',
    codePrefix: 'TB-INS-',
    defaultName: 'Pure Cotton Stitched Panel Inskirt (Petticoat)',
    sizeType: 'panel',
    sizeLabel: 'Stitched Panel Cuts (6-Part to 10-Part)',
    sizeDescription: 'Stitched in structured flare panels (6-part, 7-part, 8-part, 9-part, 10-part cuts) for saree drape.',
    defaultSizes: ['6-Part Cut', '7-Part Cut', '8-Part Cut'],
    sizeOptions: ['6-Part Cut', '7-Part Cut', '8-Part Cut', '9-Part Cut', '10-Part Cut'],
    fabricDefault: '100% Pre-Shrunk Pure Poplin Cotton',
    fabricPresets: [
      '100% Pre-Shrunk Pure Poplin Cotton',
      'Heavy Combed Cotton Satin',
      'Lycra Microfiber Saree Shapewear'
    ],
    lengthDefault: '38 inches (Waist 32-42 with Drawstring)',
    lengthPresets: [
      '38 inches (Waist 32-42 with Drawstring)',
      '40 inches (Long Length)',
      '36 inches (Petite Length)'
    ],
    careDefault: 'Regular machine or hand wash. Fast color and shrink-resistant weave. Iron if needed.',
    carePresets: [
      'Regular machine or hand wash. Fast color and shrink-resistant weave. Iron if needed.',
      'Hand wash in cold water with mild detergent.'
    ],
    descriptionDefault: 'Premium pure poplin cotton inskirt stitched in structured panels for maximum flare control and seamless draping under heavy silk, cotton, and party wear sarees. Includes matching drawstring.'
  },

  'blouse-materials': {
    name: 'Blouse Materials',
    codePrefix: 'TB-BLS-',
    defaultName: 'Pure Cotton & Silk Unstitched Blouse Piece',
    sizeType: 'meter',
    sizeLabel: 'Meter Measurements (Cut Lengths in Meters)',
    sizeDescription: 'Unstitched blouse piece length in meters. Pick standard meter options or type custom meters.',
    defaultSizes: ['1.0 Meter'],
    sizeOptions: ['0.8 Meter', '1.0 Meter', '1.25 Meters', '1.5 Meters', '2.0 Meters'],
    fabricDefault: 'Pure 2x2 Rubia Cotton / Raw Silk',
    fabricPresets: [
      'Pure 2x2 Rubia Cotton / Raw Silk',
      'Heavy Aari Work Raw Silk',
      'Brocade Jacquard Silk',
      'Pure Ikat Cotton Bit'
    ],
    lengthDefault: '1.0 Meter Standard Cut',
    lengthPresets: [
      '1.0 Meter Standard Cut',
      '0.8 Meter Running Cut',
      '1.25 Meters (Plus Size/Elbow Sleeve)',
      '1.5 Meters (Full Sleeve Design)'
    ],
    careDefault: 'Pre-wash / soak in cold saltwater before tailoring. Gentle hand wash. Do not bleach.',
    carePresets: [
      'Pre-wash / soak in cold saltwater before tailoring. Gentle hand wash. Do not bleach.',
      'Dry clean recommended for heavy embroidery and aari work pieces.'
    ],
    descriptionDefault: 'Superior quality unstitched blouse material bit with rich color fastness and smooth tailoring texture. Ideal for pairing with designer sarees, bridal wear, and contrast blouse styling.'
  },

  'linings': {
    name: 'Linings',
    codePrefix: 'TB-LIN-',
    defaultName: 'Superior 2x2 Pre-Shrunk Cotton Lining Cloth',
    sizeType: 'meter',
    sizeLabel: 'Meter Measurements (Cloth Cuts in Meters)',
    sizeDescription: 'Lining material cut lengths in meters. Pick standard cuts or enter custom meter lengths.',
    defaultSizes: ['1.0 Meter', '2.0 Meters'],
    sizeOptions: ['1.0 Meter', '1.25 Meters', '1.5 Meters', '2.0 Meters', '2.5 Meters'],
    fabricDefault: 'Pure Cambric / Rubia Cotton 2x2',
    fabricPresets: [
      'Pure Cambric / Rubia Cotton 2x2',
      'Butter Crepe Lining',
      'Soft Voile Lining'
    ],
    lengthDefault: '1.0 Meter Standard Cut',
    lengthPresets: [
      '1.0 Meter Standard Cut',
      '2.0 Meters (Salwar/Kurti Lining Cut)',
      '2.5 Meters (Full Anarkali Lining Cut)'
    ],
    careDefault: 'Soak in cold water before cutting and stitching. Normal machine or hand wash.',
    carePresets: [
      'Soak in cold water before cutting and stitching. Normal machine or hand wash.',
      'Hand wash separately.'
    ],
    descriptionDefault: 'Export quality 100% pure combed cotton lining cloth. High absorbency, skin friendly, and shrinkage stabilized to ensure flawless shape and comfort for tailored garments.'
  },

  'chudi-material': {
    name: 'Chudi Materials',
    codePrefix: 'TB-CHD-',
    defaultName: 'Designer 3-Piece Unstitched Chudidhar Material Set',
    sizeType: 'free',
    sizeLabel: 'Chudidhar Material Sizing (Universal)',
    sizeDescription: 'Unstitched salwar suit sets are universal Free Size (can be tailored up to 44/46 chest).',
    defaultSizes: ['Free Size'],
    sizeOptions: ['Free Size'],
    fabricDefault: 'Chanderi Cotton with Malmal Dupatta',
    fabricPresets: [
      'Chanderi Cotton with Malmal Dupatta',
      'Pure Bandhani Cotton with Nazneen Dupatta',
      'Pure Jam Silk with Digital Print Dupatta',
      'Rayon Slub with Embroidered Neck'
    ],
    lengthDefault: 'Top: 2.25m | Bottom: 2.0m | Dupatta: 2.25m',
    lengthPresets: [
      'Top: 2.25m | Bottom: 2.0m | Dupatta: 2.25m',
      'Top: 2.50m | Bottom: 2.50m | Dupatta: 2.25m',
      'Top: 2.0m | Bottom: 2.0m | Dupatta: 2.0m'
    ],
    careDefault: 'Gentle hand wash in cold water with mild shampoo or liquid detergent. Dry in shade.',
    carePresets: [
      'Gentle hand wash in cold water with mild shampoo or liquid detergent. Dry in shade.',
      'First wash dry clean recommended to preserve hand block print.'
    ],
    descriptionDefault: 'Complete 3-piece unstitched designer chudidhar suit set featuring premium unstitched top material, coordinated bottom fabric, and an elegant matching dupatta. Can be custom-tailored to any style.'
  }
};

// Generates a unique boutique SKU/Product code based on category
export const generateProductCode = (category) => {
  const tpl = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['sarees'];
  const prefix = tpl.codePrefix || 'TB-PRD-';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
};

// Returns full default fields for a category
export const getCategoryDefaults = (category) => {
  const tpl = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['sarees'];
  return {
    code: generateProductCode(category),
    name: tpl.defaultName,
    fabric: tpl.fabricDefault,
    length: tpl.lengthDefault,
    care: tpl.careDefault,
    description: tpl.descriptionDefault,
    sizes: [...tpl.defaultSizes]
  };
};

// Popular Boutique Color Presets for fast swatch selection
export const POPULAR_COLORS = [
  { name: 'Haldi Yellow', code: '#F59E0B' },
  { name: 'Mustard Yellow', code: '#E09F3E' },
  { name: 'Rani Pink', code: '#D81159' },
  { name: 'Peacock Blue', code: '#005F73' },
  { name: 'Emerald Green', code: '#0D5C3A' },
  { name: 'Bottle Green', code: '#064E3B' },
  { name: 'Ruby Red', code: '#DC2626' },
  { name: 'Bridal Maroon', code: '#7F1D1D' },
  { name: 'Wine Maroon', code: '#5F0F40' },
  { name: 'Rama Green / Teal', code: '#0D9488' },
  { name: 'Royal Blue', code: '#1D4ED8' },
  { name: 'Lavender', code: '#C084FC' },
  { name: 'Rust Orange', code: '#C2410C' },
  { name: 'Peach', code: '#FB923C' },
  { name: 'Jet Black', code: '#1A1A1A' },
  { name: 'Pure White', code: '#F8F9FA' }
];
