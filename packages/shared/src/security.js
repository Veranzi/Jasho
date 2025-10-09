"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFilename = sanitizeFilename;
exports.isAllowedMime = isAllowedMime;
exports.redactPhone = redactPhone;
exports.basicUrlNormalize = basicUrlNormalize;
exports.mergeUrlScanResults = mergeUrlScanResults;
function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
function isAllowedMime(mime) {
    const allowed = new Set([
        "image/png",
        "image/jpeg",
        "application/pdf",
        "image/webp",
    ]);
    return allowed.has(mime);
}
function redactPhone(phone) {
    if (!phone)
        return "";
    return phone.replace(/(\+?\d{0,3})\d{3}(\d{2,})/, "$1***$2");
}
function basicUrlNormalize(url) {
    try {
        const u = new URL(url);
        u.hash = "";
        return u.toString();
    }
    catch {
        return url.trim();
    }
}
function mergeUrlScanResults(results) {
    const unsafe = results.some((r) => r.unsafe);
    const url = results[0]?.url ?? "";
    const categories = Array.from(new Set(results.flatMap((r) => r.categories ?? [])));
    const details = Object.assign({}, ...results.map((r) => r.details ?? {}));
    return { url, unsafe, categories, details };
}
