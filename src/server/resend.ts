import type { Payout, Session, User } from "@prisma/client";
import { format } from "date-fns";
import { Resend, type CreateEmailResponse } from "resend";

import {
  BookingConfirmation,
  MentorSessionAlert,
  PayoutConfirmation,
  WelcomeMentor,
  renderEmailTemplate,
} from "@emails";
import { DEFAULT_CURRENCY, PLATFORM_NAME } from "@/server/constants";

type EmailUser = Pick<User, "name" | "email"> & {
  role?: User["role"];
  mentorProfile?: {
    college?: string | null;
  } | null;
  studentProfile?: {
    class?: string | null;
    confusionType?: string | null;
    confusionTypes?: string[];
  } | null;
};
type EmailSession = Pick<
  Session,
  "id" | "type" | "scheduledAt" | "durationMinutes" | "price" | "meetingLink"
>;
type EmailPayout = Pick<
  Payout,
  "id" | "amount" | "status" | "processedAt" | "transactionId" | "upiId" | "createdAt"
> & {
  sessionCount?: number;
  periodStart?: Date | null;
  periodEnd?: Date | null;
};
type EmailTemplate = {
  html: string;
  text: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

function getEmailFromAddress() {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("Missing EMAIL_FROM");
  }

  return from;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailShell({
  preview,
  title,
  body,
  cta,
  footer,
}: {
  preview: string;
  title: string;
  body: string[];
  cta?: {
    label: string;
    href: string;
    background: string;
    color: string;
  };
  footer?: string;
}): EmailTemplate {
  const bodyHtml = body
    .map(
      (line) =>
        `<p style="margin:0 0 16px;line-height:1.7;color:#e2e8f0;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const ctaHtml = cta
    ? `<a href="${escapeHtml(
        cta.href,
      )}" style="display:inline-block;margin-top:8px;border-radius:999px;padding:14px 20px;background:${cta.background};color:${cta.color};font-weight:700;text-decoration:none;">${escapeHtml(
        cta.label,
      )}</a>`
    : "";

  const footerHtml = footer
    ? `<p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">${escapeHtml(
        footer,
      )}</p>`
    : "";

  return {
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:32px;background:#020617;font-family:'DM Sans',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
    <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:32px;color:#e2e8f0;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;color:#5eead4;">${escapeHtml(
        PLATFORM_NAME.toUpperCase(),
      )}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f8fafc;">${escapeHtml(
        title,
      )}</h1>
      ${bodyHtml}
      ${ctaHtml}
      ${footerHtml}
    </div>
  </body>
</html>`,
    text: [preview, "", ...body, cta ? `${cta.label}: ${cta.href}` : "", footer ?? ""]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  template: EmailTemplate,
): Promise<CreateEmailResponse> {
  return getResendClient().emails.send({
    from: getEmailFromAddress(),
    to,
    subject,
    html: template.html,
    text: template.text,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
  });
}

export async function sendBookingConfirmation(
  session: EmailSession,
  student: EmailUser,
  mentor: EmailUser,
) {
  const meetingLink = session.meetingLink ?? `${getAppUrl()}/dashboard/student/sessions`;
  const [studentTemplate, mentorTemplate] = await Promise.all([
    renderEmailTemplate(
      BookingConfirmation({
        studentName: student.name,
        mentorName: mentor.name,
        mentorCollege: mentor.mentorProfile?.college ?? "GuideMe mentor network",
        sessionType: session.type,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
        meetingLink,
        sessionId: session.id,
      }),
    ),
    renderEmailTemplate(
      MentorSessionAlert({
        mentorName: mentor.name,
        studentName: student.name,
        studentClass: student.studentProfile?.class ?? "Student",
        studentConfusionType:
          student.studentProfile?.confusionTypes?.[0] ??
          student.studentProfile?.confusionType ??
          "CAREER_DIRECTION",
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
        sessionId: session.id,
        meetingLink,
      }),
    ),
  ]);

  return Promise.all([
    sendEmail(student.email, "Your GuideMe session is confirmed", studentTemplate),
    sendEmail(mentor.email, "New GuideMe session on your calendar", mentorTemplate),
  ]);
}

export async function sendSessionReminder(
  session: EmailSession,
  recipient: EmailUser,
) {
  return sendEmail(
    recipient.email,
    "Your GuideMe session starts soon",
    buildEmailShell({
      preview: "Your session starts soon.",
      title: "Session reminder",
      body: [
        `${recipient.name}, your session starts on ${format(
          session.scheduledAt,
          "EEE, d MMM yyyy 'at' h:mm a",
        )}.`,
        "Keep 5 minutes free beforehand so you can join without rushing.",
      ],
      cta: session.meetingLink
        ? {
            label: "Join session",
            href: session.meetingLink,
            background: "#14b8a6",
            color: "#f8fafc",
          }
        : undefined,
    }),
  );
}

export async function sendSessionCompletionEmails(
  session: EmailSession,
  student: EmailUser,
  mentor: EmailUser,
  summary: string,
) {
  return sendEmail(
    [student.email, mentor.email],
    "Your GuideMe session is complete",
    buildEmailShell({
      preview: "Your mentoring session has been completed.",
      title: "Session completed",
      body: [
        `${student.name} and ${mentor.name}, your ${session.durationMinutes}-minute session is now marked complete.`,
        `Session ID: ${session.id}`,
        `Summary: ${summary}`,
      ],
      cta: session.meetingLink
        ? {
            label: "Open session room",
            href: session.meetingLink,
            background: "#0f766e",
            color: "#f8fafc",
          }
        : undefined,
    }),
  );
}

export async function sendReviewRequestEmail(
  session: EmailSession,
  student: EmailUser,
  mentor: EmailUser,
  reviewLink: string,
) {
  return sendEmail(
    student.email,
    "Tell us how your GuideMe session went",
    buildEmailShell({
      preview: "Leave a review for your mentor.",
      title: "Share your feedback",
      body: [
        `${student.name}, your session with ${mentor.name} has wrapped up.`,
        "A quick review helps us keep mentor quality high and gives other students better context.",
      ],
      cta: {
        label: "Leave a review",
        href: reviewLink,
        background: "#f59e0b",
        color: "#020617",
      },
      footer: `Session ID: ${session.id}`,
    }),
  );
}

export async function sendSessionCancellationEmails(
  session: EmailSession,
  student: EmailUser,
  mentor: EmailUser,
  details: {
    cancelledByName: string;
    reason: string;
    refundAmount: number;
    isNoShow?: boolean;
  },
) {
  const refundLine =
    details.refundAmount > 0
      ? `Refund: ${formatMoney(details.refundAmount)}`
      : "Refund: No refund applies to this cancellation.";

  return sendEmail(
    [student.email, mentor.email],
    details.isNoShow
      ? "GuideMe session marked as mentor no-show"
      : "Your GuideMe session has been cancelled",
    buildEmailShell({
      preview: "A mentoring session has been cancelled.",
      title: details.isNoShow ? "Mentor no-show recorded" : "Session cancelled",
      body: [
        `${details.cancelledByName} cancelled the session scheduled for ${format(
          session.scheduledAt,
          "EEE, d MMM yyyy 'at' h:mm a",
        )}.`,
        `Reason: ${details.reason}`,
        refundLine,
      ],
      footer: `Session ID: ${session.id}`,
    }),
  );
}

export async function sendPayoutConfirmation(
  payout: EmailPayout,
  mentor: EmailUser,
) {
  const rendered = await renderEmailTemplate(
    PayoutConfirmation({
      mentorName: mentor.name,
      amount: payout.amount,
      sessionCount: payout.sessionCount ?? 1,
      upiId: payout.upiId ?? "UPI not recorded",
      transactionId: payout.transactionId ?? "Pending",
      periodStart: payout.periodStart ?? payout.processedAt ?? payout.createdAt ?? new Date(),
      periodEnd: payout.periodEnd ?? payout.processedAt ?? payout.createdAt ?? new Date(),
    }),
  );

  return sendEmail(
    mentor.email,
    "Your GuideMe payout has been processed",
    rendered,
  );
}

export async function sendRefundConfirmationEmail(params: {
  student: EmailUser;
  sessionId: string;
  refundAmount: number;
  reason?: string;
}) {
  const { student, sessionId, refundAmount, reason } = params;

  return sendEmail(
    student.email,
    "Your GuideMe refund has been initiated",
    buildEmailShell({
      preview: "Your refund is being processed.",
      title: "Refund initiated",
      body: [
        `${student.name}, your refund request has been processed for session ${sessionId}.`,
        `Refund amount: ${formatMoney(refundAmount)}`,
        reason ? `Reason: ${reason}` : "Reason: Not specified",
      ],
      footer: "If you need help, reply to this email and our support team will assist you.",
    }),
  );
}

export async function sendPaymentFailureEmail(params: {
  student: EmailUser;
  sessionId: string;
}) {
  const { student, sessionId } = params;

  return sendEmail(
    student.email,
    "Payment attempt failed for your GuideMe booking",
    buildEmailShell({
      preview: "Your payment attempt did not go through.",
      title: "Payment failed",
      body: [
        `${student.name}, we could not complete the payment for your booking (${sessionId}).`,
        "Please retry from your dashboard. If money was deducted, it is usually auto-reversed by your bank.",
      ],
      footer: "Need support? Reply to this email and mention your session ID.",
    }),
  );
}

export async function sendWelcomeMentorEmail(params: {
  mentor: EmailUser;
  college: string;
  tier: string;
  profileUrl: string;
}) {
  const rendered = await renderEmailTemplate(
    WelcomeMentor({
      mentorName: params.mentor.name,
      college: params.college,
      tier: params.tier,
      profileUrl: params.profileUrl,
    }),
  );

  return sendEmail(params.mentor.email, "Your GuideMe mentor profile is live", rendered);
}

export async function sendMentorVerificationRejectedEmail(params: {
  mentor: EmailUser;
  reason: string;
}) {
  return sendEmail(
    params.mentor.email,
    "Your GuideMe mentor verification needs updates",
    buildEmailShell({
      preview: "Your mentor verification needs a few updates before approval.",
      title: "Verification update required",
      body: [
        `${params.mentor.name}, we reviewed your GuideMe mentor application and need a few changes before approval.`,
        `Reason: ${params.reason}`,
        "Update the relevant profile details and resubmit when you are ready. The review queue will pick it up again automatically.",
      ],
      footer: "If you need help, reply to this email and the GuideMe team will assist you.",
    }),
  );
}
