// src/lib/specialSeries.ts

// Special series that must always use neutral greys (variable cost aggregates)
export const SPECIAL_SERIES_LOCK: Record<string, `#${string}`> = {
  "Deposits": "#9CA3AF",          // light grey
  "Final Payments": "#4B5563",    // dark grey  
  "Total Variable Costs": "#6B7280" // mid grey
};

export function specialColorFor(key: string): string | null {
  return SPECIAL_SERIES_LOCK[key] ?? null;
}

export function isSpecialSeries(key: string): boolean {
  return key in SPECIAL_SERIES_LOCK;
}

// Validate that special series are not overridden by user colors
export function validateSpecialSeries(colorMappings: Record<string, string>): {
  valid: boolean;
  violations: Array<{ key: string; expected: string; attempted: string }>;
} {
  const violations: Array<{ key: string; expected: string; attempted: string }> = [];
  
  for (const [key, expectedColor] of Object.entries(SPECIAL_SERIES_LOCK)) {
    const attemptedColor = colorMappings[key];
    if (attemptedColor && attemptedColor !== expectedColor) {
      violations.push({ key, expected: expectedColor, attempted: attemptedColor });
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}