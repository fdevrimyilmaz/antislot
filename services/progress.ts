import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ProgressSnapshot {
  /** Epoch ms (local) when the current streak began. */
  streakStartedAt: number;
  /** Days elapsed since `streakStartedAt`, counted in calendar boundaries. */
  gamblingFreeDays: number;
}

/**
 * Number of local-time calendar boundaries crossed between `startMs` and now.
 *
 * Why calendar-aware rather than `floor((now - start) / MS_PER_DAY)`:
 *   - User starts Monday at 23:00.
 *   - Tuesday at 01:00 they expect to see "1 day".
 *   - Pure 24-hour math gives 0 until Tuesday at 23:00, which feels broken.
 *
 * We compare local midnights so the counter ticks over at the user's
 * midnight regardless of when in the day they started.
 */
export function daysSince(startMs: number, now: number = Date.now()): number {
  if (!Number.isFinite(startMs) || startMs <= 0 || startMs > now) return 0;
  const startMidnight = atLocalMidnight(startMs);
  const nowMidnight = atLocalMidnight(now);
  return Math.max(0, Math.round((nowMidnight - startMidnight) / MS_PER_DAY));
}

function atLocalMidnight(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Read the streak state from Firestore, migrating old documents on the fly.
 *
 * Migration paths:
 *   - New user (no progress doc): start the streak from now and persist.
 *   - Old user with a static `gamblingFreeDays` int but no start timestamp:
 *     backfill `streakStartedAt` so the visible count matches what they had.
 *   - New user with both fields: just return.
 */
export async function readProgress(uid: string): Promise<ProgressSnapshot> {
  const docRef = doc(db, "users", uid);
  const snapshot = await getDoc(docRef);
  const data = snapshot.exists()
    ? ((snapshot.data() as {
        progress?: { gamblingFreeDays?: unknown; streakStartedAt?: unknown };
      }) ?? {})
    : {};
  const rawStart = data.progress?.streakStartedAt;
  const rawDays = data.progress?.gamblingFreeDays;

  if (typeof rawStart === "number" && Number.isFinite(rawStart) && rawStart > 0) {
    return { streakStartedAt: rawStart, gamblingFreeDays: daysSince(rawStart) };
  }

  const now = Date.now();
  const legacyDays =
    typeof rawDays === "number" && Number.isFinite(rawDays) && rawDays > 0
      ? Math.floor(rawDays)
      : 0;
  const backfilled = now - legacyDays * MS_PER_DAY;

  // Persist the backfill so subsequent reads are consistent.
  await writeProgress(uid, backfilled);

  return { streakStartedAt: backfilled, gamblingFreeDays: legacyDays };
}

/**
 * Persist the streak start timestamp. Also writes a snapshot of the derived
 * day count so dashboards or admin queries that read the document directly
 * still get a meaningful integer.
 */
export async function writeProgress(uid: string, streakStartedAt: number): Promise<void> {
  const docRef = doc(db, "users", uid);
  await setDoc(
    docRef,
    {
      progress: {
        streakStartedAt,
        gamblingFreeDays: daysSince(streakStartedAt),
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}
