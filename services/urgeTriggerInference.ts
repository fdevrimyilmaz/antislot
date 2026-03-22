import type { UrgeIntensity, UrgeTrigger } from "@/types/urge";

export type UrgeRiskLevel = "low" | "medium" | "high" | "critical";

export type ProactiveAction = "breathing_reset" | "delay_urge" | "start_lock" | "notify_partner" | "open_sos";

export interface UrgeInferenceResult {
  hasSignals: boolean;
  trigger?: UrgeTrigger;
  confidence: number;
  suggestedIntensity: UrgeIntensity;
  riskLevel: UrgeRiskLevel;
  reasons: string[];
  matchedSignalCount: number;
  matchedSignals: string[];
  librarySignalCount: number;
  recommendedActions: ProactiveAction[];
}

type TriggerSignalMap = Record<Exclude<UrgeTrigger, "unknown">, string[]>;

const TRIGGER_SIGNALS: TriggerSignalMap = {
  emotional: [
    "stress",
    "stres",
    "anxiety",
    "kaygi",
    "panic",
    "panik",
    "sad",
    "uzgun",
    "down",
    "yalniz",
    "alone",
    "bored",
    "sikildim",
    "angry",
    "sinirli",
    "guilty",
    "utanc",
    "shame",
    "hopeless",
    "umutsuz",
    "numb",
    "bosluk",
    "frustrated",
    "bunaldim",
    "restless",
    "huzursuz",
    "triggered",
    "tetiklendi",
    "overwhelmed",
    "kotu hissediyorum",
    "emotionally tired",
    "duygusal yorgun",
    "lonely night",
    "kalbim daraliyor",
    "inner pain",
    "ic acisi",
  ],
  environmental: [
    "casino",
    "slot",
    "bet",
    "bahis",
    "odds",
    "freebet",
    "bonus",
    "jackpot",
    "reklam",
    "ad pop up",
    "notification",
    "bildirim",
    "in app browser",
    "gece",
    "night",
    "late night",
    "internet cafe",
    "coffee shop wifi",
    "vpn off",
    "old account",
    "telegram channel",
    "discord tip",
    "stream",
    "match day",
    "derby",
    "sports score",
    "odds changed",
    "promotion mail",
    "sms offer",
    "payment shortcut",
    "bank app open",
    "saved card",
    "one click pay",
    "work break",
  ],
  cognitive: [
    "just one",
    "son bir",
    "i can control",
    "kontrol bende",
    "recover losses",
    "zarari geri al",
    "today is my day",
    "lucky",
    "sansim dondu",
    "strategy",
    "sistem buldum",
    "guaranteed",
    "kesin kazanirim",
    "quick money",
    "hizli para",
    "borrow and win",
    "odunc al geri koy",
    "mind loop",
    "takinti",
    "obsessive thought",
    "flashback",
    "memory",
    "hatira",
    "fantasy win",
    "buy back time",
    "kendimi kanitlayacagim",
    "deserve reward",
    "hak ettim",
    "escape reality",
    "gerceklikten kacis",
    "no one will know",
    "kimse bilmez",
    "only tonight",
    "bu gece son",
  ],
  physical: [
    "heart racing",
    "kalp carpintisi",
    "shaking",
    "titreme",
    "sweaty",
    "terleme",
    "tension",
    "gerginlik",
    "headache",
    "agri",
    "stomach knot",
    "mide dugum",
    "insomnia",
    "uykusuz",
    "fatigue",
    "yorgunluk",
    "no appetite",
    "istahsizlik",
    "chest pressure",
    "gogus sikismasi",
    "short breath",
    "nefes dar",
    "jaw tight",
    "kas gerginligi",
    "rush",
    "adrenaline",
    "body heat",
    "ates basmasi",
    "restless body",
    "ellerim titriyor",
    "cold sweat",
  ],
  social: [
    "friend invited",
    "arkadas cagirdi",
    "partner conflict",
    "esimle kavga",
    "family stress",
    "aile baskisi",
    "peer pressure",
    "grup baskisi",
    "isolation",
    "yalnizlik",
    "weekend plan",
    "mahalle ortam",
    "pub night",
    "bar night",
    "watch party",
    "group chat",
    "kotu etki",
    "toxic friend",
    "social media flex",
    "success stories",
    "others winning",
    "baskasi kazandi",
    "shame after relapse",
    "gizlemek zor",
    "cant ask help",
    "destek isteyemiyorum",
    "relationship tension",
    "evde tartisma",
    "alone at home",
    "bos ev",
    "partner unavailable",
  ],
  financial: [
    "debt",
    "borc",
    "credit card",
    "kredi karti",
    "loan",
    "kredi",
    "bill due",
    "fatura",
    "rent",
    "kira",
    "salary day",
    "maas gunu",
    "cash advance",
    "nakit avans",
    "late payment",
    "gecikme faizi",
    "overdraft",
    "eksi bakiye",
    "payment stress",
    "odeme baskisi",
    "money panic",
    "para panigi",
    "loss chasing",
    "zarar kovalamak",
    "i need money now",
    "simdi para lazim",
    "sell item",
    "esya sat",
    "hidden spend",
    "gizli harcama",
    "empty account",
    "hesap bos",
    "borrow from friend",
  ],
};

const HIGH_INTENSITY_SIGNALS = [
  "cant stop",
  "can't stop",
  "dayanamiyorum",
  "kontrol edemiyorum",
  "right now",
  "simdi oyna",
  "urge is huge",
  "cok guclu",
  "panic",
  "overwhelmed",
  "all in",
  "hepsini bas",
];

const MEDIUM_INTENSITY_SIGNALS = [
  "hard moment",
  "zor",
  "triggered",
  "tetiklendi",
  "restless",
  "huzursuz",
  "thinking about gambling",
  "oynamayi dusunuyorum",
  "itch",
  "istek",
  "urge rising",
  "durtu artiyor",
];

const CRITICAL_SIGNALS = [
  "i will relapse now",
  "simdi relapse",
  "krizdeyim",
  "i am in crisis",
  "harm myself",
  "kendime zarar",
  "suicide",
  "intihar",
  "everything is over",
  "artik dayanamam",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSignals(signals: string[]): string[] {
  const unique = new Set<string>();
  for (const signal of signals) {
    const normalized = normalizeText(signal);
    if (!normalized) continue;
    unique.add(normalized);
  }
  return Array.from(unique);
}

const NORMALIZED_TRIGGER_SIGNALS: TriggerSignalMap = {
  emotional: normalizeSignals(TRIGGER_SIGNALS.emotional),
  environmental: normalizeSignals(TRIGGER_SIGNALS.environmental),
  cognitive: normalizeSignals(TRIGGER_SIGNALS.cognitive),
  physical: normalizeSignals(TRIGGER_SIGNALS.physical),
  social: normalizeSignals(TRIGGER_SIGNALS.social),
  financial: normalizeSignals(TRIGGER_SIGNALS.financial),
};

const NORMALIZED_MEDIUM_SIGNALS = normalizeSignals(MEDIUM_INTENSITY_SIGNALS);
const NORMALIZED_HIGH_SIGNALS = normalizeSignals(HIGH_INTENSITY_SIGNALS);
const NORMALIZED_CRITICAL_SIGNALS = normalizeSignals(CRITICAL_SIGNALS);

function computeSignalLibrarySize(): number {
  const allSignals = new Set<string>();
  (Object.keys(NORMALIZED_TRIGGER_SIGNALS) as (keyof TriggerSignalMap)[]).forEach((trigger) => {
    NORMALIZED_TRIGGER_SIGNALS[trigger].forEach((signal) => allSignals.add(signal));
  });
  NORMALIZED_MEDIUM_SIGNALS.forEach((signal) => allSignals.add(signal));
  NORMALIZED_HIGH_SIGNALS.forEach((signal) => allSignals.add(signal));
  NORMALIZED_CRITICAL_SIGNALS.forEach((signal) => allSignals.add(signal));
  return allSignals.size;
}

export const URGE_TRIGGER_LIBRARY_SIZE = computeSignalLibrarySize();

function countSignalMatches(text: string, signals: string[]): { score: number; matches: string[] } {
  const matches: string[] = [];
  let score = 0;

  signals.forEach((signal) => {
    if (text.includes(signal)) {
      matches.push(signal);
      score += signal.includes(" ") ? 1.35 : 1;
    }
  });

  return { score, matches };
}

function toIntensity(value: number): UrgeIntensity {
  const rounded = Math.round(value);
  if (rounded < 1) return 1;
  if (rounded > 10) return 10;
  return rounded as UrgeIntensity;
}

function riskFromIntensity(intensity: UrgeIntensity): UrgeRiskLevel {
  if (intensity >= 9) return "critical";
  if (intensity >= 7) return "high";
  if (intensity >= 5) return "medium";
  return "low";
}

function recommendActions(riskLevel: UrgeRiskLevel): ProactiveAction[] {
  if (riskLevel === "critical") {
    return ["open_sos", "notify_partner", "start_lock"];
  }
  if (riskLevel === "high") {
    return ["start_lock", "notify_partner", "delay_urge"];
  }
  if (riskLevel === "medium") {
    return ["delay_urge", "breathing_reset"];
  }
  return ["breathing_reset"];
}

export function inferUrgeFromContext(context: string): UrgeInferenceResult {
  const normalized = normalizeText(context ?? "");
  if (!normalized) {
    return {
      hasSignals: false,
      confidence: 0,
      suggestedIntensity: 4,
      riskLevel: "low",
      reasons: [],
      matchedSignalCount: 0,
      matchedSignals: [],
      librarySignalCount: URGE_TRIGGER_LIBRARY_SIZE,
      recommendedActions: recommendActions("low"),
    };
  }

  const triggerScores = new Map<UrgeTrigger, number>();
  const triggerReasons = new Map<UrgeTrigger, string[]>();
  const matchedSignals = new Set<string>();

  (Object.keys(NORMALIZED_TRIGGER_SIGNALS) as (keyof TriggerSignalMap)[]).forEach((trigger) => {
    const { score, matches } = countSignalMatches(normalized, NORMALIZED_TRIGGER_SIGNALS[trigger]);
    if (score <= 0) return;
    triggerScores.set(trigger, score);
    triggerReasons.set(trigger, matches);
    matches.forEach((match) => matchedSignals.add(match));
  });

  const sortedTriggers = Array.from(triggerScores.entries()).sort((a, b) => b[1] - a[1]);
  const topTrigger = sortedTriggers[0];
  const secondTriggerScore = sortedTriggers[1]?.[1] ?? 0;
  const trigger = topTrigger?.[0];

  const baseConfidenceRaw = topTrigger ? topTrigger[1] / Math.max(1.5, topTrigger[1] + secondTriggerScore) : 0;
  const confidence = Number(
    Math.min(0.98, Math.max(0, baseConfidenceRaw + (topTrigger ? Math.min(0.32, topTrigger[1] * 0.055) : 0))).toFixed(2)
  );

  const highSignals = countSignalMatches(normalized, NORMALIZED_HIGH_SIGNALS);
  const mediumSignals = countSignalMatches(normalized, NORMALIZED_MEDIUM_SIGNALS);
  const criticalSignals = countSignalMatches(normalized, NORMALIZED_CRITICAL_SIGNALS);

  highSignals.matches.forEach((match) => matchedSignals.add(match));
  mediumSignals.matches.forEach((match) => matchedSignals.add(match));
  criticalSignals.matches.forEach((match) => matchedSignals.add(match));

  let intensityScore = 4 + mediumSignals.score * 0.8 + highSignals.score * 1.5;
  if (topTrigger) {
    intensityScore += Math.min(2.4, topTrigger[1] * 0.58);
  }
  if (topTrigger && topTrigger[1] >= 3) {
    intensityScore += 0.4;
  }
  if (normalized.length >= 180) {
    intensityScore += 0.45;
  }
  if (criticalSignals.score > 0) {
    intensityScore = Math.max(intensityScore, 9.3);
  }

  const suggestedIntensity = toIntensity(intensityScore);
  const inferredRiskLevel = criticalSignals.score > 0 ? "critical" : riskFromIntensity(suggestedIntensity);
  const reasons = [
    ...(trigger ? (triggerReasons.get(trigger) ?? []).slice(0, 2) : []),
    ...highSignals.matches.slice(0, 2),
    ...criticalSignals.matches.slice(0, 2),
  ].slice(0, 4);

  const hasSignals =
    Boolean(trigger) || highSignals.score > 0 || mediumSignals.score > 0 || criticalSignals.score > 0;

  return {
    hasSignals,
    trigger,
    confidence,
    suggestedIntensity,
    riskLevel: inferredRiskLevel,
    reasons,
    matchedSignalCount: matchedSignals.size,
    matchedSignals: Array.from(matchedSignals).slice(0, 10),
    librarySignalCount: URGE_TRIGGER_LIBRARY_SIZE,
    recommendedActions: recommendActions(inferredRiskLevel),
  };
}
