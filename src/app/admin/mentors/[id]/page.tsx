import { notFound } from "next/navigation";

import { Badge } from "@/client/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { getAdminMentorDetailData, getMentorAdminStatus } from "@/server/admin";

import { AdminStatusBadge } from "../../_components/admin-status-badge";
import { formatCurrency, formatDateOnly, formatDateTime, formatEnumLabel } from "../../_components/admin-utils";

export default async function AdminMentorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const mentor = await getAdminMentorDetailData(params.id);

  if (!mentor || !mentor.mentorProfile) {
    notFound();
  }

  const status = getMentorAdminStatus({
    verificationStatus: mentor.mentorVerification?.status,
    isVerified: mentor.mentorProfile.isVerified,
    isActive: mentor.mentorProfile.isActive,
  });

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-2xl tracking-tight text-slate-950">
            <span>{mentor.name}</span>
            <AdminStatusBadge status={status} kind="mentor" />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p><span className="font-medium text-slate-950">Email:</span> {mentor.email}</p>
              <p className="mt-1"><span className="font-medium text-slate-950">College:</span> {mentor.mentorProfile.college || "Not provided"}</p>
              <p className="mt-1"><span className="font-medium text-slate-950">Tier:</span> {mentor.mentorProfile.tier}</p>
              <p className="mt-1"><span className="font-medium text-slate-950">Joined:</span> {formatDateOnly(mentor.createdAt)}</p>
              <p className="mt-1"><span className="font-medium text-slate-950">Price:</span> {formatCurrency(mentor.mentorProfile.priceMin)} to {formatCurrency(mentor.mentorProfile.priceMax)}</p>
              <p className="mt-1"><span className="font-medium text-slate-950">LinkedIn:</span> {mentor.mentorProfile.linkedinUrl || "Not provided"}</p>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Profile bio</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{mentor.mentorProfile.bio || "No bio saved."}</p>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Recent sessions</p>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                {mentor.mentorSessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-medium text-slate-950">{session.student.name}</p>
                    <p className="mt-1">{formatDateTime(session.scheduledAt)} • {formatEnumLabel(session.status)}</p>
                    <p className="mt-1">Earning: {formatCurrency(session.mentorEarning)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Verification</p>
              <p className="mt-3 text-sm text-slate-700">Status: {mentor.mentorVerification?.status ?? "PENDING"}</p>
              <p className="mt-1 text-sm text-slate-700">Submitted: {formatDateTime(mentor.mentorVerification?.submittedAt)}</p>
              <p className="mt-1 text-sm text-slate-700">Reviewed: {formatDateTime(mentor.mentorVerification?.reviewedAt)}</p>
              <p className="mt-1 text-sm text-slate-700">Reason: {mentor.mentorVerification?.rejectionReason || "None"}</p>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Specialisations</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mentor.mentorProfile.specialisations.map((topic) => (
                  <Badge key={topic} variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                    {formatEnumLabel(topic)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Recent reviews</p>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                {mentor.reviewsReceived.map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-medium text-slate-950">{review.student.name} • {review.rating} / 5</p>
                    <p className="mt-1">{review.reviewText || "No written review."}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
