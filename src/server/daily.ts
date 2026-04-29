const DAILY_API_BASE_URL = "https://api.daily.co/v1";

type CreateDailyRoomInput = {
  sessionId: string;
  startsAt: Date;
  durationMinutes: number;
};

type DailyRoomResponse = {
  name?: string;
  url?: string;
};

function getDailyApiKey() {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    throw new Error("Missing DAILY_API_KEY");
  }

  return apiKey;
}

function getDailyDomain() {
  const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN?.trim();

  if (!domain) {
    throw new Error("Missing NEXT_PUBLIC_DAILY_DOMAIN");
  }

  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function buildRoomName(sessionId: string) {
  return `guideme-${sessionId.replaceAll("-", "").slice(0, 24)}`;
}

export async function createDailyRoom({
  sessionId,
  startsAt,
  durationMinutes,
}: CreateDailyRoomInput) {
  const roomName = buildRoomName(sessionId);
  const roomExpiresAt = new Date(startsAt.getTime() + (durationMinutes + 60) * 60 * 1000);

  const response = await fetch(`${DAILY_API_BASE_URL}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDailyApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: Math.floor(roomExpiresAt.getTime() / 1000),
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Daily room creation failed with status ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  const payload = (await response.json()) as DailyRoomResponse;
  const meetingLink = payload.url ?? `https://${getDailyDomain()}/${roomName}`;

  return {
    roomId: payload.name ?? roomName,
    meetingLink,
  };
}
