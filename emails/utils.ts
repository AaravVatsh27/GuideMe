const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.AUTH_URL?.trim() ||
  "http://localhost:3000";

export const GUIDE_ME_BRAND = {
  appName: "GuideMe",
  supportEmail: process.env.EMAIL_REPLY_TO?.trim() || process.env.EMAIL_FROM?.trim() || "support@guideme.app",
  unsubscribeUrl: `${APP_URL.replace(/\/$/, "")}/unsubscribe`,
  whatsappUrl:
    process.env.GUIDEME_COMMUNITY_WHATSAPP_URL?.trim() ||
    "https://wa.me/?text=Hi%20GuideMe%20community",
} as const;

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (["AI", "CBSE", "ICSE", "IIT", "JEE", "MBA", "NEET", "UG", "UPI", "UPSC"].includes(upper)) {
        return upper;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

export function formatIstDateTime(value: string | Date) {
  const date = resolveDate(value);
  if (!date) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date).replace(",", "") + " IST";
}

export function formatIstDate(value: string | Date) {
  const date = resolveDate(value);
  if (!date) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function resolveDate(value: string | Date) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toUtcCalendarStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  description: string;
  start: string | Date;
  durationMinutes: number;
  location?: string;
}) {
  const start = resolveDate(input.start);
  if (!start) {
    return APP_URL;
  }

  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", input.title);
  url.searchParams.set("dates", `${toUtcCalendarStamp(start)}/${toUtcCalendarStamp(end)}`);
  url.searchParams.set("details", input.description);
  if (input.location) {
    url.searchParams.set("location", input.location);
  }

  return url.toString();
}

export function buildAppleCalendarUrl(input: {
  title: string;
  description: string;
  start: string | Date;
  durationMinutes: number;
  location?: string;
}) {
  const start = resolveDate(input.start);
  if (!start) {
    return APP_URL;
  }

  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GuideMe//Transactional Email//EN",
    "BEGIN:VEVENT",
    `UID:guideme-${start.getTime()}@guideme.app`,
    `DTSTAMP:${toUtcCalendarStamp(new Date())}`,
    `DTSTART:${toUtcCalendarStamp(start)}`,
    `DTEND:${toUtcCalendarStamp(end)}`,
    `SUMMARY:${input.title}`,
    `DESCRIPTION:${input.description.replace(/\n/g, "\\n")}`,
    input.location ? `LOCATION:${input.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines)}`;
}

export function getPreparationTips(confusionType: string | null | undefined) {
  switch (confusionType) {
    case "STREAM_SELECTION":
      return [
        "Ask which subjects feel energizing versus draining in the last three months.",
        "Bring two concrete stream paths with realistic college and career outcomes.",
        "Use the final five minutes to help the student shortlist the next decision step.",
      ];
    case "EXAM_CHOICE":
      return [
        "Clarify the student's target outcomes before comparing exam paths.",
        "Contrast effort, syllabus overlap, and timeline across the top options.",
        "End with one exam roadmap the student can validate with parents this week.",
      ];
    case "COLLEGE_SELECTION":
      return [
        "Anchor advice on rank reality, budget, and geography constraints first.",
        "Prepare examples of tradeoffs between brand, branch, and long-term fit.",
        "Leave the student with a shortlist grouped into safe, target, and stretch options.",
      ];
    case "CAREER_DIRECTION":
      return [
        "Diagnose whether the confusion is about interest, aptitude, or external pressure.",
        "Use lived examples instead of generic career descriptions wherever possible.",
        "Translate abstract options into one action the student can test this month.",
      ];
    case "SUBJECT_COMBINATION":
      return [
        "Clarify which subjects are mandatory for the student's likely next milestones.",
        "Explain the doors each combination keeps open or closes off.",
        "Keep the recommendation simple enough to discuss with school and family immediately.",
      ];
    case "COACHING_SELECTION":
      return [
        "Gauge whether the student needs structure, accountability, or just better resources.",
        "Compare coaching to self-study with honest cost versus outcome tradeoffs.",
        "Suggest a short trial plan before the student commits long term.",
      ];
    case "PLANNING_NEXT_TWO_YEARS":
      return [
        "Break the next two years into phases instead of one overwhelming plan.",
        "Focus on the highest leverage habits, not an impossible perfect timetable.",
        "End with a weekly operating plan the student can start tomorrow.",
      ];
    case "POST_GRADUATION_PATH":
      return [
        "Map jobs, exams, and higher studies against the student's current strengths.",
        "Highlight what must happen in the next ninety days for each path.",
        "Push toward one primary track and one backup track by the end of the call.",
      ];
    default:
      return [
        "Start by clarifying the exact decision the student needs to make next.",
        "Use specific examples from your own path instead of generic advice.",
        "Finish with one concrete action and one checkpoint for the student.",
      ];
  }
}

export function getSessionManageUrl(role: "student" | "mentor") {
  return `${APP_URL.replace(/\/$/, "")}/dashboard/${role}/sessions`;
}
