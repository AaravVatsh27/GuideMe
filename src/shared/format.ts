/**
 * Display helpers shared by every dashboard, the admin panel and the public pages,
 * so amounts and initials look the same everywhere.
 */

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats a rupee amount, e.g. 1499 → "₹1,499". Missing values show as ₹0. */
export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(Math.round(value ?? 0));
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
