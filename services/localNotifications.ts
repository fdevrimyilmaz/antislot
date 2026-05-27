import Constants from "expo-constants";
import { Platform } from "react-native";

import type { RiskWindow } from "@/store/riskWindowsStore";

/**
 * Local (on-device) notification scheduler.
 *
 * Separate from `services/notifications.ts` (which deals with REMOTE push
 * tokens). Local notifications don't require Expo push credentials — they
 * are scheduled by the OS itself based on a trigger we hand it. Each
 * helper here cancels its category before re-scheduling so we never
 * accumulate duplicates.
 *
 * Categories (used as identifier prefixes):
 *   - "rw_<windowId>_<weekday>" → fires at the start of each risk window
 *   - "checkin"                 → daily morning check-in nudge
 */

type NotificationsModule = typeof import("expo-notifications");

const log = (...args: unknown[]) => {
  if (__DEV__) console.log("[LocalNotifications]", ...args);
};

let cachedModule: NotificationsModule | null | undefined;
let modulePromise: Promise<NotificationsModule | null> | null = null;

function isExpoGo(): boolean {
  const appOwnership = (Constants as { appOwnership?: string | null }).appOwnership;
  const env =
    (Constants as { executionEnvironment?: string | null }).executionEnvironment ?? "";
  return appOwnership === "expo" || env.toLowerCase() === "storeclient";
}

async function getModule(): Promise<NotificationsModule | null> {
  if (cachedModule !== undefined) return cachedModule;
  if (modulePromise) return modulePromise;
  if (Platform.OS === "web" || isExpoGo()) {
    cachedModule = null;
    return cachedModule;
  }

  modulePromise = import("expo-notifications")
    .then((mod) => {
      cachedModule = mod as NotificationsModule;
      return cachedModule;
    })
    .catch((error) => {
      log("expo-notifications import error:", error);
      cachedModule = null;
      return null;
    })
    .finally(() => {
      modulePromise = null;
    });

  return modulePromise;
}

export type LocalPermissionStatus = "granted" | "denied" | "undetermined" | "unsupported";

export async function ensureLocalPermission(): Promise<LocalPermissionStatus> {
  const Notifications = await getModule();
  if (!Notifications) return "unsupported";

  try {
    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch (error) {
    log("permission error:", error);
    return "unsupported";
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const Notifications = await getModule();
  if (!Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync("antislot-default", {
      name: "Antislot",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: "#1D4C72",
    });
  } catch (error) {
    log("channel error:", error);
  }
}

/** Cancel every scheduled notification whose identifier starts with `prefix`. */
async function cancelByPrefix(prefix: string): Promise<void> {
  const Notifications = await getModule();
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((s) => typeof s.identifier === "string" && s.identifier.startsWith(prefix))
        .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier))
    );
  } catch (error) {
    log(`cancel(${prefix}) error:`, error);
  }
}

/**
 * Re-schedule weekly reminders for every risk window. Pass an empty array
 * to clear all reminders. expo-notifications uses 1=Sunday..7=Saturday;
 * our store uses 0=Sunday..6=Saturday, hence the `+ 1`.
 */
export async function rescheduleRiskWindowReminders(windows: RiskWindow[]): Promise<void> {
  const Notifications = await getModule();
  if (!Notifications) return;

  await cancelByPrefix("rw_");
  if (windows.length === 0) return;

  await ensureAndroidChannel();

  for (const w of windows) {
    for (const day of w.days) {
      const id = `rw_${w.id}_${day}`;
      try {
        // Cast to any: expo-notifications trigger shapes have shifted across
        // SDK versions. The legacy weekly trigger ({weekday,hour,minute,
        // repeats:true}) is universally accepted; we keep it explicit here.
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: "Risk penceresi başladı",
            body: `${w.label} · şimdi nazik ol, SOS uzakta değil.`,
            sound: "default",
          },
          trigger: {
            weekday: day + 1,
            hour: w.startHour,
            minute: w.startMinute,
            repeats: true,
          } as any,
        });
      } catch (error) {
        log(`schedule rw ${id} error:`, error);
      }
    }
  }
}

/**
 * Re-schedule the daily check-in. Pass `null` to clear it.
 */
export async function rescheduleDailyCheckin(
  time: { hour: number; minute: number } | null
): Promise<void> {
  const Notifications = await getModule();
  if (!Notifications) return;

  await cancelByPrefix("checkin");
  if (!time) return;

  await ensureAndroidChannel();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: "checkin",
      content: {
        title: "Günlük check-in",
        body: "Dürtü, ruh hali ve niyetini 30 saniyede kaydet.",
        sound: "default",
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      } as any,
    });
  } catch (error) {
    log("schedule checkin error:", error);
  }
}

export type ReverseDebtReminderResult =
  | { status: "scheduled"; triggerAt: Date }
  | { status: Exclude<LocalPermissionStatus, "granted"> };

/**
 * Schedule a one-off reminder used by the reverse-debt simulation module.
 * Existing reverse-debt reminders are replaced so only one is active.
 *
 * Pass `triggerAt` to fire at a specific wall-clock time (e.g. the
 * `finishAt` displayed in the result card). Otherwise we fall back to
 * `now + workHours`, which can drift if the user delays before tapping.
 *
 * Sec floor is 60 to avoid instant-fire weirdness when the alarm time has
 * essentially already passed.
 */
export async function scheduleReverseDebtReminder(params: {
  amount: number;
  workHours: number;
  currency?: string;
  triggerAt?: Date;
}): Promise<ReverseDebtReminderResult> {
  const permission = await ensureLocalPermission();
  if (permission !== "granted") {
    return { status: permission };
  }

  const Notifications = await getModule();
  if (!Notifications) {
    return { status: "unsupported" };
  }

  const currency = (params.currency ?? "TL").trim() || "TL";
  const amount = Math.max(0, Math.round(params.amount));
  const workHours = Math.max(0.1, params.workHours);
  const secondsFromTrigger = params.triggerAt
    ? Math.round((params.triggerAt.getTime() - Date.now()) / 1000)
    : Math.round(workHours * 3600);
  const seconds = Math.max(60, secondsFromTrigger);
  const triggerAt = new Date(Date.now() + seconds * 1000);
  const hoursLabel = Number.isInteger(workHours)
    ? String(workHours)
    : workHours.toFixed(1).replace(".", ",");

  await cancelByPrefix("reverse_debt");
  await ensureAndroidChannel();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `reverse_debt_${Date.now()}`,
      content: {
        title: "Tersine borç hatırlatması",
        body: `${amount} ${currency} için ${hoursLabel} saatlik emek süresi doldu. Bu parayı çalışarak kazandığın hissi hatırla.`,
        sound: "default",
      },
      // Use the modern typed trigger shape — earlier `{ seconds }` worked
      // pre-SDK 50 but the typed form is now canonical and survives SDK
      // upgrades cleanly.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });
    return { status: "scheduled", triggerAt };
  } catch (error) {
    log("schedule reverse debt error:", error);
    return { status: "unsupported" };
  }
}

/** Cancel any pending reverse-debt reminder. Safe to call when none scheduled. */
export async function cancelReverseDebtReminder(): Promise<void> {
  await cancelByPrefix("reverse_debt");
}

/** Convenience: clear everything we manage. */
export async function clearAllLocalSchedules(): Promise<void> {
  await Promise.all([
    cancelByPrefix("rw_"),
    cancelByPrefix("checkin"),
    cancelByPrefix("reverse_debt"),
  ]);
}
