// src/lib/printColorMap.ts
const CATS = ['#324E98','#EF4444','#10B981','#F59E0B','#A855F7','#0EA5E9','#F43F5E','#22C55E'] as const;
const FALLBACKS = {
  primary: '#324E98',
  destructive: '#EF4444',
  text: '#0F172A',     // slate-900
  grid: '#CBD5E1',     // slate-300
  muted: '#94A3B8'     // slate-400
};

const map = new Map<string,string>();

// stabile Index-Bildung (kleines DJB2-Hash)
function idxFor(key: string) {
  let h = 5381; for (let i=0;i<key.length;i++) h = ((h<<5)+h) ^ key.charCodeAt(i);
  return Math.abs(h) % CATS.length;
}

// Seed mit Produkt-/Serien-Schlüsseln, z.B. ['Hoodie','Shorts','Shirts']
export function seedPrintColorMap(keys: string[]) {
  for (const k of keys) if (k && !map.has(k)) map.set(k, CATS[idxFor(k)]);
}

export function colorFor(key: string | undefined, fallback = FALLBACKS.primary) {
  if (!key) return fallback;
  return map.get(key) || CATS[idxFor(key)];
}

export function palette() { return { CATS, ...FALLBACKS }; }

// Diagnose: vollständige Zuordnung ausgeben
export function dumpColorMap() {
  return Array.from(map.entries()).map(([k,v])=>({key:k,color:v}));
}
