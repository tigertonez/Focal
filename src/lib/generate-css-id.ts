
/**
 * Converts a string into a valid CSS identifier.
 * e.g., "Pro Widget" -> "pro-widget"
 * @param name The string to convert.
 * @returns A safe string to be used as a CSS class or variable name.
 */
export function generateCssId(name: string): string {
    return name
        .toLowerCase() // Convert to lowercase
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove any non-alphanumeric characters except hyphens
}
