/**
 * Mobile-robust client-side downloads.
 *
 * Desktop browsers handle `<a download>` with data: URLs fine, but mobile
 * browsers (notably iOS Safari and some in-app webviews) frequently ignore the
 * `download` attribute or silently fail on large data: URLs. These helpers:
 *   1. Convert data: URLs to Blob object URLs (much more reliable on mobile).
 *   2. Attempt a normal anchor download.
 *   3. Fall back to opening the file in a new tab when `download` isn't
 *      supported, so the user can still long-press / share / save it.
 */

/** True when the `download` attribute is actually honored by the browser. */
function supportsDownloadAttribute(): boolean {
  const a = document.createElement('a');
  return typeof a.download !== 'undefined';
}

/** Convert a data: URL into a Blob (no network round-trip). */
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const data = match[3];
  if (isBase64) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(data)], { type: mime });
}

/** Trigger a download for a Blob, with an open-in-new-tab fallback. */
export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    if (supportsDownloadAttribute()) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      // iOS Safari / webviews: no download attribute — open so the user can
      // save or share the file manually.
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }
  } finally {
    // Revoke a little later so the download/open has time to start.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}

/**
 * Download a data: URL (e.g. a QR code produced by `QRCode.toDataURL`) in a
 * mobile-robust way by first turning it into a Blob.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const blob = dataUrlToBlob(dataUrl);
  if (blob) {
    downloadBlob(blob, filename);
    return;
  }
  // Fallback: couldn't parse the data URL — try the naive anchor path.
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * Fetch a same-origin (or CORS-enabled) URL and download the response as a
 * Blob. Falls back to opening the URL directly if the fetch fails.
 */
export async function downloadUrl(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    downloadBlob(blob, filename);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
