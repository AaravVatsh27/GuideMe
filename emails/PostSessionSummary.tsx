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
import { formatIstDate, formatIstDateTime } from "./utils";

export type PostSessionSummaryProps = {
  studentName: string;
  mentorName: string;
  sessionDate: string | Date;
  aiSummary: string;
  actionItems: string[];
  meetingNotes: string;
  rebookLink: string;
};

export function PostSessionSummary({
  studentName,
  mentorName,
  sessionDate,
  aiSummary,
  actionItems,
  meetingNotes,
  rebookLink,
}: PostSessionSummaryProps) {
  return (
    <GuideMeEmailLayout
      preview={`Your GuideMe session summary with ${mentorName} is ready.`}
      title="Your session summary is ready"
      subtitle={`Hi ${studentName}, here is the recap from your ${formatIstDate(sessionDate)} session with ${mentorName}.`}
    >
      <InfoCard title="Session summary">
        <DetailItem label="Mentor" value={mentorName} />
        <DetailItem label="Session date" value={formatIstDateTime(sessionDate)} />
        <Text style={{ ...emailStyles.contentText, marginBottom: 0 }}>{aiSummary}</Text>
      </InfoCard>

      <SectionHeading>Action items</SectionHeading>
      <InfoCard>
        <BulletList items={actionItems.length > 0 ? actionItems : ["No action items were captured for this session."]} />
      </InfoCard>

      <SectionHeading>Meeting notes</SectionHeading>
      <InfoCard>
        <Text style={{ ...emailStyles.contentText, marginBottom: 0 }}>
          {meetingNotes || "No extra meeting notes were saved."}
        </Text>
      </InfoCard>

      <Section>
        <ActionButton href={rebookLink}>Rebook this mentor</ActionButton>
      </Section>
    </GuideMeEmailLayout>
  );
}

export default PostSessionSummary;
