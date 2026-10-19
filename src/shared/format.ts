/**
 * Display helpers shared by every dashboard, the admin panel and the public pages,
 * so amounts and initials look the same everywhere.
 */

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const currencyFormatterWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an amount in paise, e.g. 149900 → "₹1,499" and 9950 → "₹99.50".
 * Missing values show as ₹0.
 */
export function formatPaise(paise: number | null | undefined) {
  const value = Math.round(paise ?? 0);
  return value % 100 === 0
    ? currencyFormatter.format(value / 100)
    : currencyFormatterWithPaise.format(value / 100);
}

/** Up to two uppercase initials from a name, e.g. "Aarav Vatsh" → "AV". */
export function getInitials(name: string | null | undefined, fallback = "?") {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || fallback;
}
