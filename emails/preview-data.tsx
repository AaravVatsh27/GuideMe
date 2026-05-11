import { BookingConfirmation, type BookingConfirmationProps } from "./BookingConfirmation";
import { MentorSessionAlert, type MentorSessionAlertProps } from "./MentorSessionAlert";
import { PayoutConfirmation, type PayoutConfirmationProps } from "./PayoutConfirmation";
import { PostSessionSummary, type PostSessionSummaryProps } from "./PostSessionSummary";
import { SessionReminder, type SessionReminderProps } from "./SessionReminder";
import { WelcomeMentor, type WelcomeMentorProps } from "./WelcomeMentor";
import { WelcomeStudent, type WelcomeStudentProps } from "./WelcomeStudent";

const sampleDate = new Date("2026-05-08T13:30:00+05:30");

export const emailPreviewRegistry = {
  "booking-confirmation": {
    subject: "Your GuideMe session is confirmed",
    element: (
      <BookingConfirmation
        studentName="Aarav"
        mentorName="Riya Mehta"
        mentorCollege="IIT Bombay"
        sessionType="PAID"
        scheduledAt={sampleDate}
        durationMinutes={45}
        meetingLink="https://meet.guideme.app/session/demo-booking"
        sessionId="BK-2048"
      />
    ),
  },
  "mentor-session-alert": {
    subject: "New student session on your calendar",
    element: (
      <MentorSessionAlert
        mentorName="Riya"
        studentName="Aarav"
        studentClass="CLASS_11"
        studentConfusionType="STREAM_SELECTION"
        scheduledAt={sampleDate}
        durationMinutes={45}
        sessionId="BK-2048"
        preparationTips={[
          "Compare PCM and PCB against what the student actually enjoys studying now.",
          "Use one short story from your own decision process to reduce abstraction.",
          "End with a stream shortlist and one discussion point for the student's parents.",
        ]}
        meetingLink="https://meet.guideme.app/session/demo-booking"
      />
    ),
  },
  "session-reminder-24h": {
    subject: "Your GuideMe session is tomorrow",
    element: (
      <SessionReminder
        recipientName="Aarav"
        recipientRole="student"
        otherPersonName="Riya Mehta"
        scheduledAt={sampleDate}
        meetingLink="https://meet.guideme.app/session/demo-booking"
        isOnehour={false}
      />
    ),
  },
  "session-reminder-1h": {
    subject: "Your GuideMe session starts in about 1 hour",
    element: (
      <SessionReminder
        recipientName="Riya"
        recipientRole="mentor"
        otherPersonName="Aarav"
        scheduledAt={sampleDate}
        meetingLink="https://meet.guideme.app/session/demo-booking"
        isOnehour
      />
    ),
  },
  "post-session-summary": {
    subject: "Your GuideMe session summary is ready",
    element: (
      <PostSessionSummary
        studentName="Aarav"
        mentorName="Riya Mehta"
        sessionDate={sampleDate}
        aiSummary="You narrowed the decision to PCM versus Commerce, mapped each option to likely exam paths, and identified the biggest pressure point as family expectations rather than marks."
        actionItems={[
          "List the three subjects you naturally spend the most time on this week.",
          "Speak to one teacher about whether PCM keeps your strongest options open.",
          "Review the mentor's stream comparison notes with your parents this weekend.",
        ]}
        meetingNotes="Aarav responds well to examples tied to actual college outcomes. Family input is important, but the next conversation should stay anchored on aptitude and long-term fit."
        rebookLink="https://guideme.app/dashboard/student/find-mentor?mentorId=demo"
      />
    ),
  },
  "payout-confirmation": {
    subject: "Your GuideMe payout has been processed",
    element: (
      <PayoutConfirmation
        mentorName="Riya"
        amount={3200}
        sessionCount={5}
        upiId="riya.mehta@oksbi"
        transactionId="UTR20481234"
        periodStart="2026-05-01"
        periodEnd="2026-05-07"
      />
    ),
  },
  "welcome-mentor": {
    subject: "Welcome to GuideMe",
    element: (
      <WelcomeMentor
        mentorName="Riya"
        college="IIT Bombay"
        tier="VERIFIED"
        profileUrl="https://guideme.app/dashboard/mentor/profile"
      />
    ),
  },
  "welcome-student": {
    subject: "Welcome to GuideMe",
    element: (
      <WelcomeStudent
        studentName="Aarav"
        class="CLASS_11"
        topMentorName="Riya Mehta"
        topMentorCollege="IIT Bombay"
        findMentorUrl="https://guideme.app/dashboard/student/find-mentor"
      />
    ),
  },
} as const;

export type EmailPreviewTemplate = keyof typeof emailPreviewRegistry;

export const emailPreviewTemplates = Object.keys(emailPreviewRegistry) as EmailPreviewTemplate[];

export type PreviewProps =
  | BookingConfirmationProps
  | MentorSessionAlertProps
  | SessionReminderProps
  | PostSessionSummaryProps
  | PayoutConfirmationProps
  | WelcomeMentorProps
  | WelcomeStudentProps;
