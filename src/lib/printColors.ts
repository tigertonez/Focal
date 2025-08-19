// src/lib/printColors.ts

// Convert CSS var hsl to hex once and cache (called in print iframe context)
const cache = new Map<string, string>();

function hslToHex(hsl: string): string {
    let [h, s, l] = hsl.match(/\d+/g)!.map(Number);
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


export function resolveThemeHex(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  if (cache.has(varName)) return cache.get(varName)!;
  
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim(); 
  
  if (!raw) {
    cache.set(varName, fallback);
    return fallback;
  }
  
  const hex = raw.startsWith('#') ? raw : hslToHex(raw);
  cache.set(varName, hex);
  return hex;
}

export function getPrintPalette() {
  return {
    primary: resolveThemeHex('--primary', '#324E98'),
    destructive: resolveThemeHex('--destructive', '#EF4444'),
    success: '#10B981',
    warning: '#F59E0B',
    muted: '#94A3B8',
    green: "hsl(140, 70%, 40%)",
    lightRed: "hsl(0, 70%, 70%)",
    categorical: ['#324E98', '#EF4444', '#10B981', '#F59E0B', '#A855F7', '#0EA5E9', '#F43F5E', '#22C55E']
  };
}
