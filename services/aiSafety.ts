import { postChatWithContext, type ChatCoachingContext } from "./api";
import {
  getLocaleForLanguage,
  resolveUiLanguage,
  type SupportedLanguage,
} from "@/i18n/translations";
import { inferUrgeFromContext, type ProactiveAction } from "@/services/urgeTriggerInference";

export type SupportedLocale = "tr" | "en";
export type SafetyLocale = SupportedLanguage | SupportedLocale;

export type SafetyFlags = {
  crisis: boolean;
  selfHarm: boolean;
  medical: boolean;
  illegal: boolean;
  gamblingTrigger: boolean;
};

export type SafetyReplySource =
  | "remote"
  | "local_fallback"
  | "safety_crisis"
  | "safety_refusal"
  | "empty";

type SafetyHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type SafetyContext = {
  locale?: SafetyLocale;
  signal?: AbortSignal;
  history?: SafetyHistoryItem[];
};

type SafetyKeywords = {
  crisis: string[];
  selfHarm: string[];
  medical: string[];
  illegal: string[];
  gambling: string[];
  stopWords: string[];
  tactic: string[];
  moneyAngle: string[];
  unsafeReply: string[];
};

type SafetyCopy = {
  systemPrompt: string;
  crisis: string;
  refusal: string;
  emptyInput: string;
};

type LocaleConfig = {
  normalizeLocale: string;
  keywords: SafetyKeywords;
  copy: SafetyCopy;
};

type LocalCoachCopy = {
  intro: string;
  triggerFocus: string;
  medicalBoundary: string;
  illegalBoundary: string;
  outro: string;
  stepDelay: string;
  stepNight: string;
  stepMovement: string;
  stepMoney: string;
  stepJournal: string;
  stepConnect: string;
};

const LOCALE_CONFIG: Record<SupportedLocale, LocaleConfig> = {
  tr: {
    normalizeLocale: getLocaleForLanguage("tr"),
    keywords: {
      crisis: ["acil", "kriz", "dayanamiyorum", "cok kotuyum", "yardim edin"],
      selfHarm: ["intihar", "kendimi oldur", "yasamak istemiyorum", "canima kiyacagim", "bilek"],
      medical: ["ilac", "doz", "tedavi", "tani"],
      illegal: ["dolandir", "hack", "sahte"],
      gambling: ["bahis", "slot", "kasa", "kupon", "iddaa", "casino", "rulet", "poker"],
      stopWords: ["birak", "birakma", "kurtul", "durdur", "istemiyorum", "vazgec", "uzak dur"],
      tactic: ["taktik", "strateji", "kupon", "iddaa", "oran", "sistem", "site", "bonus"],
      moneyAngle: ["para kazan", "kazandir", "kazanma", "kazan", "kar et"],
      unsafeReply: ["taktik", "strateji", "kazandir", "kazanma", "oran", "kupon", "iddaa", "bonus"],
    },
    copy: {
      systemPrompt: [
        "Sen destekleyici bir asistansin.",
        "Tibbi veya klinik tavsiye verme.",
        "Kumar birakma hedefini destekle, tetikleyici detaylara girme.",
        "Bahis kazanma taktigi, site onerisi veya para kazanma yontemi verme.",
        "Kisisel veri isteme.",
        "Kisa, net ve eyleme donuk oneriler ver.",
        "Gerekirse Turkiye kriz kaynaklari: 112, YEDAM 115, Alo 183.",
      ].join(" "),
      crisis:
        "Su an zor bir an yasiyor olabilirsin. Guvende olman oncelikli. Acil risk varsa 112'yi ara. YEDAM 115 ve Alo 183'e ulasabilir veya guvendigin birini arayabilirsin.",
      refusal:
        "Bahis kazanma taktigi veya para kazanma yontemi konusunda yardimci olamam. Istersen birakma hedefini destekleyen adimlar planlayabiliriz: 10 dakika erteleme, tetikleyici listesi, destek agina yazma ve alternatif aktivite.",
      emptyInput: "Bir cumle yazarak baslayabilirsin. Istersen nasil hissettigini anlat.",
    },
  },
  en: {
    normalizeLocale: getLocaleForLanguage("en"),
    keywords: {
      crisis: ["emergency", "crisis", "cant cope", "can't cope", "overwhelmed", "panic"],
      selfHarm: ["suicide", "kill myself", "hurt myself", "end my life", "self harm"],
      medical: ["medication", "dose", "treatment", "diagnosis", "prescription"],
      illegal: ["fraud", "hack", "scam", "fake id", "launder"],
      gambling: ["bet", "betting", "slot", "casino", "roulette", "poker", "odds", "bookmaker"],
      stopWords: ["quit", "stop", "avoid", "dont want", "don't want", "stay away", "recover"],
      tactic: ["strategy", "tactic", "tips", "odds", "system", "method", "bonus", "site"],
      moneyAngle: ["make money", "win money", "profit", "guaranteed win", "beat the house"],
      unsafeReply: ["strategy", "tactic", "odds", "bonus", "guaranteed win", "beat the house"],
    },
    copy: {
      systemPrompt: [
        "You are a supportive recovery assistant.",
        "Do not provide medical or clinical advice.",
        "Support gambling-cessation goals without trigger-heavy details.",
        "Do not provide betting tactics, site recommendations, or money-making methods.",
        "Do not request personal sensitive data.",
        "Give concise, actionable coping steps.",
      ].join(" "),
      crisis:
        "This sounds like a very hard moment. Your safety comes first. If you are in immediate danger, call local emergency services now. You can also reach a trusted person or local crisis support line.",
      refusal:
        "I can't help with betting tactics or ways to win money from gambling. I can help you with safer alternatives such as delay techniques, trigger planning, and reaching support.",
      emptyInput: "You can start with one sentence about how you feel right now.",
    },
  },
};

const LOCAL_COACH_COPY: Record<SupportedLocale, LocalCoachCopy> = {
  tr: {
    intro: "Baglanti kesilse bile yanindayim. Simdi kisa bir dengeleme plani uygulayalim:",
    triggerFocus: "Bu durtu dalgadir; 10-20 dakika icinde siddeti duser.",
    medicalBoundary:
      "Tibbi/ilac dozu konusunda yonlendirme veremem; bunun icin bir saglik uzmani ile gorusmelisin.",
    illegalBoundary:
      "Yasadisi veya zarar verici adimlarda yardimci olamam. Guvenli ve yasal secenekleri secelim.",
    outro: "Hazirsan 2 dakika sonra tekrar yaz, sonraki adimi birlikte netlestirelim.",
    stepDelay: "10 dakika ertele, bir bardak su ic ve ortam degistir.",
    stepNight: "Ekrani kapat, 4-7-8 nefes dongusunu 4 tur uygula, sonra kisa dus al.",
    stepMovement: "90 saniye ayakta kal, 20 squat veya 5 dakikalik hizli yuruyus yap.",
    stepMoney: "Banka uygulamasindan harcama limitini dusur veya karti gecici kilitle.",
    stepJournal: "Tetikleyiciyi tek cumle yaz: 'Neyi hissettim, neye ihtiyacim var?'",
    stepConnect: "Guvendigin birine tek satir mesaj at: 'Su an destege ihtiyacim var.'",
  },
  en: {
    intro: "Even if connection is unstable, I am with you. Let's run a short stabilization plan:",
    triggerFocus: "This urge is a wave; intensity usually drops within 10-20 minutes.",
    medicalBoundary:
      "I cannot provide medication or dose guidance; please use a licensed medical professional for that.",
    illegalBoundary:
      "I cannot help with illegal or harmful actions. Let's stick to safe and legal options.",
    outro: "If you want, message again in 2 minutes and we will set the next step together.",
    stepDelay: "Delay for 10 minutes, drink a glass of water, and change your environment.",
    stepNight: "Turn the screen off, do 4 rounds of 4-7-8 breathing, then take a short shower.",
    stepMovement: "Stand for 90 seconds, then do 20 squats or a 5-minute brisk walk.",
    stepMoney: "Lower your spending limit in your banking app or temporarily lock your card.",
    stepJournal: "Write one line: 'What am I feeling, and what do I need right now?'",
    stepConnect: "Send one line to someone you trust: 'I need support right now.'",
  },
};

const ACTION_LABELS: Record<SupportedLocale, Record<ProactiveAction, string>> = {
  tr: {
    breathing_reset: "4 tur 4-7-8 nefes uygula.",
    delay_urge: "10 dakika erteleme penceresi ac.",
    start_lock: "Para koruma kilidini etkinlestir.",
    notify_partner: "Partnerine kisa bir durum mesaji gonder.",
    open_sos: "Hemen SOS ekranina gec ve guvenlik adimlarini uygula.",
  },
  en: {
    breathing_reset: "Do 4 rounds of 4-7-8 breathing.",
    delay_urge: "Start a 10-minute delay window.",
    start_lock: "Enable your money protection lock.",
    notify_partner: "Send a short status message to your trusted partner.",
    open_sos: "Open the SOS flow now and follow safety steps.",
  },
};

const DEFAULT_LOCALE: SupportedLocale = "tr";
const SUPPORTED_UI_LOCALES = new Set<SupportedLocale>(["tr", "en"]);
const DIRECT_GEMINI_MAX_RETRIES = 2;

const hasAny = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

function normalizeSafetyLocale(locale?: SafetyLocale): SupportedLocale {
  if (locale && SUPPORTED_UI_LOCALES.has(locale as SupportedLocale)) {
    return locale as SupportedLocale;
  }
  if (!locale) return DEFAULT_LOCALE;
  return resolveUiLanguage(locale as SupportedLanguage);
}

const getLocaleConfig = (locale?: SafetyLocale): LocaleConfig =>
  LOCALE_CONFIG[normalizeSafetyLocale(locale)] ?? LOCALE_CONFIG[DEFAULT_LOCALE];

const normalizeText = (text: string, localeConfig: LocaleConfig): string =>
  text.trim().toLocaleLowerCase(localeConfig.normalizeLocale);

const detectFlags = (text: string, keywords: SafetyKeywords): SafetyFlags => ({
  crisis: hasAny(text, keywords.crisis),
  selfHarm: hasAny(text, keywords.selfHarm),
  medical: hasAny(text, keywords.medical),
  illegal: hasAny(text, keywords.illegal),
  gamblingTrigger: hasAny(text, keywords.gambling),
});

const isTacticRequest = (text: string, keywords: SafetyKeywords): boolean => {
  if (hasAny(text, keywords.stopWords)) {
    return false;
  }

  const hasGambling = hasAny(text, keywords.gambling);
  const hasMoneyAngle = hasAny(text, keywords.moneyAngle);
  const hasTactics = hasAny(text, keywords.tactic);
  return hasMoneyAngle || (hasGambling && hasTactics);
};

const isUnsafeReply = (text: string, keywords: SafetyKeywords): boolean =>
  hasAny(text, keywords.gambling) && hasAny(text, keywords.unsafeReply);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeForComparison = (value: string): string =>
  value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const isRepeatedReply = (reply: string, history: SafetyHistoryItem[]): boolean => {
  const lastAssistant = [...history].reverse().find((item) => item.role === "assistant");
  if (!lastAssistant) return false;
  return normalizeForComparison(lastAssistant.content) === normalizeForComparison(reply);
};

const buildRegenerationHint = (locale: SupportedLocale): string =>
  locale === "tr"
    ? "Onceden verdigin cevabi tekrar etme. Bu sefer daha farkli, daha somut ve yeni 3 adim ver."
    : "Do not repeat the previous reply. Give a clearly different answer with 3 new practical steps.";

const summarizeFocus = (text: string): string => {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= 160) {
    return compact;
  }
  return `${compact.slice(0, 157)}...`;
};

function buildChatCoachingContext(
  userText: string,
  locale: SupportedLocale,
  flags: SafetyFlags
): ChatCoachingContext {
  const inference = inferUrgeFromContext(userText);
  const actionLabels = ACTION_LABELS[locale];
  const actionPlan = inference.recommendedActions.map((action) => actionLabels[action]);

  if (flags.medical) {
    actionPlan.push(
      locale === "tr"
        ? "Ilac/doz konusunda yonlendirme verme; profesyonel yardima yonlendir."
        : "Avoid medication/dose guidance and route to professional support."
    );
  }
  if (flags.illegal) {
    actionPlan.push(
      locale === "tr"
        ? "Yasal ve guvenli seceneklere odaklan."
        : "Keep the plan focused on legal and safe options."
    );
  }

  const dedupedActions = Array.from(new Set(actionPlan)).slice(0, 5);
  const focusPrefix = locale === "tr" ? "Kullanici ifadesi" : "User statement";

  return {
    locale,
    riskLevel: inference.riskLevel,
    suggestedIntensity: inference.suggestedIntensity,
    trigger: inference.trigger,
    focus: `${focusPrefix}: ${summarizeFocus(userText)}`,
    actionPlan: dedupedActions,
  };
}

const buildModelCandidates = (): string[] => {
  const configured =
    (process.env.EXPO_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash").trim() ||
    "gemini-2.5-flash";

  const baseline = [
    configured,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
  ];

  const deduped: string[] = [];
  for (const model of baseline) {
    if (!model) continue;
    if (!deduped.includes(model)) {
      deduped.push(model);
    }
  }
  return deduped;
};

async function requestGeminiDirect(
  localeConfig: LocaleConfig,
  history: SafetyHistoryItem[],
  userText: string,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("direct_gemini_key_missing");
  }

  const baseUrl =
    (process.env.EXPO_PUBLIC_GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").trim() ||
    "https://generativelanguage.googleapis.com/v1beta";
  const models = buildModelCandidates();

  let lastError = "direct_gemini_failed";
  for (const model of models) {
    for (let attempt = 0; attempt <= DIRECT_GEMINI_MAX_RETRIES; attempt += 1) {
      const contents = [
        { role: "user", parts: [{ text: `[SYSTEM]\n${localeConfig.copy.systemPrompt}` }] },
        ...history.map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }],
        })),
        { role: "user", parts: [{ text: userText }] },
      ];

      const response = await fetch(
        `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.6,
            },
          }),
          signal,
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        lastError = String(data?.error?.message || `status_${response.status}`);
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < DIRECT_GEMINI_MAX_RETRIES) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        // Non-retryable or max retries reached -> try next model candidate
        break;
      }

      const reply = (data?.candidates ?? [])
        .flatMap((candidate: { content?: { parts?: Array<{ text?: string }> } }) =>
          candidate?.content?.parts ?? []
        )
        .map((part: { text?: string }) => part.text || "")
        .join(" ")
        .trim();

      if (reply) {
        return reply;
      }

      lastError = "empty_direct_gemini_reply";
      if (attempt < DIRECT_GEMINI_MAX_RETRIES) {
        await sleep(200 * (attempt + 1));
      }
    }
  }

  throw new Error(lastError);
}

function buildLocalCoachReply(
  userText: string,
  flags: SafetyFlags,
  locale: SupportedLocale,
  normalizeLocale: string
): string {
  const copy = LOCAL_COACH_COPY[locale];
  const normalized = userText.trim().toLocaleLowerCase(normalizeLocale);
  const compactUserText = userText.trim().replace(/\s+/g, " ");

  const mentionsNight = /gece|uyku|night|sleep/.test(normalized);
  const mentionsMoney = /borc|kredi|para|debt|loan|money/.test(normalized);
  const mentionsLonely = /yalniz|yalnizlik|kimse|alone|lonely|nobody/.test(normalized);
  const hash = compactUserText
    .split("")
    .reduce((sum, ch) => (sum + ch.charCodeAt(0)) % 997, 0);

  const firstStep = mentionsNight ? copy.stepNight : copy.stepDelay;
  const secondStep = mentionsMoney ? copy.stepMoney : copy.stepMovement;
  const thirdStep = mentionsLonely ? copy.stepConnect : copy.stepJournal;

  const steps =
    hash % 3 === 0
      ? [firstStep, secondStep, thirdStep]
      : hash % 3 === 1
      ? [secondStep, thirdStep, firstStep]
      : [thirdStep, firstStep, secondStep];

  const reflection =
    locale === "tr"
      ? `Senden duydugum ana nokta: "${compactUserText.slice(0, 120)}"`
      : `What I hear most is: "${compactUserText.slice(0, 120)}"`;

  const lines = [copy.intro, reflection];
  if (flags.gamblingTrigger) {
    lines.push(copy.triggerFocus);
  }
  if (flags.medical) {
    lines.push(copy.medicalBoundary);
  }
  if (flags.illegal) {
    lines.push(copy.illegalBoundary);
  }
  lines.push(`1. ${steps[0]}`);
  lines.push(`2. ${steps[1]}`);
  lines.push(`3. ${steps[2]}`);
  lines.push(copy.outro);

  return lines.join("\n");
}

export async function safeAiReply(
  userText: string,
  context?: SafetyContext
): Promise<{ text: string; flags: SafetyFlags; source: SafetyReplySource }> {
  const locale = normalizeSafetyLocale(context?.locale);
  const localeConfig = LOCALE_CONFIG[locale] ?? LOCALE_CONFIG[DEFAULT_LOCALE];
  const trimmed = userText.trim();
  const normalized = normalizeText(trimmed, localeConfig);
  const flags = detectFlags(normalized, localeConfig.keywords);

  if (!trimmed) {
    return { text: localeConfig.copy.emptyInput, flags, source: "empty" };
  }

  if (flags.selfHarm || flags.crisis) {
    return { text: localeConfig.copy.crisis, flags, source: "safety_crisis" };
  }

  if (isTacticRequest(normalized, localeConfig.keywords)) {
    return { text: localeConfig.copy.refusal, flags, source: "safety_refusal" };
  }

  const history = (context?.history ?? [])
    .filter(
      (item): item is SafetyHistoryItem =>
        Boolean(item) &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 1200),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-10);

  const coachingContext = buildChatCoachingContext(trimmed, locale, flags);

  let reply: string;
  try {
    reply = await postChatWithContext(
      [
        ...history,
        { role: "user", content: trimmed },
      ],
      coachingContext,
      { signal: context?.signal }
    );
  } catch {
    try {
      reply = await requestGeminiDirect(localeConfig, history, trimmed, context?.signal);
    } catch {
      return {
        text: buildLocalCoachReply(trimmed, flags, locale, localeConfig.normalizeLocale),
        flags,
        source: "local_fallback",
      };
    }
  }

  if (isRepeatedReply(reply, history)) {
    try {
      reply = await requestGeminiDirect(
        localeConfig,
        history,
        `${trimmed}\n\n${buildRegenerationHint(locale)}`,
        context?.signal
      );
    } catch {
      // keep previous reply if regeneration fails
    }
  }

  const normalizedReply = normalizeText(reply, localeConfig);
  if (isUnsafeReply(normalizedReply, localeConfig.keywords)) {
    return { text: localeConfig.copy.refusal, flags, source: "safety_refusal" };
  }

  return { text: reply, flags, source: "remote" };
}
