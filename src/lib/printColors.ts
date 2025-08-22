// src/lib/printColors.ts

import type { Product } from "./types";
import { getProductColor } from "./utils";
import { ForecastContextType, useForecast } from "@/context/ForecastContext";

/**
 * Resolves a CSS color string (including CSS variables) to a HEX string.
 * This must be run in a browser context where styles are available.
 * @param input The color string (e.g., 'hsl(var(--primary))', '#FFF', 'rgb(0,0,0)').
 * @param fallback A default HEX color to return on failure.
 * @returns The resolved color as a HEX string (e.g., '#324E98').
 */
export function resolveToHex(input: string, fallback = '#777777'): string {
    if (!input || typeof document === 'undefined') return fallback;

    let a = document.createElement('div');
    a.style.color = input;
    document.body.appendChild(a);
    let resolvedColor = getComputedStyle(a).color;
    document.body.removeChild(a);

    const match = resolvedColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (!match) return fallback;

    const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
    const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


/**
 * Retrieves the application's product list from the global context
 * and builds a map of product name to its resolved HEX color.
 * This function must be run within a component that has access to the ForecastContext.
 * @param doc The document object (typically from an iframe) to resolve computed styles against.
 * @returns A map where keys are product names and values are their HEX colors.
 */
export function getRevenueSeriesHexMap(doc: Document): Record<string, string> {
    const colorMap: Record<string, string> = {};

    // This is a workaround to access React context data from a non-React utility function.
    // It relies on the data being available on the window object of the print iframe.
    const inputs = (doc.defaultView as any)?.__NEXT_DATA__?.props?.pageProps?.inputs as ForecastContextType['inputs'] | undefined;
    
    if (!inputs || !inputs.products) {
        console.warn("Could not find product data to build color map.");
        return {};
    }

    inputs.products.forEach(product => {
        const colorString = getProductColor(product);
        colorMap[product.productName] = resolveToHex(colorString);
    });

    return colorMap;
}

    