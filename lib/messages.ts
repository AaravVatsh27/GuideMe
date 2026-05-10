import { PLATFORM_NAME } from "@/lib/constants";

export const bookingMessages = {
  student: {
    title: "Session confirmed",
    body: "Your intro session has been confirmed.",
  },
  mentor: {
    title: "New intro booking",
    body: "A student booked an intro session with you.",
  },
} as const;

export const cancellationTitles = {
  default: "Session cancelled",
  noShow: "Mentor no-show recorded",
} as const;

export const completionMessages = {
  student: {
    title: "Session completed",
    body: "Your session is complete. Please leave a review for your mentor.",
  },
  mentor: {
    title: "Session completed",
    body: "Your session has been marked complete and the payout is queued.",
  },
} as const;

export const aiSummary = {
  systemPrompt:
    "You summarize student mentoring sessions for a product database. Stay concise, specific, and action-oriented.",
  promptIntro: `Summarize this ${PLATFORM_NAME} mentoring session in 2 short paragraphs.`,
  promptFocus:
    "Focus on student goals, mentor guidance, and concrete next steps.",
  promptFormat: "Do not use markdown bullets or headings.",
  fallbackNoContent: (durationMinutes: number, sessionType: string) =>
    `completed a ${durationMinutes}-minute ${sessionType.toLowerCase()} session`,
  fallbackHeader: (
    studentName: string,
    durationMinutes: number,
    sessionType: string,
    mentorName: string,
  ) =>
    `${studentName} completed a ${durationMinutes}-minute ${sessionType.toLowerCase()} session with ${mentorName}.`,
  fallbackNoTranscriptSuffix:
    "No transcript or notes were captured, so this summary is limited to attendance metadata.",
  fallbackHighlightsLabel: "Key discussion points",
  transcriptHeader: "Transcript:",
  transcriptEmpty: "No transcript provided.",
  notesHeader: "Session notes:",
  notesEmpty: "No notes captured.",
  chatHeader: "Session chat:",
  chatEmpty: "No chat messages captured.",
} as const;
