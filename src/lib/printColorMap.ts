// src/lib/printColorMap.ts
const CATS = ['#324E98', '#EF4444', '#10B981', '#F59E0B', '#A855F7', '#0EA5E9', '#F43F5E', '#22C55E'] as const;
const FALLBACKS = {
  primary: '#324E98',
  destructive: '#EF4444',
  text: '#0F172A',     // slate-900
  grid: '#CBD5E1',     // slate-300
  muted: '#94A3B8'     // slate-400
};

// Special series that must use neutral greys (variable cost aggregates)
const SPECIAL_SERIES_COLORS: Record<string, string> = {
  "Deposits": "#9CA3AF",          // light grey
  "Final Payments": "#4B5563",    // dark grey
  "Total Variable Costs": "#6B7280" // mid grey
};

const map = new Map<string, string>();

// Stable index generation (small DJB2 hash)
function idxFor(key: string) {
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h) ^ key.charCodeAt(i);
  }
  return Math.abs(h) % CATS.length;
}

// Seed with product/series keys and their user-defined colors
export function seedPrintColorMap(items: Array<{ id?: string; name: string; color?: string; hex?: string }>) {
  map.clear(); // Clear previous mappings
  
  for (const item of items) {
    const key = item.name;
    if (!key) continue;
    
    // Check if this is a special series that must use neutral grey
    if (SPECIAL_SERIES_COLORS[key]) {
      map.set(key, SPECIAL_SERIES_COLORS[key]);
      continue;
    }
    
    // Use user-defined color if available and valid
    const userColor = item.color || item.hex;
    if (userColor && /^#[0-9A-F]{6}$/i.test(userColor)) {
      map.set(key, userColor);
    } else {
      // Fallback to deterministic color from palette
      map.set(key, CATS[idxFor(key)]);
    }
  }
}

export function colorFor(key: string | undefined, fallback = FALLBACKS.primary) {
  if (!key) return fallback;
  
  // Check special series first
  if (SPECIAL_SERIES_COLORS[key]) {
    return SPECIAL_SERIES_COLORS[key];
  }
  
  return map.get(key) || CATS[idxFor(key)];
}

export function palette() {
  return { CATS, ...FALLBACKS };
}

// Get all current mappings for diagnostics
export function dumpColorMap() {
  return Array.from(map.entries()).map(([k, v]) => ({ key: k, color: v }));
}

// Validate that user colors are preserved for fixed costs
export function validateUserColors(expectedMappings: Record<string, string>): { valid: boolean; mismatches: Array<{ key: string; expected: string; actual: string }> } {
  const mismatches: Array<{ key: string; expected: string; actual: string }> = [];
  
  for (const [key, expectedColor] of Object.entries(expectedMappings)) {
    // Skip special series as they should always use neutral greys
    if (SPECIAL_SERIES_COLORS[key]) continue;
    
    const actualColor = map.get(key);
    if (actualColor !== expectedColor) {
      mismatches.push({ key, expected: expectedColor, actual: actualColor || 'undefined' });
    }
  }
  
  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}