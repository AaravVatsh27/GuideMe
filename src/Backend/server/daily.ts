const DAILY_API_BASE_URL = "https://api.daily.co/v1";
const DAILY_ROOM_EXPIRY_BUFFER_MINUTES = 60;

type CreateDailyRoomInput = {
  sessionId: string;
  startsAt: Date;
  durationMinutes: number;
};

type CreateDailyMeetingTokenInput = {
  roomName: string;
  userName: string;
  isOwner: boolean;
  notBefore: Date;
  expiresAt: Date;
};

type DailyRoomResponse = {
  name?: string;
  url?: string;
};

type DailyMeetingTokenResponse = {
  token?: string;
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

export function getDailyRoomNameFromSession(input: {
  meetingRoomId?: string | null;
  meetingLink?: string | null;
  sessionId?: string;
}) {
  if (input.meetingRoomId?.trim()) {
    return input.meetingRoomId.trim();
  }

  if (input.meetingLink?.trim()) {
    try {
      const roomPath = new URL(input.meetingLink).pathname.split("/").filter(Boolean)[0];
      if (roomPath) {
        return roomPath;
      }
    } catch {
      // fall through to session id fallback
    }
  }

  if (input.sessionId) {
    return buildRoomName(input.sessionId);
  }

  throw new Error("Unable to determine Daily room name for session");
}

export async function createDailyRoom({
  sessionId,
  startsAt,
  durationMinutes,
}: CreateDailyRoomInput) {
  const roomName = buildRoomName(sessionId);
  const roomExpiresAt = new Date(
    startsAt.getTime() + (durationMinutes + DAILY_ROOM_EXPIRY_BUFFER_MINUTES) * 60 * 1000,
  );

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

export async function createDailyMeetingToken({
  roomName,
  userName,
  isOwner,
  notBefore,
  expiresAt,
}: CreateDailyMeetingTokenInput) {
  const response = await fetch(`${DAILY_API_BASE_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDailyApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        nbf: Math.floor(notBefore.getTime() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Daily meeting token creation failed with status ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  const payload = (await response.json()) as DailyMeetingTokenResponse;

  if (!payload.token) {
    throw new Error("Daily meeting token response was missing a token");
  }

  return payload.token;
}
