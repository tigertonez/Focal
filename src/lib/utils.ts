

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
    if (compact && Math.abs(value) >= 1000) {
        const thousands = value / 1000;
        return `${currency === 'EUR' ? '€' : '$'}${thousands.toFixed(0)}k`;
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
let usedColorIndex = 0; // Use a simple index to cycle through colors for more reliable uniqueness

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
export function getProductColor(item: Product | FixedCostItem | { id: string, name: string, color?: string }): string {
    const isProduct = 'productName' in item;
    const name = isProduct ? item.productName : item.name;
    const id = item.id;

    if (item.color) return item.color;
    if (assignedColors[id]) return assignedColors[id];

    const lowerName = name.toLowerCase();
    
    // Check for direct semantic matches first (like "Deposits")
    for (const key in semanticColorMap) {
        if (lowerName === key.toLowerCase()) {
            const color = semanticColorMap[key];
            assignedColors[id] = color;
            return color;
        }
    }
    
    const hash = simpleHash(id);
    let color: string;

    // Check for keyword-based semantic matches
    let foundSemantic = false;
    for (const key in semanticColorMap) {
        if (lowerName.includes(key.toLowerCase())) {
            color = semanticColorMap[key];
            assignedColors[id] = color;
            foundSemantic = true;
            return color;
        }
    }

    const palette = isProduct ? productColorVars : chartColorVars;
    color = palette[hash % palette.length];
    
    assignedColors[id] = color;
    return color;
}
