
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
const productColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const assignedProductColors: Record<string, string> = {};
let nextProductColorIndex = 0;

/**
 * Assigns a consistent color to a product by its name.
 * This ensures that a product has the same color across all charts and tables.
 * @param productName The name of the product.
 * @returns A CSS color string.
 */
export function getProductColor(productName: string): string {
    if (!assignedProductColors[productName]) {
        assignedProductColors[productName] = productColors[nextProductColorIndex % productColors.length];
        nextProductColorIndex++;
    }
    return assignedProductColors[productName];
}
