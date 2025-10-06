import type { UrlScanResult } from "./types";

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function isAllowedMime(mime: string): boolean {
  const allowed = new Set([
    "image/png",
    "image/jpeg",
    "application/pdf",
    "image/webp",
  ]);
  return allowed.has(mime);
}

export function redactPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\+?\d{0,3})\d{3}(\d{2,})/, "$1***$2");
}

export function basicUrlNormalize(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url.trim();
  }
}

export function mergeUrlScanResults(results: UrlScanResult[]): UrlScanResult {
  const unsafe = results.some((r) => r.unsafe);
  const url = results[0]?.url ?? "";
  const categories = Array.from(
    new Set(results.flatMap((r) => r.categories ?? []))
  );
  const details = Object.assign({}, ...results.map((r) => r.details ?? {}));
  return { url, unsafe, categories, details };
}
