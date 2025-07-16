
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { chartColorVars, semanticColorMap, productColorVars } from "./engine/chart-colors"
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
let nextProductColorIndex = 0;
let nextFixedCostColorIndex = 0;

/**
 * Assigns a consistent color to a product or fixed cost item.
 * Prioritizes user-defined color, then semantic mapping, then falls back to a rotating default palette.
 * @param item The product or fixed cost item object.
 * @returns A CSS color string (hex or HSL).
 */
export function getProductColor(item: Product | FixedCostItem): string {
    const isProduct = 'productName' in item;
    const name = isProduct ? item.productName : item.name;

    // 1. Priority: Use user-defined color if it exists
    if (item.color) {
        return item.color;
    }
    
    // 2. Check cache to maintain consistency across renders
    if (assignedColors[name]) {
        return assignedColors[name];
    }
    
    // 3. For Fixed Costs, check for semantic matches
    if (!isProduct) {
        const lowerName = name.toLowerCase();
        for (const key in semanticColorMap) {
            if (lowerName.includes(key.toLowerCase())) {
                const color = semanticColorMap[key];
                assignedColors[name] = color;
                return color;
            }
        }
    }

    // 4. Fallback: Assign next available color from the appropriate default palette
    let color: string;
    if (isProduct) {
        color = productColorVars[nextProductColorIndex % productColorVars.length];
        nextProductColorIndex++;
    } else {
        color = chartColorVars[nextFixedCostColorIndex % chartColorVars.length];
        nextFixedCostColorIndex++;
    }
    
    assignedColors[name] = color;
    return color;
}
