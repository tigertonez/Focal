
// src/lib/printColors.ts
const cache = new Map<string, string>();

function hslToHex(hsl: string): string {
  const norm = hsl.replace(/[hsl(),%]/gi, '').trim();
  const parts = norm.split(/\s+/);
  if (parts.length < 3) return '';
  
  let [h, s, l] = parts.map(Number);
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    
  const to255 = (x: number) => Math.round(x * 255);
  const toHex2 = (x: number) => x.toString(16).padStart(2, '0');
  
  const r = to255(f(0)), g = to255(f(8)), b = to255(f(4));
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

export function resolveToHex(input: string, fallback: string = '#777777'): string {
  if (typeof window === 'undefined') return fallback;
  if (!input) return fallback;
  
  const key = `R:${input}`;
  if (cache.has(key)) return cache.get(key)!;

  let out = fallback;
  const s = input.trim();

  try {
    if (s.startsWith('#')) {
      if (s.length === 4) out = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
      else if (s.length === 7) out = s;
    } else if (s.startsWith('hsl')) {
      const inner = s.slice(s.indexOf('(') + 1, s.lastIndexOf(')')).trim();
      if (inner.startsWith('var(')) {
        const varName = inner.slice(4, -1).trim();
        const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        out = raw ? hslToHex(raw) : fallback;
      } else {
        out = hslToHex(inner);
      }
    } else if (s.startsWith('var(')) {
      const varName = s.slice(4, -1).trim();
      const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (raw) {
        out = raw.startsWith('#') ? raw : (raw.includes('%') ? hslToHex(raw) : raw);
      }
    } else {
      const tmp = document.createElement('div');
      tmp.style.color = s;
      document.body.appendChild(tmp);
      const rgb = getComputedStyle(tmp).color;
      document.body.removeChild(tmp);
      
      const m = rgb.match(/\d+/g);
      if (m && m.length >= 3) {
        const [r, g, b] = m.map(Number);
        out = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
  } catch (e) {
    console.error(`[resolveToHex] Failed for input: "${input}"`, e);
    out = fallback; // Ensure fallback on any error
  }

  cache.set(key, out);
  return out;
}
