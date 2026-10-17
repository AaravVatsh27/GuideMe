import { z } from "zod";

// Hosts that profile images may be served from. Keep in sync with images.remotePatterns
// in next.config.mjs; *.ufs.sh is where UploadThing v7 serves uploaded files.
const IMAGE_HOST_SUFFIXES = [
  "lh3.googleusercontent.com",
  "uploadthing.com",
  "utfs.io",
  "ufs.sh",
  "supabase.co",
] as const;

// Inline images are only used as a fallback when uploads are not configured.
const DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i;
const MAX_DATA_IMAGE_LENGTH = 2_000_000;

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hostMatches(hostname: string, suffix: string) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

/** True for absolute https URLs, so values like javascript: or data: are never rendered as links. */
export function isSafeHttpsUrl(value: string | null | undefined): value is string {
  return Boolean(value && parseUrl(value)?.protocol === "https:");
}

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(isSafeHttpsUrl, "Enter a valid https:// URL");

export const linkedinUrlSchema = httpsUrlSchema.refine((value) => {
  const url = parseUrl(value);
  return Boolean(url && hostMatches(url.hostname, "linkedin.com"));
}, "Enter a linkedin.com profile URL");

export const imageUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (value.startsWith("data:")) {
      return value.length <= MAX_DATA_IMAGE_LENGTH && DATA_IMAGE_PATTERN.test(value);
    }

    const url = parseUrl(value);
    return Boolean(
      url &&
        url.protocol === "https:" &&
        IMAGE_HOST_SUFFIXES.some((suffix) => hostMatches(url.hostname, suffix)),
    );
  }, "Use an uploaded image or an image hosted on a supported service");
