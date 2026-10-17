import { formatEnumLabel } from "./admin-utils";
import { AdminPill, type AdminPillTone } from "./admin-ui";

type StatusKind = "mentor" | "payment" | "session" | "verification";

function getStatusTone(status: string, kind: StatusKind): AdminPillTone {
  const normalized = status.toUpperCase();

  if (kind === "mentor" || kind === "verification") {
    switch (normalized) {
      case "VERIFIED":
      case "APPROVED":
        return "green";
      case "PENDING":
        return "amber";
      case "REJECTED":
      case "SUSPENDED":
        return "red";
      default:
        return "gray";
    }
  }

  if (kind === "payment") {
    switch (normalized) {
      case "CAPTURED":
      case "PAID":
        return "green";
      case "PENDING":
      case "PROCESSING":
        return "amber";
      case "FAILED":
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "red";
      default:
        return "gray";
    }
  }

  switch (normalized) {
    case "COMPLETED":
      return "green";
    case "SCHEDULED":
      return "indigo";
    case "ONGOING":
      return "amber";
    case "NO_SHOW":
    case "CANCELLED":
      return "red";
    default:
      return "gray";
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
  return <AdminPill tone={getStatusTone(status, kind)}>{label ?? formatEnumLabel(status)}</AdminPill>;
}
