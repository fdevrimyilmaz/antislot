/**
 * Urge Store
 *
 * Manages urge detection, intervention, and logging state.
 *
 * Domain: Urge Intervention System
 * Principles:
 * - Offline-first
 * - Privacy-preserving
 * - Learning-oriented
 * - Non-judgmental
 */

import { storage, STORAGE_KEYS } from '@/lib/storage';
import type {
  ActiveUrge,
  CrisisAssessment,
  InterventionEffectiveness,
  InterventionRecord,
  InterventionType,
  SafetyLevel,
  UrgeIntensity,
  UrgeLog,
  UrgePattern,
  UrgeSettings,
  UrgeTrigger,
} from '@/types/urge';
import type { UrgeSyncLog, UrgeSyncRequest, UrgeSyncResponse } from '@/types/urgeSync';
import { create } from 'zustand';

interface UrgeStoreState {
  // Active urge state
  activeUrge: ActiveUrge | null;

  // Historical data
  urgeLogs: UrgeLog[];
  patterns: UrgePattern[];

  // Settings
  settings: UrgeSettings;

  // State flags
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  hydrate: () => Promise<void>;

  // Urge management
  startUrge: (intensity: UrgeIntensity, trigger?: UrgeTrigger, context?: string) => Promise<ActiveUrge>;
  updateUrgeIntensity: (intensity: UrgeIntensity) => Promise<void>;
  addIntervention: (type: InterventionType, duration?: number) => Promise<void>;
  selectIntervention: (type: InterventionType, duration?: number) => Promise<void>;
  markCrisis: () => Promise<void>;
  completeIntervention: (effectiveness?: InterventionEffectiveness) => Promise<void>;
  completeUrge: (finalIntensity: UrgeIntensity, effectiveness?: InterventionEffectiveness, note?: string) => Promise<UrgeLog>;
  cancelUrge: () => Promise<void>;

  // Logging
  logUrge: (log: Omit<UrgeLog, 'id' | 'timestamp'>) => Promise<UrgeLog>;
  logFeedback: (effective: boolean, notes?: string) => Promise<void>;
  getUrgeLogs: (limit?: number) => UrgeLog[];
  getRecentUrges: (days: number) => UrgeLog[];

  // Pattern analysis
  analyzePatterns: () => Promise<void>;
  getPatterns: () => UrgePattern[];
  getEffectiveInterventions: (trigger?: UrgeTrigger) => InterventionType[];

  // Safety assessment
  assessSafety: (intensity: UrgeIntensity, trigger?: UrgeTrigger) => CrisisAssessment;

  // Settings
  updateSettings: (partial: Partial<UrgeSettings>) => Promise<void>;
  resetData: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const MAX_URGE_LOGS = 1000;
const MAX_FEEDBACK_ENTRIES = 500;
const MAX_PATTERNS = 200;
const MAX_CONTEXT_CHARS = 500;
const MAX_NOTE_CHARS = 1000;
const MAX_ACTIVE_URGE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_SYNC_LOGS = MAX_URGE_LOGS;

let syncInFlight: Promise<void> | null = null;
let syncQueued = false;
type UrgeSyncClient = (payload: UrgeSyncRequest) => Promise<UrgeSyncResponse | null>;
let urgeSyncClient: UrgeSyncClient | null = null;

const INTERVENTION_TYPES: InterventionType[] = [
  'breathing',
  'grounding',
  'reframing',
  'redirection',
  'support',
  'delay',
  'sos',
];

const URGE_TRIGGERS: UrgeTrigger[] = [
  'emotional',
  'environmental',
  'cognitive',
  'physical',
  'social',
  'financial',
  'unknown',
];

const EFFECTIVENESS_VALUES: InterventionEffectiveness[] = [
  'very_helpful',
  'helpful',
  'neutral',
  'not_helpful',
];

const DEFAULT_SETTINGS: UrgeSettings = {
  enabled: true,
  defaultInterventions: ['breathing', 'grounding', 'delay'],
  interventionConfigs: [
    { type: 'breathing', enabled: true, defaultDuration: 60 },
    { type: 'grounding', enabled: true },
    { type: 'reframing', enabled: true },
    { type: 'redirection', enabled: true },
    { type: 'delay', enabled: true, defaultDuration: 600 },
    { type: 'support', enabled: true },
    { type: 'sos', enabled: true },
  ],
  autoLog: true,
  reminderEnabled: false,
  patternAnalysisEnabled: true,
};

const DEFAULT_STATE: Pick<UrgeStoreState, 'activeUrge' | 'urgeLogs' | 'patterns' | 'settings' | 'hydrated' | 'loading' | 'error'> = {
  activeUrge: null,
  urgeLogs: [],
  patterns: [],
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  loading: false,
  error: null,
};

function isInterventionType(value: unknown): value is InterventionType {
  return typeof value === 'string' && INTERVENTION_TYPES.includes(value as InterventionType);
}

function isUrgeTrigger(value: unknown): value is UrgeTrigger {
  return typeof value === 'string' && URGE_TRIGGERS.includes(value as UrgeTrigger);
}

function isInterventionEffectiveness(value: unknown): value is InterventionEffectiveness {
  return typeof value === 'string' && EFFECTIVENESS_VALUES.includes(value as InterventionEffectiveness);
}

function clampIntensity(value: unknown, fallback: UrgeIntensity = 5): UrgeIntensity {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const rounded = Math.round(numeric);
  if (rounded < 1 || rounded > 10) return fallback;
  return rounded as UrgeIntensity;
}

function sanitizeText(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxChars);
}

function toDurationSeconds(rawDuration: unknown, startedAt: number, completedAt: number): number {
  if (typeof rawDuration === 'number' && Number.isFinite(rawDuration) && rawDuration > 0) {
    // Migrate old millisecond values to seconds.
    if (rawDuration > 10000) {
      return Math.max(1, Math.floor(rawDuration / 1000));
    }
    return Math.max(1, Math.floor(rawDuration));
  }
  return Math.max(1, Math.floor((completedAt - startedAt) / 1000));
}

function createUrgeId(): string {
  return `urge_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function sortAndLimitLogs(logs: UrgeLog[]): UrgeLog[] {
  return [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_URGE_LOGS);
}

function compareLogQuality(a: UrgeLog, b: UrgeLog): number {
  const aHasOutcome = a.outcome ? 1 : 0;
  const bHasOutcome = b.outcome ? 1 : 0;
  if (aHasOutcome !== bHasOutcome) return aHasOutcome - bHasOutcome;

  const aInterventions = a.interventions.length;
  const bInterventions = b.interventions.length;
  if (aInterventions !== bInterventions) return aInterventions - bInterventions;

  if (a.duration !== b.duration) return a.duration - b.duration;

  const aContextLen = a.context?.length ?? 0;
  const bContextLen = b.context?.length ?? 0;
  if (aContextLen !== bContextLen) return aContextLen - bContextLen;

  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  return a.id.localeCompare(b.id);
}

function mergeLogSets(preferred: UrgeLog[], secondary: UrgeLog[]): UrgeLog[] {
  const byId = new Map<string, UrgeLog>();

  for (const log of secondary) {
    byId.set(log.id, log);
  }

  for (const log of preferred) {
    const existing = byId.get(log.id);
    if (!existing || compareLogQuality(log, existing) >= 0) {
      byId.set(log.id, log);
    }
  }

  return sortAndLimitLogs(Array.from(byId.values()));
}

function normalizeSyncLog(value: unknown): UrgeLog | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<UrgeSyncLog> & Record<string, unknown>;
  return normalizeUrgeLog({
    ...candidate,
    trigger: candidate.trigger == null ? undefined : candidate.trigger,
  });
}

function normalizeIntervention(intervention: unknown): InterventionRecord | null {
  if (!intervention || typeof intervention !== 'object') return null;
  const candidate = intervention as Partial<InterventionRecord>;
  if (!isInterventionType(candidate.type)) return null;
  if (typeof candidate.startedAt !== 'number' || !Number.isFinite(candidate.startedAt)) return null;

  const startedAt = Math.floor(candidate.startedAt);
  const completedAt =
    typeof candidate.completedAt === 'number' && Number.isFinite(candidate.completedAt)
      ? Math.floor(candidate.completedAt)
      : undefined;

  const duration =
    completedAt !== undefined
      ? toDurationSeconds(candidate.duration, startedAt, completedAt)
      : typeof candidate.duration === 'number' && Number.isFinite(candidate.duration) && candidate.duration > 0
        ? Math.max(1, Math.floor(candidate.duration))
        : undefined;

  return {
    type: candidate.type,
    startedAt,
    completedAt,
    duration,
    effectiveness: isInterventionEffectiveness(candidate.effectiveness) ? candidate.effectiveness : undefined,
    note: sanitizeText(candidate.note, MAX_NOTE_CHARS),
  };
}

function normalizeActiveUrge(value: unknown): ActiveUrge | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ActiveUrge>;

  if (typeof candidate.id !== 'string' || !candidate.id.trim()) return null;
  if (typeof candidate.startedAt !== 'number' || !Number.isFinite(candidate.startedAt)) return null;

  const interventions = Array.isArray(candidate.interventions)
    ? candidate.interventions.map(normalizeIntervention).filter((entry): entry is InterventionRecord => entry !== null)
    : [];

  return {
    id: candidate.id,
    startedAt: Math.floor(candidate.startedAt),
    initialIntensity: clampIntensity(candidate.initialIntensity, 5),
    currentIntensity: clampIntensity(candidate.currentIntensity, clampIntensity(candidate.initialIntensity, 5)),
    trigger: isUrgeTrigger(candidate.trigger) ? candidate.trigger : undefined,
    context: sanitizeText(candidate.context, MAX_CONTEXT_CHARS),
    interventions,
    currentIntervention: isInterventionType(candidate.currentIntervention) ? candidate.currentIntervention : undefined,
    crisisViewed: Boolean(candidate.crisisViewed),
  };
}

function normalizeUrgeLog(value: unknown): UrgeLog | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<UrgeLog>;

  if (typeof candidate.id !== 'string' || !candidate.id.trim()) return null;
  if (typeof candidate.timestamp !== 'number' || !Number.isFinite(candidate.timestamp)) return null;

  const interventions = Array.isArray(candidate.interventions)
    ? candidate.interventions.map(normalizeIntervention).filter((entry): entry is InterventionRecord => entry !== null)
    : [];

  const outcome =
    candidate.outcome && typeof candidate.outcome === 'object'
      ? {
          finalIntensity: clampIntensity(candidate.outcome.finalIntensity, clampIntensity(candidate.intensity, 5)),
          effectiveness: isInterventionEffectiveness(candidate.outcome.effectiveness)
            ? candidate.outcome.effectiveness
            : 'neutral',
          note: sanitizeText(candidate.outcome.note, MAX_NOTE_CHARS),
        }
      : undefined;

  return {
    id: candidate.id,
    timestamp: Math.floor(candidate.timestamp),
    intensity: clampIntensity(candidate.intensity, 5),
    trigger: isUrgeTrigger(candidate.trigger) ? candidate.trigger : undefined,
    context: sanitizeText(candidate.context, MAX_CONTEXT_CHARS),
    interventions,
    outcome,
    duration:
      typeof candidate.duration === 'number' && Number.isFinite(candidate.duration) && candidate.duration > 0
        ? Math.max(1, Math.floor(candidate.duration))
        : 1,
  };
}

function normalizeSettings(value: unknown): UrgeSettings {
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;
  const candidate = value as Partial<UrgeSettings>;

  const defaultInterventions = Array.isArray(candidate.defaultInterventions)
    ? candidate.defaultInterventions.filter((entry): entry is InterventionType => isInterventionType(entry))
    : DEFAULT_SETTINGS.defaultInterventions;

  const interventionConfigs = Array.isArray(candidate.interventionConfigs)
    ? candidate.interventionConfigs
        .map((config) => {
          if (!config || typeof config !== 'object' || !isInterventionType(config.type)) return null;
          const defaultDuration =
            typeof config.defaultDuration === 'number' && Number.isFinite(config.defaultDuration) && config.defaultDuration > 0
              ? Math.floor(config.defaultDuration)
              : undefined;
          return {
            type: config.type,
            enabled: config.enabled !== false,
            defaultDuration,
            preferences: config.preferences && typeof config.preferences === 'object' ? config.preferences : undefined,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : DEFAULT_SETTINGS.interventionConfigs;

  return {
    enabled: candidate.enabled !== false,
    defaultInterventions: defaultInterventions.length > 0 ? defaultInterventions : DEFAULT_SETTINGS.defaultInterventions,
    interventionConfigs: interventionConfigs.length > 0 ? interventionConfigs : DEFAULT_SETTINGS.interventionConfigs,
    autoLog: candidate.autoLog !== false,
    reminderEnabled: candidate.reminderEnabled === true,
    patternAnalysisEnabled: candidate.patternAnalysisEnabled !== false,
  };
}

function normalizePatterns(value: unknown): UrgePattern[] {
  if (!Array.isArray(value)) return [];
  const normalized: UrgePattern[] = [];

  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;

    const candidate = entry as Partial<UrgePattern>;
    const trigger = isUrgeTrigger(candidate.trigger) ? candidate.trigger : 'unknown';
    const effectiveInterventions = Array.isArray(candidate.effectiveInterventions)
      ? candidate.effectiveInterventions.filter((item): item is InterventionType => isInterventionType(item))
      : [];

    const pattern: UrgePattern = {
      id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : `pattern_${trigger}`,
      trigger,
      commonIntensity: clampIntensity(candidate.commonIntensity, 5),
      effectiveInterventions,
      frequency:
        typeof candidate.frequency === 'number' && Number.isFinite(candidate.frequency) && candidate.frequency > 0
          ? Math.floor(candidate.frequency)
          : 1,
      lastSeen:
        typeof candidate.lastSeen === 'number' && Number.isFinite(candidate.lastSeen)
          ? Math.floor(candidate.lastSeen)
          : Date.now(),
    };

    const timeOfDay = sanitizeText(candidate.timeOfDay, 32);
    if (timeOfDay) pattern.timeOfDay = timeOfDay;

    const dayOfWeek = sanitizeText(candidate.dayOfWeek, 32);
    if (dayOfWeek) pattern.dayOfWeek = dayOfWeek;

    normalized.push(pattern);
  });

  return normalized.slice(0, MAX_PATTERNS);
}

async function persistActiveUrge(activeUrge: ActiveUrge | null): Promise<void> {
  if (!activeUrge) {
    await storage.remove(STORAGE_KEYS.URGE_ACTIVE, { type: 'secure' });
    return;
  }
  await storage.set(STORAGE_KEYS.URGE_ACTIVE, activeUrge, { type: 'secure' });
}

async function readStoredUrgeLogs(repair = false): Promise<UrgeLog[]> {
  const raw = await storage.get<unknown>(STORAGE_KEYS.URGE_LOGS, { type: 'secure' });
  const logs = Array.isArray(raw)
    ? raw.map((entry) => normalizeUrgeLog(entry)).filter((entry): entry is UrgeLog => entry !== null)
    : [];
  const normalized = sortAndLimitLogs(logs);

  if (repair) {
    await storage.set(STORAGE_KEYS.URGE_LOGS, normalized, { type: 'secure' });
  }

  return normalized;
}

async function getStoredLastSyncAt(): Promise<number> {
  const raw = await storage.get<unknown>(STORAGE_KEYS.URGE_LAST_SYNC_AT, { type: 'secure' });
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.trunc(parsed);
}

async function setStoredLastSyncAt(value: number): Promise<void> {
  if (!Number.isFinite(value) || value <= 0) return;
  await storage.set(STORAGE_KEYS.URGE_LAST_SYNC_AT, Math.trunc(value), { type: 'secure' });
}

function toSyncLog(log: UrgeLog): UrgeSyncLog {
  return {
    id: log.id,
    timestamp: log.timestamp,
    intensity: log.intensity,
    trigger: log.trigger ?? null,
    context: log.context,
    interventions: log.interventions.map((intervention) => ({
      type: intervention.type,
      startedAt: intervention.startedAt,
      completedAt: intervention.completedAt,
      duration: intervention.duration,
      effectiveness: intervention.effectiveness,
      note: intervention.note,
    })),
    outcome: log.outcome
      ? {
          finalIntensity: log.outcome.finalIntensity,
          effectiveness: log.outcome.effectiveness,
          note: log.outcome.note,
        }
      : undefined,
    duration: log.duration,
  };
}

export async function getUrgeSyncState(): Promise<{ logs: UrgeSyncLog[]; lastSyncAt: number }> {
  const [logs, lastSyncAt] = await Promise.all([
    readStoredUrgeLogs(true),
    getStoredLastSyncAt(),
  ]);

  return {
    logs: logs.slice(0, MAX_SYNC_LOGS).map((log) => toSyncLog(log)),
    lastSyncAt,
  };
}

export async function applyCloudUrgeState(logs: UrgeSyncLog[], syncedAt: number): Promise<void> {
  const localLogs = await readStoredUrgeLogs(true);
  const remoteLogs = (logs ?? [])
    .map((entry) => normalizeSyncLog(entry))
    .filter((entry): entry is UrgeLog => entry !== null);

  const merged = mergeLogSets(localLogs, remoteLogs);
  await storage.set(STORAGE_KEYS.URGE_LOGS, merged, { type: 'secure' });
  if (syncedAt > 0) {
    await setStoredLastSyncAt(syncedAt);
  }
}

export function setUrgeSyncClient(client: UrgeSyncClient | null): void {
  urgeSyncClient = client;
}

async function syncUrgeSnapshot(payload: UrgeSyncRequest): Promise<UrgeSyncResponse | null> {
  if (!urgeSyncClient) {
    return null;
  }
  return urgeSyncClient(payload);
}

export async function syncUrgesWithServer(): Promise<void> {
  if (syncInFlight) {
    syncQueued = true;
    return syncInFlight;
  }

  syncInFlight = (async () => {
    do {
      syncQueued = false;

      const snapshot = await getUrgeSyncState();
      const response = await syncUrgeSnapshot({
        logs: snapshot.logs,
        lastSyncAt: snapshot.lastSyncAt,
      });

      if (!response) {
        return;
      }

      await applyCloudUrgeState(response.logs, response.serverTime);
    } while (syncQueued);
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export const useUrgeStore = create<UrgeStoreState>((set, get) => ({
  ...DEFAULT_STATE,

  hydrate: async () => {
    const state = get();
    if (state.hydrated) return;

    set({ loading: true, error: null });

    try {
      const [logs, patternsRes, settingsRes, activeRes] = await Promise.all([
        readStoredUrgeLogs(true),
        storage.get<UrgePattern[]>(STORAGE_KEYS.URGE_PATTERNS, { type: 'secure' }),
        storage.get<UrgeSettings>(STORAGE_KEYS.URGE_SETTINGS, { type: 'secure' }),
        storage.get<ActiveUrge>(STORAGE_KEYS.URGE_ACTIVE, { type: 'secure' }),
      ]);

      const patterns = normalizePatterns(patternsRes ?? []);
      const settings = normalizeSettings(settingsRes ?? DEFAULT_SETTINGS);
      let activeUrge = normalizeActiveUrge(activeRes);

      if (activeUrge && Date.now() - activeUrge.startedAt > MAX_ACTIVE_URGE_AGE_MS) {
        activeUrge = null;
        await persistActiveUrge(null);
      }

      set({
        activeUrge,
        urgeLogs: logs,
        patterns,
        settings,
        hydrated: true,
        loading: false,
      });
    } catch (error) {
      console.error('[UrgeStore] Hydration error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load urge data',
        loading: false,
        hydrated: true,
      });
    }
  },

  startUrge: async (intensity, trigger, context) => {
    const state = get();
    if (state.activeUrge) {
      return state.activeUrge;
    }

    const now = Date.now();
    const safeIntensity = clampIntensity(intensity, 5);
    const urge: ActiveUrge = {
      id: createUrgeId(),
      startedAt: now,
      initialIntensity: safeIntensity,
      currentIntensity: safeIntensity,
      trigger: isUrgeTrigger(trigger) ? trigger : undefined,
      context: sanitizeText(context, MAX_CONTEXT_CHARS),
      interventions: [],
    };

    set({ activeUrge: urge });
    await persistActiveUrge(urge);
    return urge;
  },

  updateUrgeIntensity: async (intensity) => {
    const state = get();
    if (!state.activeUrge) return;

    const updated: ActiveUrge = {
      ...state.activeUrge,
      currentIntensity: clampIntensity(intensity, state.activeUrge.currentIntensity),
    };

    set({ activeUrge: updated });
    await persistActiveUrge(updated);
  },

  addIntervention: async (type, duration) => {
    const state = get();
    if (!state.activeUrge) return;

    const safeDuration =
      typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : undefined;

    const current = state.activeUrge;
    const lastIntervention = current.interventions[current.interventions.length - 1];

    // Guard against duplicate "selected + started" records for the same unfinished intervention.
    if (lastIntervention && !lastIntervention.completedAt && lastIntervention.type === type) {
      const mergedLast: InterventionRecord = {
        ...lastIntervention,
        duration: safeDuration ?? lastIntervention.duration,
      };
      const updatedInterventions = [...current.interventions.slice(0, -1), mergedLast];
      const updated = { ...current, interventions: updatedInterventions, currentIntervention: type };
      set({ activeUrge: updated });
      await persistActiveUrge(updated);
      return;
    }

    const record: InterventionRecord = {
      type,
      startedAt: Date.now(),
      duration: safeDuration,
    };

    const updated: ActiveUrge = {
      ...current,
      interventions: [...current.interventions, record],
      currentIntervention: type,
    };

    set({ activeUrge: updated });
    await persistActiveUrge(updated);
  },

  selectIntervention: async (type, duration) => {
    await get().addIntervention(type, duration);
  },

  markCrisis: async () => {
    const state = get();
    if (!state.activeUrge) return;
    const updated: ActiveUrge = { ...state.activeUrge, crisisViewed: true };
    set({ activeUrge: updated });
    await persistActiveUrge(updated);
  },

  completeIntervention: async (effectiveness) => {
    const state = get();
    if (!state.activeUrge) return;

    const current = state.activeUrge;
    let targetIndex = -1;
    for (let index = current.interventions.length - 1; index >= 0; index -= 1) {
      if (!current.interventions[index].completedAt) {
        targetIndex = index;
        break;
      }
    }

    if (targetIndex === -1) {
      if (current.currentIntervention !== undefined) {
        const updated = { ...current, currentIntervention: undefined };
        set({ activeUrge: updated });
        await persistActiveUrge(updated);
      }
      return;
    }

    const completedAt = Date.now();
    const interventions = current.interventions.map((intervention, index) => {
      if (index !== targetIndex) return intervention;

      return {
        ...intervention,
        completedAt,
        duration: toDurationSeconds(intervention.duration, intervention.startedAt, completedAt),
        effectiveness: isInterventionEffectiveness(effectiveness) ? effectiveness : intervention.effectiveness,
      };
    });

    const updated: ActiveUrge = {
      ...current,
      interventions,
      currentIntervention: undefined,
    };

    set({ activeUrge: updated });
    await persistActiveUrge(updated);
  },

  completeUrge: async (finalIntensity, effectiveness, note) => {
    const state = get();
    if (!state.activeUrge) {
      throw new Error('No active urge to complete');
    }

    const urge = state.activeUrge;
    const now = Date.now();
    const duration = Math.max(1, Math.floor((now - urge.startedAt) / 1000));
    const safeEffectiveness: InterventionEffectiveness = isInterventionEffectiveness(effectiveness)
      ? effectiveness
      : 'neutral';
    const safeNote = sanitizeText(note, MAX_NOTE_CHARS);

    const completedInterventions = urge.interventions.map((intervention) => {
      const completedAt =
        typeof intervention.completedAt === 'number' && Number.isFinite(intervention.completedAt)
          ? intervention.completedAt
          : now;

      return {
        ...intervention,
        completedAt,
        duration: toDurationSeconds(intervention.duration, intervention.startedAt, completedAt),
      };
    });

    const log: UrgeLog = {
      id: urge.id,
      timestamp: urge.startedAt,
      intensity: urge.initialIntensity,
      trigger: urge.trigger,
      context: urge.context,
      interventions: completedInterventions,
      outcome: {
        finalIntensity: clampIntensity(finalIntensity, urge.currentIntensity),
        effectiveness: safeEffectiveness,
        note: safeNote,
      },
      duration,
    };

    const updatedLogs = sortAndLimitLogs([log, ...state.urgeLogs]);

    await Promise.all([
      storage.set(STORAGE_KEYS.URGE_LOGS, updatedLogs, { type: 'secure' }),
      persistActiveUrge(null),
    ]);

    set({
      activeUrge: null,
      urgeLogs: updatedLogs,
    });

    if (state.settings.patternAnalysisEnabled) {
      await get().analyzePatterns();
    }

    return log;
  },

  cancelUrge: async () => {
    set({ activeUrge: null });
    await persistActiveUrge(null);
  },

  logUrge: async (logData) => {
    const state = get();
    const log: UrgeLog = {
      ...logData,
      id: createUrgeId(),
      timestamp: Date.now(),
      intensity: clampIntensity(logData.intensity, 5),
      trigger: isUrgeTrigger(logData.trigger) ? logData.trigger : undefined,
      context: sanitizeText(logData.context, MAX_CONTEXT_CHARS),
      interventions: (logData.interventions ?? [])
        .map(normalizeIntervention)
        .filter((entry): entry is InterventionRecord => entry !== null),
      duration:
        typeof logData.duration === 'number' && Number.isFinite(logData.duration) && logData.duration > 0
          ? Math.floor(logData.duration)
          : 1,
      outcome: logData.outcome
        ? {
            finalIntensity: clampIntensity(logData.outcome.finalIntensity, clampIntensity(logData.intensity, 5)),
            effectiveness: isInterventionEffectiveness(logData.outcome.effectiveness)
              ? logData.outcome.effectiveness
              : 'neutral',
            note: sanitizeText(logData.outcome.note, MAX_NOTE_CHARS),
          }
        : undefined,
    };

    const updatedLogs = sortAndLimitLogs([log, ...state.urgeLogs]);
    await storage.set(STORAGE_KEYS.URGE_LOGS, updatedLogs, { type: 'secure' });

    set({ urgeLogs: updatedLogs });

    if (state.settings.patternAnalysisEnabled) {
      await get().analyzePatterns();
    }

    return log;
  },

  logFeedback: async (effective, notes) => {
    const state = get();
    const effectiveness: InterventionEffectiveness = effective ? 'helpful' : 'not_helpful';
    if (state.activeUrge?.currentIntervention) {
      await get().completeIntervention(effectiveness);
    }

    type FeedbackEntry = { timestamp: number; effective: boolean; notes?: string; urgeId?: string };
    const raw = await storage.get<FeedbackEntry[]>(STORAGE_KEYS.URGE_FEEDBACK, { type: 'secure' });
    const list = raw ?? [];
    const entry: FeedbackEntry = {
      timestamp: Date.now(),
      effective,
      notes: sanitizeText(notes, MAX_NOTE_CHARS),
      urgeId: state.activeUrge?.id,
    };
    const updated = [entry, ...list].slice(0, MAX_FEEDBACK_ENTRIES);
    await storage.set(STORAGE_KEYS.URGE_FEEDBACK, updated, { type: 'secure' });
  },

  getUrgeLogs: (limit) => {
    const state = get();
    const logs = sortAndLimitLogs(state.urgeLogs);
    return limit ? logs.slice(0, limit) : logs;
  },

  getRecentUrges: (days) => {
    const state = get();
    const safeDays = Number.isFinite(days) && days > 0 ? days : 1;
    const cutoff = Date.now() - safeDays * 24 * 60 * 60 * 1000;
    return state.urgeLogs.filter((log) => log.timestamp >= cutoff);
  },

  analyzePatterns: async () => {
    const state = get();
    const logs = state.urgeLogs;

    if (logs.length < 3) {
      return;
    }

    const triggerGroups = new Map<UrgeTrigger, UrgeLog[]>();
    logs.forEach((log) => {
      const trigger = log.trigger || 'unknown';
      if (!triggerGroups.has(trigger)) {
        triggerGroups.set(trigger, []);
      }
      triggerGroups.get(trigger)?.push(log);
    });

    const patterns: UrgePattern[] = [];

    triggerGroups.forEach((groupLogs, trigger) => {
      if (groupLogs.length < 2) return;

      const intensities = groupLogs.map((log) => log.intensity);
      const avgIntensity = clampIntensity(
        Math.round(intensities.reduce((sum, value) => sum + value, 0) / intensities.length),
        5
      );

      const interventionCounts = new Map<InterventionType, number>();
      groupLogs.forEach((log) => {
        log.interventions.forEach((intervention) => {
          if (intervention.effectiveness === 'very_helpful' || intervention.effectiveness === 'helpful') {
            const count = interventionCounts.get(intervention.type) || 0;
            interventionCounts.set(intervention.type, count + 1);
          }
        });
      });

      const effectiveInterventions = Array.from(interventionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      const lastSeen = Math.max(...groupLogs.map((log) => log.timestamp));

      patterns.push({
        id: `pattern_${trigger}`,
        trigger,
        commonIntensity: avgIntensity,
        effectiveInterventions,
        frequency: groupLogs.length,
        lastSeen,
      });
    });

    const normalized = patterns.slice(0, MAX_PATTERNS);
    await storage.set(STORAGE_KEYS.URGE_PATTERNS, normalized, { type: 'secure' });
    set({ patterns: normalized });
  },

  getPatterns: () => {
    return get().patterns;
  },

  getEffectiveInterventions: (trigger) => {
    const state = get();

    if (!trigger) {
      const allInterventions = new Map<InterventionType, number>();
      state.urgeLogs.forEach((log) => {
        log.interventions.forEach((intervention) => {
          if (intervention.effectiveness === 'very_helpful' || intervention.effectiveness === 'helpful') {
            const count = allInterventions.get(intervention.type) || 0;
            allInterventions.set(intervention.type, count + 1);
          }
        });
      });

      const top = Array.from(allInterventions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      return top.length > 0 ? top : state.settings.defaultInterventions;
    }

    const pattern = state.patterns.find((entry) => entry.trigger === trigger);
    if (pattern && pattern.effectiveInterventions.length > 0) {
      return pattern.effectiveInterventions;
    }

    return state.settings.defaultInterventions;
  },

  assessSafety: (intensity, trigger) => {
    const safeIntensity = clampIntensity(intensity, 5);

    let level: SafetyLevel = 'safe';
    let recommendedAction: CrisisAssessment['recommendedAction'] = 'continue';
    let urgency: CrisisAssessment['urgency'] = 'low';
    let message: string | undefined;

    if (safeIntensity >= 9) {
      level = 'crisis';
      recommendedAction = 'sos';
      urgency = 'critical';
      message = 'You can access immediate support. You are not alone.';
    } else if (safeIntensity >= 7) {
      level = 'high';
      recommendedAction = 'helpline';
      urgency = 'high';
      message = 'Consider reaching out for support. Help is available.';
    } else if (safeIntensity >= 5) {
      level = 'moderate';
      recommendedAction = 'continue';
      urgency = 'medium';
    } else {
      level = 'safe';
      recommendedAction = 'continue';
      urgency = 'low';
    }

    return {
      level,
      recommendedAction,
      urgency,
      message,
    };
  },

  updateSettings: async (partial) => {
    const state = get();
    const updated = normalizeSettings({ ...state.settings, ...partial });
    await storage.set(STORAGE_KEYS.URGE_SETTINGS, updated, { type: 'secure' });
    set({ settings: updated });
  },

  resetData: async () => {
    await Promise.all([
      storage.remove(STORAGE_KEYS.URGE_LOGS, { type: 'secure' }),
      storage.remove(STORAGE_KEYS.URGE_PATTERNS, { type: 'secure' }),
      storage.remove(STORAGE_KEYS.URGE_FEEDBACK, { type: 'secure' }),
      storage.remove(STORAGE_KEYS.URGE_ACTIVE, { type: 'secure' }),
      storage.remove(STORAGE_KEYS.URGE_LAST_SYNC_AT, { type: 'secure' }),
    ]);

    set({
      activeUrge: null,
      urgeLogs: [],
      patterns: [],
      settings: DEFAULT_SETTINGS,
    });
  },

  syncWithServer: async () => {
    await syncUrgesWithServer();
    const [logs, patterns] = await Promise.all([
      readStoredUrgeLogs(true),
      storage.get<UrgePattern[]>(STORAGE_KEYS.URGE_PATTERNS, { type: 'secure' }),
    ]);
    set({
      urgeLogs: logs,
      patterns: normalizePatterns(patterns ?? []),
    });
  },
}));
