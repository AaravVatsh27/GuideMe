import {
  AI_SUMMARY_HIGHLIGHTS_LIMIT,
  AI_SUMMARY_MAX_TOKENS,
} from "@/lib/constants";
import { aiSummary } from "@/lib/messages";

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
const ANTHROPIC_VERSION = "2023-06-01";
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
    .slice(0, AI_SUMMARY_HIGHLIGHTS_LIMIT);

  const header = aiSummary.fallbackHeader(
    context.studentName,
    context.durationMinutes,
    context.sessionType,
    context.mentorName,
  );

  if (highlights.length === 0) {
    return `${header} ${aiSummary.fallbackNoTranscriptSuffix}`;
  }

  return [header, `${aiSummary.fallbackHighlightsLabel}: ${highlights.join(" ")}`].join(" ");
}

function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? null;
}

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? null;
}

function buildPrompt(context: SessionSummaryContext) {
  const transcriptBlock = context.transcript?.trim()
    ? `${aiSummary.transcriptHeader}\n${context.transcript.trim()}`
    : `${aiSummary.transcriptHeader}\n${aiSummary.transcriptEmpty}`;
  const notesBlock =
    context.noteLines && context.noteLines.length > 0
      ? `${aiSummary.notesHeader}\n- ${context.noteLines.join("\n- ")}`
      : `${aiSummary.notesHeader}\n- ${aiSummary.notesEmpty}`;
  const messagesBlock =
    context.messageLines && context.messageLines.length > 0
      ? `${aiSummary.chatHeader}\n- ${context.messageLines.join("\n- ")}`
      : `${aiSummary.chatHeader}\n- ${aiSummary.chatEmpty}`;

  return [
    aiSummary.promptIntro,
    aiSummary.promptFocus,
    aiSummary.promptFormat,
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
        instructions: aiSummary.systemPrompt,
        input: buildPrompt(context),
        max_output_tokens: AI_SUMMARY_MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error(
        `OpenAI session summary failed with status ${response.status}${details ? `: ${details}` : ""}`,
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
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
      max_tokens: AI_SUMMARY_MAX_TOKENS,
      system: aiSummary.systemPrompt,
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
    console.error(
      `Anthropic session summary failed with status ${response.status}${details ? `: ${details}` : ""}`,
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
