import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  formatDays,
  formatHM,
  getActiveWindow,
  type RiskWindow,
  type Weekday,
  useRiskWindowsStore,
} from "@/store/riskWindowsStore";

type Preset = {
  label: string;
  description: string;
  days: Weekday[];
  startHour: number;
  endHour: number;
};

const PRESETS: Preset[] = [
  {
    label: "Hafta sonu geceleri",
    description: "Cuma-Pazar gecesi 21:00-02:00 — en yaygın bahis penceresi.",
    days: [5, 6, 0],
    startHour: 21,
    endHour: 2,
  },
  {
    label: "Maç akşamları",
    description: "Hafta içi 19:00-23:00 — canlı bahis zamanı.",
    days: [1, 2, 3, 4, 5],
    startHour: 19,
    endHour: 23,
  },
  {
    label: "Maaş günü",
    description: "Aylık ödeme sonrası riskli pencere.",
    days: [1, 5],
    startHour: 18,
    endHour: 23,
  },
  {
    label: "Uykusuz geceler",
    description: "Gece geç saatler — dürtü kontrolü en zayıf.",
    days: [0, 1, 2, 3, 4, 5, 6],
    startHour: 0,
    endHour: 5,
  },
];

const DAY_LABELS: { id: Weekday; short: string }[] = [
  { id: 1, short: "Pzt" },
  { id: 2, short: "Sal" },
  { id: 3, short: "Çar" },
  { id: 4, short: "Per" },
  { id: 5, short: "Cum" },
  { id: 6, short: "Cmt" },
  { id: 0, short: "Paz" },
];

export default function RiskWindowsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { windows, hydrated, hydrate, add, remove } = useRiskWindowsStore();

  // Form state for new window.
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<Weekday[]>([]);
  const [startHour, setStartHour] = useState(19);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const activeWindow = useMemo(() => getActiveWindow(windows), [windows]);

  const toggleDay = (d: Weekday) => {
    haptics.selection();
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const applyPreset = (p: Preset) => {
    haptics.tapLight();
    setLabel(p.label);
    setDays(p.days);
    setStartHour(p.startHour);
    setStartMinute(0);
    setEndHour(p.endHour);
    setEndMinute(0);
  };

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    if (trimmedLabel.length < 2) {
      haptics.warning();
      toast.warning("Pencereye kısa bir ad ver.", "Eksik");
      return;
    }
    if (days.length === 0) {
      haptics.warning();
      toast.warning("En az bir gün seç.", "Eksik");
      return;
    }
    if (startHour === endHour && startMinute === endMinute) {
      haptics.warning();
      toast.warning("Başlangıç ve bitiş aynı olamaz.", "Saat hatası");
      return;
    }

    setSaving(true);
    haptics.tapMedium();
    try {
      await add({
        label: trimmedLabel,
        days,
        startHour,
        startMinute,
        endHour,
        endMinute,
      });
      haptics.success();
      toast.success("Risk penceresi eklendi.", "Eklendi");
      setLabel("");
      setDays([]);
      setStartHour(19);
      setStartMinute(0);
      setEndHour(23);
      setEndMinute(0);
    } catch (error) {
      reportError(error, { scope: "risk-windows.add" });
      haptics.error();
      toast.error("Kaydedilemedi.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (w: RiskWindow) => {
    Alert.alert(
      "Pencereyi sil",
      `“${w.label}” silinsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            haptics.tapMedium();
            try {
              await remove(w.id);
              haptics.success();
            } catch (error) {
              reportError(error, { scope: "risk-windows.remove" });
              haptics.error();
            }
          },
        },
      ]
    );
  };

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
            Risk Pencereleri
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            En riskli saat dilimlerini önceden işaretle. Pencere aktifken
            uygulama seni uyarır, SOS hızlandırılır.
          </Text>

          {activeWindow ? (
            <Card
              style={[
                styles.cardSpacing,
                { backgroundColor: `${colors.danger}14`, borderColor: colors.danger },
              ]}
            >
              <View style={styles.activeRow}>
                <Ionicons name="warning" size={20} color={colors.danger} />
                <View style={styles.activeText}>
                  <Text style={[styles.activeTitle, { color: colors.text }]}>
                    Şu an risk penceresinde
                  </Text>
                  <Text style={[styles.activeSub, { color: colors.textMuted }]}>
                    “{activeWindow.label}” — {formatDays(activeWindow.days)} ·{" "}
                    {formatHM(activeWindow.startHour, activeWindow.startMinute)}
                    {"–"}
                    {formatHM(activeWindow.endHour, activeWindow.endMinute)}
                  </Text>
                </View>
              </View>
              <Button
                title="SOS'a Git"
                onPress={() => router.push("/sos")}
                variant="destructive"
                fullWidth
                leftIcon="medkit"
                style={styles.activeBtn}
              />
            </Card>
          ) : null}

          {/* Existing windows */}
          {windows.length > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Kayıtlı pencereler"
                icon="time"
                meta={`${windows.length} tane`}
              />
              {windows.map((w, idx) => (
                <View
                  key={w.id}
                  style={[
                    styles.windowRow,
                    idx < windows.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.windowMain}>
                    <Text style={[styles.windowLabel, { color: colors.text }]}>
                      {w.label}
                    </Text>
                    <Text
                      style={[styles.windowMeta, { color: colors.textMuted }]}
                    >
                      {formatDays(w.days)} ·{" "}
                      {formatHM(w.startHour, w.startMinute)}–
                      {formatHM(w.endHour, w.endMinute)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(w)}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`${w.label} sil`}
                  >
                    <Ionicons name="trash" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          ) : null}

          {/* Presets */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Hazır şablonlar"
              icon="sparkles"
              subtitle="Hızlı başlangıç için klinik gözlemlerden derlenmiş riskli zamanlar."
            />
            <View style={styles.presetList}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  activeOpacity={0.85}
                  onPress={() => applyPreset(p)}
                  style={[
                    styles.presetRow,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label} şablonunu kullan`}
                >
                  <Ionicons
                    name="arrow-forward-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.presetText}>
                    <Text style={[styles.presetLabel, { color: colors.text }]}>
                      {p.label}
                    </Text>
                    <Text
                      style={[styles.presetHint, { color: colors.textMuted }]}
                    >
                      {p.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Add new */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Yeni pencere"
              icon="add-circle"
              subtitle="Manuel bir pencere ekle."
            />
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              Ad
            </Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Örn: Hafta sonu maç gecesi"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
              accessibilityLabel="Pencere adı"
              maxLength={48}
            />

            <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>
              Günler
            </Text>
            <View style={styles.dayRow}>
              {DAY_LABELS.map((d) => {
                const selected = days.includes(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => toggleDay(d.id)}
                    activeOpacity={0.85}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={d.short}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.card,
                        borderColor: selected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        { color: selected ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {d.short}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <TimePicker
                label="Başlangıç"
                hour={startHour}
                minute={startMinute}
                onChange={(h, m) => {
                  setStartHour(h);
                  setStartMinute(m);
                }}
              />
              <TimePicker
                label="Bitiş"
                hour={endHour}
                minute={endMinute}
                onChange={(h, m) => {
                  setEndHour(h);
                  setEndMinute(m);
                }}
              />
            </View>

            <Text style={[styles.crossNote, { color: colors.textMuted }]}>
              Bitiş başlangıçtan küçükse pencere gece yarısını geçer
              (örn: 22:00–02:00).
            </Text>

            <Button
              title={saving ? "Kaydediliyor" : "Pencere ekle"}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              variant="primary"
              fullWidth
              leftIcon="add"
              style={styles.addBtn}
            />
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
                Bu özellik dış uygulamaları engellemez. Pencere aktifken
                uygulama içinde uyarı çıkar ve SOS yolu kısalır.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type TimePickerProps = {
  label: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
};

function TimePicker({ label, hour, minute, onChange }: TimePickerProps) {
  const { colors } = useTheme();

  const stepHour = (delta: number) => {
    haptics.selection();
    onChange((hour + 24 + delta) % 24, minute);
  };
  const stepMinute = (delta: number) => {
    haptics.selection();
    let m = minute + delta;
    let h = hour;
    if (m >= 60) {
      m = 0;
      h = (h + 1) % 24;
    } else if (m < 0) {
      m = 45;
      h = (h + 23) % 24;
    }
    onChange(h, m);
  };

  return (
    <View
      style={[
        styles.timePicker,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <Text style={[styles.timePickerLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <View style={styles.timeControls}>
        <View style={styles.timeStepper}>
          <TouchableOpacity
            onPress={() => stepHour(-1)}
            style={[styles.stepBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel={`${label} saat azalt`}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.timeValue, { color: colors.text }]}>
            {String(hour).padStart(2, "0")}
          </Text>
          <TouchableOpacity
            onPress={() => stepHour(1)}
            style={[styles.stepBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel={`${label} saat artır`}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
        <View style={styles.timeStepper}>
          <TouchableOpacity
            onPress={() => stepMinute(-15)}
            style={[styles.stepBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel={`${label} dakika azalt`}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.timeValue, { color: colors.text }]}>
            {String(minute).padStart(2, "0")}
          </Text>
          <TouchableOpacity
            onPress={() => stepMinute(15)}
            style={[styles.stepBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel={`${label} dakika artır`}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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

  activeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  activeText: { flex: 1, minWidth: 0 },
  activeTitle: { fontSize: 15, fontWeight: "800" },
  activeSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  activeBtn: { marginTop: 12 },

  windowRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  windowMain: { flex: 1, minWidth: 0 },
  windowLabel: { fontSize: 15, fontWeight: "800" },
  windowMeta: { fontSize: 12, marginTop: 3 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  presetList: { gap: 10 },
  presetRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: { flex: 1, minWidth: 0 },
  presetLabel: { fontSize: 14, fontWeight: "800" },
  presetHint: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  fieldLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayChipText: { fontSize: 13, fontWeight: "800" },

  timeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  timePicker: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  timePickerLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  timeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "900",
    minWidth: 28,
    textAlign: "center",
  },
  timeColon: { fontSize: 18, fontWeight: "900" },

  crossNote: { fontSize: 11, lineHeight: 15, marginTop: 10 },
  addBtn: { marginTop: 14 },

  warningRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warningText: { fontSize: 12, lineHeight: 18, flex: 1 },
});
