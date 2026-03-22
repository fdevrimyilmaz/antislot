import type { SupportedLanguage } from "@/i18n/translations";
import { sendLocalNotification } from "@/services/notifications";
import { getLanguage } from "@/store/languageStore";
import { useAccountabilityStore } from "@/store/accountabilityStore";
import { useMoneyProtectionStore, type MoneyProtectionRiskLevel } from "@/store/moneyProtectionStore";

const HIGH_RISK_COOLDOWN_MS = 20 * 60 * 1000;
const AUTO_LOCK_MINUTES = 20;

type RiskSnapshot = {
  hydrated: boolean;
  riskLevel: MoneyProtectionRiskLevel;
  lockActive: boolean;
};

type HighRiskInterventionCheck = {
  previousRisk: MoneyProtectionRiskLevel | null;
  nextRisk: MoneyProtectionRiskLevel;
  now: number;
  lastTriggeredAt: number | null;
  cooldownMs: number;
};

let teardownEngine: (() => void) | null = null;

function snapshotFromState(state: ReturnType<typeof useMoneyProtectionStore.getState>): RiskSnapshot {
  return {
    hydrated: state.hydrated,
    riskLevel: state.riskLevel,
    lockActive: state.lockActive,
  };
}

const PROACTIVE_COPY: Record<SupportedLanguage, { title: string; body: string }> = {
  tr: {
    title: "Proaktif koruma baslatildi",
    body: "Yuksek risk sinyali algilandi. 20 dakikalik koruma kilidi otomatik baslatildi.",
  },
  en: {
    title: "Proactive protection started",
    body: "High-risk relapse signals detected. A 20-minute lock has been started.",
  },
  de: {
    title: "Proaktiver Schutz gestartet",
    body: "Hohes Rueckfallrisiko erkannt. Ein 20-Minuten-Lock wurde gestartet.",
  },
  fr: {
    title: "Protection proactive activee",
    body: "Risque eleve detecte. Un verrou de 20 minutes a ete lance.",
  },
  hi: {
    title: "Proactive protection shuru",
    body: "High-risk signal mila. 20 minute ka lock shuru hua.",
  },
  lv: {
    title: "Proaktiva aizsardziba aktiveta",
    body: "Atklats augsts risks. Ieslegts 20 minusu lock.",
  },
  zh: {
    title: "Qidong zhuodong baohu",
    body: "Jiance dao gao fengxian. Yi qidong 20 fenzhong lock.",
  },
  tl: {
    title: "Naka-on ang proactive protection",
    body: "May high-risk signal. Nagsimula ang 20 minutong lock.",
  },
  sq: {
    title: "Mbrojtja proaktive u aktivizua",
    body: "U zbulua rrezik i larte. U nis lock 20-minutash.",
  },
  sr: {
    title: "Proaktivna zastita je aktivirana",
    body: "Detektovan je visok rizik. Pokrenut je lock od 20 minuta.",
  },
  fi: {
    title: "Proaktiivinen suojaus kaynnistetty",
    body: "Korkea riski havaittu. 20 minuutin lock kaynnistyi.",
  },
  sv: {
    title: "Proaktivt skydd startat",
    body: "Hog risk upptackt. Ett 20-minuters lock har startats.",
  },
  it: {
    title: "Protezione proattiva avviata",
    body: "Rischio elevato rilevato. Avviato lock di 20 minuti.",
  },
  is: {
    title: "Proaktiv vernd hafin",
    body: "Haettuhaetta greind. 20 minutna lock sett i gang.",
  },
  ja: {
    title: "Proactive protection kaishi",
    body: "High-risk signal wo kentchi. 20 fun lock wo kaishi.",
  },
  ko: {
    title: "Proactive protection sijak",
    body: "High-risk signal gamji. 20 bun lock sijak.",
  },
  es: {
    title: "Proteccion proactiva iniciada",
    body: "Riesgo alto detectado. Se inicio un lock de 20 minutos.",
  },
  pt: {
    title: "Protecao proativa iniciada",
    body: "Risco alto detectado. Lock de 20 minutos foi iniciado.",
  },
  ms: {
    title: "Perlindungan proaktif bermula",
    body: "Risiko tinggi dikesan. Lock 20 minit telah dimulakan.",
  },
  km: {
    title: "Proactive protection started",
    body: "High-risk relapse signals detected. A 20-minute lock has been started.",
  },
  th: {
    title: "Proactive protection started",
    body: "High-risk relapse signals detected. A 20-minute lock has been started.",
  },
};

function localeCopy(language: SupportedLanguage): { title: string; body: string } {
  return PROACTIVE_COPY[language] ?? PROACTIVE_COPY.en;
}

export function shouldTriggerHighRiskIntervention(check: HighRiskInterventionCheck): boolean {
  if (check.nextRisk !== "high") return false;
  if (check.previousRisk === "high") return false;
  if (check.lastTriggeredAt != null && check.now - check.lastTriggeredAt < check.cooldownMs) {
    return false;
  }
  return true;
}

async function runHighRiskIntervention(snapshot: RiskSnapshot): Promise<void> {
  const accountability = useAccountabilityStore.getState();
  if (!accountability.hydrated) {
    await accountability.hydrate();
  }

  const currentPolicy = useAccountabilityStore.getState();
  if (!currentPolicy.proactiveInterventionEnabled) {
    return;
  }

  if (!snapshot.lockActive) {
    await useMoneyProtectionStore.getState().startLock(AUTO_LOCK_MINUTES);
  }

  let language: SupportedLanguage = "tr";
  try {
    language = await getLanguage();
  } catch {
    language = "tr";
  }
  const copy = localeCopy(language);
  await sendLocalNotification({
    title: copy.title,
    body: copy.body,
    data: {
      feature: "proactive_intervention",
      reason: "money_protection_high_risk",
    },
  });
}

export function startProactiveInterventionEngine(): () => void {
  if (teardownEngine) {
    return teardownEngine;
  }

  let disposed = false;
  let lastHighRiskInterventionAt: number | null = null;
  let queue: Promise<void> = Promise.resolve();

  const enqueue = (task: () => Promise<void>) => {
    queue = queue
      .then(async () => {
        if (disposed) return;
        await task();
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn("[ProactiveIntervention] task failed:", error);
        }
      });
  };

  const evaluate = (next: RiskSnapshot, previousRisk: MoneyProtectionRiskLevel | null) => {
    if (!next.hydrated) return;
    const now = Date.now();
    const shouldTrigger = shouldTriggerHighRiskIntervention({
      previousRisk,
      nextRisk: next.riskLevel,
      now,
      lastTriggeredAt: lastHighRiskInterventionAt,
      cooldownMs: HIGH_RISK_COOLDOWN_MS,
    });
    if (!shouldTrigger) return;

    lastHighRiskInterventionAt = now;
    enqueue(async () => {
      const latest = snapshotFromState(useMoneyProtectionStore.getState());
      if (!latest.hydrated || latest.riskLevel !== "high") return;
      await runHighRiskIntervention(latest);
    });
  };

  const unsubscribe = useMoneyProtectionStore.subscribe((nextState, previousState) => {
    const next = snapshotFromState(nextState);
    const previousRisk = previousState?.riskLevel ?? null;
    evaluate(next, previousRisk);
  });

  const initial = snapshotFromState(useMoneyProtectionStore.getState());
  evaluate(initial, null);

  teardownEngine = () => {
    disposed = true;
    unsubscribe();
    teardownEngine = null;
  };

  return teardownEngine;
}
