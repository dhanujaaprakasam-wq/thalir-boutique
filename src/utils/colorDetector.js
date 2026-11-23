// Thalir Boutique - High-Precision Garment Color Detection & Matching Engine (v3)
// Features:
// 1. Redmean Human-Perceptual Color Distance Matching
// 2. Center-Weighted Garment Pixel Prioritization
// 3. Multi-Cluster Palette Extraction (Extracts body color + border/print accents)
// 4. Strict Neutral Background Elimination (Floor, bedsheet, table & white studio walls)

export const BOUTIQUE_COLOR_PALETTE = [
  // Yellows & Golds
  { name: 'Haldi Yellow', code: '#F59E0B', r: 245, g: 158, b: 11 },
  { name: 'Mustard Yellow', code: '#E09F3E', r: 224, g: 159, b: 62 },
  { name: 'Lemon Yellow', code: '#FACC15', r: 250, g: 204, b: 21 },
  { name: 'Golden Zari', code: '#D4AF37', r: 212, g: 175, b: 55 },
  { name: 'Champagne Gold', code: '#E2BF7D', r: 226, g: 191, b: 125 },

  // Pinks & Magentas
  { name: 'Rani Pink', code: '#D81159', r: 216, g: 17, b: 89 },
  { name: 'Hot Pink', code: '#E0218A', r: 224, g: 33, b: 138 },
  { name: 'Rose Pink', code: '#F43F5E', r: 244, g: 63, b: 94 },
  { name: 'Baby Pink', code: '#F9A8D4', r: 249, g: 168, b: 212 },
  { name: 'Blush Pink', code: '#FDA4AF', r: 253, g: 164, b: 175 },

  // Blues
  { name: 'Peacock Blue', code: '#005F73', r: 0, g: 95, b: 115 },
  { name: 'Royal Blue', code: '#1D4ED8', r: 29, g: 78, b: 216 },
  { name: 'Navy Blue', code: '#0F172A', r: 15, g: 23, b: 42 },
  { name: 'Sky Blue', code: '#38BDF8', r: 56, g: 189, b: 248 },
  { name: 'Ice Blue', code: '#BAE6FD', r: 186, g: 230, b: 253 },

  // Greens
  { name: 'Emerald Green', code: '#0D5C3A', r: 13, g: 92, b: 58 },
  { name: 'Bottle Green', code: '#064E3B', r: 6, g: 78, b: 59 },
  { name: 'Rama Green / Teal', code: '#0D9488', r: 13, g: 148, b: 136 },
  { name: 'Mehendi Green', code: '#588157', r: 88, g: 129, b: 87 },
  { name: 'Olive Green', code: '#65A30D', r: 101, g: 163, b: 13 },
  { name: 'Mint Green', code: '#6EE7B7', r: 110, g: 231, b: 183 },
  { name: 'Pista Green', code: '#A7F3D0', r: 167, g: 243, b: 208 },

  // Reds & Maroons
  { name: 'Bridal Maroon', code: '#7F1D1D', r: 127, g: 29, b: 29 },
  { name: 'Ruby Red', code: '#DC2626', r: 220, g: 38, b: 38 },
  { name: 'Chilli Red', code: '#B91C1C', r: 185, g: 28, b: 28 },
  { name: 'Kumkum Red', code: '#9B1D20', r: 155, g: 29, b: 32 },

  // Purples & Wines
  { name: 'Wine Maroon', code: '#5F0F40', r: 95, g: 15, b: 64 },
  { name: 'Plum / Burgundy', code: '#701A75', r: 112, g: 26, b: 117 },
  { name: 'Royal Purple', code: '#7C3AED', r: 124, g: 58, b: 237 },
  { name: 'Lavender', code: '#C084FC', r: 192, g: 132, b: 252 },

  // Oranges & Peaches
  { name: 'Tangerine Orange', code: '#EA580C', r: 234, g: 88, b: 12 },
  { name: 'Rust Orange', code: '#C2410C', r: 194, g: 65, b: 12 },
  { name: 'Peach', code: '#FB923C', r: 251, g: 146, b: 60 },
  { name: 'Coral', code: '#F87171', r: 248, g: 113, b: 113 },

  // Neutrals, Earthy & Monochrome
  { name: 'Beige / Sandal', code: '#E7D8C9', r: 231, g: 216, b: 201 },
  { name: 'Cream / Off-White', code: '#FEF3C7', r: 254, g: 243, b: 199 },
  { name: 'Silver Grey', code: '#9CA3AF', r: 156, g: 163, b: 175 },
  { name: 'Charcoal Grey', code: '#334155', r: 51, g: 65, b: 85 },
  { name: 'Jet Black', code: '#1A1A1A', r: 26, g: 26, b: 26 },
  { name: 'Pure White', code: '#F8F9FA', r: 248, g: 249, b: 250 },
  { name: 'Chocolate Brown', code: '#451A03', r: 69, g: 26, b: 3 }
];

export const rgbToHex = (r, g, b) => {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = ((bigint >> 8) & 0xf) * 17;
    const g = ((bigint >> 4) & 0xf) * 17;
    const b = (bigint & 0xf) * 17;
    return { r, g, b };
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

// Redmean Human-Eye Perceptual Color Distance Formula
export const colorDistance = (r1, g1, b1, r2, g2, b2) => {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (((512 + rmean) * dr * dr) >> 8) +
    (4 * dg * dg) +
    (((767 - rmean) * db * db) >> 8)
  );
};

// Finds the closest matching authentic boutique color
export const matchClosestBoutiqueColor = (r, g, b) => {
  let closest = BOUTIQUE_COLOR_PALETTE[0];
  let minDistance = Infinity;

  for (const preset of BOUTIQUE_COLOR_PALETTE) {
    const distance = colorDistance(r, g, b, preset.r, preset.g, preset.b);
    if (distance < minDistance) {
      minDistance = distance;
      closest = preset;
    }
  }

  return closest;
};

// Computer Vision: Analyzes image pixel array with adaptive background filtering
const extractDominantColorFromPixels = (imgData, width, height) => {
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  let chromaticPixelCount = 0;
  let allPixelsCount = 0;
  let fallbackR = 0, fallbackG = 0, fallbackB = 0;

  // Step 1: Scan for chromatic content to decide background suppression threshold
  for (let i = 0; i < imgData.length; i += 4) {
    const a = imgData[i + 3];
    if (a < 128) continue;
    allPixelsCount++;

    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    fallbackR += r;
    fallbackG += g;
    fallbackB += b;

    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    if (saturation >= 18) {
      chromaticPixelCount++;
    }
  }

  // If at least 3.5% of pixels are chromatic, we have a colorful garment!
  const hasGarmentColor = (chromaticPixelCount / Math.max(1, allPixelsCount)) > 0.035;

  // Step 2: Bucket colors with center-weighting
  const buckets = {};
  const step = 20; // 20-unit quantization

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = imgData[idx + 3];
      if (a < 128) continue;

      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      const brightness = (r + g + b) / 3;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);

      // Background Filtering:
      // If image has a colorful saree, completely filter out grey floors, bedsheets, white studio background
      if (hasGarmentColor) {
        const isNeutralBackdrop = (saturation < 16 && brightness > 120);
        const isExtremeGlare = (brightness > 242 && saturation < 25);
        const isPitchBlack = (brightness < 12);
        if (isNeutralBackdrop || isExtremeGlare || isPitchBlack) {
          continue;
        }
      }

      // Radial Center Weight:
      // Saree is centered in product photos. Center pixels receive 1.0 weight, edges down to 0.25.
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const centerWeight = Math.max(0.25, 1.0 - (dist * 0.55));

      // Vibrant pixels get higher weight so garment body wins over subtle print noise
      const vibrancyWeight = 1.0 + (saturation / 30);
      const weight = centerWeight * vibrancyWeight;

      const kr = Math.round(r / step) * step;
      const kg = Math.round(g / step) * step;
      const kb = Math.round(b / step) * step;
      const key = `${kr},${kg},${kb}`;

      if (!buckets[key]) {
        buckets[key] = { count: 0, weight: 0, sumR: 0, sumG: 0, sumB: 0 };
      }

      buckets[key].count++;
      buckets[key].weight += weight;
      buckets[key].sumR += r * weight;
      buckets[key].sumG += g * weight;
      buckets[key].sumB += b * weight;
    }
  }

  // Sort clusters by accumulated weight
  const sortedClusters = Object.values(buckets).sort((a, b) => b.weight - a.weight);

  // If no buckets formed (e.g. solid white or black)
  if (sortedClusters.length === 0) {
    if (allPixelsCount > 0) {
      const avgR = Math.round(fallbackR / allPixelsCount);
      const avgG = Math.round(fallbackG / allPixelsCount);
      const avgB = Math.round(fallbackB / allPixelsCount);
      const match = matchClosestBoutiqueColor(avgR, avgG, avgB);
      return {
        colorName: match.name,
        colorCode: match.code,
        detectedHex: rgbToHex(avgR, avgG, avgB),
        rgb: { r: avgR, g: avgG, b: avgB },
        suggestions: [match]
      };
    }
    return {
      colorName: 'Emerald Green',
      colorCode: '#0D5C3A',
      detectedHex: '#0D5C3A',
      rgb: { r: 13, g: 92, b: 58 },
      suggestions: [{ name: 'Emerald Green', code: '#0D5C3A' }]
    };
  }

  // Extract distinct top suggestions from the image (Primary body color + border/print accents)
  const suggestions = [];
  for (const b of sortedClusters) {
    if (b.weight <= 0) continue;
    const cr = Math.round(b.sumR / b.weight);
    const cg = Math.round(b.sumG / b.weight);
    const cb = Math.round(b.sumB / b.weight);
    const match = matchClosestBoutiqueColor(cr, cg, cb);

    // Only add if distinct from existing suggestions
    const alreadyPresent = suggestions.some(s => s.name === match.name);
    if (!alreadyPresent) {
      suggestions.push({
        name: match.name,
        code: match.code,
        detectedHex: rgbToHex(cr, cg, cb)
      });
    }
    if (suggestions.length >= 4) break;
  }

  const primary = suggestions[0] || {
    name: 'Emerald Green',
    code: '#0D5C3A',
    detectedHex: '#0D5C3A'
  };

  const topCluster = sortedClusters[0];
  const finalR = Math.round(topCluster.sumR / topCluster.weight);
  const finalG = Math.round(topCluster.sumG / topCluster.weight);
  const finalB = Math.round(topCluster.sumB / topCluster.weight);

  return {
    colorName: primary.name,
    colorCode: primary.code,
    detectedHex: primary.detectedHex || rgbToHex(finalR, finalG, finalB),
    rgb: { r: finalR, g: finalG, b: finalB },
    suggestions: suggestions
  };
};

// Asynchronously detects dominant boutique color from any image URL or Data URL
export const detectDominantColorFromImage = (imageSrc) => {
  return new Promise((resolve) => {
    if (!imageSrc || typeof imageSrc !== 'string') {
      resolve({
        colorName: 'Emerald Green',
        colorCode: '#0D5C3A',
        suggestions: [{ name: 'Emerald Green', code: '#0D5C3A' }]
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64; // 64x64 = 4,096 sample points
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            colorName: 'Emerald Green',
            colorCode: '#0D5C3A',
            suggestions: [{ name: 'Emerald Green', code: '#0D5C3A' }]
          });
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;
        const result = extractDominantColorFromPixels(imgData, size, size);
        resolve(result);
      } catch (err) {
        console.warn('Auto color detection error:', err);
        resolve({
          colorName: 'Emerald Green',
          colorCode: '#0D5C3A',
          suggestions: [{ name: 'Emerald Green', code: '#0D5C3A' }]
        });
      }
    };

    img.onerror = () => {
      resolve({
        colorName: 'Emerald Green',
        colorCode: '#0D5C3A',
        suggestions: [{ name: 'Emerald Green', code: '#0D5C3A' }]
      });
    };

    img.src = imageSrc;
  });
};
