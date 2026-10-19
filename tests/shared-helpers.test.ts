import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIp } from "@/Backend/lib/client-ip";
import { sanitizeText } from "@/Backend/lib/sanitize";
import { getSafeRedirectTo } from "@/shared/auth-flow";
import { formatPaise, getInitials } from "@/shared/format";
import { imageUrlSchema, isSafeHttpsUrl, linkedinUrlSchema } from "@/shared/validations/url";

describe("getSafeRedirectTo", () => {
  it("keeps same-site paths", () => {
    expect(getSafeRedirectTo("/dashboard/student?tab=1")).toBe("/dashboard/student?tab=1");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", ""])(
    "falls back for %s",
    (value) => {
      expect(getSafeRedirectTo(value)).toBe("/dashboard");
    },
  );
});

describe("URL validation", () => {
  it("only treats https URLs as safe links", () => {
    expect(isSafeHttpsUrl("https://linkedin.com/in/x")).toBe(true);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("http://linkedin.com/in/x")).toBe(false);
  });

  it("only accepts LinkedIn URLs on linkedin.com", () => {
    expect(linkedinUrlSchema.safeParse("https://www.linkedin.com/in/x").success).toBe(true);
    expect(linkedinUrlSchema.safeParse("https://linkedin.com.evil.io/x").success).toBe(false);
  });

  it("only accepts images from supported hosts or inline raster images", () => {
    expect(imageUrlSchema.safeParse("https://abc.ufs.sh/f/1").success).toBe(true);
    expect(imageUrlSchema.safeParse("https://evil.com/a.png").success).toBe(false);
    expect(imageUrlSchema.safeParse("data:image/png;base64,iVBORw0KGgo=").success).toBe(true);
    expect(imageUrlSchema.safeParse("data:image/svg+xml;base64,PHN2Zz4=").success).toBe(false);
  });
});

describe("sanitizeText", () => {
  it("strips tags and script contents but keeps plain text as-is", () => {
    expect(sanitizeText("<b>Hi</b> & welcome<script>alert(1)</script>")).toBe("Hi & welcome");
  });
});

describe("format helpers", () => {
  it("formats paise as rupees, showing paise only when there are any", () => {
    expect(formatPaise(149900)).toBe("₹1,499");
    expect(formatPaise(9950)).toBe("₹99.50");
    expect(formatPaise(null)).toBe("₹0");
  });

  it("builds initials", () => {
    expect(getInitials("Aarav Vatsh")).toBe("AV");
    expect(getInitials("  ", "G")).toBe("G");
  });
});

describe("getClientIp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const request = (headers: Record<string, string>) => new Request("https://x.test", { headers });

  it("ignores client-supplied X-Forwarded-For entries behind one proxy", () => {
    vi.stubEnv("VERCEL", "");
    expect(getClientIp(request({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" }))).toBe("1.2.3.4");
  });

  it("trusts the platform header on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    expect(getClientIp(request({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "1.2.3.4" }))).toBe("1.2.3.4");
  });
});
