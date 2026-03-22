import type {
  InterventionEffectiveness,
  InterventionType,
  UrgeIntensity,
  UrgeTrigger,
} from "@/types/urge";

export type UrgeSyncIntervention = {
  type: InterventionType;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  effectiveness?: InterventionEffectiveness;
  note?: string;
};

export type UrgeSyncOutcome = {
  finalIntensity: UrgeIntensity;
  effectiveness: InterventionEffectiveness;
  note?: string;
};

export type UrgeSyncLog = {
  id: string;
  timestamp: number;
  intensity: UrgeIntensity;
  trigger: UrgeTrigger | null;
  context?: string;
  interventions: UrgeSyncIntervention[];
  outcome?: UrgeSyncOutcome;
  duration: number;
};

export type UrgeSyncRequest = {
  logs: UrgeSyncLog[];
  lastSyncAt: number;
};

export type UrgeSyncResponse = {
  ok: boolean;
  logs: UrgeSyncLog[];
  serverTime: number;
  conflicts: number;
};
