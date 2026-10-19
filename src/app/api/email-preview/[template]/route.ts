import { NextResponse } from "next/server";

import { emailPreviewRegistry, emailPreviewTemplates, renderEmailTemplate } from "@emails";
import { defineRoute } from "@/Backend/lib/define-route";
import { apiErrorResponse } from "@/Backend/lib/api-helpers";

type RouteParams = { params: { template: string } };

export const GET = defineRoute(
  { auth: "optional" },
  async (request: Request, context: RouteParams, { session }) => {
  // Previews are a development tool; in production only admins may see them.
  if (process.env.NODE_ENV === "production" && session?.user.role !== "ADMIN") {
    return apiErrorResponse("Not found", 404);
  }

  const { template } = context.params;
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
