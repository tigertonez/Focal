

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


/**
 * Returns the color for a given product or fixed cost item.
 * It prioritizes the color set on the item object itself.
 * If no color is set, it assigns a deterministic color from a predefined palette
 * based on a hash of the item's ID.
 * @param item The product or fixed cost item.
 * @returns A CSS color string.
 */
export function getProductColor(item: { id: string, color?: string, name?: string, productName?: string }): string {
    if (item.color) {
        return item.color;
    }

    // Fallback to a deterministic color based on the ID if no color is specified.
    const palette = [
        "#2563eb", "#d946ef", "#f97316", "#0d9488",
        "#ec4899", "#8b5cf6", "#65a30d", "#f59e0b"
    ];
    
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
        const char = item.id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    
    return palette[Math.abs(hash) % palette.length];
}
