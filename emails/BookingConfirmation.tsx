import { Link, Section, Text } from "@react-email/components";

import {
  ActionButton,
  BulletList,
  DetailItem,
  GuideMeEmailLayout,
  InfoCard,
  SectionHeading,
  emailStyles,
} from "./_components/GuideMeEmailLayout";
import {
  buildAppleCalendarUrl,
  buildGoogleCalendarUrl,
  formatIstDateTime,
  humanizeLabel,
  resolveDate,
} from "./utils";

export type BookingConfirmationProps = {
  studentName: string;
  mentorName: string;
  mentorCollege: string;
  sessionType: string;
  scheduledAt: string | Date;
  durationMinutes: number;
  meetingLink: string;
  sessionId: string;
};

export function BookingConfirmation({
  studentName,
  mentorName,
  mentorCollege,
  sessionType,
  scheduledAt,
  durationMinutes,
  meetingLink,
  sessionId,
}: BookingConfirmationProps) {
  const scheduledLabel = formatIstDateTime(scheduledAt);
  const calendarStart = resolveDate(scheduledAt) ?? scheduledAt;
  const calendarDescription = `GuideMe mentoring session with ${mentorName}. Session ID: ${sessionId}.`;
  const googleCalendarUrl = buildGoogleCalendarUrl({
    title: `GuideMe session with ${mentorName}`,
    description: calendarDescription,
    start: calendarStart,
    durationMinutes,
    location: meetingLink,
  });
  const appleCalendarUrl = buildAppleCalendarUrl({
    title: `GuideMe session with ${mentorName}`,
    description: calendarDescription,
    start: calendarStart,
    durationMinutes,
    location: meetingLink,
  });

  return (
    <GuideMeEmailLayout
      preview={`Your GuideMe session with ${mentorName} is confirmed for ${scheduledLabel}.`}
      title="Your session is confirmed"
      subtitle={`Hi ${studentName}, everything is locked in. Here is what you need before the call starts.`}
      footerNote={`Session ID: ${sessionId}`}
    >
      <InfoCard title="Session details">
        <DetailItem label="Mentor" value={`${mentorName} • ${mentorCollege}`} />
        <DetailItem label="Session type" value={humanizeLabel(sessionType)} />
        <DetailItem label="Scheduled for" value={scheduledLabel} />
        <DetailItem label="Duration" value={`${durationMinutes} minutes`} />
        <DetailItem label="Meeting link" value={meetingLink} />
      </InfoCard>

      <Section>
        <ActionButton href={meetingLink}>Join your session</ActionButton>
      </Section>

      <Section style={{ margin: "16px 0 20px" }}>
        <Link href={googleCalendarUrl} style={emailStyles.smallLink}>
          Add to Google Calendar
        </Link>
        <Link href={appleCalendarUrl} style={emailStyles.smallLink}>
          Add to Apple Calendar
        </Link>
      </Section>

      <SectionHeading>What to expect</SectionHeading>
      <BulletList
        items={[
          "Bring one or two exact questions so the session starts with the highest-value decision.",
          "Keep your current notes, marks, and shortlist nearby so your mentor can get specific fast.",
          "Reserve the last five minutes to confirm your next step and deadline before leaving the call.",
        ]}
      />

      <Text style={emailStyles.contentText}>
        If the meeting link ever changes, the latest version in your GuideMe dashboard is the one to trust.
      </Text>
    </GuideMeEmailLayout>
  );
}

export default BookingConfirmation;
