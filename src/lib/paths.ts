
'use client';

/**
 * @fileOverview Path utilities for constructing URLs that are safe for Next.js basePath.
 */

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Prepends the basePath to a given path.
 * @param p The path to prefix.
 * @returns The path with the basePath.
 */
export const apiUrl = (p: string) => `${basePath}${p.startsWith('/') ? p : '/' + p}`;

/**
 * Appends query parameters to a URL, respecting the basePath.
 * @param path The base path for the URL.
 * @param params An object of query parameters to append.
 * @returns The full URL string with query parameters.
 */
export function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  // The base URL 'http://localhost' is a placeholder; it's required by the URL constructor
  // but is not used in the final output since we only need the search parameters.
  const u = new URL(apiUrl(path), 'http://localhost');
  
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      u.searchParams.set(k, String(v));
    }
  });

  const qs = u.search ? u.search : '';
  return apiUrl(path) + qs;
}
