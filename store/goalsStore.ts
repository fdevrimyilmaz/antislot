import * as SecureStore from "expo-secure-store";

/**
 * Goals — user-defined targets with a deadline or streak-day milestone.
 * Quitzilla-style "1 ay temiz", "borç X TL eridi", "yeni alışkanlık edin".
 */

const KEY = "antislot_goals";

export type GoalKind = "streak" | "savings" | "habit" | "freeform";

export type Goal = {
  id: string;
  title: string;
  kind: GoalKind;
  /** For streak/savings goals: target value. */
  target?: number;
  /** Optional deadline (ms). */
  deadline?: number;
  notes?: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
};

export async function getGoals(): Promise<Goal[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Goal[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  } catch {
    return [];
  }
}

async function saveAll(goals: Goal[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(goals));
}

export async function addGoal(
  input: Omit<Goal, "id" | "createdAt" | "completed" | "completedAt">
): Promise<Goal[]> {
  const goals = await getGoals();
  const goal: Goal = {
    ...input,
    id: `goal_${Date.now()}`,
    createdAt: Date.now(),
    completed: false,
  };
  const updated = [goal, ...goals];
  await saveAll(updated);
  return updated;
}

export async function toggleGoalCompleted(id: string): Promise<Goal[]> {
  const goals = await getGoals();
  const updated = goals.map((g) => {
    if (g.id !== id) return g;
    const next = !g.completed;
    return {
      ...g,
      completed: next,
      completedAt: next ? Date.now() : undefined,
    };
  });
  await saveAll(updated);
  return updated;
}

export async function removeGoal(id: string): Promise<Goal[]> {
  const goals = await getGoals();
  const updated = goals.filter((g) => g.id !== id);
  await saveAll(updated);
  return updated;
}

export function progressFor(goal: Goal, gamblingFreeDays: number, savedAmount: number): number {
  if (goal.completed) return 1;
  if (goal.kind === "streak" && goal.target && goal.target > 0) {
    return Math.min(1, gamblingFreeDays / goal.target);
  }
  if (goal.kind === "savings" && goal.target && goal.target > 0) {
    return Math.min(1, savedAmount / goal.target);
  }
  return 0;
}
