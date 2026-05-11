import { Link, Section, Text } from "@react-email/components";

import {
  ActionButton,
  DetailItem,
  GuideMeEmailLayout,
  InfoCard,
  emailStyles,
} from "./_components/GuideMeEmailLayout";
import { formatIstDateTime, getSessionManageUrl, resolveDate } from "./utils";

export type SessionReminderProps = {
  recipientName: string;
  recipientRole: "student" | "mentor";
  otherPersonName: string;
  scheduledAt: string | Date;
  meetingLink: string;
  isOnehour: boolean;
};

export function SessionReminder({
  recipientName,
  recipientRole,
  otherPersonName,
  scheduledAt,
  meetingLink,
  isOnehour,
}: SessionReminderProps) {
  const scheduledLabel = formatIstDateTime(scheduledAt);
  const manageUrl = getSessionManageUrl(recipientRole);
  const maybeDate = resolveDate(scheduledAt);
  const relativeLabel = isOnehour
    ? "in about 1 hour"
    : maybeDate
      ? "in about 24 hours"
      : "soon";

  return (
    <GuideMeEmailLayout
      preview={`Reminder: your GuideMe session with ${otherPersonName} starts ${relativeLabel}.`}
      title={isOnehour ? "Your session starts in about 1 hour" : "Your session is tomorrow"}
      subtitle={`Hi ${recipientName}, your conversation with ${otherPersonName} is coming up.`}
    >
      <Text style={emailStyles.contentText}>
        Keep a few minutes free before the session so you can join calmly, settle in, and start on time.
      </Text>

      <InfoCard title="Reminder details">
        <DetailItem label="With" value={otherPersonName} />
        <DetailItem label="Starts" value={scheduledLabel} />
        <DetailItem label="Time until session" value={relativeLabel} />
      </InfoCard>

      <Section>
        <ActionButton href={meetingLink}>Join session</ActionButton>
      </Section>

      <Section style={{ marginTop: "18px" }}>
        <Link href={manageUrl} style={emailStyles.smallLink}>
          Reschedule or cancel
        </Link>
      </Section>
    </GuideMeEmailLayout>
  );
}

export default SessionReminder;
