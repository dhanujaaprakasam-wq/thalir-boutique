// Thalir Boutique - Intelligent Saree Type & Garment Fabric Detection Engine
// Detects authentic saree types (Kanjivaram, Kalamkari, Jacquard, Tissue, Banarasi, Mulmul Cotton, etc.)
// from image visual analysis (texture, metallic zari sheen, contrast borders) and image filename cues.

export const SAREE_PRESETS = [
  {
    id: 'kanjivaram',
    icon: '🥻',
    name: 'Kanjivaram Soft Silk Saree',
    nameTa: 'காஞ்சிபுரம் சாப்ட் சில்க் சேலை',
    fabric: 'Kanjivaram Soft Silk with Rich Zari',
    fabricTa: 'காஞ்சிபுரம் சாப்ட் சில்க் ஜரிகை பார்டர்',
    keywords: ['kanjivaram', 'kanchipuram', 'pattu', 'bridal', 'temple', 'traditional', 'wedding', 'zari', 'korvai', 'soft silk', 'silk saree', 'contrast border'],
    care: 'Dry clean only to maintain pure zari finish and soft silk luster. Wrap in breathable cotton cloth.',
    description: 'Opulent traditional Kanjivaram soft silk saree adorned with classic temple zari borders, rich contrast pallu, and timeless bridal motifs. Unmatched elegance for traditional functions, weddings, and auspicious rituals.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'kalamkari',
    icon: '🪡',
    name: 'Kalamkari Handblock Printed Saree',
    nameTa: 'கலம்காரி கை அச்சு காட்டன் சேலை',
    fabric: 'Handcrafted Kalamkari Pure Cotton',
    fabricTa: 'கலம்காரி கைத்தறி பியூர் காட்டன்',
    keywords: ['kalamkari', 'peacock', 'village', 'warli', 'folk', 'tribal', 'hand block', 'block print', 'ajrakh', 'dabu', 'printed cotton', 'print', 'figurative', 'charcoal'],
    care: 'Gentle hand wash in cold water with mild liquid detergent. Line dry in shade.',
    description: 'Heritage Kalamkari handblock printed saree inspired by timeless temple and folklore art. Created on breathable pure cotton with rich natural mineral dyes for an earthy, artistic appeal.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'jacquard',
    icon: '✨',
    name: 'Geometric Woven Jacquard Soft Silk Saree',
    nameTa: 'ஜியோமெட்ரிக் நெசவு ஜாக்கார்ட் சேலை',
    fabric: 'Geometric Woven Jacquard Soft Silk',
    fabricTa: 'ஜியோமெட்ரிக் நெசவு ஜாக்கார்ட் சாப்ட் சில்க்',
    keywords: ['jacquard', 'geometric', 'woven', 'weave', 'brocade', 'box', 'motif', 'grid', 'checks', 'texture'],
    care: 'Dry clean only to maintain rich jacquard weave and delicate metallic sheen. Medium steam iron on reverse.',
    description: 'Exquisite geometric woven jacquard saree featuring intricate artisanal weaving motifs, rich textured body, and an elaborate pallu with matching running blouse piece. Perfect for festive celebrations and party occasions.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'mulmul_cotton',
    icon: '🌿',
    name: 'Pure Mulmul Cotton Handloom Saree',
    nameTa: 'பியூர் மல்மல் காட்டன் கைத்தறி சேலை',
    fabric: 'Pure Mulmul Cotton (100 Count)',
    fabricTa: 'பியூர் மல்மல் காட்டன் (100 கவுண்ட்)',
    keywords: ['mulmul', 'cotton', 'malmal', 'soft cotton', 'daily wear', 'chettinad', 'bengal cotton', 'linen', 'breathable'],
    care: 'Gentle cold water hand wash separately. Mild starch optional for crisp drape. Dry in shade.',
    description: 'Feather-light 100-count pure mulmul cotton saree offering supreme breathability and effortless soft draping. Designed for humid tropical summers, office wear, and relaxed elegance.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'tissue',
    icon: '💫',
    name: 'Pure Tissue Silk Shimmer Saree',
    nameTa: 'பியூர் டிஷ்யூ சில்க் ஷிம்மர் சேலை',
    fabric: 'Pure Tissue Silk with Metallic Sheen',
    fabricTa: 'பியூர் டிஷ்யூ சில்க் மெட்டாலிக் ஷைன்',
    keywords: ['tissue', 'shimmer', 'metallic', 'glaze', 'champagne', 'crush', 'glossy', 'golden tissue', 'silver tissue'],
    care: 'Dry clean only. Gentle steam press on reverse side with protective cloth. Do not wring.',
    description: 'Glamorous pure tissue silk saree radiant with delicate metallic shimmer and gossamer lightweight drape. Ideal for contemporary cocktail receptions, sangeet nights, and chic evening parties.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'banarasi',
    icon: '👑',
    name: 'Banarasi Munga Silk Saree',
    nameTa: 'பனாரசி முங்கா சில்க் சேலை',
    fabric: 'Banarasi Munga Silk (Golden Kadwa Weave)',
    fabricTa: 'பனாரசி முங்கா சில்க் (கட்வா நெசவு)',
    keywords: ['banarasi', 'banaras', 'munga', 'kadwa', 'katan', 'floral jaal', 'tanchoi'],
    care: 'Dry clean only. Store wrapped in pure muslin cloth. Avoid spraying perfume directly on zari.',
    description: 'Royal Banarasi Munga silk saree woven with intricate golden floral jaal work, glistening kadwa zari craftsmanship, and a regal brocade border for grand wedding banquets and festive soirées.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'batik',
    icon: '🎨',
    name: 'Handcrafted Batik Wax Resist Cotton Saree',
    nameTa: 'கையால் செய்யப்பட்ட பாடிக் மெழுகு காட்டன் சேலை',
    fabric: 'Batik Wax Resist Pure Cotton',
    fabricTa: 'பாடிக் மெழுகு பியூர் காட்டன்',
    keywords: ['batik', 'wax', 'resist', 'crackles', 'tie and dye', 'shibori', 'indigo'],
    care: 'Hand wash in cold water with mild shampoo or liquid detergent. Color-fast treatment done. Dry in shade.',
    description: 'Artisanal pure cotton saree created using age-old wax resist batik dye techniques, showcasing authentic crackle aesthetics, earthy contrasts, and soft breathable everyday comfort.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'chanderi',
    icon: '🌾',
    name: 'Chanderi Silk Cotton Handloom Saree',
    nameTa: 'சந்தேரி சில்க் காட்டன் கைத்தறி சேலை',
    fabric: 'Chanderi Silk Cotton with Gold Borders',
    fabricTa: 'சந்தேரி சில்க் காட்டன் ஜரிகை பார்டர்',
    keywords: ['chanderi', 'tussar', 'silk cotton', 'kota', 'doria', 'butti', 'handloom silk cotton'],
    care: 'First wash dry clean recommended. Subsequent cold water gentle hand wash. Dry in shade.',
    description: 'Subtle and sophisticated Chanderi silk cotton saree distinguished by its sheer texture, fine handloom feel, and delicate golden zari buttis. Perfect for pooja celebrations and formal day events.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'organza',
    icon: '🌸',
    name: 'Floral Designer Organza Silk Saree',
    nameTa: 'ஃப்ளோரல் டிசைனர் ஆர்கன்சா சில்க் சேலை',
    fabric: 'Premium Sheer Organza Silk',
    fabricTa: 'ப்ரீமியம் ஆர்கன்சா சில்க்',
    keywords: ['organza', 'chiffon', 'sheer', 'translucent', 'floral', 'digital print', 'pastel', 'airy', 'glass tissue'],
    care: 'Dry clean or very gentle cold water dip wash. Do not twist or wring. Hang dry in shade.',
    description: 'Ultra-lightweight sheer organza silk saree featuring ethereal floral digital artistry and scalloped embroidery borders. Accentuates an effortlessly graceful and modern festive silhouette.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  },
  {
    id: 'georgette',
    icon: '💃',
    name: 'Designer Georgette Party Wear Saree',
    nameTa: 'டிசைனர் ஜார்ஜெட் பார்ட்டி வேர் சேலை',
    fabric: 'Pure Viscose Georgette with Thread Embroidery',
    fabricTa: 'பியூர் விஸ்கோஸ் ஜார்ஜெட் எம்பிராய்டரி',
    keywords: ['georgette', 'crepe', 'viscose', 'sequin', 'thread work', 'party wear', 'drape'],
    care: 'Dry clean recommended. Low heat iron on reverse.',
    description: 'Fluid drape pure viscose georgette saree featuring subtle tonal embroidery, easy-to-pleat texture, and modern chic allure for evening dinners and celebrations.',
    length: '6.3m (5.5m saree + 0.8m running blouse piece)'
  }
];

// Non-saree category intelligent presets
export const CATEGORY_GARMENT_PRESETS = {
  'kurtis': [
    {
      id: 'anarkali',
      name: 'Designer Printed Anarkali Kurti & Dupatta Set',
      fabric: 'Pure Rayon Slub with Foil Print',
      keywords: ['anarkali', 'flared', 'dupatta', 'set', 'gown']
    },
    {
      id: 'straight_cotton',
      name: 'Office Wear Straight Cut Cotton Kurti',
      fabric: '100% Breathable Cambric Cotton',
      keywords: ['straight', 'office', 'cotton', 'formal', 'daily']
    }
  ],
  'inskirts': [
    {
      id: 'panel_cotton',
      name: 'Structured 7-Part Panel Poplin Inskirt',
      fabric: '100% Pre-Shrunk Poplin Cotton',
      keywords: ['panel', 'poplin', '7 part', '6 part', '8 part']
    },
    {
      id: 'fishcut_shaper',
      name: 'Mermaid Fit Saree Silhouette Shapewear',
      fabric: 'Stretch Microfiber Lycra Fabric',
      keywords: ['shaper', 'shapewear', 'mermaid', 'fishcut', 'lycra']
    }
  ],
  'blouse-materials': [
    {
      id: 'aari_raw_silk',
      name: 'Heavy Aari Handwork Bridal Raw Silk Blouse Piece',
      fabric: 'Pure Raw Silk with Maggam / Aari Embroidery',
      keywords: ['aari', 'maggam', 'raw silk', 'bridal blouse', 'embroidered']
    },
    {
      id: 'brocade_jacquard',
      name: 'Brocade Jacquard Woven Blouse Material Bit',
      fabric: 'Rich Brocade Jacquard Weave',
      keywords: ['brocade', 'jacquard', 'woven', 'metallic']
    }
  ]
};

/**
 * Intelligent Image & Filename Saree / Garment Type Detection
 * Takes raw file name and image pixel dataUrl, analyzes texture and keywords,
 * and returns the precise saree type, fabric, care, and description.
 */
export async function detectSareeAndFabric(imageSrc, fileName = '', category = 'sarees') {
  const cleanFileName = String(fileName || '')
    .toLowerCase()
    .replace(/[._\-+]/g, ' ')
    .replace(/\s+/g, ' ');

  // 1. Keyword matching against Saree Presets
  let matchedPreset = null;
  let matchScore = 0;

  for (const preset of SAREE_PRESETS) {
    let score = 0;
    for (const kw of preset.keywords) {
      if (cleanFileName.includes(kw)) {
        score += (kw.length > 5 ? 3 : 2);
      }
    }
    if (score > matchScore) {
      matchScore = score;
      matchedPreset = preset;
    }
  }

  // 2. Computer Vision Pixel Inspection (if image available)
  let visualMetrics = {
    edgeContrast: 0,
    hasZari: false,
    hasContrastBorder: false,
    isSheerOrTissue: false,
    isMatteCotton: false
  };

  if (imageSrc && typeof imageSrc === 'string') {
    visualMetrics = await analyzeImageVisualTexture(imageSrc);
  }

  // 3. Intelligent Classification when file name does not give a conclusive match
  if (!matchedPreset || matchScore < 2) {
    if (visualMetrics.hasZari && visualMetrics.hasContrastBorder) {
      // Distinct contrast border + metallic zari = Classic Kanjivaram Soft Silk Saree
      matchedPreset = SAREE_PRESETS.find(p => p.id === 'kanjivaram') || SAREE_PRESETS[0];
    } else if (visualMetrics.isSheerOrTissue) {
      // High lightness + metallic sheen = Pure Tissue Silk Shimmer Saree
      matchedPreset = SAREE_PRESETS.find(p => p.id === 'tissue') || SAREE_PRESETS[4];
    } else if (visualMetrics.hasZari) {
      // Metallic zari present without contrast border = Jacquard or Banarasi Kadwa
      if (visualMetrics.edgeContrast > 26) {
        matchedPreset = SAREE_PRESETS.find(p => p.id === 'jacquard') || SAREE_PRESETS[2];
      } else {
        matchedPreset = SAREE_PRESETS.find(p => p.id === 'kanjivaram') || SAREE_PRESETS[0];
      }
    } else {
      // No metallic zari: Pure printed / handloom fabrics
      if (visualMetrics.edgeContrast > 24) {
        // High detailed printed motifs (figures, trees, peacocks, florals) = Kalamkari
        matchedPreset = SAREE_PRESETS.find(p => p.id === 'kalamkari') || SAREE_PRESETS[1];
      } else if (visualMetrics.isMatteCotton) {
        // Soft matte handloom texture = Pure Mulmul Cotton
        matchedPreset = SAREE_PRESETS.find(p => p.id === 'mulmul_cotton') || SAREE_PRESETS[3];
      } else {
        // Balanced silk cotton handloom
        matchedPreset = SAREE_PRESETS.find(p => p.id === 'chanderi') || SAREE_PRESETS[7];
      }
    }
  }

  return {
    presetId: matchedPreset.id,
    sareeName: matchedPreset.name,
    sareeNameTa: matchedPreset.nameTa,
    fabric: matchedPreset.fabric,
    fabricTa: matchedPreset.fabricTa,
    care: matchedPreset.care,
    description: matchedPreset.description,
    length: matchedPreset.length,
    confidence: matchScore >= 2 ? 'high' : 'medium',
    detectedSource: matchScore >= 2 ? 'filename_keywords' : 'visual_pixel_analysis'
  };
}

/**
 * Analyzes texture variance, edge frequency, metallic zari presence, and contrast borders
 * using an off-screen HTML5 Canvas.
 */
function analyzeImageVisualTexture(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ edgeContrast: 15, hasZari: false, hasContrastBorder: false, isSheerOrTissue: false, isMatteCotton: false });
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        let totalLuminance = 0;
        let totalGradient = 0;
        let zariPixelCount = 0;
        let highLightnessPixelCount = 0;
        const pixelCount = size * size;

        // Grayscale 2D matrix for edge detection
        const gray = new Float32Array(pixelCount);
        for (let i = 0; i < pixelCount; i++) {
          const idx = i * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[i] = lum;
          totalLuminance += lum;

          // Check for golden metallic zari pixels (high red + medium-high green + lower blue)
          if (r > 150 && g > 110 && g < 220 && (r - b) > 40 && Math.abs(r - g) < 70) {
            zariPixelCount++;
          }

          if (lum > 210) {
            highLightnessPixelCount++;
          }
        }

        // Horizontal & Vertical Sobel-like edge gradient
        let gradientSamples = 0;
        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;
            const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
            const gy = Math.abs(gray[idx + size] - gray[idx - size]);
            totalGradient += (gx + gy);
            gradientSamples++;
          }
        }

        // Contrast border detection: measure difference between outer border perimeter and inner body
        let borderLuminance = 0;
        let borderCount = 0;
        let centerLuminance = 0;
        let centerCount = 0;

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const idx = y * size + x;
            const lum = gray[idx];
            if (y < 12 || y > size - 12 || x < 12 || x > size - 12) {
              borderLuminance += lum;
              borderCount++;
            } else {
              centerLuminance += lum;
              centerCount++;
            }
          }
        }

        const avgBorderLum = borderLuminance / Math.max(1, borderCount);
        const avgCenterLum = centerLuminance / Math.max(1, centerCount);
        const hasContrastBorder = Math.abs(avgBorderLum - avgCenterLum) > 28;

        const avgLuminance = totalLuminance / pixelCount;
        const avgGradient = totalGradient / Math.max(1, gradientSamples);
        const zariRatio = zariPixelCount / pixelCount;
        const highLightnessRatio = highLightnessPixelCount / pixelCount;

        const hasZari = zariRatio > 0.025;
        const isSheerOrTissue = highLightnessRatio > 0.40 && zariRatio > 0.015;
        const isMatteCotton = avgGradient < 20 && !hasZari && avgLuminance < 190;

        resolve({
          edgeContrast: avgGradient,
          hasZari,
          hasContrastBorder,
          isSheerOrTissue,
          isMatteCotton
        });
      } catch (e) {
        resolve({ edgeContrast: 15, hasZari: false, hasContrastBorder: false, isSheerOrTissue: false, isMatteCotton: false });
      }
    };

    img.onerror = () => {
      resolve({ edgeContrast: 15, hasZari: false, hasContrastBorder: false, isSheerOrTissue: false, isMatteCotton: false });
    };

    img.src = imageSrc;
  });
}
