import { PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { addMinutes } from "date-fns";
import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import {
  createDailyMeetingToken,
  getDailyRoomNameFromSession,
} from "@/Backend/server/daily";
import {
  SESSION_JOIN_EARLY_WINDOW_MINUTES,
  SESSION_ROOM_GRACE_MINUTES,
} from "@/shared/constants";
import { defineRoute } from "@/Backend/lib/define-route";

export const GET = defineRoute(
  {},
  async (_request: Request, context: { params: { sessionId: string } }, { session }) => {
  const record = await db.session.findUnique({
    where: {
      id: context.params.sessionId,
    },
    select: {
      id: true,
      status: true,
      type: true,
      scheduledAt: true,
      durationMinutes: true,
      mentorId: true,
      studentId: true,
      meetingLink: true,
      meetingRoomId: true,
      payment: {
        select: {
          status: true,
        },
      },
      mentor: {
        select: {
          name: true,
        },
      },
      student: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!record) {
    return apiErrorResponse("Session not found", 404);
  }

  if (record.studentId !== session.user.id && record.mentorId !== session.user.id) {
    return apiErrorResponse("Forbidden", 403);
  }

  if (record.status !== SessionStatus.SCHEDULED && record.status !== SessionStatus.ONGOING) {
    return apiErrorResponse(`This session is ${record.status.toLowerCase()}`, 409);
  }

  if (record.type === SessionType.PAID && record.payment?.status !== PaymentStatus.CAPTURED) {
    return apiErrorResponse("Payment must be completed before joining this session", 402);
  }

  if (!record.meetingLink) {
    return apiErrorResponse("Meeting room is not ready yet", 409);
  }

  const roomOpensAt = addMinutes(record.scheduledAt, -SESSION_JOIN_EARLY_WINDOW_MINUTES);
  const roomClosesAt = addMinutes(
    record.scheduledAt,
    record.durationMinutes + SESSION_ROOM_GRACE_MINUTES,
  );
  const now = new Date();

  if (now > roomClosesAt) {
    return apiErrorResponse("This session's room has closed", 409);
  }

  if (now < roomOpensAt) {
    return NextResponse.json(
      {
        error: `The room opens ${SESSION_JOIN_EARLY_WINDOW_MINUTES} minutes before the scheduled time`,
        roomOpensAt,
      },
      { status: 409 },
    );
  }

  const roomName = getDailyRoomNameFromSession({
    meetingRoomId: record.meetingRoomId,
    meetingLink: record.meetingLink,
    sessionId: record.id,
  });
  const token = await createDailyMeetingToken({
    roomName,
    userName: record.studentId === session.user.id ? record.student.name : record.mentor.name,
    isOwner: record.mentorId === session.user.id,
    notBefore: roomOpensAt,
    expiresAt: roomClosesAt,
  });

  const joinUrl = new URL(record.meetingLink);
  joinUrl.searchParams.set("t", token);

  return NextResponse.json({
    joinUrl: joinUrl.toString(),
    roomOpensAt,
  });
}, "/api/sessions/[sessionId]/daily-token");
