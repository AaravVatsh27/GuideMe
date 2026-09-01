import { PLATFORM_NAME } from "@/Backend/server/constants";
import { sendEmail } from "@/Backend/server/resend";

interface CollegeOtpParams {
  email: string;
  otp: string;
  collegeName?: string | null;
  expiresInMinutes: number;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendCollegeVerificationOtp({
  email,
  otp,
  collegeName,
  expiresInMinutes,
}: CollegeOtpParams) {
  const institutionLine = collegeName
    ? `<p style="margin:0 0 16px;line-height:1.7;color:#cbd5e1;">Institution: ${escapeHtml(
        collegeName,
      )}</p>`
    : "";

  return sendEmail(email, `Verify your college email - ${PLATFORM_NAME}`, {
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your college email</title>
  </head>
  <body style="margin:0;padding:32px;background:#020617;font-family:'DM Sans',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:32px;color:#e2e8f0;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;color:#5eead4;">${escapeHtml(
        PLATFORM_NAME.toUpperCase(),
      )}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f8fafc;">Verify your college email</h1>
      <p style="margin:0 0 16px;line-height:1.7;color:#cbd5e1;">Your ${escapeHtml(
        PLATFORM_NAME,
      )} verification code is:</p>
      <p style="margin:0 0 20px;font-size:32px;font-weight:800;letter-spacing:0.18em;color:#f8fafc;">${escapeHtml(
        otp,
      )}</p>
      <p style="margin:0 0 16px;line-height:1.7;color:#cbd5e1;">This code expires in ${expiresInMinutes} minutes.</p>
      ${institutionLine}
    </div>
  </body>
</html>`,
    text: [
      `Your ${PLATFORM_NAME} verification code is:`,
      otp,
      `This code expires in ${expiresInMinutes} minutes.`,
      collegeName ? `Institution: ${collegeName}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
