import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { Badge } from "@/client/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { SessionLoadingSkeleton } from "@/components/session/SessionLoadingSkeleton";

// Dynamic import for VideoRoom to avoid SSR issues with WebRTC/Canvas
const VideoRoom = dynamic(() => import("@/components/session/VideoRoom"), {
  loading: () => <SessionLoadingSkeleton />,
  ssr: false,
});

interface SessionPageProps {
  params: { sessionId: string };
}

async function getSession(sessionId: string, userId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      mentor: { select: { name: true, image: true, id: true } },
      student: { select: { name: true, image: true, id: true } },
    },
  });

  if (!session) return null;
  if (session.mentorId !== userId && session.studentId !== userId) return null;

  return session;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/session/${params.sessionId}`);
  }

  const session = await getSession(params.sessionId, userSession.user.id);
  if (!session) {
    notFound();
  }

  const isMentor = session.mentorId === userSession.user.id;
  const partnerName = isMentor ? session.student.name : session.mentor.name;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col gap-6">
      {/* Session Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <Users className="size-6 text-sky-500" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Session with {partnerName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="text-slate-400 border-slate-800 bg-slate-900/50">
                <Clock className="size-3 mr-1.5" />
                {session.durationMinutes} minutes
              </Badge>
              <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/20">
                {session.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">Secure • End-to-end encrypted</p>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 min-h-[600px]">
        <VideoRoom sessionId={params.sessionId} />
      </div>

      {/* Sidebar/Bottom area for notes/chat could go here */}
    </div>
  );
}
