import * as Haptics from "expo-haptics";

type HapticKind =
  | "selection"
  | "impactLight"
  | "impactMedium"
  | "impactHeavy"
  | "success"
  | "warning"
  | "error";

function trigger(kind: HapticKind): void {
  try {
    switch (kind) {
      case "selection":
        void Haptics.selectionAsync();
        return;
      case "impactLight":
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case "impactMedium":
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case "impactHeavy":
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case "success":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case "warning":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      case "error":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
    }
  } catch {
    // Haptics are best-effort. Older devices, simulators, or web platform
    // may throw; we never want to surface this to the caller.
  }
}

export const haptics = {
  selection: () => trigger("selection"),
  tapLight: () => trigger("impactLight"),
  tapMedium: () => trigger("impactMedium"),
  tapHeavy: () => trigger("impactHeavy"),
  success: () => trigger("success"),
  warning: () => trigger("warning"),
  error: () => trigger("error"),
};
