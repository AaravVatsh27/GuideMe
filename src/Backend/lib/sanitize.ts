import DOMPurify from "isomorphic-dompurify";

/**
 * Strip ALL HTML from a string — use for plain-text fields (bio, headline, notes).
 * Returns an empty string if the input is falsy.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Allow a safe subset of HTML — use for rich-text fields if ever needed.
 */
export function sanitizeRichText(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "ul", "ol", "li", "p", "br", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

/**
 * Validates an Indian mobile number (10 digits, optionally prefixed with +91 / 0).
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^(?:\+91|0)?[6-9]\d{9}$/.test(phone.trim());
}

/**
 * Validates an E.164 international phone number.
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}
