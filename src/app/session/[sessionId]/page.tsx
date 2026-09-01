import { notFound, redirect } from "next/navigation";

import { auth } from "@/Backend/auth";
import { SessionRoomPageClient } from "@/Frontend/components/session/SessionRoomPageClient";
import { db } from "@/Backend/server/db";
import { sessionDetailsInclude } from "@/Backend/server/sessions";

type SessionPageProps = {
  params: { sessionId: string };
  searchParams?: { review?: string };
};

async function getSession(sessionId: string, userId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: sessionDetailsInclude,
  });

  if (!session) {
    return null;
  }

  if (session.mentorId !== userId && session.studentId !== userId) {
    return null;
  }

  return session;
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  const userSession = await auth();

  if (!userSession?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/session/${params.sessionId}`);
  }

  const session = await getSession(params.sessionId, userSession.user.id);

  if (!session) {
    notFound();
  }

  const serializedSession = JSON.parse(JSON.stringify(session));

  return (
    <SessionRoomPageClient
      sessionId={params.sessionId}
      currentUserId={userSession.user.id}
      initialSession={serializedSession}
      shouldPromptReview={searchParams?.review === "1"}
    />
  );
}
