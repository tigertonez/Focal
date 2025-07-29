

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { chartColorVars, semanticColorMap, productColorVars } from "./engine/chart-colors"
import type { FixedCostItem, Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'USD', compact = false) {
    const style: Intl.NumberFormatOptions = {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    };
    if (compact) {
        if (Math.abs(value) >= 1000) {
            const thousands = value / 1000;
            return `${currency === 'EUR' ? '€' : '$'}${thousands.toFixed(0)}k`;
        }
    }
    return new Intl.NumberFormat('de-DE', style).format(value);
}

export function formatNumber(value: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// --- Centralized Product Color Assignment ---
const assignedColors: Record<string, string> = {};
const usedColors = new Set<string>();

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

// New semantic color map for products
const productSemanticColors: Record<string, string[]> = {
    "gold": ["hsl(45, 74%, 55%)", "hsl(45, 74%, 65%)", "hsl(45, 74%, 45%)"],
    "silber": ["hsl(220, 13%, 85%)", "hsl(220, 13%, 75%)", "hsl(220, 13%, 65%)"],
    "silver": ["hsl(220, 13%, 85%)", "hsl(220, 13%, 75%)", "hsl(220, 13%, 65%)"],
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

    const lowerName = name.toLowerCase();
    const hash = simpleHash(id);
    let color: string | undefined;

    // 3. New: Check for semantic product keywords
    if (isProduct) {
        for (const key in productSemanticColors) {
            if (lowerName.includes(key)) {
                const palette = productSemanticColors[key];
                color = palette[hash % palette.length];
                break; // Stop after first match
            }
        }
    }

    // 4. For Fixed Costs, check for semantic matches
    if (!isProduct) {
        for (const key in semanticColorMap) {
            if (lowerName.includes(key.toLowerCase())) {
                const semanticColor = semanticColorMap[key];
                if (!usedColors.has(semanticColor)) {
                    color = semanticColor;
                }
                break;
            }
        }
    }

    // 5. Fallback: Assign a deterministic color from the default palette, ensuring uniqueness
    if (!color) {
        const palette = isProduct ? productColorVars : chartColorVars;
        let attempt = 0;
        do {
            const index = (hash + attempt) % palette.length;
            const potentialColor = palette[index];
            if (!usedColors.has(potentialColor)) {
                color = potentialColor;
            }
            attempt++;
        } while (!color && attempt < palette.length);

        // If all colors are used, just cycle through them
        if (!color) {
            color = palette[hash % palette.length];
        }
    }
    
    usedColors.add(color);
    assignedColors[id] = color;
    return color;
}
