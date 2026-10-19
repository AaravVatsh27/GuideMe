import { notFound } from "next/navigation";

import { getAdminMentorDetailData, getMentorAdminStatus } from "@/Backend/server/admin";
import { cn } from "@/Frontend/lib/utils";

import { AdminStatusBadge } from "@/Frontend/views/admin/admin-status-badge";
import {
  AdminAvatar,
  adminCardClass,
  AdminDetailRows,
  AdminPill,
  adminSectionLabelClass,
} from "@/Frontend/views/admin/admin-ui";
import { formatPaise, formatDateOnly, formatDateTime, formatEnumLabel } from "@/Frontend/views/admin/admin-utils";

function DetailCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(adminCardClass, "p-6", className)}>
      <h2 className={adminSectionLabelClass}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

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
  const verificationStatus = mentor.mentorVerification?.status ?? "PENDING";

  return (
    <div className="space-y-5">
      <section className={cn(adminCardClass, "flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8")}>
        <AdminAvatar name={mentor.name} image={mentor.image} className="size-16 text-lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Mentor profile</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="break-words text-[36px] font-bold leading-tight tracking-tight text-[#0F172A]">{mentor.name}</h1>
            <AdminStatusBadge status={status} kind="mentor" />
          </div>
          <p className="mt-1 break-all text-sm text-[#64748B]">{mentor.email}</p>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <DetailCard title="Profile details">
            <AdminDetailRows
              rows={[
                { label: "Email", value: mentor.email },
                { label: "College", value: mentor.mentorProfile.college || "Not provided" },
                {
                  label: "Tier",
                  value: (
                    <AdminPill
                      tone={mentor.mentorProfile.tier === "VERIFIED" ? "green" : mentor.mentorProfile.tier === "ELITE" ? "indigo" : "gray"}
                    >
                      {mentor.mentorProfile.tier}
                    </AdminPill>
                  ),
                },
                { label: "Joined", value: formatDateOnly(mentor.createdAt) },
                {
                  label: "Price",
                  value: `${formatPaise(mentor.mentorProfile.priceMinPaise)} to ${formatPaise(mentor.mentorProfile.priceMaxPaise)}`,
                },
                { label: "LinkedIn", value: <span className="break-all">{mentor.mentorProfile.linkedinUrl || "Not provided"}</span> },
              ]}
            />
          </DetailCard>

          <DetailCard title="Profile bio">
            <p className="text-sm leading-6 text-[#334155]">{mentor.mentorProfile.bio || "No bio saved."}</p>
          </DetailCard>

          <DetailCard title="Recent sessions">
            {mentor.mentorSessions.length > 0 ? (
              <ul>
                {mentor.mentorSessions.map((session) => (
                  <li key={session.id} className="flex items-center gap-3 border-b border-[#F1F5F9] py-3 last:border-b-0">
                    <AdminAvatar name={session.student.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0F172A]">{session.student.name}</p>
                      <p className="text-xs text-[#64748B]">{formatDateTime(session.scheduledAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <AdminStatusBadge status={session.status} kind="session" />
                      <span className="text-xs text-[#64748B]">Earning: {formatPaise(session.mentorEarningPaise)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#64748B]">No sessions yet.</p>
            )}
          </DetailCard>
        </div>

        <div className="space-y-5">
          <DetailCard title="Verification">
            <AdminDetailRows
              rows={[
                {
                  label: "Status",
                  value: <AdminStatusBadge status={verificationStatus} kind="verification" />,
                },
                { label: "Submitted", value: formatDateTime(mentor.mentorVerification?.submittedAt) },
                { label: "Reviewed", value: formatDateTime(mentor.mentorVerification?.reviewedAt) },
                { label: "Reason", value: mentor.mentorVerification?.rejectionReason || "None" },
              ]}
            />
          </DetailCard>

          <DetailCard title="Specialisations">
            {mentor.mentorProfile.specialisations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mentor.mentorProfile.specialisations.map((topic) => (
                  <AdminPill key={topic} tone="gray">
                    {formatEnumLabel(topic)}
                  </AdminPill>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">No specialisations added.</p>
            )}
          </DetailCard>

          <DetailCard title="Recent reviews">
            {mentor.reviewsReceived.length > 0 ? (
              <ul>
                {mentor.reviewsReceived.map((review) => (
                  <li key={review.id} className="border-b border-[#F1F5F9] py-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-[#0F172A]">{review.student.name}</p>
                      <AdminPill tone="indigo">{review.rating} / 5</AdminPill>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#334155]">{review.reviewText || "No written review."}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#64748B]">No reviews yet.</p>
            )}
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
