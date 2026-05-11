import { Section, Text } from "@react-email/components";

import {
  DetailItem,
  GuideMeEmailLayout,
  InfoCard,
  SectionHeading,
  emailStyles,
} from "./_components/GuideMeEmailLayout";
import { formatCurrency, formatIstDate } from "./utils";

export type PayoutConfirmationProps = {
  mentorName: string;
  amount: number;
  sessionCount: number;
  upiId: string;
  transactionId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
};

export function PayoutConfirmation({
  mentorName,
  amount,
  sessionCount,
  upiId,
  transactionId,
  periodStart,
  periodEnd,
}: PayoutConfirmationProps) {
  return (
    <GuideMeEmailLayout
      preview={`Your GuideMe payout of ${formatCurrency(amount)} has been processed.`}
      title="Your payout is on the way"
      subtitle={`Nice work, ${mentorName}. A new payout has been processed for your recent sessions.`}
    >
      <Text style={emailStyles.contentText}>
        Congratulations. You've helped {sessionCount} students this week, and your earnings have been sent to your payout method.
      </Text>

      <InfoCard title="Earnings breakdown">
        <DetailItem label="Payout period" value={`${formatIstDate(periodStart)} to ${formatIstDate(periodEnd)}`} />
        <DetailItem label="Sessions covered" value={sessionCount.toString()} />
        <DetailItem label="Total payout" value={formatCurrency(amount)} />
        <DetailItem label="UPI ID" value={upiId} />
        <DetailItem label="Transaction ID" value={transactionId} />
      </InfoCard>

      <SectionHeading>Payout details</SectionHeading>
      <Section>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginBottom: "20px",
          }}
        >
          <tbody>
            {[
              ["Total earnings", formatCurrency(amount)],
              ["Session count", sessionCount.toString()],
              ["Transfer method", `UPI • ${upiId}`],
              ["Reference", transactionId],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    borderBottom: "1px solid #dbe4ee",
                    color: "#64748b",
                    fontFamily: emailStyles.contentText.fontFamily,
                    fontSize: "13px",
                    padding: "10px 12px 10px 0",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #dbe4ee",
                    color: "#0f172a",
                    fontFamily: emailStyles.contentText.fontFamily,
                    fontSize: "14px",
                    fontWeight: "600",
                    padding: "10px 0 10px 12px",
                    textAlign: "right",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </GuideMeEmailLayout>
  );
}

export default PayoutConfirmation;
