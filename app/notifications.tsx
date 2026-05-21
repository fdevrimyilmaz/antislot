import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { useNotifPrefsStore } from "@/store/notificationsPrefsStore";
import { useRiskWindowsStore } from "@/store/riskWindowsStore";
import {
  ensureLocalPermission,
  rescheduleDailyCheckin,
  rescheduleRiskWindowReminders,
  type LocalPermissionStatus,
} from "@/services/localNotifications";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { prefs, hydrated, hydrate, setPrefs } = useNotifPrefsStore();
  const riskWindows = useRiskWindowsStore((s) => s.windows);

  const [permission, setPermission] = useState<LocalPermissionStatus | "checking">(
    "checking"
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    (async () => {
      try {
        // Just peek at the current grant; don't request unless user toggles on.
        const Notifications = await import("expo-notifications").catch(() => null);
        if (!Notifications) {
          setPermission("unsupported");
          return;
        }
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(
          status === "granted"
            ? "granted"
            : status === "denied"
            ? "denied"
            : "undetermined"
        );
      } catch {
        setPermission("unsupported");
      }
    })();
  }, []);

  const ensureGrant = async (): Promise<boolean> => {
    const result = await ensureLocalPermission();
    setPermission(result);
    if (result === "granted") return true;
    if (result === "unsupported") {
      toast.warning(
        "Bu cihazda yerel bildirimler kullanılamıyor.",
        "Desteklenmiyor"
      );
      return false;
    }
    toast.warning(
      "Bildirim izni verilmedi. Ayarlardan açabilirsin.",
      "İzin Yok"
    );
    return false;
  };

  const handleToggleRisk = async (value: boolean) => {
    haptics.selection();
    setBusy(true);
    try {
      if (value) {
        const ok = await ensureGrant();
        if (!ok) return;
        await rescheduleRiskWindowReminders(riskWindows);
        await setPrefs({ riskRemindersEnabled: true });
        haptics.success();
        toast.success(
          `${riskWindows.length} risk penceresi için hatırlatıcı kuruldu.`,
          "Açıldı"
        );
      } else {
        await rescheduleRiskWindowReminders([]);
        await setPrefs({ riskRemindersEnabled: false });
        haptics.success();
        toast.success("Risk hatırlatıcıları kapatıldı.", "Kapatıldı");
      }
    } catch (error) {
      reportError(error, { scope: "notifications.toggleRisk" });
      haptics.error();
      toast.error("Değişiklik uygulanamadı.", "Hata");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleCheckin = async (value: boolean) => {
    haptics.selection();
    setBusy(true);
    try {
      if (value) {
        const ok = await ensureGrant();
        if (!ok) return;
        await rescheduleDailyCheckin({
          hour: prefs.checkinHour,
          minute: prefs.checkinMinute,
        });
        await setPrefs({ checkinEnabled: true });
        haptics.success();
        toast.success(
          `Her gün ${pad(prefs.checkinHour)}:${pad(prefs.checkinMinute)} için hatırlatıcı kuruldu.`,
          "Açıldı"
        );
      } else {
        await rescheduleDailyCheckin(null);
        await setPrefs({ checkinEnabled: false });
        haptics.success();
        toast.success("Günlük hatırlatıcı kapatıldı.", "Kapatıldı");
      }
    } catch (error) {
      reportError(error, { scope: "notifications.toggleCheckin" });
      haptics.error();
      toast.error("Değişiklik uygulanamadı.", "Hata");
    } finally {
      setBusy(false);
    }
  };

  const handleAdjustTime = async (deltaHour: number, deltaMinute: number) => {
    haptics.selection();
    const nextHour = (prefs.checkinHour + 24 + deltaHour) % 24;
    let nextMinute = prefs.checkinMinute + deltaMinute;
    let carryHour = nextHour;
    if (nextMinute >= 60) {
      nextMinute -= 60;
      carryHour = (carryHour + 1) % 24;
    } else if (nextMinute < 0) {
      nextMinute += 60;
      carryHour = (carryHour + 23) % 24;
    }
    await setPrefs({ checkinHour: carryHour, checkinMinute: nextMinute });
    // If the user has check-ins enabled, immediately re-schedule.
    if (prefs.checkinEnabled) {
      try {
        await rescheduleDailyCheckin({ hour: carryHour, minute: nextMinute });
      } catch (error) {
        reportError(error, { scope: "notifications.adjustTime" });
      }
    }
  };

  const permissionLine = (() => {
    switch (permission) {
      case "checking":
        return "İzin durumu kontrol ediliyor…";
      case "granted":
        return "Bildirim izni verildi.";
      case "denied":
        return "Bildirim izni reddedildi. Cihaz ayarlarından aç.";
      case "undetermined":
        return "Bildirim izni henüz istenmedi.";
      case "unsupported":
      default:
        return Platform.OS === "web"
          ? "Web sürümünde yerel bildirimler desteklenmiyor."
          : "Bu derlemede yerel bildirimler desteklenmiyor (Expo Go).";
    }
  })();

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Bildirimler
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Cihazında yerel olarak çalışan hatırlatıcılar. Sunucuya bağlanmaz,
            kişisel veri dışarı çıkmaz.
          </Text>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="İzin durumu"
              icon="shield-checkmark"
              subtitle={permissionLine}
            />
            {permission === "denied" ? (
              <Button
                title="Sistem ayarlarını aç"
                onPress={() => Linking.openSettings().catch(() => undefined)}
                variant="secondary"
                fullWidth
                leftIcon="open"
                style={styles.actionBtn}
              />
            ) : null}
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Risk penceresi hatırlatıcısı"
              icon="time"
              subtitle="Her risk penceresinin başlangıcında bildirim gönderir."
            />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  Açık
                </Text>
                <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                  {riskWindows.length === 0
                    ? "Önce Risk Pencereleri ekranından bir pencere tanımla."
                    : `${riskWindows.length} pencere için kurulu.`}
                </Text>
              </View>
              <Switch
                value={prefs.riskRemindersEnabled}
                onValueChange={handleToggleRisk}
                disabled={busy || riskWindows.length === 0}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Risk penceresi hatırlatıcısı"
              />
            </View>
            {riskWindows.length === 0 ? (
              <Button
                title="Risk Pencereleri'ne git"
                onPress={() => router.push("/risk-windows" as never)}
                variant="ghost"
                fullWidth
                leftIcon="arrow-forward"
                style={styles.actionBtn}
              />
            ) : null}
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Günlük check-in"
              icon="sunny"
              subtitle="Sabah dürtü, ruh hali ve niyet kaydı için kısa bir hatırlatma."
            />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  Açık
                </Text>
                <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                  Her gün {pad(prefs.checkinHour)}:{pad(prefs.checkinMinute)}
                </Text>
              </View>
              <Switch
                value={prefs.checkinEnabled}
                onValueChange={handleToggleCheckin}
                disabled={busy}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Günlük check-in hatırlatıcısı"
              />
            </View>

            <View style={styles.timeBlock}>
              <View style={styles.timeBlockHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  Saat
                </Text>
                <View style={styles.stepperRow}>
                  <StepBtn
                    icon="remove"
                    onPress={() => handleAdjustTime(-1, 0)}
                    color={colors.primary}
                  />
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {pad(prefs.checkinHour)}
                  </Text>
                  <StepBtn
                    icon="add"
                    onPress={() => handleAdjustTime(1, 0)}
                    color={colors.primary}
                  />
                </View>
              </View>
              <View style={styles.timeBlockHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  Dakika
                </Text>
                <View style={styles.stepperRow}>
                  <StepBtn
                    icon="remove"
                    onPress={() => handleAdjustTime(0, -15)}
                    color={colors.primary}
                  />
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {pad(prefs.checkinMinute)}
                  </Text>
                  <StepBtn
                    icon="add"
                    onPress={() => handleAdjustTime(0, 15)}
                    color={colors.primary}
                  />
                </View>
              </View>
            </View>
          </Card>

          <Card
            style={[
              styles.cardSpacing,
              { backgroundColor: `${colors.warning}14` },
            ]}
          >
            <View style={styles.warningRow}>
              <Ionicons name="information-circle" size={18} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Hatırlatıcılar tamamen cihazında çalışır. Telefon yeniden
                başlatıldığında planlananlar korunur, internet bağlantısı
                gerekmez.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function StepBtn({
  icon,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.stepBtn, { backgroundColor: `${color}14` }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={16} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },
  cardSpacing: { marginBottom: 14 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowText: { flex: 1, minWidth: 0, paddingRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: "800" },
  rowHint: { fontSize: 12, marginTop: 3 },

  actionBtn: { marginTop: 10 },

  fieldLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  timeBlock: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  timeBlockHalf: { flex: 1, alignItems: "center" },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    fontSize: 20,
    fontWeight: "900",
    minWidth: 36,
    textAlign: "center",
  },

  warningRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warningText: { fontSize: 12, lineHeight: 18, flex: 1 },
});
