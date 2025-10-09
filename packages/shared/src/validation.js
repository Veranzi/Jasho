"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCurrency = isValidCurrency;
exports.clampAmountCents = clampAmountCents;
exports.maskBalance = maskBalance;
function isValidCurrency(code) {
    return /^[A-Z]{3}$/.test(code);
}
function clampAmountCents(amount) {
    if (!Number.isFinite(amount))
        return 0;
    return Math.max(0, Math.round(amount));
}
function maskBalance(amountCents) {
    if (!Number.isFinite(amountCents))
        return "***";
    const abs = Math.abs(amountCents);
    if (abs < 10_00)
        return "< $10";
    if (abs < 100_00)
        return "$**";
    const str = (amountCents / 100).toFixed(2);
    return str.replace(/\d(?=\d{2})/g, "*");
}
