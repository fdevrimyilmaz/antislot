import * as SecureStore from "expo-secure-store";

export type SessionType = "therapy" | "mindfulness";

export interface SessionState {
  currentSessionId: string | null;
  currentStep: number;
  completedSessionIds: string[];
  lastStartedAt: number | null;
  lastCompletedAt: number | null;
}

const DEFAULT_STATE: SessionState = {
  currentSessionId: null,
  currentStep: 0,
  completedSessionIds: [],
  lastStartedAt: null,
  lastCompletedAt: null,
};

function keyFor(type: SessionType) {
  return `antislot_sessions_${type}`;
}

async function loadState(type: SessionType): Promise<SessionState> {
  try {
    const stored = await SecureStore.getItemAsync(keyFor(type));
    if (!stored) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(stored) } as SessionState;
  } catch (error) {
    console.error("Oturum durumu yüklenirken hata:", error);
    return { ...DEFAULT_STATE };
  }
}

async function saveState(type: SessionType, state: SessionState): Promise<void> {
  try {
    await SecureStore.setItemAsync(keyFor(type), JSON.stringify(state));
  } catch (error) {
    console.error("Oturum durumu kaydedilirken hata:", error);
    throw error;
  }
}

export async function getSessionState(type: SessionType): Promise<SessionState> {
  return loadState(type);
}

export async function startSession(type: SessionType, sessionId: string): Promise<SessionState> {
  const state = await loadState(type);
  const next: SessionState = {
    ...state,
    currentSessionId: sessionId,
    currentStep: 0,
    lastStartedAt: Date.now(),
  };
  await saveState(type, next);
  return next;
}

export async function setSessionStep(
  type: SessionType,
  sessionId: string,
  step: number
): Promise<SessionState> {
  const state = await loadState(type);
  if (state.currentSessionId !== sessionId) {
    return state;
  }
  const next = { ...state, currentStep: step };
  await saveState(type, next);
  return next;
}

export async function completeSession(type: SessionType, sessionId: string): Promise<SessionState> {
  const state = await loadState(type);
  const completed = state.completedSessionIds.includes(sessionId)
    ? state.completedSessionIds
    : [...state.completedSessionIds, sessionId];
  const next: SessionState = {
    ...state,
    currentSessionId: null,
    currentStep: 0,
    completedSessionIds: completed,
    lastCompletedAt: Date.now(),
  };
  await saveState(type, next);
  return next;
}

export async function resetSessions(type: SessionType): Promise<void> {
  await saveState(type, { ...DEFAULT_STATE });
}
