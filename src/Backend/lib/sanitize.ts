const SCRIPT_OR_STYLE_BLOCK = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_TAG = /<\/?[a-z!][^>]*>/gi;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Turns user input into plain text for fields like bio, headline and notes:
 * removes HTML tags (and the contents of script/style blocks) and control characters.
 * The text is stored unescaped; React escapes it when rendering, so characters such as
 * "&" are not stored as HTML entities.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    .replace(SCRIPT_OR_STYLE_BLOCK, "")
    .replace(HTML_TAG, "")
    .replace(CONTROL_CHARACTERS, "")
    .trim();
}

/**
 * Validates an Indian mobile number (10 digits, optionally prefixed with +91 / 0).
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^(?:\+91|0)?[6-9]\d{9}$/.test(phone.trim());
}
