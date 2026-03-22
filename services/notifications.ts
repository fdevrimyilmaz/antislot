import Constants from "expo-constants";
import { Platform } from "react-native";

import { ENABLE_NOTIFICATIONS } from "@/constants/featureFlags";

type NotificationPermissionStatus = "undetermined" | "denied" | "granted";
type NotificationsModule = typeof import("expo-notifications");

export type NotificationCode = "no_token" | "permission_denied" | "not_supported" | "error";

export type NotificationResult = {
  ok: boolean;
  code?: NotificationCode;
  message?: string;
  data?: {
    token?: string;
    status?: NotificationPermissionStatus;
  };
};

export type NotificationDiagnostics = {
  enabled: boolean;
  permissionStatus: NotificationPermissionStatus | "disabled" | "error" | "not_supported";
  tokenPresent: boolean;
  message?: string;
};

export type LocalNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
};

let cachedToken: string | null = null;
let notificationsModuleCache: NotificationsModule | null | undefined;
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

const log = (...args: unknown[]) => {
  if (__DEV__) {
    console.log("[Notifications]", ...args);
  }
};

const toMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error ?? "Unknown error");
};

function isExpoGo(): boolean {
  const appOwnership = (Constants as { appOwnership?: string | null }).appOwnership;
  const executionEnvironment =
    (Constants as { executionEnvironment?: string | null }).executionEnvironment ?? "";
  return appOwnership === "expo" || executionEnvironment.toLowerCase() === "storeclient";
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (notificationsModuleCache !== undefined) return notificationsModuleCache;
  if (notificationsModulePromise) return notificationsModulePromise;

  if (isExpoGo()) {
    notificationsModuleCache = null;
    return notificationsModuleCache;
  }

  notificationsModulePromise = import("expo-notifications")
    .then((mod) => {
      notificationsModuleCache = mod as NotificationsModule;
      return notificationsModuleCache;
    })
    .catch((error) => {
      log("expo-notifications import error:", error);
      notificationsModuleCache = null;
      return null;
    })
    .finally(() => {
      notificationsModulePromise = null;
    });

  return notificationsModulePromise;
}

function notSupportedInExpoGoMessage(): string {
  return "Expo Go SDK 53+ remote notifications desteklemez. Development build kullanin.";
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1D4C72",
    });
  } catch (error) {
    log("setNotificationChannelAsync error:", error);
  }
}

export async function getNotificationDiagnostics(): Promise<NotificationDiagnostics> {
  if (!ENABLE_NOTIFICATIONS) {
    return { enabled: false, permissionStatus: "disabled", tokenPresent: false };
  }
  if (Platform.OS === "web") {
    return { enabled: false, permissionStatus: "not_supported", tokenPresent: false };
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return {
      enabled: false,
      permissionStatus: "not_supported",
      tokenPresent: false,
      message: notSupportedInExpoGoMessage(),
    };
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    return {
      enabled: true,
      permissionStatus: permissions.status as NotificationPermissionStatus,
      tokenPresent: Boolean(cachedToken),
    };
  } catch (error) {
    return {
      enabled: true,
      permissionStatus: "error",
      tokenPresent: false,
      message: toMessage(error),
    };
  }
}

export async function registerForPushNotifications(): Promise<NotificationResult> {
  if (!ENABLE_NOTIFICATIONS) {
    return {
      ok: false,
      code: "not_supported",
      message: "Bildirimler devre disi.",
    };
  }
  if (Platform.OS === "web") {
    return {
      ok: false,
      code: "not_supported",
      message: "Push bildirimleri webde desteklenmiyor.",
    };
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return {
      ok: false,
      code: "not_supported",
      message: notSupportedInExpoGoMessage(),
    };
  }

  try {
    let status = (await Notifications.getPermissionsAsync())
      .status as NotificationPermissionStatus;
    if (status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status as NotificationPermissionStatus;
    }

    if (status !== "granted") {
      return {
        ok: false,
        code: "permission_denied",
        message: "Bildirim izni verilmedi.",
      };
    }

    await ensureAndroidChannel();

    const projectId =
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId;

    let tokenResponse: { data?: string } | undefined;
    try {
      tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
    } catch (error) {
      return {
        ok: false,
        code: "no_token",
        message: toMessage(error),
      };
    }

    const token = tokenResponse?.data;
    if (!token) {
      return {
        ok: false,
        code: "no_token",
        message: "Push token alinmadi.",
      };
    }

    cachedToken = token;
    return { ok: true, data: { token, status } };
  } catch (error) {
    return {
      ok: false,
      code: "error",
      message: toMessage(error),
    };
  }
}

export async function sendLocalNotification(payload: LocalNotificationPayload): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === "web") {
    return false;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== "granted") {
      return false;
    }

    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title.trim(),
        body: payload.body.trim(),
        sound: "default",
        data: payload.data,
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    log("sendLocalNotification error:", error);
    return false;
  }
}
