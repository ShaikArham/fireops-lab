export function formatMinorUnits(amountMinor: number, currency: string): string {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new TypeError("Amount must be a safe integer in minor units.");
  }

  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}
