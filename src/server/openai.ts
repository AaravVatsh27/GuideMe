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

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const OPENAI_CHAT_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? null;
}

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
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    log.warn("OPENAI_API_KEY is not set — using fallback session summary.", {
      requestId: "system",
      route: "openai-summary",
    });
    return fallbackSummary;
  }

  try {
    const response = await fetch(OPENAI_CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You summarize student mentoring sessions for a product database. Stay concise, specific, and action-oriented.",
          },
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
        `OpenAI session summary failed with status ${response.status}${details ? `: ${details}` : ""}`,
        new Error("OpenAI session summary request failed"),
        {
          requestId: "system",
          route: "openai-summary",
        },
      );
      return fallbackSummary;
    }

    const payload = (await response.json()) as OpenAIChatResponse;
    const summary = payload.choices?.[0]?.message?.content?.trim();

    return summary || fallbackSummary;
  } catch (error) {
    log.error("OpenAI session summary threw an error", error, {
      requestId: "system",
      route: "openai-summary",
    });
    return fallbackSummary;
  }
}
import { log } from "@/lib/logger";
