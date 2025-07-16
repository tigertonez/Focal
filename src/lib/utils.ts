
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { chartColorVars, semanticColorMap } from "./engine/chart-colors"
import type { FixedCostItem, Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatNumber(value: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// --- Centralized Product Color Assignment ---

const assignedColors: Record<string, string> = {};
let nextColorIndex = 0;

/**
 * Assigns a consistent color to a product or fixed cost item.
 * Prioritizes user-defined color, then semantic mapping, then falls back to a rotating default palette.
 * @param item The product or fixed cost item object.
 * @returns A CSS color string (hex or HSL).
 */
export function getProductColor(item: Product | FixedCostItem): string {
    const name = 'productName' in item ? item.productName : item.name;

    // 1. Priority: Use user-defined color if it exists
    if (item.color) {
        return item.color;
    }
    
    // 2. Check cache to maintain consistency across renders
    if (assignedColors[name]) {
        return assignedColors[name];
    }

    // 3. Check for semantic matches in the predefined map
    const lowerName = name.toLowerCase();
    for (const key in semanticColorMap) {
        if (lowerName.includes(key.toLowerCase())) {
            const color = semanticColorMap[key];
            assignedColors[name] = color;
            return color;
        }
    }

    // 4. Fallback: Assign next available color from the default palette
    const color = chartColorVars[nextColorIndex % chartColorVars.length];
    assignedColors[name] = color;
    nextColorIndex++;
    
    return color;
}
