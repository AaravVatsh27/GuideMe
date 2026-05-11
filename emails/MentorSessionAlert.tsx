import { Section, Text } from "@react-email/components";

import {
  ActionButton,
  BulletList,
  DetailItem,
  GuideMeEmailLayout,
  InfoCard,
  SectionHeading,
  emailStyles,
} from "./_components/GuideMeEmailLayout";
import { formatIstDateTime, getPreparationTips, humanizeLabel } from "./utils";

export type MentorSessionAlertProps = {
  mentorName: string;
  studentName: string;
  studentClass: string;
  studentConfusionType: string;
  scheduledAt: string | Date;
  durationMinutes: number;
  sessionId: string;
  preparationTips?: string[];
  meetingLink?: string;
};

export function MentorSessionAlert({
  mentorName,
  studentName,
  studentClass,
  studentConfusionType,
  scheduledAt,
  durationMinutes,
  sessionId,
  preparationTips,
  meetingLink,
}: MentorSessionAlertProps) {
  const scheduledLabel = formatIstDateTime(scheduledAt);
  const classLabel = humanizeLabel(studentClass);
  const confusionLabel = humanizeLabel(studentConfusionType);
  const prepTips = preparationTips?.length ? preparationTips : getPreparationTips(studentConfusionType);

  return (
    <GuideMeEmailLayout
      preview={`New GuideMe session: ${studentName} on ${scheduledLabel}.`}
      title="A new student session is on your calendar"
      subtitle={`Hi ${mentorName}, here is the context you need before the call starts.`}
      footerNote={`Session ID: ${sessionId}`}
    >
      <InfoCard title="Session details">
        <DetailItem label="Student" value={studentName} />
        <DetailItem label="Class" value={classLabel} />
        <DetailItem label="Scheduled for" value={scheduledLabel} />
        <DetailItem label="Duration" value={`${durationMinutes} minutes`} />
      </InfoCard>

      <SectionHeading>Student context</SectionHeading>
      <Text style={emailStyles.contentText}>
        This student is a {classLabel} student confused about {confusionLabel.toLowerCase()}.
      </Text>

      <InfoCard title="Preparation tips">
        <BulletList items={prepTips.slice(0, 3)} />
      </InfoCard>

      {meetingLink ? (
        <Section>
          <ActionButton href={meetingLink}>Join session</ActionButton>
        </Section>
      ) : null}
    </GuideMeEmailLayout>
  );
}

export default MentorSessionAlert;
