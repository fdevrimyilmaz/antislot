import { postChat } from "./api";

export type SafetyFlags = {
  crisis: boolean;
  selfHarm: boolean;
  medical: boolean;
  illegal: boolean;
  gamblingTrigger: boolean;
};

type SafetyContext = {
  locale: "tr";
};

const SELF_HARM_KEYWORDS = [
  "intihar",
  "kendimi öldür",
  "yaşamak istemiyorum",
  "bilek",
  "canıma kıyacağım",
];

const CRISIS_KEYWORDS = ["acil", "kriz", "dayanamıyorum", "çok kötüyüm"];

const GAMBLING_KEYWORDS = [
  "bahis",
  "slot",
  "kasa",
  "kupon",
  "iddaa",
  "para kazanma",
  "taktik",
  "strateji",
  "kazandır",
];

const MEDICAL_KEYWORDS = ["ilaç", "doz", "tedavi", "tanı"];

const ILLEGAL_KEYWORDS = ["dolandır", "hack", "sahte"];

const STOP_WORDS = [
  "bırak",
  "bırakma",
  "kurtul",
  "durdur",
  "istemiyorum",
  "vazgeç",
  "kaçın",
  "uzak dur",
];

const TACTIC_KEYWORDS = [
  "taktik",
  "strateji",
  "kupon",
  "iddaa",
  "oran",
  "sistem",
  "site",
  "kazandır",
  "kazanma",
  "para kazan",
];

const UNSAFE_REPLY_KEYWORDS = [
  "taktik",
  "strateji",
  "kazandır",
  "kazanma",
  "oran",
  "kupon",
  "iddaa",
  "sistem",
  "site",
  "bonus",
];

const CRISIS_RESPONSE_TR =
  "Şu an çok zor bir an olabilir. Güvende olman önemli. Acil tehlike varsa lütfen 112'yi ara. " +
  "Yeşilay YEDAM (115) ve Alo 183'e ulaşabilir, güvendiğin birini arayabilirsin. " +
  "İstersen kısa bir nefes: 4 saniye al, 4 tut, 6 yavaş ver; bunu 3-5 tur yap.";

const REFUSAL_RESPONSE_TR =
  "Bahis kazanma taktikleri veya para kazanma yöntemleri konusunda yardımcı olamam. " +
  "İstersen bırakma hedefini destekleyebiliriz: 10 dakika erteleme, dürtü sörfü, tetikleyici listesi, " +
  "destek ağına yazma ve alternatif bir aktivite seçme. Zorlanıyorsan 112, YEDAM 115 veya Alo 183'e ulaşabilirsin.";

const SYSTEM_PROMPT_TR = [
  "Sen destekleyici bir asistansın.",
  "Ben terapist değilim, tıbbi/klinik tavsiye vermem.",
  "Kumar bırakma hedefini destekle, tetikleyici ayrıntıya girme.",
  "Bahis kazanma taktiği, site önerisi, yöntem vb. verme.",
  "Kişisel verileri isteme.",
  "Kısa, net, şefkatli ve eyleme dönük öneriler ver: dürtü sörfü, erteleme, tetikleyici listesi, destek ağı, alternatif aktivite.",
  "Türkiye kaynakları: 112, YEDAM, Alo 183.",
].join(" ");

const normalizeText = (text: string): string => text.trim().toLocaleLowerCase("tr");

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
  const hasGambling = hasAny(text, ["bahis", "slot", "iddaa", "kupon", "kasa"]);
  const hasMoneyAngle = hasAny(text, ["para kazan", "kazandır", "kazanma", "kazan"]);
  const hasTactics = hasAny(text, TACTIC_KEYWORDS);
  return hasMoneyAngle || (hasGambling && hasTactics);
};

const isUnsafeReply = (text: string): boolean => {
  const hasGambling = hasAny(text, ["bahis", "slot", "iddaa", "kupon", "kasa"]);
  const hasTactics = hasAny(text, UNSAFE_REPLY_KEYWORDS);
  return hasGambling && hasTactics;
};

const getLocaleCopy = (locale: "tr") => {
  if (locale === "tr") {
    return {
      systemPrompt: SYSTEM_PROMPT_TR,
      crisis: CRISIS_RESPONSE_TR,
      refusal: REFUSAL_RESPONSE_TR,
    };
  }
  return {
    systemPrompt: SYSTEM_PROMPT_TR,
    crisis: CRISIS_RESPONSE_TR,
    refusal: REFUSAL_RESPONSE_TR,
  };
};

export async function safeAiReply(
  userText: string,
  context?: SafetyContext
): Promise<{ text: string; flags: SafetyFlags }> {
  const locale = context?.locale ?? "tr";
  const trimmed = userText.trim();
  const normalized = normalizeText(trimmed);
  const flags = detectFlags(normalized);
  const copy = getLocaleCopy(locale);

  if (flags.selfHarm || flags.crisis) {
    return { text: copy.crisis, flags };
  }

  if (isTacticRequest(normalized)) {
    return { text: copy.refusal, flags };
  }

  const reply = await postChat([
    { role: "system", content: copy.systemPrompt },
    { role: "user", content: trimmed },
  ]);
  const replyNormalized = normalizeText(reply);
  const safeText = isUnsafeReply(replyNormalized) ? copy.refusal : reply;
  return { text: safeText, flags };
}
