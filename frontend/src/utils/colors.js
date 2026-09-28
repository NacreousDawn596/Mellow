// Utility helpers for color extraction (dynamic artwork background).

function rgbToHex(r, g, b) {
  const to = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3 ? h.split('').map((c) => c + c).join('') : h,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hexA, hexB, t) {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  return rgbToHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t
  );
}

export function lighten(hex, t) {
  return mix(hex, '#ffffff', t);
}

export function darken(hex, t) {
  return mix(hex, '#000000', t);
}

/**
 * Extract a representative dominant color from an image.
 * Returns a Promise<string> hex color, resolving to a fallback on failure
 * (e.g. tainted canvas due to CORS).
 */
export function extractDominantColor(img, fallback = '#1b1230') {
  return new Promise((resolve) => {
    try {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      // track the most saturated pixel too, for a livelier accent
      let best = null;
      let bestSat = -1;

      for (let i = 0; i < data.length; i += 4) {
        const pr = data[i];
        const pg = data[i + 1];
        const pb = data[i + 2];
        r += pr;
        g += pg;
        b += pb;
        count += 1;

        const max = Math.max(pr, pg, pb);
        const min = Math.min(pr, pg, pb);
        const sat = max === 0 ? 0 : (max - min) / max;
        if (sat > bestSat) {
          bestSat = sat;
          best = [pr, pg, pb];
        }
      }

      const avg = rgbToHex(r / count, g / count, b / count);
      // bias the accent toward the vibrant pixel for a livelier tint
      const accent = best ? rgbToHex(best[0], best[1], best[2]) : avg;
      resolve({ average: avg, accent });
    } catch {
      resolve({ average: fallback, accent: fallback });
    }
  });
}

export const defaultAccent = {
  average: '#1b1230',
  accent: '#8b5cf6',
};
