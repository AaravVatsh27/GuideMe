import { NextResponse } from "next/server";

import { withApiErrorHandling } from "@/lib/api-helpers";
import { emailPreviewRegistry, emailPreviewTemplates, renderEmailTemplate } from "@emails";

type RouteParams = { params: Promise<{ template: string }> };

export const GET = withApiErrorHandling(async (
  request: Request,
  context: RouteParams,
) => {
  const { template } = await context.params;
  const preview = emailPreviewRegistry[template as keyof typeof emailPreviewRegistry];

  if (!preview) {
    return NextResponse.json(
      {
        error: "Unknown email template",
        availableTemplates: emailPreviewTemplates,
      },
      { status: 404 },
    );
  }

  const format = new URL(request.url).searchParams.get("format");
  const rendered = await renderEmailTemplate(preview.element);

  if (format === "text") {
    return new NextResponse(rendered.text, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-guideme-email-template": template,
      },
    });
  }

  return new NextResponse(rendered.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-guideme-email-subject": preview.subject,
      "x-guideme-email-template": template,
    },
  });
}, "/api/email-preview/[template]");
