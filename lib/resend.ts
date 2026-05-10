import type { Payout, Session, User } from "@prisma/client";
import { format } from "date-fns";
import { Resend, type CreateEmailResponse } from "resend";

import { DEFAULT_CURRENCY, MONEY_LOCALE, PLATFORM_NAME } from "@/lib/constants";
import {
  emailColors,
  emailCopy,
  emailDateFormat,
  emailTypography,
} from "@/lib/email-theme";

type EmailUser = Pick<User, "name" | "email">;
type EmailSession = Pick<
  Session,
  "id" | "type" | "scheduledAt" | "durationMinutes" | "price" | "meetingLink"
>;
type EmailPayout = Pick<Payout, "id" | "amount" | "status" | "processedAt" | "transactionId">;
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSessionTime(date: Date) {
  return format(date, emailDateFormat);
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
        `<p style="margin:0 0 16px;line-height:1.7;color:${emailColors.bodyText};">${escapeHtml(line)}</p>`,
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
    ? `<p style="margin:24px 0 0;color:${emailColors.muted};font-size:13px;line-height:1.6;">${escapeHtml(
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
  <body style="margin:0;padding:32px;background:${emailColors.pageBg};font-family:${emailTypography.bodyFontFamily};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
    <div style="max-width:560px;margin:0 auto;background:${emailColors.cardBg};border:1px solid ${emailColors.border};border-radius:24px;padding:32px;color:${emailColors.bodyText};">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;color:${emailColors.accent};">${escapeHtml(
        PLATFORM_NAME.toUpperCase(),
      )}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:${emailColors.heading};">${escapeHtml(
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
  return sendEmail(
    [student.email, mentor.email],
    emailCopy.bookingSubject,
    buildEmailShell({
      preview: emailCopy.bookingPreview,
      title: emailCopy.bookingTitle,
      body: [
        `${student.name}, your session with ${mentor.name} is scheduled for ${formatSessionTime(
          session.scheduledAt,
        )}.`,
        `Session ID: ${session.id}`,
        `Type: ${session.type}`,
        `Duration: ${session.durationMinutes} minutes`,
        `Price: ${formatMoney(session.price)}`,
      ],
      cta: session.meetingLink
        ? {
            label: emailCopy.bookingCtaLabel,
            href: session.meetingLink,
            background: emailColors.ctaPrimaryBg,
            color: emailColors.ctaPrimaryColor,
          }
        : undefined,
    }),
  );
}

export async function sendSessionReminder(
  session: EmailSession,
  recipient: EmailUser,
) {
  return sendEmail(
    recipient.email,
    emailCopy.reminderSubject,
    buildEmailShell({
      preview: emailCopy.reminderPreview,
      title: emailCopy.reminderTitle,
      body: [
        `${recipient.name}, your session starts on ${formatSessionTime(session.scheduledAt)}.`,
        emailCopy.reminderBufferLine,
      ],
      cta: session.meetingLink
        ? {
            label: emailCopy.reminderCtaLabel,
            href: session.meetingLink,
            background: emailColors.ctaJoinBg,
            color: emailColors.ctaJoinColor,
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
    emailCopy.completionSubject,
    buildEmailShell({
      preview: emailCopy.completionPreview,
      title: emailCopy.completionTitle,
      body: [
        `${student.name} and ${mentor.name}, your ${session.durationMinutes}-minute session is now marked complete.`,
        `Session ID: ${session.id}`,
        `Summary: ${summary}`,
      ],
      cta: session.meetingLink
        ? {
            label: emailCopy.completionCtaLabel,
            href: session.meetingLink,
            background: emailColors.ctaOpenBg,
            color: emailColors.ctaOpenColor,
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
    emailCopy.reviewSubject,
    buildEmailShell({
      preview: emailCopy.reviewPreview,
      title: emailCopy.reviewTitle,
      body: [
        `${student.name}, your session with ${mentor.name} has wrapped up.`,
        ...emailCopy.reviewBody,
      ],
      cta: {
        label: emailCopy.reviewCtaLabel,
        href: reviewLink,
        background: emailColors.ctaPrimaryBg,
        color: emailColors.ctaPrimaryColor,
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
      : emailCopy.cancellationRefundEmpty;

  return sendEmail(
    [student.email, mentor.email],
    details.isNoShow ? emailCopy.cancellationNoShowSubject : emailCopy.cancellationSubject,
    buildEmailShell({
      preview: emailCopy.cancellationPreview,
      title: details.isNoShow ? emailCopy.cancellationNoShowTitle : emailCopy.cancellationTitle,
      body: [
        `${details.cancelledByName} cancelled the session scheduled for ${formatSessionTime(
          session.scheduledAt,
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
  return sendEmail(
    mentor.email,
    emailCopy.payoutSubject,
    buildEmailShell({
      preview: emailCopy.payoutPreview,
      title: emailCopy.payoutTitle,
      body: [
        `${mentor.name}, your payout of ${formatMoney(payout.amount)} is now ${payout.status.toLowerCase()}.`,
        `Payout ID: ${payout.id}`,
        `Processed at: ${
          payout.processedAt ? formatSessionTime(payout.processedAt) : emailCopy.payoutProcessedAtPending
        }`,
        `Transaction ID: ${payout.transactionId ?? emailCopy.payoutTransactionIdPending}`,
      ],
      footer: emailCopy.payoutFooter,
    }),
  );
}
