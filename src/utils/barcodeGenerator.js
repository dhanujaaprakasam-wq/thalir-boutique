/**
 * Barcode & QR Code Generator Utility for Thalir Boutique
 * Generates standards-compliant Code128 barcodes and 2D QR codes in pure SVG.
 */
import QRCode from 'qrcode';

// Code128 Patterns for ASCII 32 to 127
// 107 patterns, each 11 modules wide (except stop character which is 13)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is STOP pattern)
];

// Start B symbol index is 104
const START_B = 104;
const STOP = 106;

/**
 * Encodes text into Code128 format modules (sequence of 1s and 0s)
 */
export function encodeCode128B(text) {
  if (!text) return '';
  const clean = String(text);
  
  // Calculate checksum
  let checksum = START_B;
  const indices = [START_B];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      indices.push(code);
      checksum += code * (i + 1);
    } else {
      // Fallback for non-printable char
      indices.push(0);
    }
  }

  const checkIndex = checksum % 103;
  indices.push(checkIndex);
  indices.push(STOP);

  // Convert pattern digits (widths of alternating bar/space) to binary modules
  let binaryString = '';
  indices.forEach((idx) => {
    const pattern = CODE128_PATTERNS[idx];
    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      binaryString += (isBar ? '1' : '0').repeat(width);
      isBar = !isBar;
    }
  });

  return binaryString;
}

/**
 * Generates an SVG path string for Code128 barcode
 */
export function generateBarcodeSvgPath(text, barWidth = 2, height = 48) {
  const binary = encodeCode128B(text);
  if (!binary) return { path: '', width: 100, height };

  const quietZone = 10; // 10 modules on each side
  let path = '';
  let x = quietZone * barWidth;

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      path += `M${x},0 h${barWidth} v${height} h-${barWidth} Z `;
    }
    x += barWidth;
  }

  const totalWidth = (binary.length + quietZone * 2) * barWidth;
  return { path, width: totalWidth, height };
}

/**
 * Generate QR Code Data URL (PNG/SVG) using qrcode library
 */
export async function generateQrDataUrl(text, options = {}) {
  try {
    const url = await QRCode.toDataURL(text, {
      width: options.width || 120,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.color || '#073822',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return url;
  } catch (err) {
    console.warn('QR code generation error:', err);
    return '';
  }
}
