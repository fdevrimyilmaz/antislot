import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScenarioId = "education" | "security" | "health" | "relationships";
type WeekdayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type RiskWindowId = "morning" | "afternoon" | "evening" | "night";
type TriggerIntensity = 1 | 2 | 3;
type AllocationMap = Record<ScenarioId, number>;
type ChecklistMap = Record<string, boolean>;
type WeeklyPlanMap = Record<WeekdayId, boolean>;
type TriggerEntry = {
  id: string;
  label: string;
  intensity: TriggerIntensity;
  createdAt: number;
  resolved: boolean;
  action: string;
};

type Scenario = {
  id: ScenarioId;
  tag: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  planTr: string[];
  planEn: string[];
  impactWeight: number;
};

type StoredAlternativeLifeState = {
  budget?: number;
  months?: number;
  selectedScenarioId?: ScenarioId;
  allocations?: Partial<Record<ScenarioId, number>>;
  checklist?: ChecklistMap;
  commitmentStartAt?: number | null;
  motivationNote?: string;
  weeklyPlan?: Partial<Record<WeekdayId, boolean>>;
  riskWindow?: RiskWindowId;
  checkInCount?: number;
  lastCheckInAt?: number | null;
  triggerDraft?: string;
  triggerIntensity?: number;
  triggerLogs?: TriggerEntry[];
  counterMoveCount?: number;
  lastCounterMoveAt?: number | null;
  lastCounterMoveLabel?: string;
};

const STORAGE_KEY = "@antislot/alternative-life/v3";
const MIN_BUDGET = 10000;
const MAX_BUDGET = 3000000;
const BUDGET_STEP = 5000;
const MIN_MONTHS = 3;
const MAX_MONTHS = 24;
const DAY_MS = 24 * 60 * 60 * 1000;
const CHECKIN_COOLDOWN_MS = 8 * 60 * 60 * 1000;
const MAX_TRIGGER_LOGS = 24;

const SCENARIOS: Scenario[] = [
  {
    id: "education",
    tag: "LEARN",
    titleTr: "Egitim ve sertifika",
    titleEn: "Education and certifications",
    descTr: "Gelir potansiyelini arttiran beceriye yatirim.",
    descEn: "Investment into skills that improve earning potential.",
    planTr: ["Bootcamp veya mesleki kurs", "Yabanci dil + sinav", "Mentorluk ve proje portfoyu"],
    planEn: ["Bootcamp or vocational training", "Language path + exam", "Mentoring and portfolio projects"],
    impactWeight: 1.4,
  },
  {
    id: "security",
    tag: "SAFE",
    titleTr: "Finansal guvenlik plani",
    titleEn: "Financial safety plan",
    descTr: "Acil fon, borc azaltma ve duzenli birikim odagi.",
    descEn: "Emergency fund, debt reduction, and steady savings focus.",
    planTr: ["3-6 aylik acil fon hedefi", "Yuksek faizli borc temizligi", "Aylik otomatik birikim"],
    planEn: ["3-6 month emergency fund", "High-interest debt cleanup", "Monthly auto-saving setup"],
    impactWeight: 1.7,
  },
  {
    id: "health",
    tag: "HEALTH",
    titleTr: "Saglik ve rutin",
    titleEn: "Health and routine",
    descTr: "Uyku, hareket ve terapi ile stabil gunluk ritim.",
    descEn: "Stable daily rhythm through sleep, movement, and therapy.",
    planTr: ["Uyku duzeni protokolu", "Haftalik egzersiz takvimi", "Destekleyici terapi gorusmesi"],
    planEn: ["Sleep schedule protocol", "Weekly exercise calendar", "Supportive therapy sessions"],
    impactWeight: 1.2,
  },
  {
    id: "relationships",
    tag: "RELATE",
    titleTr: "Iliski ve deneyim",
    titleEn: "Relationships and experiences",
    descTr: "Baglari guclendiren, kalici motivasyon olusturan deneyimler.",
    descEn: "Experiences that strengthen bonds and long-term motivation.",
    planTr: ["Aile/arkadas ile planli zaman", "Aylik mini kacamak", "Ortak hobi rutini"],
    planEn: ["Scheduled time with family/friends", "Monthly mini-break", "Shared hobby routine"],
    impactWeight: 1.1,
  },
];

const SCENARIO_IDS: ScenarioId[] = ["education", "security", "health", "relationships"];
const WEEKDAY_IDS: WeekdayId[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT_BUDGET = 100000;
const DEFAULT_MONTHS = 12;
const DEFAULT_ALLOCATIONS: AllocationMap = {
  education: 30,
  security: 35,
  health: 20,
  relationships: 15,
};
const DEFAULT_WEEKLY_PLAN: WeeklyPlanMap = {
  mon: true,
  tue: true,
  wed: true,
  thu: false,
  fri: true,
  sat: false,
  sun: true,
};
const DEFAULT_RISK_WINDOW: RiskWindowId = "night";

const isScenarioId = (value: unknown): value is ScenarioId =>
  typeof value === "string" && SCENARIO_IDS.includes(value as ScenarioId);

const clampBudget = (value: number) => Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, Math.round(value)));
const clampMonths = (value: number) => Math.max(MIN_MONTHS, Math.min(MAX_MONTHS, Math.round(value)));
const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

const normalizeAllocations = (source?: Partial<Record<ScenarioId, number>>): AllocationMap => {
  const draft: AllocationMap = {
    education: source?.education ?? DEFAULT_ALLOCATIONS.education,
    security: source?.security ?? DEFAULT_ALLOCATIONS.security,
    health: source?.health ?? DEFAULT_ALLOCATIONS.health,
    relationships: source?.relationships ?? DEFAULT_ALLOCATIONS.relationships,
  };

  for (const id of SCENARIO_IDS) {
    const value = Number(draft[id]);
    draft[id] = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  }

  const total = SCENARIO_IDS.reduce((sum, id) => sum + draft[id], 0);
  if (total <= 100) return draft;

  const adjusted: AllocationMap = { education: 0, security: 0, health: 0, relationships: 0 };
  let remaining = 100;
  SCENARIO_IDS.forEach((id, index) => {
    if (index === SCENARIO_IDS.length - 1) {
      adjusted[id] = remaining;
      return;
    }
    const proportional = Math.floor((draft[id] / total) * 100);
    adjusted[id] = Math.max(0, Math.min(remaining, proportional));
    remaining -= adjusted[id];
  });

  return adjusted;
};

const normalizeWeeklyPlan = (source?: Partial<Record<WeekdayId, boolean>>): WeeklyPlanMap => ({
  mon: typeof source?.mon === "boolean" ? source.mon : DEFAULT_WEEKLY_PLAN.mon,
  tue: typeof source?.tue === "boolean" ? source.tue : DEFAULT_WEEKLY_PLAN.tue,
  wed: typeof source?.wed === "boolean" ? source.wed : DEFAULT_WEEKLY_PLAN.wed,
  thu: typeof source?.thu === "boolean" ? source.thu : DEFAULT_WEEKLY_PLAN.thu,
  fri: typeof source?.fri === "boolean" ? source.fri : DEFAULT_WEEKLY_PLAN.fri,
  sat: typeof source?.sat === "boolean" ? source.sat : DEFAULT_WEEKLY_PLAN.sat,
  sun: typeof source?.sun === "boolean" ? source.sun : DEFAULT_WEEKLY_PLAN.sun,
});

const clampTriggerIntensity = (value: number): TriggerIntensity => {
  if (value >= 3) return 3;
  if (value <= 1) return 1;
  return 2;
};

const normalizeTriggerLogs = (source?: unknown): TriggerEntry[] => {
  if (!Array.isArray(source)) return [];

  const normalized = source
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Partial<TriggerEntry>;
      const label = typeof candidate.label === "string" ? candidate.label.trim().slice(0, 80) : "";
      if (!label) return null;

      const createdAt =
        typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt) && candidate.createdAt > 0
          ? Math.trunc(candidate.createdAt)
          : Date.now() - index * 1000;
      const id =
        typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id.trim().slice(0, 40)
          : `${createdAt}-${index}`;
      const intensity = clampTriggerIntensity(Number(candidate.intensity ?? 2));
      const resolved = Boolean(candidate.resolved);
      const action = typeof candidate.action === "string" ? candidate.action.trim().slice(0, 120) : "";

      return {
        id,
        label,
        intensity,
        createdAt,
        resolved,
        action,
      } satisfies TriggerEntry;
    })
    .filter((entry): entry is TriggerEntry => Boolean(entry));

  return normalized.slice(0, MAX_TRIGGER_LOGS);
};

export default function AlternativeLifeScreen() {
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";

  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [budgetInput, setBudgetInput] = useState(String(DEFAULT_BUDGET));
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>("security");
  const [allocations, setAllocations] = useState<AllocationMap>(DEFAULT_ALLOCATIONS);
  const [checklist, setChecklist] = useState<ChecklistMap>({});
  const [commitmentStartAt, setCommitmentStartAt] = useState<number | null>(null);
  const [motivationNote, setMotivationNote] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanMap>(DEFAULT_WEEKLY_PLAN);
  const [riskWindow, setRiskWindow] = useState<RiskWindowId>(DEFAULT_RISK_WINDOW);
  const [checkInCount, setCheckInCount] = useState(0);
  const [lastCheckInAt, setLastCheckInAt] = useState<number | null>(null);
  const [triggerDraft, setTriggerDraft] = useState("");
  const [triggerIntensity, setTriggerIntensity] = useState<TriggerIntensity>(2);
  const [triggerLogs, setTriggerLogs] = useState<TriggerEntry[]>([]);
  const [counterMoveCount, setCounterMoveCount] = useState(0);
  const [lastCounterMoveAt, setLastCounterMoveAt] = useState<number | null>(null);
  const [lastCounterMoveLabel, setLastCounterMoveLabel] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !mounted) return;

        const parsed = JSON.parse(raw) as StoredAlternativeLifeState;
        const restoredBudget = clampBudget(typeof parsed.budget === "number" ? parsed.budget : DEFAULT_BUDGET);
        const restoredMonths = clampMonths(typeof parsed.months === "number" ? parsed.months : DEFAULT_MONTHS);
        const restoredScenario = isScenarioId(parsed.selectedScenarioId) ? parsed.selectedScenarioId : "security";

        setBudget(restoredBudget);
        setBudgetInput(String(restoredBudget));
        setMonths(restoredMonths);
        setSelectedScenarioId(restoredScenario);
        setAllocations(normalizeAllocations(parsed.allocations));
        setWeeklyPlan(normalizeWeeklyPlan(parsed.weeklyPlan));

        if (typeof parsed.motivationNote === "string") {
          setMotivationNote(parsed.motivationNote.slice(0, 180));
        }
        if (
          parsed.riskWindow === "morning" ||
          parsed.riskWindow === "afternoon" ||
          parsed.riskWindow === "evening" ||
          parsed.riskWindow === "night"
        ) {
          setRiskWindow(parsed.riskWindow);
        }
        if (typeof parsed.checkInCount === "number" && Number.isFinite(parsed.checkInCount) && parsed.checkInCount >= 0) {
          setCheckInCount(Math.floor(parsed.checkInCount));
        }
        setTriggerLogs(normalizeTriggerLogs(parsed.triggerLogs));
        if (typeof parsed.triggerDraft === "string") {
          setTriggerDraft(parsed.triggerDraft.slice(0, 80));
        }
        if (typeof parsed.triggerIntensity === "number" && Number.isFinite(parsed.triggerIntensity)) {
          setTriggerIntensity(clampTriggerIntensity(parsed.triggerIntensity));
        }
        if (
          typeof parsed.counterMoveCount === "number" &&
          Number.isFinite(parsed.counterMoveCount) &&
          parsed.counterMoveCount >= 0
        ) {
          setCounterMoveCount(Math.floor(parsed.counterMoveCount));
        }
        if (typeof parsed.lastCounterMoveLabel === "string") {
          setLastCounterMoveLabel(parsed.lastCounterMoveLabel.slice(0, 80));
        }

        if (parsed.checklist && typeof parsed.checklist === "object") {
          setChecklist(parsed.checklist);
        }

        if (
          parsed.commitmentStartAt === null ||
          (typeof parsed.commitmentStartAt === "number" && Number.isFinite(parsed.commitmentStartAt))
        ) {
          setCommitmentStartAt(parsed.commitmentStartAt ?? null);
        }
        if (
          parsed.lastCheckInAt === null ||
          (typeof parsed.lastCheckInAt === "number" && Number.isFinite(parsed.lastCheckInAt))
        ) {
          setLastCheckInAt(parsed.lastCheckInAt ?? null);
        }
        if (
          parsed.lastCounterMoveAt === null ||
          (typeof parsed.lastCounterMoveAt === "number" && Number.isFinite(parsed.lastCounterMoveAt))
        ) {
          setLastCounterMoveAt(parsed.lastCounterMoveAt ?? null);
        }
      } catch {
        if (mounted) {
          setSyncError(isTr ? "Plan verisi yuklenemedi." : "Plan data could not be loaded.");
        }
      } finally {
        if (mounted) setHydrated(true);
      }
    };

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [isTr]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const persist = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            budget,
            months,
            selectedScenarioId,
            allocations,
            checklist,
            commitmentStartAt,
            motivationNote,
            weeklyPlan,
            riskWindow,
            checkInCount,
            lastCheckInAt,
            triggerDraft,
            triggerIntensity,
            triggerLogs,
            counterMoveCount,
            lastCounterMoveAt,
            lastCounterMoveLabel,
          } satisfies StoredAlternativeLifeState)
        );
        if (!cancelled) setSyncError(null);
      } catch {
        if (!cancelled) {
          setSyncError(isTr ? "Plan kaydedilemedi." : "Plan could not be saved.");
        }
      }
    };

    void persist();
    return () => {
      cancelled = true;
    };
  }, [
    allocations,
    budget,
    checklist,
    commitmentStartAt,
    hydrated,
    isTr,
    months,
    selectedScenarioId,
    motivationNote,
    weeklyPlan,
    riskWindow,
    checkInCount,
    lastCheckInAt,
    triggerDraft,
    triggerIntensity,
    triggerLogs,
    counterMoveCount,
    lastCounterMoveAt,
    lastCounterMoveLabel,
  ]);

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const formatMoney = (value: number) => moneyFormatter.format(Math.max(0, Math.round(value)));
  const formatDateTime = (value: number) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);

  const totalAllocationPercent = SCENARIO_IDS.reduce((sum, id) => sum + allocations[id], 0);
  const remainingAllocationPercent = Math.max(0, 100 - totalAllocationPercent);
  const allocatedAmount = Math.round((budget * totalAllocationPercent) / 100);
  const unallocatedAmount = Math.max(0, budget - allocatedAmount);
  const monthlyActionAmount = Math.round(allocatedAmount / months);
  const safetyBuffer = Math.max(unallocatedAmount, Math.round(budget * 0.15));

  const scenarioRows = useMemo(
    () =>
      SCENARIOS.map((scenario) => {
        const percent = allocations[scenario.id];
        const amount = Math.round((budget * percent) / 100);
        const impact = Math.round((amount / 10000) * scenario.impactWeight * 10) / 10;
        return {
          ...scenario,
          percent,
          amount,
          impact,
        };
      }),
    [allocations, budget]
  );

  const rankedScenarios = useMemo(() => [...scenarioRows].sort((a, b) => b.impact - a.impact), [scenarioRows]);

  const recommendedScenarioId = (rankedScenarios[0]?.id ?? "security") as ScenarioId;
  const primaryScenarioId = (allocations[selectedScenarioId] > 0 ? selectedScenarioId : recommendedScenarioId) as ScenarioId;
  const primaryScenario = SCENARIOS.find((scenario) => scenario.id === primaryScenarioId) ?? SCENARIOS[0];
  const primaryPlan = isTr ? primaryScenario.planTr : primaryScenario.planEn;
  const completedTasks = primaryPlan.reduce(
    (count, _item, index) => count + (checklist[`${primaryScenario.id}:${index}`] ? 1 : 0),
    0
  );
  const completionRatio = primaryPlan.length > 0 ? completedTasks / primaryPlan.length : 0;
  const recoveryScore = Math.round(rankedScenarios.reduce((sum, row) => sum + row.impact, 0));
  const activeWeeklyDays = WEEKDAY_IDS.reduce((count, id) => count + (weeklyPlan[id] ? 1 : 0), 0);
  const weeklyCoverageRatio = activeWeeklyDays / WEEKDAY_IDS.length;
  const disciplineScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completionRatio * 45 +
          weeklyCoverageRatio * 25 +
          (commitmentStartAt ? 20 : 0) +
          (motivationNote.trim().length >= 24 ? 10 : 0)
      )
    )
  );
  const checkInReady = !lastCheckInAt || Date.now() - lastCheckInAt >= CHECKIN_COOLDOWN_MS;
  const checkInRemainingHours = checkInReady
    ? 0
    : Math.max(1, Math.ceil((CHECKIN_COOLDOWN_MS - (Date.now() - (lastCheckInAt ?? 0))) / (60 * 60 * 1000)));

  const weekDayLabels = useMemo(
    () =>
      isTr
        ? {
            mon: "Pzt",
            tue: "Sali",
            wed: "Cars",
            thu: "Pers",
            fri: "Cuma",
            sat: "Ctesi",
            sun: "Pazar",
          }
        : {
            mon: "Mon",
            tue: "Tue",
            wed: "Wed",
            thu: "Thu",
            fri: "Fri",
            sat: "Sat",
            sun: "Sun",
          },
    [isTr]
  );

  const riskWindowOptions = useMemo(
    () =>
      isTr
        ? [
            { id: "morning" as const, label: "Sabah", action: "15 dk yuruyus + su + gun plani" },
            { id: "afternoon" as const, label: "Oglen", action: "Telefonu 20 dk uzaklastir, mini gorev tamamla" },
            { id: "evening" as const, label: "Aksam", action: "Aile/arkadas temasi + disarida kisa tur" },
            { id: "night" as const, label: "Gece", action: "Ekran kapat + riskli app engeli + nefes rutini" },
          ]
        : [
            { id: "morning" as const, label: "Morning", action: "15m walk + water + plan the day" },
            { id: "afternoon" as const, label: "Afternoon", action: "20m phone distance and finish one mini task" },
            { id: "evening" as const, label: "Evening", action: "Family/friend contact and short outdoor walk" },
            { id: "night" as const, label: "Night", action: "Screen off + app block + breathing routine" },
          ],
    [isTr]
  );

  const selectedRiskWindow = riskWindowOptions.find((option) => option.id === riskWindow) ?? riskWindowOptions[3];
  const unresolvedTriggerCount = triggerLogs.filter((entry) => !entry.resolved).length;
  const avgTriggerIntensity = triggerLogs.length
    ? Math.round((triggerLogs.reduce((sum, entry) => sum + entry.intensity, 0) / triggerLogs.length) * 10) / 10
    : 0;
  const triggerPressureScore = Math.max(
    0,
    Math.min(100, Math.round(unresolvedTriggerCount * 12 + avgTriggerIntensity * 16 + (riskWindow === "night" ? 14 : 6)))
  );
  const lastCounterMoveLabelText =
    lastCounterMoveLabel.trim().length > 0
      ? lastCounterMoveLabel.trim()
      : isTr
        ? "Genel tetiklenme"
        : "General trigger";

  const quickTriggerOptions = useMemo(
    () =>
      isTr
        ? ["Yalnizlik", "Can sikintisi", "Borc baskisi", "Sosyal medya reklami", "Gece uyuyamama"]
        : ["Loneliness", "Boredom", "Debt pressure", "Social ad trigger", "Sleepless night"],
    [isTr]
  );

  const getIntensityLabel = (level: TriggerIntensity) => {
    if (isTr) {
      if (level === 1) return "Dusuk";
      if (level === 2) return "Orta";
      return "Yuksek";
    }
    if (level === 1) return "Low";
    if (level === 2) return "Medium";
    return "High";
  };

  const counterMoveSteps = useMemo(() => {
    const motivationAnchor =
      motivationNote.trim().length > 0
        ? motivationNote.trim().slice(0, 70)
        : isTr
          ? "Kumarsiz guvenli hayati seciyorum."
          : "I choose a stable no-gambling life.";

    const scenarioAction =
      primaryScenario.id === "security"
        ? isTr
          ? "Banka/butce uygulamasinda 1 mini birikim transferi yap."
          : "Make one mini savings transfer in your banking/budget app."
        : primaryScenario.id === "education"
          ? isTr
            ? "10 dakikalik beceri calismasi baslat."
            : "Start a focused 10-minute skill session."
          : primaryScenario.id === "health"
            ? isTr
              ? "3 dakikalik nefes + 20 squat yap."
              : "Do 3 minutes of breathing plus 20 squats."
            : isTr
              ? "Bir yakinina kisa bir mesaj at."
              : "Send a short message to someone close.";

    return isTr
      ? [
          "90 saniye kurali: ertele, ayaga kalk, ortam degistir.",
          selectedRiskWindow.action,
          scenarioAction,
          `Hatirlatma: ${motivationAnchor}`,
        ]
      : [
          "90-second rule: delay, stand up, change your environment.",
          selectedRiskWindow.action,
          scenarioAction,
          `Anchor: ${motivationAnchor}`,
        ];
  }, [isTr, motivationNote, primaryScenario.id, selectedRiskWindow.action]);

  const lifeShiftSprints = useMemo(() => {
    const highPressure = triggerPressureScore >= 60;
    const money = (value: number) => moneyFormatter.format(Math.max(0, Math.round(value)));

    return isTr
      ? [
          {
            id: "sprint-48h",
            horizon: "48 Saat",
            title: highPressure ? "Kriz baskisini dusur" : "Dalgayi erken kes",
            steps: [
              selectedRiskWindow.action,
              highPressure
                ? "Riskli app/site erisimini 24 saatlik sert kilide al."
                : "Tetikleyici saatte telefonu diger odada tut ve mini gorev tamamla.",
              "Her gun 1 kez 90 saniye + nefes protokolunu uygula.",
            ],
          },
          {
            id: "sprint-7d",
            horizon: "7 Gun",
            title: "Momentum haftasi",
            steps: [
              `${isTr ? "Birincil alan" : "Primary area"}: ${primaryScenario.titleTr}`,
              `Gunluk mini aksiyon butcesi: ${money(Math.max(0, Math.round(monthlyActionAmount / 30)))}`,
              activeWeeklyDays >= 5
                ? "Aktif ritmi koru, bos gunlerde tek sosyal temas gorevi ekle."
                : "Haftalik aktif gunu en az 5'e tamamla.",
            ],
          },
          {
            id: "sprint-30d",
            horizon: "30 Gun",
            title: "Kimlik guclendirme",
            steps: [
              `Guvenlik tamponu hedefi: ${money(safetyBuffer)}`,
              "Ay sonunda nuks tetikleyici listesini sadele ve ilk 3 tetikleyiciyi protokole bagla.",
              "Kumarsiz benlik cumleni guncelle ve haftalik rapora ekle.",
            ],
          },
        ]
      : [
          {
            id: "sprint-48h",
            horizon: "48 Hours",
            title: highPressure ? "Reduce crisis pressure" : "Cut the wave early",
            steps: [
              selectedRiskWindow.action,
              highPressure
                ? "Use a strict 24-hour lock on risky apps/sites."
                : "Keep your phone in another room during trigger windows and complete one mini task.",
              "Run your 90-second + breathing protocol at least once daily.",
            ],
          },
          {
            id: "sprint-7d",
            horizon: "7 Days",
            title: "Momentum week",
            steps: [
              `Primary area: ${primaryScenario.titleEn}`,
              `Daily micro-action budget: ${money(Math.max(0, Math.round(monthlyActionAmount / 30)))}`,
              activeWeeklyDays >= 5
                ? "Keep rhythm; add one social contact task on lighter days."
                : "Raise active weekly days to at least 5.",
            ],
          },
          {
            id: "sprint-30d",
            horizon: "30 Days",
            title: "Identity reinforcement",
            steps: [
              `Safety buffer target: ${money(safetyBuffer)}`,
              "At month-end, reduce trigger list to top 3 and map each to a protocol step.",
              "Update your no-gambling identity sentence and add it to weekly review.",
            ],
          },
        ];
  }, [
    activeWeeklyDays,
    isTr,
    moneyFormatter,
    monthlyActionAmount,
    primaryScenario.titleEn,
    primaryScenario.titleTr,
    safetyBuffer,
    selectedRiskWindow.action,
    triggerPressureScore,
  ]);

  const roadmapMilestones = useMemo(() => {
    const stage1Months = Math.max(1, Math.round(months * 0.25));
    const stage2Months = Math.max(stage1Months + 1, Math.round(months * 0.6));
    const stage3Months = months;
    const stage1Target = Math.round(allocatedAmount * 0.3);
    const stage2Target = Math.round(allocatedAmount * 0.65);
    const stage3Target = allocatedAmount;

    return isTr
      ? [
          {
            id: "phase-1",
            title: "Faz 1: Zemini sabitle",
            period: `Ay 1-${stage1Months}`,
            target: stage1Target,
            actions: ["Riskli saatlerde otonom plan", "2 temel harcama disiplini", "Haftalik ritim aktivasyonu"],
          },
          {
            id: "phase-2",
            title: "Faz 2: Guvenli ivme",
            period: `Ay ${stage1Months + 1}-${stage2Months}`,
            target: stage2Target,
            actions: ["Borc azaltma veya birikim ivmesi", "En az 1 yeni beceri rutini", "Sosyal destek frekansi artisi"],
          },
          {
            id: "phase-3",
            title: "Faz 3: Kalici kimlik",
            period: `Ay ${stage2Months + 1}-${stage3Months}`,
            target: stage3Target,
            actions: ["Kumarsiz kimlik manifesto guncellemesi", "Aylik sonuc raporu", "Nuks onleme protokolu"],
          },
        ]
      : [
          {
            id: "phase-1",
            title: "Phase 1: Stabilize the base",
            period: `Month 1-${stage1Months}`,
            target: stage1Target,
            actions: ["Autopilot plan for risky hours", "Two core spending discipline rules", "Activate weekly rhythm"],
          },
          {
            id: "phase-2",
            title: "Phase 2: Safe momentum",
            period: `Month ${stage1Months + 1}-${stage2Months}`,
            target: stage2Target,
            actions: ["Debt reduction or savings acceleration", "At least one skill routine", "Higher support contact frequency"],
          },
          {
            id: "phase-3",
            title: "Phase 3: Durable identity",
            period: `Month ${stage2Months + 1}-${stage3Months}`,
            target: stage3Target,
            actions: ["Update no-gambling identity manifesto", "Monthly result review", "Relapse prevention protocol"],
          },
        ];
  }, [allocatedAmount, isTr, months]);

  const commitmentDays = commitmentStartAt
    ? Math.max(1, Math.floor((Date.now() - commitmentStartAt) / DAY_MS) + 1)
    : 0;
  const commitmentDate = commitmentStartAt
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(commitmentStartAt)
    : null;

  const plannerHint = useMemo(() => {
    if (remainingAllocationPercent > 0) {
      return isTr
        ? `Dagitimda %${remainingAllocationPercent} bos alan var. Boslugu hedefli alanlara yonlendir.`
        : `${remainingAllocationPercent}% remains unallocated. Route it to high-priority life areas.`;
    }
    if (months <= 6 && allocatedAmount > budget * 0.7) {
      return isTr
        ? "Plan agresif gorunuyor. Sureyi biraz uzatmak baskiyi azaltir."
        : "Plan looks aggressive. Extending the timeline can lower pressure.";
    }
    return isTr
      ? "Plan dengeli. Simdi en kritik adim: bu haftalik gorevleri tamamlamak."
      : "Plan is balanced. Next key move: complete this week tasks.";
  }, [allocatedAmount, budget, isTr, months, remainingAllocationPercent]);

  const setBudgetFromNumber = (value: number) => {
    const next = clampBudget(value);
    setBudget(next);
    setBudgetInput(String(next));
  };

  const handleBudgetBlur = () => {
    const parsed = Number(digitsOnly(budgetInput));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setBudgetInput(String(budget));
      return;
    }
    setBudgetFromNumber(parsed);
  };

  const adjustAllocation = (id: ScenarioId, delta: number) => {
    setAllocations((prev) => {
      const current = prev[id];
      const totalExceptCurrent = SCENARIO_IDS.reduce((sum, key) => (key === id ? sum : sum + prev[key]), 0);
      const maxAllowed = 100 - totalExceptCurrent;
      const nextValue = Math.max(0, Math.min(maxAllowed, current + delta));
      if (nextValue === current) return prev;
      return { ...prev, [id]: nextValue };
    });
  };

  const toggleTask = (scenarioId: ScenarioId, index: number) => {
    const key = `${scenarioId}:${index}`;
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleWeekday = (id: WeekdayId) => {
    setWeeklyPlan((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setMotivationTemplate = (value: string) => {
    setMotivationNote(value.slice(0, 180));
  };

  const runCheckIn = () => {
    if (!checkInReady) {
      Alert.alert(
        isTr ? "Check-in beklemede" : "Check-in cooling down",
        isTr
          ? `${checkInRemainingHours} saat sonra tekrar check-in yapabilirsin.`
          : `You can check in again in about ${checkInRemainingHours} hours.`
      );
      return;
    }
    setCheckInCount((prev) => prev + 1);
    setLastCheckInAt(Date.now());
  };

  const runInstantCounterMove = (label?: string) => {
    const sourceLabel = label && label.trim().length > 0 ? label.trim().slice(0, 80) : lastCounterMoveLabelText;
    setCounterMoveCount((prev) => prev + 1);
    setLastCounterMoveAt(Date.now());
    setLastCounterMoveLabel(sourceLabel);

    Alert.alert(
      isTr ? "Anlik karsi hamle baslatildi" : "Instant counter move started",
      `${isTr ? "Kaynak" : "Source"}: ${sourceLabel}\n1) ${counterMoveSteps[0]}\n2) ${counterMoveSteps[1]}\n3) ${counterMoveSteps[2]}\n4) ${counterMoveSteps[3]}`
    );
  };

  const addTriggerLog = () => {
    const label = triggerDraft.trim().slice(0, 80);
    if (!label) {
      Alert.alert(
        isTr ? "Tetikleyici bos" : "Trigger is empty",
        isTr ? "Lutfen tetikleyiciyi kisa bir cumle ile yaz." : "Please write the trigger in one short sentence."
      );
      return;
    }

    const createdAt = Date.now();
    const entry: TriggerEntry = {
      id: `${createdAt}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      intensity: triggerIntensity,
      createdAt,
      resolved: false,
      action: counterMoveSteps[1],
    };

    setTriggerLogs((prev) => [entry, ...prev].slice(0, MAX_TRIGGER_LOGS));
    setTriggerDraft("");
  };

  const toggleTriggerResolved = (id: string) => {
    setTriggerLogs((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, resolved: !entry.resolved } : entry))
    );
  };

  const removeTrigger = (id: string) => {
    setTriggerLogs((prev) => prev.filter((entry) => entry.id !== id));
  };

  const resetPlanner = () => {
    Alert.alert(
      isTr ? "Plani sifirla" : "Reset planner",
      isTr
        ? "Butce, dagitim ve gorev durumlari varsayilan hale donsun mu?"
        : "Reset budget, allocation, and task states to default values?",
      [
        { text: isTr ? "Vazgec" : "Cancel", style: "cancel" },
        {
          text: isTr ? "Sifirla" : "Reset",
          style: "destructive",
          onPress: () => {
            setBudget(DEFAULT_BUDGET);
            setBudgetInput(String(DEFAULT_BUDGET));
            setMonths(DEFAULT_MONTHS);
            setSelectedScenarioId("security");
            setAllocations(DEFAULT_ALLOCATIONS);
            setChecklist({});
            setCommitmentStartAt(null);
            setMotivationNote("");
            setWeeklyPlan(DEFAULT_WEEKLY_PLAN);
            setRiskWindow(DEFAULT_RISK_WINDOW);
            setCheckInCount(0);
            setLastCheckInAt(null);
            setTriggerDraft("");
            setTriggerIntensity(2);
            setTriggerLogs([]);
            setCounterMoveCount(0);
            setLastCounterMoveAt(null);
            setLastCounterMoveLabel("");
          },
        },
      ]
    );
  };

  const toggleCommitment = () => {
    if (commitmentStartAt) {
      Alert.alert(
        isTr ? "Kumarsiz mod kapansin mi?" : "Disable no-gambling mode?",
        isTr
          ? "Seri sayaci sifirlanir. Eminsen devam et."
          : "Your streak counter will reset. Continue only if you are sure.",
        [
          { text: isTr ? "Vazgec" : "Cancel", style: "cancel" },
          { text: isTr ? "Kapat" : "Disable", style: "destructive", onPress: () => setCommitmentStartAt(null) },
        ]
      );
      return;
    }

    setCommitmentStartAt(Date.now());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.alternativeLife.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.exploreModules.alternativeLife.subtitle}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu panel, risk yerine hayat yatirimi secerek guclu bir cikis plani kurman icin tasarlandi."
              : "This panel is built to help you choose life investments over risk and build a strong exit plan."}
          </Text>

          <View style={styles.heroStats}>
            <View style={[styles.heroPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.heroPillValue, { color: colors.text }]}>{formatMoney(budget)}</Text>
              <Text style={[styles.heroPillLabel, { color: colors.textSecondary }]}>{isTr ? "Toplam butce" : "Total budget"}</Text>
            </View>
            <View style={[styles.heroPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.heroPillValue, { color: colors.text }]}>{recoveryScore}</Text>
              <Text style={[styles.heroPillLabel, { color: colors.textSecondary }]}>{isTr ? "Toparlanma skoru" : "Recovery score"}</Text>
            </View>
            <View style={[styles.heroPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.heroPillValue, { color: colors.text }]}>{months}</Text>
              <Text style={[styles.heroPillLabel, { color: colors.textSecondary }]}>{isTr ? "Ay hedefi" : "Months"}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Plan kontrol merkezi" : "Plan control center"}</Text>

          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{isTr ? "Butce" : "Budget"}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setBudgetFromNumber(budget - BUDGET_STEP)}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
              </TouchableOpacity>
              <TextInput
                value={budgetInput}
                onChangeText={(value) => setBudgetInput(digitsOnly(value))}
                onBlur={handleBudgetBlur}
                keyboardType="number-pad"
                style={[styles.budgetInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setBudgetFromNumber(budget + BUDGET_STEP)}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickBudgetRow}>
            {[50000, 100000, 250000].map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.quickBudgetChip, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setBudgetFromNumber(value)}
              >
                <Text style={[styles.quickBudgetText, { color: colors.primary }]}>{formatMoney(value)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{isTr ? "Sure" : "Timeline"}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setMonths((prev) => clampMonths(prev - 1))}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
              </TouchableOpacity>
              <View style={[styles.monthsBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.monthsValue, { color: colors.text }]}>{months}</Text>
                <Text style={[styles.monthsLabel, { color: colors.textSecondary }]}>{isTr ? "ay" : "months"}</Text>
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setMonths((prev) => clampMonths(prev + 1))}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.plannerHint, { color: colors.textSecondary }]}>{plannerHint}</Text>
          {syncError ? <Text style={[styles.syncError, { color: colors.warning ?? colors.primary }]}>{syncError}</Text> : null}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Dagitim panosu" : "Allocation board"}</Text>
          {scenarioRows.map((scenario) => {
            const isPrimary = scenario.id === primaryScenario.id;
            return (
              <View key={scenario.id} style={[styles.scenarioCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={styles.scenarioHead}>
                  <View style={styles.scenarioHeadLeft}>
                    <View style={[styles.tag, { borderColor: colors.primary, backgroundColor: colors.card }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{scenario.tag}</Text>
                    </View>
                    <Text style={[styles.scenarioTitle, { color: colors.text }]}>
                      {isTr ? scenario.titleTr : scenario.titleEn}
                    </Text>
                  </View>
                  {isPrimary ? (
                    <View style={[styles.primaryBadge, { borderColor: colors.primary, backgroundColor: colors.card }]}>
                      <Text style={[styles.primaryBadgeText, { color: colors.primary }]}>{isTr ? "Birincil" : "Primary"}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.scenarioDesc, { color: colors.textSecondary }]}>
                  {isTr ? scenario.descTr : scenario.descEn}
                </Text>

                <View style={styles.metricRow}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    {isTr ? "Ayrilan" : "Allocated"}: {formatMoney(scenario.amount)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.primary }]}>
                    {isTr ? "Etki" : "Impact"}: {scenario.impact}
                  </Text>
                </View>

                <View style={styles.allocationControls}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => adjustAllocation(scenario.id, -5)}
                  >
                    <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>

                  <Text style={[styles.percentValue, { color: colors.text }]}>{scenario.percent}%</Text>

                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => adjustAllocation(scenario.id, 5)}
                  >
                    <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primarySelectBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => setSelectedScenarioId(scenario.id)}
                  >
                    <Text style={[styles.primarySelectText, { color: colors.primary }]}>
                      {isTr ? "Birincil sec" : "Set primary"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={[styles.summaryRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {isTr ? "Toplam dagitim" : "Total allocation"}: %{totalAllocationPercent}
            </Text>
            <Text style={[styles.summaryText, { color: colors.primary }]}>
              {isTr ? "Bos kalan" : "Unallocated"}: %{remainingAllocationPercent}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Finansal cikis metrikleri" : "Exit metrics"}</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>{isTr ? "Aylik odak" : "Monthly focus"}</Text>
              <Text style={[styles.metricPillValue, { color: colors.text }]}>{formatMoney(monthlyActionAmount)}</Text>
            </View>
            <View style={[styles.metricPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>{isTr ? "Guvenlik tamponu" : "Safety buffer"}</Text>
              <Text style={[styles.metricPillValue, { color: colors.text }]}>{formatMoney(safetyBuffer)}</Text>
            </View>
            <View style={[styles.metricPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>{isTr ? "Ayrilan butce" : "Allocated"}</Text>
              <Text style={[styles.metricPillValue, { color: colors.text }]}>{formatMoney(allocatedAmount)}</Text>
            </View>
            <View style={[styles.metricPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>{isTr ? "Serbest butce" : "Free amount"}</Text>
              <Text style={[styles.metricPillValue, { color: colors.text }]}>{formatMoney(unallocatedAmount)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Motivasyon cekirdegi" : "Motivation core"}</Text>
          <Text style={[styles.commitmentText, { color: colors.textSecondary }]}>
            {isTr
              ? "Kisa bir neden cumlesi yaz. Zor anda bu karti acman geri donusu engeller."
              : "Write one short reason. Opening this card in hard moments blocks fallback behavior."}
          </Text>
          <TextInput
            value={motivationNote}
            onChangeText={(text) => setMotivationNote(text.slice(0, 180))}
            multiline
            maxLength={180}
            placeholder={isTr ? "Ornek: Aileme guven vermek ve borcsuz yasamak icin..." : "Example: I choose a debt-free, stable life for my family..."}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.motivationInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <View style={styles.templateRow}>
            {(isTr
              ? [
                  "Ailem ve itibarim icin temiz bir sayfa aciyorum.",
                  "Parami riske degil gelecegime yonlendiriyorum.",
                  "Kisa haz yerine kalici guven secimi yapiyorum.",
                ]
              : [
                  "I choose a clean restart for my family and reputation.",
                  "I route money to my future, not to risk.",
                  "I choose durable safety over short-term thrill.",
                ]
            ).map((template) => (
              <TouchableOpacity
                key={template}
                style={[styles.templateChip, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setMotivationTemplate(template)}
              >
                <Text style={[styles.templateText, { color: colors.primary }]}>{isTr ? "Hizli doldur" : "Quick fill"}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.summaryRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {isTr ? "Disiplin skoru" : "Discipline score"}: {disciplineScore}/100
            </Text>
            <Text style={[styles.summaryText, { color: colors.primary }]}>
              {isTr ? "Haftalik aktif gun" : "Active days"}: {activeWeeklyDays}/7
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Haftalik ritim kilidi" : "Weekly rhythm lock"}</Text>
          <Text style={[styles.commitmentText, { color: colors.textSecondary }]}>
            {isTr
              ? "Riskli bosluklari kapatmak icin aktif gunleri isaretle."
              : "Mark active days to close risky idle windows."}
          </Text>
          <View style={styles.dayGrid}>
            {WEEKDAY_IDS.map((dayId) => {
              const active = weeklyPlan[dayId];
              return (
                <TouchableOpacity
                  key={dayId}
                  style={[
                    styles.dayChip,
                    active
                      ? { borderColor: colors.primary, backgroundColor: colors.primary }
                      : { borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  onPress={() => toggleWeekday(dayId)}
                >
                  <Text style={[styles.dayText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>
                    {weekDayLabels[dayId]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.controlLabel, { color: colors.textSecondary, marginTop: 10 }]}>
            {isTr ? "En riskli pencere" : "Highest risk window"}
          </Text>
          <View style={styles.riskWindowRow}>
            {riskWindowOptions.map((option) => {
              const active = option.id === riskWindow;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.riskChip,
                    active
                      ? { borderColor: colors.primary, backgroundColor: colors.primary }
                      : { borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  onPress={() => setRiskWindow(option.id)}
                >
                  <Text style={[styles.riskChipText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.riskActionCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>
              {isTr ? "Otomatik aksiyon" : "Auto action"}
            </Text>
            <Text style={[styles.metricPillValue, { color: colors.text }]}>{selectedRiskWindow.action}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Taktik sprint paneli" : "Tactical sprint panel"}</Text>
          <Text style={[styles.commitmentText, { color: colors.textSecondary }]}>
            {isTr
              ? "Planini 48 saat, 7 gun ve 30 gunlik hizli fazlara bol. Her faz nuks baskisini azaltip hayata yatirimi guclendirir."
              : "Split your plan into 48-hour, 7-day, and 30-day sprints. Each phase lowers relapse pressure and strengthens life investments."}
          </Text>
          <View style={styles.sprintList}>
            {lifeShiftSprints.map((sprint) => (
              <View key={sprint.id} style={[styles.sprintCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={styles.sprintHead}>
                  <Text style={[styles.sprintHorizon, { color: colors.primary }]}>{sprint.horizon}</Text>
                  <Text style={[styles.sprintTitle, { color: colors.text }]}>{sprint.title}</Text>
                </View>
                <View style={styles.sprintActions}>
                  {sprint.steps.map((step) => (
                    <Text key={`${sprint.id}-${step}`} style={[styles.sprintActionText, { color: colors.textSecondary }]}>
                      {`- ${step}`}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "90 gun yol haritasi" : "90-day roadmap"}</Text>
          <View style={styles.roadmapList}>
            {roadmapMilestones.map((phase) => (
              <View key={phase.id} style={[styles.roadmapItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={styles.roadmapHeader}>
                  <Text style={[styles.roadmapTitle, { color: colors.text }]}>{phase.title}</Text>
                  <Text style={[styles.roadmapPeriod, { color: colors.textSecondary }]}>{phase.period}</Text>
                </View>
                <Text style={[styles.metricLabel, { color: colors.primary }]}>
                  {isTr ? "Hedef birikim/etki" : "Target amount/impact"}: {formatMoney(phase.target)}
                </Text>
                <View style={styles.roadmapActions}>
                  {phase.actions.map((action) => (
                    <Text key={`${phase.id}-${action}`} style={[styles.roadmapActionText, { color: colors.textSecondary }]}>
                      {`- ${action}`}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.commitmentActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={runCheckIn}
            >
              <Text style={styles.primaryBtnText}>
                {isTr ? "Bugun check-in yap" : "Run daily check-in"}
              </Text>
            </TouchableOpacity>
            <View style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                {isTr ? `Toplam check-in: ${checkInCount}` : `Total check-ins: ${checkInCount}`}
              </Text>
            </View>
          </View>
          {!checkInReady ? (
            <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>
              {isTr
                ? `Tekrar check-in icin yaklasik ${checkInRemainingHours} saat bekle.`
                : `Wait about ${checkInRemainingHours} hours for next check-in.`}
            </Text>
          ) : null}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isTr ? "Nuks tetikleyici merkezi" : "Relapse trigger center"}
          </Text>
          <Text style={[styles.commitmentText, { color: colors.textSecondary }]}>
            {isTr
              ? "Tetikleyiciyi hizli kaydet, yogunlugunu isaretle ve anlik karsi hamleyi tek tusla baslat."
              : "Capture triggers quickly, mark intensity, and launch an instant counter move in one tap."}
          </Text>

          <View style={styles.triggerStatsRow}>
            <View style={[styles.triggerStatPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.triggerStatValue, { color: colors.text }]}>{unresolvedTriggerCount}</Text>
              <Text style={[styles.triggerStatLabel, { color: colors.textSecondary }]}>
                {isTr ? "Acik tetikleyici" : "Open triggers"}
              </Text>
            </View>
            <View style={[styles.triggerStatPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.triggerStatValue, { color: colors.text }]}>{triggerPressureScore}</Text>
              <Text style={[styles.triggerStatLabel, { color: colors.textSecondary }]}>
                {isTr ? "Baski skoru" : "Pressure score"}
              </Text>
            </View>
            <View style={[styles.triggerStatPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.triggerStatValue, { color: colors.text }]}>{counterMoveCount}</Text>
              <Text style={[styles.triggerStatLabel, { color: colors.textSecondary }]}>
                {isTr ? "Karsi hamle" : "Counter moves"}
              </Text>
            </View>
          </View>

          <View style={[styles.triggerProBlock, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.triggerBlockTitle, { color: colors.text }]}>
              {isTr ? "Hizli kayit ve yanit" : "Quick capture and response"}
            </Text>

            <View style={styles.triggerChipRow}>
              {quickTriggerOptions.map((trigger) => (
                <TouchableOpacity
                  key={trigger}
                  style={[styles.triggerChip, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => setTriggerDraft(trigger)}
                >
                  <Text style={[styles.triggerChipText, { color: colors.primary }]} numberOfLines={1}>
                    {trigger}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={triggerDraft}
              onChangeText={(text) => setTriggerDraft(text.slice(0, 80))}
              maxLength={80}
              placeholder={isTr ? "Ornek: Gece tek basina telefonda reklam gordum" : "Example: Late night ad trigger while alone"}
              placeholderTextColor={colors.textSecondary}
              style={[styles.triggerInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            />

            <View style={styles.intensityRow}>
              {[1, 2, 3].map((level) => {
                const active = triggerIntensity === level;
                return (
                  <TouchableOpacity
                    key={`intensity-${level}`}
                    style={[
                      styles.intensityChip,
                      active
                        ? { borderColor: colors.primary, backgroundColor: colors.primary }
                        : { borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                    onPress={() => setTriggerIntensity(level as TriggerIntensity)}
                  >
                    <Text style={[styles.intensityChipText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>
                      {getIntensityLabel(level as TriggerIntensity)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.triggerActionRow}>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={addTriggerLog}>
                <Text style={styles.primaryBtnText}>{isTr ? "Kaydi ekle" : "Add record"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => runInstantCounterMove(triggerDraft)}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                  {isTr ? "Anlik hamleyi calistir" : "Run instant move"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.triggerProBlock, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.triggerBlockTitle, { color: colors.text }]}>
              {isTr ? "Anlik karsi hamle protokolu" : "Instant counter-move protocol"}
            </Text>
            <View style={styles.protocolList}>
              {counterMoveSteps.map((step, index) => (
                <Text key={`step-${index}`} style={[styles.protocolItemText, { color: colors.textSecondary }]}>
                  {`${index + 1}. ${step}`}
                </Text>
              ))}
            </View>
            {lastCounterMoveAt ? (
              <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>
                {isTr
                  ? `Son hamle: ${formatDateTime(lastCounterMoveAt)} | ${lastCounterMoveLabelText}`
                  : `Last move: ${formatDateTime(lastCounterMoveAt)} | ${lastCounterMoveLabelText}`}
              </Text>
            ) : null}
          </View>

          <View style={[styles.triggerProBlock, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.triggerBlockTitle, { color: colors.text }]}>
              {isTr ? "Tetikleyici kayitlari" : "Trigger records"}
            </Text>
            <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>
              {isTr ? `Ortalama yogunluk: ${avgTriggerIntensity || 0}` : `Average intensity: ${avgTriggerIntensity || 0}`}
            </Text>

            <View style={styles.triggerList}>
              {triggerLogs.length === 0 ? (
                <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>
                  {isTr ? "Henuz tetikleyici kaydi yok." : "No trigger record yet."}
                </Text>
              ) : (
                triggerLogs.slice(0, 6).map((entry) => (
                  <View key={entry.id} style={[styles.triggerListItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <View style={styles.triggerListTop}>
                      <Text style={[styles.triggerListLabel, { color: colors.text }]} numberOfLines={1}>
                        {entry.label}
                      </Text>
                      <View
                        style={[
                          styles.triggerIntensityBadge,
                          {
                            borderColor: colors.border,
                            backgroundColor: entry.intensity === 3 ? "#FEE2E2" : entry.intensity === 2 ? "#FEF3C7" : "#DCFCE7",
                          },
                        ]}
                      >
                        <Text style={[styles.triggerIntensityText, { color: colors.textSecondary }]}>
                          {getIntensityLabel(entry.intensity)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>
                      {formatDateTime(entry.createdAt)} | {entry.resolved ? (isTr ? "Cozuldu" : "Resolved") : isTr ? "Acik" : "Open"}
                    </Text>
                    <Text style={[styles.roadmapActionText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {isTr ? "Onerilen hamle" : "Suggested move"}: {entry.action}
                    </Text>
                    <View style={styles.triggerButtonsRow}>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={() => toggleTriggerResolved(entry.id)}
                      >
                        <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                          {entry.resolved ? (isTr ? "Tekrar ac" : "Re-open") : isTr ? "Cozuldu" : "Resolve"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={() => runInstantCounterMove(entry.label)}
                      >
                        <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                          {isTr ? "Hamleyi calistir" : "Run move"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={() => removeTrigger(entry.id)}
                      >
                        <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                          {isTr ? "Sil" : "Delete"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isTr ? "7 gunluk gorev seti" : "7-day action set"} - {isTr ? primaryScenario.titleTr : primaryScenario.titleEn}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${completionRatio * 100}%` }]} />
          </View>
          <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>
            {isTr
              ? `${completedTasks}/${primaryPlan.length} gorev tamamlandi`
              : `${completedTasks}/${primaryPlan.length} tasks completed`}
          </Text>

          <View style={styles.taskList}>
            {primaryPlan.map((task, index) => {
              const done = Boolean(checklist[`${primaryScenario.id}:${index}`]);
              return (
                <TouchableOpacity
                  key={`${primaryScenario.id}-${index}`}
                  style={[styles.taskItem, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => toggleTask(primaryScenario.id, index)}
                >
                  <View
                    style={[
                      styles.taskCheck,
                      done
                        ? { borderColor: colors.primary, backgroundColor: colors.primary }
                        : { borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                  >
                    <Text style={styles.taskCheckText}>{done ? "v" : ""}</Text>
                  </View>
                  <Text style={[styles.taskText, { color: colors.textSecondary }]}>{task}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Kumarsiz baglilik modu" : "No-gambling commitment"}</Text>
          <Text style={[styles.commitmentText, { color: colors.textSecondary }]}>
            {commitmentStartAt
              ? isTr
                ? `${commitmentDays}. gundesin. Baslangic: ${commitmentDate}`
                : `Day ${commitmentDays}. Started: ${commitmentDate}`
              : isTr
                ? "Tek tusla mod baslatip gun serini takip edebilirsin."
                : "Start with one tap and track your day streak."}
          </Text>
          <View style={styles.commitmentActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={toggleCommitment}
            >
              <Text style={styles.primaryBtnText}>
                {commitmentStartAt ? (isTr ? "Modu kapat" : "Disable mode") : isTr ? "Modu baslat" : "Enable mode"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={resetPlanner}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{isTr ? "Plani sifirla" : "Reset planner"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu plan cihazinda saklanir. Kucuk ama tutarli adimlar, kumar dongusunden cikisi hizlandirir."
              : "This plan stays on your device. Small but consistent actions speed up your exit from gambling loops."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    lineHeight: 20,
    marginBottom: 10,
  },
  intro: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 20,
    marginBottom: 12,
  },
  heroStats: {
    flexDirection: "row",
    gap: 8,
  },
  heroPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 9,
    minHeight: 66,
    justifyContent: "center",
  },
  heroPillValue: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 18,
  },
  heroPillLabel: {
    fontSize: 10,
    fontFamily: Fonts.body,
    marginTop: 3,
  },
  controlCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
    lineHeight: 20,
  },
  controlRow: {
    marginBottom: 10,
  },
  controlLabel: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 21,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    minHeight: 38,
  },
  quickBudgetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickBudgetChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  quickBudgetText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  monthsBox: {
    flex: 1,
    minHeight: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  monthsValue: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  monthsLabel: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  plannerHint: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 18,
    marginTop: 2,
  },
  syncError: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    marginTop: 8,
  },
  motivationInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 88,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  templateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  templateChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  templateText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    minWidth: 58,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  riskWindowRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  riskChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  riskChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  riskActionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sprintList: {
    gap: 8,
  },
  sprintCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sprintHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sprintHorizon: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.2,
  },
  sprintTitle: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
  },
  sprintActions: {
    gap: 4,
  },
  sprintActionText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  roadmapList: {
    gap: 8,
    marginBottom: 10,
  },
  roadmapItem: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  roadmapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  roadmapTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
  },
  roadmapPeriod: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  roadmapActions: {
    marginTop: 4,
    gap: 4,
  },
  roadmapActionText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  triggerStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  triggerStatPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  triggerStatValue: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: Fonts.bodySemiBold,
  },
  triggerStatLabel: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Fonts.body,
  },
  triggerProBlock: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  triggerBlockTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  triggerChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  triggerChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "48%",
  },
  triggerChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  triggerInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 40,
    fontSize: 12,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  intensityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  intensityChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  intensityChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  triggerActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  protocolList: {
    gap: 5,
    marginBottom: 8,
  },
  protocolItemText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  triggerList: {
    marginTop: 6,
    gap: 8,
  },
  triggerListItem: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  triggerListTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  triggerListLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.bodySemiBold,
  },
  triggerIntensityBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  triggerIntensityText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
  },
  triggerButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  scenarioCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: 10,
  },
  scenarioHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  scenarioHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  tag: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.3,
  },
  scenarioTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 19,
  },
  primaryBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
  },
  scenarioDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  allocationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  percentValue: {
    minWidth: 52,
    textAlign: "center",
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  primarySelectBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: "auto",
  },
  primarySelectText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  summaryRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricPill: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    minWidth: "47%",
    maxWidth: "47%",
    flex: 1,
  },
  metricPillLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginBottom: 4,
  },
  metricPillValue: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  progressTrack: {
    borderWidth: 1,
    borderRadius: Radius.full,
    height: 10,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    minWidth: 0,
  },
  progressMeta: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 13,
  },
  taskText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  commitmentText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  commitmentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
