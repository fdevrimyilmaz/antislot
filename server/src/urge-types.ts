export type UrgeCloudIntervention = {
  type: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  effectiveness?: string;
  note?: string;
};

export type UrgeCloudOutcome = {
  finalIntensity: number;
  effectiveness: string;
  note?: string;
};

export type UrgeCloudLog = {
  id: string;
  timestamp: number;
  intensity: number;
  trigger: string | null;
  context?: string;
  interventions: UrgeCloudIntervention[];
  outcome?: UrgeCloudOutcome;
  duration: number;
};

export type UrgeSyncResult = {
  logs: UrgeCloudLog[];
  serverTime: number;
  conflicts: number;
};
