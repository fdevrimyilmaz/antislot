/**
 * On-device data export.
 *
 * Gathers user data from every persisted store into a single structured
 * JSON object. Used by the export screen to share via the native Share
 * sheet (Notes, Files, Mail, Drive, etc.) — no server roundtrip.
 *
 * Privacy posture:
 *   - This function ONLY reads. Nothing is sent anywhere.
 *   - It does not include internal IDs from Firestore or device-specific
 *     identifiers — only the user-authored content.
 */

import { getCheckinHistory, getTodayCheckin } from "@/store/checkinStore";
import { getCrisisPlan } from "@/store/crisisPlanStore";
import { getGoals } from "@/store/goalsStore";
import { getLossLedger } from "@/store/lossLedgerStore";
import { getPledgeStreak, getTodayPledge } from "@/store/pledgeStore";
import { getReasons } from "@/store/reasonsStore";
import { getSavingsConfig } from "@/store/savingsStore";
import { getContacts, getBuddyMessage } from "@/store/sosStore";
import { getUrgeLog } from "@/store/urgeLogStore";
import { useCelebrationStore } from "@/store/celebrationStore";
import { useCurriculumStore } from "@/store/curriculumStore";
import { useLockoutStore } from "@/store/lockoutStore";
import { useNotifPrefsStore } from "@/store/notificationsPrefsStore";
import { useRiskWindowsStore } from "@/store/riskWindowsStore";

export type ExportedData = {
  exportedAt: string;
  schemaVersion: 1;
  pledge: Awaited<ReturnType<typeof getTodayPledge>> | null;
  pledgeStreak: number;
  checkinToday: Awaited<ReturnType<typeof getTodayCheckin>> | null;
  checkinHistory: Awaited<ReturnType<typeof getCheckinHistory>>;
  urgeLog: Awaited<ReturnType<typeof getUrgeLog>>;
  lossLedger: Awaited<ReturnType<typeof getLossLedger>>;
  goals: Awaited<ReturnType<typeof getGoals>>;
  reasons: Awaited<ReturnType<typeof getReasons>>;
  crisisPlan: Awaited<ReturnType<typeof getCrisisPlan>>;
  savingsConfig: Awaited<ReturnType<typeof getSavingsConfig>>;
  contacts: Awaited<ReturnType<typeof getContacts>>;
  buddyMessage: string;
  curriculum: ReturnType<typeof useCurriculumStore.getState>["state"];
  riskWindows: ReturnType<typeof useRiskWindowsStore.getState>["windows"];
  lockout: ReturnType<typeof useLockoutStore.getState>["state"];
  notifPrefs: ReturnType<typeof useNotifPrefsStore.getState>["prefs"];
  celebratedUpTo: ReturnType<typeof useCelebrationStore.getState>["celebratedUpTo"];
};

/**
 * Reads every store and returns a structured snapshot. Throws if any
 * underlying store throws (rare — stores swallow most errors).
 */
export async function gatherUserData(): Promise<ExportedData> {
  // Run reads in parallel; Zustand `getState()` reads are sync and free.
  const [
    pledge,
    pledgeStreak,
    checkinToday,
    checkinHistory,
    urgeLog,
    lossLedger,
    goals,
    reasons,
    crisisPlan,
    savingsConfig,
    contacts,
    buddyMessage,
  ] = await Promise.all([
    getTodayPledge(),
    getPledgeStreak(),
    getTodayCheckin(),
    getCheckinHistory(),
    getUrgeLog(),
    getLossLedger(),
    getGoals(),
    getReasons(),
    getCrisisPlan(),
    getSavingsConfig(),
    getContacts(),
    getBuddyMessage(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    pledge,
    pledgeStreak,
    checkinToday,
    checkinHistory,
    urgeLog,
    lossLedger,
    goals,
    reasons,
    crisisPlan,
    savingsConfig,
    contacts,
    buddyMessage,
    curriculum: useCurriculumStore.getState().state,
    riskWindows: useRiskWindowsStore.getState().windows,
    lockout: useLockoutStore.getState().state,
    notifPrefs: useNotifPrefsStore.getState().prefs,
    celebratedUpTo: useCelebrationStore.getState().celebratedUpTo,
  };
}

/**
 * Returns a quick by-category count for the export preview UI so the
 * user knows what's about to leave the app.
 */
export function summarizeExport(data: ExportedData): {
  label: string;
  count: number;
}[] {
  return [
    { label: "Dürtü kaydı", count: data.urgeLog.length },
    { label: "Check-in", count: data.checkinHistory.length },
    { label: "Kayıp defteri", count: data.lossLedger.length },
    { label: "Hedef", count: data.goals.length },
    { label: "Sebep kartı", count: data.reasons.length },
    { label: "Acil kişi", count: data.contacts.length },
    { label: "Risk penceresi", count: data.riskWindows.length },
    { label: "Tamamlanan gün", count: data.curriculum.completed.length },
  ];
}

/**
 * Pretty-print the JSON with stable key ordering and 2-space indent —
 * suitable for sharing into Notes/Mail/Files where humans may read it.
 */
export function formatExport(data: ExportedData): string {
  return JSON.stringify(data, null, 2);
}
