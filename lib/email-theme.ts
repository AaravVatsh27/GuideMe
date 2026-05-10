export const emailColors = {
  pageBg: "#020617",
  cardBg: "#0f172a",
  border: "#1e293b",
  accent: "#5eead4",
  bodyText: "#e2e8f0",
  heading: "#f8fafc",
  muted: "#94a3b8",
  ctaPrimaryBg: "#f59e0b",
  ctaPrimaryColor: "#020617",
  ctaJoinBg: "#14b8a6",
  ctaJoinColor: "#f8fafc",
  ctaOpenBg: "#0f766e",
  ctaOpenColor: "#f8fafc",
} as const;

export const emailTypography = {
  bodyFontFamily: "'DM Sans',Arial,sans-serif",
} as const;

export const emailDateFormat = "EEE, d MMM yyyy 'at' h:mm a";

export const emailCopy = {
  bookingSubject: "Your GuideMe session is confirmed",
  bookingTitle: "Session booked",
  bookingPreview: "Your mentoring session is booked.",
  bookingCtaLabel: "Open session room",
  reminderSubject: "Your GuideMe session starts soon",
  reminderTitle: "Session reminder",
  reminderPreview: "Your session starts soon.",
  reminderBufferLine: "Keep 5 minutes free beforehand so you can join without rushing.",
  reminderCtaLabel: "Join session",
  completionSubject: "Your GuideMe session is complete",
  completionTitle: "Session completed",
  completionPreview: "Your mentoring session has been completed.",
  completionCtaLabel: "Open session room",
  reviewSubject: "Tell us how your GuideMe session went",
  reviewTitle: "Share your feedback",
  reviewPreview: "Leave a review for your mentor.",
  reviewBody: [
    "A quick review helps us keep mentor quality high and gives other students better context.",
  ],
  reviewCtaLabel: "Leave a review",
  cancellationSubject: "Your GuideMe session has been cancelled",
  cancellationNoShowSubject: "GuideMe session marked as mentor no-show",
  cancellationTitle: "Session cancelled",
  cancellationNoShowTitle: "Mentor no-show recorded",
  cancellationPreview: "A mentoring session has been cancelled.",
  cancellationRefundEmpty: "Refund: No refund applies to this cancellation.",
  payoutSubject: "Your GuideMe payout has been processed",
  payoutTitle: "Payout processed",
  payoutPreview: "A mentor payout has been processed.",
  payoutFooter: "Reply to this email if you need payout support.",
  payoutTransactionIdPending: "Will be added once available",
  payoutProcessedAtPending: "Pending",
} as const;
