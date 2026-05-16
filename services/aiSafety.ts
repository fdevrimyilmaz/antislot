import { postChat } from "./api";
import type { Language } from "@/i18n/translations";

export type SafetyFlags = {
  crisis: boolean;
  selfHarm: boolean;
  medical: boolean;
  illegal: boolean;
  gamblingTrigger: boolean;
};

type SafetyContext = {
  locale: Language;
  signal?: AbortSignal;
};

const SELF_HARM_KEYWORDS = [
  // TR
  "intihar",
  "kendimi oldur",
  "yasamak istemiyorum",
  "canima kiyacagim",
  // EN fallback
  "suicide",
  "kill myself",
  "don't want to live",
  "end my life",
];

const CRISIS_KEYWORDS = [
  // TR
  "acil",
  "kriz",
  "dayanamiyorum",
  "cok kotuyum",
  // EN fallback
  "emergency",
  "crisis",
  "can't take it",
  "i am not safe",
];

const GAMBLING_KEYWORDS = [
  // TR
  "bahis",
  "slot",
  "kupon",
  "iddaa",
  "oran",
  "kazan",
  // EN fallback
  "bet",
  "odds",
  "casino",
  "sportsbook",
  "strategy",
  "winning",
];

const MEDICAL_KEYWORDS = ["ilac", "doz", "tedavi", "tani", "medicine", "dose", "treatment", "diagnosis"];

const ILLEGAL_KEYWORDS = ["dolandir", "hack", "sahte", "fraud", "hack", "fake"];

const STOP_WORDS = [
  // TR
  "birak",
  "kurtul",
  "durdur",
  "istemiyorum",
  // EN
  "stop",
  "quit",
  "i want to quit",
  "i don't want",
];

const TACTIC_KEYWORDS = [
  // TR
  "taktik",
  "strateji",
  "kupon",
  "iddaa",
  "oran",
  "sistem",
  "site",
  "kazandir",
  "kazanma",
  "para kazan",
  // EN
  "strategy",
  "tips",
  "odds",
  "system",
  "site",
  "win",
  "winning",
  "make money",
  "sure bet",
];

const UNSAFE_REPLY_KEYWORDS = [
  "strategy",
  "tips",
  "odds",
  "system",
  "bonus",
  "bet",
  "casino",
  "iddaa",
  "kupon",
  "kazandir",
  "kazanma",
];

const CRISIS_RESPONSE_TR =
  "Su an cok zor bir an olabilir. Guvende olman onemli. Acil tehlike varsa lutfen 112'yi ara. " +
  "Yesilay YEDAM (115) ve Alo 183'e ulasabilir, guvendigin birini arayabilirsin. " +
  "Istersen kisa bir nefes: 4 saniye al, 4 tut, 6 yavas ver; bunu 3-5 tur yap.";

const REFUSAL_RESPONSE_TR =
  "Bahis kazanma taktikleri veya para kazanma yontemleri konusunda yardimci olamam. " +
  "Istersen birakma hedefini destekleyebiliriz: 10 dakika erteleme, durtu surfu, tetikleyici listesi, " +
  "destek agina yazma ve alternatif bir aktivite secme.";

const SYSTEM_PROMPT_TR = [
  "Sen destekleyici bir asistansin.",
  "Tibbi/klinik tani veya tedavi tavsiyesi verme.",
  "Kumar birakma hedefini destekle, tetikleyici ayrintiya girme.",
  "Bahis kazanma taktigi, site onerisi, yontem vb. verme.",
  "Kisa, net, sefkatli ve eyleme donuk oneriler ver.",
  "Kullanici hangi dilde yaziyorsa o dilde cevap ver.",
].join(" ");

const CRISIS_RESPONSE_EN =
  "This may be a very hard moment right now. Your safety comes first. If there is immediate danger, call local emergency services now. " +
  "You can also contact a trusted person and ask them to stay with you while you regulate your breathing.";

const REFUSAL_RESPONSE_EN =
  "I can't help with gambling-winning tactics or money-making betting strategies. " +
  "I can help you stay on your quit goal: 10-minute delay, urge surfing, trigger list, message your support network, and choose one safe alternative activity now.";

const LANGUAGE_NAME: Record<Language, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ar: "Arabic",
  ru: "Russian",
  fil: "Filipino",
  sv: "Swedish",
  fi: "Finnish",
  nl: "Dutch",
  ja: "Japanese",
  id: "Indonesian",
  th: "Thai",
  hi: "Hindi",
  km: "Khmer",
  el: "Greek",
};

const systemPromptForLocale = (locale: Language) => {
  const target = LANGUAGE_NAME[locale] ?? "English";
  return [
    "You are a supportive recovery assistant.",
    "Do not provide gambling-winning tactics, methods, sites, or betting advice.",
    "Do not provide medical diagnosis or clinical treatment advice.",
    "Be brief, practical, compassionate, and action-oriented.",
    `Reply in ${target}. If the user writes in another language, still reply in ${target}.`,
  ].join(" ");
};

const normalizeText = (text: string, locale: Language = "tr"): string => {
  try {
    return text.trim().toLocaleLowerCase(locale);
  } catch {
    return text.trim().toLowerCase();
  }
};

const hasAny = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

const detectFlags = (text: string): SafetyFlags => ({
  crisis: hasAny(text, CRISIS_KEYWORDS),
  selfHarm: hasAny(text, SELF_HARM_KEYWORDS),
  medical: hasAny(text, MEDICAL_KEYWORDS),
  illegal: hasAny(text, ILLEGAL_KEYWORDS),
  gamblingTrigger: hasAny(text, GAMBLING_KEYWORDS),
});

const wantsToStop = (text: string): boolean => hasAny(text, STOP_WORDS);

const isTacticRequest = (text: string): boolean => {
  if (wantsToStop(text)) return false;
  const hasGambling = hasAny(text, ["bahis", "slot", "iddaa", "kupon", "kasa", "bet", "casino"]);
  const hasMoneyAngle = hasAny(text, ["para kazan", "kazandir", "kazanma", "kazan", "make money", "win"]);
  const hasTactics = hasAny(text, TACTIC_KEYWORDS);
  return hasMoneyAngle || (hasGambling && hasTactics);
};

const isUnsafeReply = (text: string): boolean => {
  const hasGambling = hasAny(text, ["bahis", "slot", "iddaa", "kupon", "kasa", "bet", "casino"]);
  const hasTactics = hasAny(text, UNSAFE_REPLY_KEYWORDS);
  return hasGambling && hasTactics;
};

const getLocaleCopy = (locale: Language) => {
  if (locale === "tr") {
    return {
      systemPrompt: SYSTEM_PROMPT_TR,
      crisis: CRISIS_RESPONSE_TR,
      refusal: REFUSAL_RESPONSE_TR,
    };
  }

  return {
    systemPrompt: systemPromptForLocale(locale),
    crisis: CRISIS_RESPONSE_EN,
    refusal: REFUSAL_RESPONSE_EN,
  };
};

export async function safeAiReply(
  userText: string,
  context?: SafetyContext
): Promise<{ text: string; flags: SafetyFlags; truncated: boolean }> {
  const locale = context?.locale ?? "tr";
  const trimmed = userText.trim();
  const normalized = normalizeText(trimmed, locale);
  const flags = detectFlags(normalized);
  const copy = getLocaleCopy(locale);

  if (flags.selfHarm || flags.crisis) {
    return { text: copy.crisis, flags, truncated: false };
  }

  if (isTacticRequest(normalized)) {
    return { text: copy.refusal, flags, truncated: false };
  }

  const { reply, truncated } = await postChat(
    [
      { role: "system", content: copy.systemPrompt },
      { role: "user", content: trimmed },
    ],
    { signal: context?.signal }
  );

  const replyNormalized = normalizeText(reply, locale);
  const isUnsafe = isUnsafeReply(replyNormalized);
  const safeText = isUnsafe ? copy.refusal : reply;

  return {
    text: safeText,
    flags,
    truncated: isUnsafe ? false : truncated,
  };
}
