/**
 * Escape HTML special characters to prevent XSS in Mapbox popup templates.
 * Use this for any user/admin-supplied data interpolated into HTML strings.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize a URL for use in HTML attributes.
 * Only allows http:, https:, and data: protocols.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "data:"].includes(parsed.protocol)) {
      return escapeHtml(url);
    }
    return "";
  } catch {
    // Relative URLs are safe
    if (url.startsWith("/")) return escapeHtml(url);
    return "";
  }
}
