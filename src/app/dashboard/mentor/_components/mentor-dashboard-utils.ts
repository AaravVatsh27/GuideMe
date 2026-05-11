import { format } from "date-fns";

const ACRONYM_LABELS: Record<string, string> = {
  AI: "AI",
  CA: "CA",
  CBSE: "CBSE",
  GMAT: "GMAT",
  GRE: "GRE",
  ICSE: "ICSE",
  IIT: "IIT",
  JEE: "JEE",
  MBA: "MBA",
  MS: "MS",
  NDA: "NDA",
  NEET: "NEET",
  NIT: "NIT",
  PCB: "PCB",
  PCM: "PCM",
  UG: "UG",
  UPI: "UPI",
  UPSC: "UPSC",
};

export function formatCurrency(value: number | null | undefined) {
  return `INR ${(value ?? 0).toLocaleString("en-IN")}`;
}

export function formatDateTime(value: string | Date) {
  return format(new Date(value), "EEE, d MMM yyyy 'at' h:mm a");
}

export function formatShortDateTime(value: string | Date) {
  return format(new Date(value), "d MMM, h:mm a");
}

export function formatDateOnly(value: string | Date) {
  return format(new Date(value), "d MMM yyyy");
}

export function formatTimeOnly(value: string | Date) {
  return format(new Date(value), "h:mm a");
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => ACRONYM_LABELS[word] ?? `${word.charAt(0)}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

export function getInitials(name: string | null | undefined) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "G";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function getFirstName(name: string | null | undefined) {
  const [first = "Student"] = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return first || "Student";
}

export function normalizeResponseRate(value: number | null | undefined) {
  if (!value) {
    return 0;
  }

  if (value > 0 && value <= 1) {
    return value * 100;
  }

  return value;
}

export function formatResponseRate(value: number | null | undefined) {
  return `${Math.round(normalizeResponseRate(value))}%`;
}

export function hourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${suffix}`;
}

export function slotTimeValue(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function buildSlotKey(dayOfWeek: number, hour: number) {
  return `${dayOfWeek}-${slotTimeValue(hour)}`;
}

export function formatTrend(currentValue: number, previousValue: number) {
  if (currentValue > 0 && previousValue <= 0) {
    return "New this month";
  }

  if (currentValue <= 0 && previousValue <= 0) {
    return "No earnings yet";
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.abs(change).toFixed(0);

  if (change >= 0) {
    return `+${rounded}% vs last month`;
  }

  return `-${rounded}% vs last month`;
}

export function escapeCsvValue(value: string | number | null | undefined) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
