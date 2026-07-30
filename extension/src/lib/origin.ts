/**
 * chrome.permissions origin pattern for a URL, e.g. "https://example.com/*".
 *
 * Returns null for schemes chrome.permissions cannot grant — notably file://,
 * which is controlled by the "Allow access to file URLs" toggle in
 * chrome://extensions and cannot be requested programmatically.
 *
 * Kept free of chrome API calls so it is importable without registering the
 * service worker's listeners.
 */
export function originPattern(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `${u.protocol}//${u.hostname}/*`;
  } catch {
    return null;
  }
}
