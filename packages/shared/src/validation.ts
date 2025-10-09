export function isValidCurrency(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

export function clampAmountCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount));
}

export function maskBalance(amountCents: number): string {
  if (!Number.isFinite(amountCents)) return "***";
  const abs = Math.abs(amountCents);
  if (abs < 10_00) return "< $10";
  if (abs < 100_00) return "$**";
  const str = (amountCents / 100).toFixed(2);
  return str.replace(/\d(?=\d{2})/g, "*");
}
