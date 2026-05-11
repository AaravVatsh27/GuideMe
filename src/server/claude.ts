type SessionSummaryContext = {
  sessionId: string;
  sessionType: string;
  scheduledAt: Date;
  durationMinutes: number;
  studentName: string;
  mentorName: string;
  transcript?: string | null;
  noteLines?: string[];
  messageLines?: string[];
};

type AnthropicMessageResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type OpenAIResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const OPENAI_RESPONSES_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

function buildFallbackSummary(context: SessionSummaryContext) {
  const highlights = [
    context.transcript?.trim(),
    ...(context.noteLines ?? []),
    ...(context.messageLines ?? []),
  ]
    .map((line) => line?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 4);

  if (highlights.length === 0) {
    return `${context.studentName} completed a ${context.durationMinutes}-minute ${context.sessionType.toLowerCase()} session with ${context.mentorName}. No transcript or notes were captured, so this summary is limited to attendance metadata.`;
  }

  return [
    `${context.studentName} completed a ${context.durationMinutes}-minute ${context.sessionType.toLowerCase()} session with ${context.mentorName}.`,
    `Key discussion points: ${highlights.join(" ")}`,
  ].join(" ");
}

function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? null;
}

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? null;
}

function buildPrompt(context: SessionSummaryContext) {
  const transcriptBlock = context.transcript?.trim()
    ? `Transcript:\n${context.transcript.trim()}`
    : "Transcript:\nNo transcript provided.";
  const notesBlock =
    context.noteLines && context.noteLines.length > 0
      ? `Session notes:\n- ${context.noteLines.join("\n- ")}`
      : "Session notes:\n- No notes captured.";
  const messagesBlock =
    context.messageLines && context.messageLines.length > 0
      ? `Session chat:\n- ${context.messageLines.join("\n- ")}`
      : "Session chat:\n- No chat messages captured.";

  return [
    `Summarize this GuideMe mentoring session in 2 short paragraphs.`,
    `Focus on student goals, mentor guidance, and concrete next steps.`,
    `Do not use markdown bullets or headings.`,
    `Session ID: ${context.sessionId}`,
    `Type: ${context.sessionType}`,
    `Student: ${context.studentName}`,
    `Mentor: ${context.mentorName}`,
    `Scheduled at: ${context.scheduledAt.toISOString()}`,
    `Duration: ${context.durationMinutes} minutes`,
    transcriptBlock,
    notesBlock,
    messagesBlock,
  ].join("\n\n");
}

export async function generateClaudeSessionSummary(context: SessionSummaryContext) {
  const fallbackSummary = buildFallbackSummary(context);
  const openAiApiKey = getOpenAiApiKey();
  const apiKey = getAnthropicApiKey();

  if (openAiApiKey) {
    const response = await fetch(OPENAI_RESPONSES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
        instructions:
          "You summarize student mentoring sessions for a product database. Stay concise, specific, and action-oriented.",
        input: buildPrompt(context),
        max_output_tokens: 320,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      log.error(
        `OpenAI session summary failed with status ${response.status}${details ? `: ${details}` : ""}`,
        new Error("OpenAI session summary request failed"),
        {
          requestId: "system",
          route: "claude-summary",
        },
      );
    } else {
      const payload = (await response.json()) as OpenAIResponsesApiResponse;
      const summary =
        payload.output_text?.trim() ||
        payload.output
          ?.flatMap((item) => item.content ?? [])
          .filter((item) => item.type === "output_text" && item.text)
          .map((item) => item.text?.trim() ?? "")
          .filter(Boolean)
          .join("\n\n")
          .trim();

      if (summary) {
        return summary;
      }
    }
  }

  if (!apiKey) {
    return fallbackSummary;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 320,
      system:
        "You summarize student mentoring sessions for a product database. Stay concise, specific, and action-oriented.",
      messages: [
        {
          role: "user",
          content: buildPrompt(context),
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    log.error(
      `Anthropic session summary failed with status ${response.status}${details ? `: ${details}` : ""}`,
      new Error("Anthropic session summary request failed"),
      {
        requestId: "system",
        route: "claude-summary",
      },
    );
    return fallbackSummary;
  }

  const payload = (await response.json()) as AnthropicMessageResponse;
  const summary = payload.content
    ?.filter((item) => item.type === "text" && item.text)
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return summary || fallbackSummary;
}
import { log } from "@/lib/logger";
