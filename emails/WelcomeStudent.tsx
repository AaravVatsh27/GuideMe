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
import { humanizeLabel } from "./utils";

export type WelcomeStudentProps = {
  studentName: string;
  class: string;
  topMentorName: string;
  topMentorCollege: string;
  findMentorUrl: string;
};

export function WelcomeStudent({
  studentName,
  class: studentClass,
  topMentorName,
  topMentorCollege,
  findMentorUrl,
}: WelcomeStudentProps) {
  return (
    <GuideMeEmailLayout
      preview={`Welcome to GuideMe, ${studentName}. Start with a mentor who matches your current decision stage.`}
      title="Welcome to GuideMe"
      subtitle={`Hi ${studentName}, you are all set. Here is the fastest way to get clarity as a ${humanizeLabel(studentClass)} student.`}
    >
      <SectionHeading>How GuideMe works</SectionHeading>
      <BulletList
        items={[
          "Find a mentor who has already made the decision you are trying to make now.",
          "Book a short session, bring your exact confusion, and get specific advice instead of generic motivation.",
          "Leave with one concrete next step and use your dashboard to keep momentum moving.",
        ]}
      />

      <InfoCard title="Recommended starting point">
        <DetailItem label="Top mentor right now" value={topMentorName} />
        <DetailItem label="College" value={topMentorCollege} />
        <Text style={{ ...emailStyles.contentText, marginBottom: 0 }}>
          This is a strong first conversation if you want a high-signal example of what your next move can look like.
        </Text>
      </InfoCard>

      <Section>
        <ActionButton href={findMentorUrl}>Find a mentor</ActionButton>
      </Section>
    </GuideMeEmailLayout>
  );
}

export default WelcomeStudent;
