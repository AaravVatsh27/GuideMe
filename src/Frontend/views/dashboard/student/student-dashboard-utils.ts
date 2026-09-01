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
  PCM: "PCM",
  PCB: "PCB",
  UG: "UG",
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

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((word) => ACRONYM_LABELS[word] ?? `${word.charAt(0)}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

export function formatActivityLabel(action: string) {
  return formatEnumLabel(action);
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
