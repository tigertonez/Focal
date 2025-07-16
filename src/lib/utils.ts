

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

// A simple hashing function to get a deterministic index from a string.
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};


/**
 * Assigns a consistent color to a product or fixed cost item.
 * This function is now deterministic and stateless.
 * @param item The product or fixed cost item object.
 * @returns A CSS color string (hex or HSL).
 */
export function getProductColor(item: Product | FixedCostItem): string {
    const isProduct = 'productName' in item;
    const name = isProduct ? item.productName : item.name;
    const id = item.id;

    // 1. Priority: Use user-defined color if it exists
    if (item.color) {
        return item.color;
    }
    
    // 2. Check cache to maintain consistency within a single render pass
    if (assignedColors[id]) {
        return assignedColors[id];
    }
    
    // 3. For Fixed Costs, check for semantic matches
    if (!isProduct) {
        const lowerName = name.toLowerCase();
        for (const key in semanticColorMap) {
            if (lowerName.includes(key.toLowerCase())) {
                const color = semanticColorMap[key];
                assignedColors[id] = color;
                return color;
            }
        }
    }

    // 4. Fallback: Assign a deterministic color from the appropriate default palette based on ID hash
    const hash = simpleHash(id);
    let color: string;
    if (isProduct) {
        color = productColorVars[hash % productColorVars.length];
    } else {
        color = chartColorVars[hash % chartColorVars.length];
    }
    
    assignedColors[id] = color;
    return color;
}
