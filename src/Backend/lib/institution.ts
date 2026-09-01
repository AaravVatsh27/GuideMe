const INSTITUTION_NAME_STOP_WORDS = new Set(["of", "and", "the", "for", "in", "at"]);

export function normalizeInstitutionName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((word) => word.length > 0 && !INSTITUTION_NAME_STOP_WORDS.has(word))
    .join(" ")
    .trim()
    .replace(/\s+/g, "-");
}
