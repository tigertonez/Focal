
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
