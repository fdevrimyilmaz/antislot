const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_ALNUM = /[^a-z0-9\s]/g;

export function normalizeSmsText(input: string): string {
  if (!input) return "";

  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[çÇ]/g, "c")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[8]/g, "b")
    .replace(/[_\-.]/g, " ")
    .replace(NON_ALNUM, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toCompactSmsText(input: string): string {
  return normalizeSmsText(input).replace(/[^a-z0-9]/g, "");
}

export function normalizeSmsKeyword(keyword: string): string {
  return normalizeSmsText(keyword);
}

export function isValidSmsKeyword(keyword: string): boolean {
  const normalized = normalizeSmsKeyword(keyword);
  if (normalized.length < 2) return false;
  return /[a-z0-9]/.test(normalized);
}

export function dedupeSmsKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of keywords) {
    if (typeof raw !== "string") continue;
    const normalized = normalizeSmsKeyword(raw);
    if (!isValidSmsKeyword(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
