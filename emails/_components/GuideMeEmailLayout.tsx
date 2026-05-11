import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { GUIDE_ME_BRAND } from "../utils";

const colors = {
  navy: "#0f172a",
  navySoft: "#172554",
  teal: "#14b8a6",
  tealDark: "#0f766e",
  text: "#0f172a",
  muted: "#475569",
  border: "#dbe4ee",
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceSoft: "#f1f5f9",
  amber: "#f59e0b",
} as const;

const fontFamily = "'Inter', 'Segoe UI', Helvetica, Arial, sans-serif";

type LayoutProps = {
  preview: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerNote?: string;
};

type ActionButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function GuideMeEmailLayout({
  preview,
  title,
  subtitle,
  children,
  footerNote,
}: LayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={shell}>
          <Section style={header}>
            <div style={brandRow}>
              <div style={logoWrap}>G</div>
              <div>
                <Text style={brandLabel}>GuideMe</Text>
                <Text style={brandSubLabel}>Clarity from mentors who have been there</Text>
              </div>
            </div>
            <Heading style={titleStyle}>{title}</Heading>
            {subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null}
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Email{" "}
              <Link href={`mailto:${GUIDE_ME_BRAND.supportEmail}`} style={footerLink}>
                {GUIDE_ME_BRAND.supportEmail}
              </Link>
              .
            </Text>
            {footerNote ? <Text style={footerMuted}>{footerNote}</Text> : null}
            <Text style={footerMuted}>
              You are receiving this transactional email because you use GuideMe.{" "}
              <Link href={GUIDE_ME_BRAND.unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function ActionButton({ href, children, variant = "primary" }: ActionButtonProps) {
  return (
    <Button
      href={href}
      style={variant === "primary" ? primaryButton : secondaryButton}
    >
      {children}
    </Button>
  );
}

export function InfoCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={card}>
      {title ? <Text style={cardTitle}>{title}</Text> : null}
      {children}
    </Section>
  );
}

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={detailItem}>
      <Text style={detailLabel}>{label}</Text>
      <Text style={detailValue}>{value}</Text>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <Text style={sectionHeading}>{children}</Text>;
}

export function BulletList({
  items,
  accent = colors.teal,
}: {
  items: string[];
  accent?: string;
}) {
  return (
    <Section>
      {items.map((item, index) => (
        <div key={`${item}-${index}`} style={bulletRow}>
          <div style={{ ...bulletDot, backgroundColor: accent }} />
          <Text style={bulletText}>{item}</Text>
        </div>
      ))}
    </Section>
  );
}

export const emailStyles = {
  colors,
  fontFamily,
  contentText: {
    color: colors.muted,
    fontFamily,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  smallLink: {
    color: colors.tealDark,
    fontFamily,
    fontSize: "14px",
    fontWeight: "600",
    marginRight: "16px",
    textDecoration: "none",
  },
  mutedText: {
    color: colors.muted,
    fontFamily,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0",
  },
} as const;

const body = {
  backgroundColor: colors.background,
  fontFamily,
  margin: 0,
  padding: "24px 12px",
} as const;

const shell = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "28px",
  margin: "0 auto",
  maxWidth: "640px",
  overflow: "hidden",
} as const;

const header = {
  background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navySoft} 100%)`,
  padding: "28px 32px",
} as const;

const brandRow = {
  alignItems: "center",
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
} as const;

const logoWrap = {
  alignItems: "center",
  backgroundColor: colors.teal,
  borderRadius: "999px",
  color: colors.surface,
  display: "flex",
  fontFamily,
  fontSize: "20px",
  fontWeight: "700",
  height: "44px",
  justifyContent: "center",
  width: "44px",
} as const;

const brandLabel = {
  color: colors.surface,
  fontFamily,
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: "24px",
  margin: 0,
} as const;

const brandSubLabel = {
  color: "#cbd5e1",
  fontFamily,
  fontSize: "12px",
  letterSpacing: "0.02em",
  lineHeight: "16px",
  margin: 0,
} as const;

const titleStyle = {
  color: colors.surface,
  fontFamily,
  fontSize: "30px",
  fontWeight: "700",
  lineHeight: "38px",
  margin: "0 0 12px",
} as const;

const subtitleStyle = {
  color: "#dbeafe",
  fontFamily,
  fontSize: "16px",
  lineHeight: "26px",
  margin: 0,
} as const;

const content = {
  padding: "28px 32px 12px",
} as const;

const footer = {
  padding: "8px 32px 28px",
} as const;

const divider = {
  borderColor: colors.border,
  margin: "0 32px",
} as const;

const footerText = {
  color: colors.text,
  fontFamily,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
} as const;

const footerMuted = {
  color: "#64748b",
  fontFamily,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0 0 8px",
} as const;

const footerLink = {
  color: colors.tealDark,
  textDecoration: "underline",
} as const;

const primaryButton = {
  backgroundColor: colors.teal,
  borderRadius: "999px",
  color: colors.surface,
  display: "inline-block",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  padding: "14px 22px",
  textDecoration: "none",
} as const;

const secondaryButton = {
  backgroundColor: colors.surfaceSoft,
  border: `1px solid ${colors.border}`,
  borderRadius: "999px",
  color: colors.text,
  display: "inline-block",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  padding: "14px 22px",
  textDecoration: "none",
} as const;

const card = {
  backgroundColor: colors.surfaceSoft,
  border: `1px solid ${colors.border}`,
  borderRadius: "22px",
  padding: "20px",
  marginBottom: "20px",
} as const;

const cardTitle = {
  color: colors.text,
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  letterSpacing: "0.02em",
  lineHeight: "20px",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
} as const;

const detailItem = {
  borderBottom: `1px solid ${colors.border}`,
  padding: "0 0 12px",
  marginBottom: "12px",
} as const;

const detailLabel = {
  color: "#64748b",
  fontFamily,
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.03em",
  lineHeight: "16px",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
} as const;

const detailValue = {
  color: colors.text,
  fontFamily,
  fontSize: "15px",
  lineHeight: "22px",
  margin: 0,
} as const;

const sectionHeading = {
  color: colors.text,
  fontFamily,
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "22px",
  margin: "0 0 12px",
} as const;

const bulletRow = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
} as const;

const bulletDot = {
  borderRadius: "999px",
  flexShrink: 0,
  height: "10px",
  marginTop: "7px",
  width: "10px",
} as const;

const bulletText = {
  color: colors.muted,
  fontFamily,
  fontSize: "15px",
  lineHeight: "24px",
  margin: 0,
} as const;
