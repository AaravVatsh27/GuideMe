import { Link, Section, Text } from "@react-email/components";

import {
  ActionButton,
  BulletList,
  GuideMeEmailLayout,
  InfoCard,
  SectionHeading,
  emailStyles,
} from "./_components/GuideMeEmailLayout";
import { GUIDE_ME_BRAND, humanizeLabel } from "./utils";

export type WelcomeMentorProps = {
  mentorName: string;
  college: string;
  tier: string;
  profileUrl: string;
};

export function WelcomeMentor({
  mentorName,
  college,
  tier,
  profileUrl,
}: WelcomeMentorProps) {
  return (
    <GuideMeEmailLayout
      preview={`Welcome to GuideMe, ${mentorName}. Your mentor profile is now under review.`}
      title="Welcome to GuideMe"
      subtitle={`Hi ${mentorName}, your ${humanizeLabel(tier).toLowerCase()} mentor profile from ${college} is now in review.`}
    >
      <InfoCard title="What happens next">
        <BulletList
          items={[
            "Your profile is under review while we check trust signals, clarity, and readiness for student bookings.",
            "Once approved, students will be able to discover your profile and book open slots directly.",
            "Any edits you make to your profile now will immediately strengthen the quality of the final listing.",
          ]}
        />
      </InfoCard>

      <SectionHeading>Tips for a great first session</SectionHeading>
      <BulletList
        items={[
          "Open with the student's exact decision, not a broad life story.",
          "Use one or two examples from your own path that make the advice concrete.",
          "Always end with one action, one deadline, and one reason the student should follow through.",
        ]}
      />

      <Section style={{ marginTop: "20px" }}>
        <ActionButton href={profileUrl}>Open your profile</ActionButton>
      </Section>

      <Text style={{ ...emailStyles.contentText, marginTop: "18px" }}>
        Join the mentor community here:{" "}
        <Link href={GUIDE_ME_BRAND.whatsappUrl} style={emailStyles.smallLink}>
          GuideMe WhatsApp community
        </Link>
      </Text>
    </GuideMeEmailLayout>
  );
}

export default WelcomeMentor;
