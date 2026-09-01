import { Badge } from "@/Frontend/components/ui/badge";
import { cn } from "@/Backend/server/utils";

import { formatEnumLabel } from "./admin-utils";

type StatusKind = "mentor" | "payment" | "session" | "verification";

function getStatusClass(status: string, kind: StatusKind) {
  const normalized = status.toUpperCase();

  if (kind === "mentor" || kind === "verification") {
    switch (normalized) {
      case "VERIFIED":
      case "APPROVED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "REJECTED":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "SUSPENDED":
        return "border-slate-300 bg-slate-100 text-slate-700";
      default:
        return "border-slate-300 bg-slate-50 text-slate-700";
    }
  }

  if (kind === "payment") {
    switch (normalized) {
      case "CAPTURED":
      case "PAID":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "PENDING":
      case "PROCESSING":
        return "border-sky-200 bg-sky-50 text-sky-700";
      case "FAILED":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-slate-300 bg-slate-50 text-slate-700";
    }
  }

  switch (normalized) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SCHEDULED":
    case "ONGOING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "NO_SHOW":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CANCELLED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
  }
}

export function AdminStatusBadge({
  status,
  label,
  kind,
}: {
  status: string;
  label?: string;
  kind: StatusKind;
}) {
  return (
    <Badge variant="outline" className={cn("border", getStatusClass(status, kind))}>
      {label ?? formatEnumLabel(status)}
    </Badge>
  );
}
