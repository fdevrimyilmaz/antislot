import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  calculateSavings,
  formatCurrency,
  getSavingsConfig,
} from "@/store/savingsStore";
import {
  getTodayCheckin,
  saveCheckin,
  type CheckinMood,
} from "@/store/checkinStore";
import { formatLocaleTemplate, getInsightsLocale } from "@/i18n/home";

type SavingsWidgetProps = {
  days: number;
};

type MoodOption = { id: CheckinMood; emoji: string; label: string };

function buildMoodOptions(copy: ReturnType<typeof getInsightsLocale>): MoodOption[] {
  return [
    { id: "kotu", emoji: "\u{1F61E}", label: copy.moodBad },
    { id: "zor", emoji: "\u{1F623}", label: copy.moodHard },
    { id: "idare", emoji: "\u{1F610}", label: copy.moodOkay },
    { id: "iyi", emoji: "\u{1F642}", label: copy.moodGood },
    { id: "harika", emoji: "\u{1F604}", label: copy.moodGreat },
  ];
}

export function SavingsWidget({ days }: SavingsWidgetProps) {
  const { language } = useLanguage();
  const copy = useMemo(() => getInsightsLocale(language), [language]);

  const [dailyAverage, setDailyAverage] = useState(200);
  const [currency, setCurrency] = useState("TRY");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const config = await getSavingsConfig();
        if (active) {
          setDailyAverage(config.dailyAverage);
          setCurrency(config.currency);
        }
      } catch (error) {
        reportError(error, { scope: "savings.load", level: "warning" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = calculateSavings(days, dailyAverage);
  const monthly = calculateSavings(30, dailyAverage);

  return (
    <LinearGradient
      colors={["#0E5C44", "#0A4A37", "#073A2B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.widget}
    >
      <View style={styles.widgetDecor} pointerEvents="none">
        <Ionicons name="wallet" size={90} color="rgba(255,255,255,0.12)" />
      </View>
      <View style={styles.widgetHeader}>
        <View style={[styles.widgetIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Ionicons name="wallet" size={16} color="#FFFFFF" />
        </View>
        <Text style={styles.widgetLabel}>{copy.savingsLabel}</Text>
      </View>
      <Text style={styles.widgetValue}>{formatCurrency(total, currency)}</Text>
      <Text style={styles.widgetHint}>
        {days > 0
          ? formatLocaleTemplate(copy.savingsProgressTemplate, {
              days,
              monthly: formatCurrency(monthly, currency),
            })
          : copy.savingsEmptyHint}
      </Text>
    </LinearGradient>
  );
}

export function DailyCheckinWidget() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const copy = useMemo(() => getInsightsLocale(language), [language]);
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<boolean | null>(null);
  const [urge, setUrge] = useState(5);
  const [mood, setMood] = useState<CheckinMood>("idare");
  const [saving, setSaving] = useState(false);

  const moodOptions = useMemo(() => buildMoodOptions(copy), [copy]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const entry = await getTodayCheckin();
        if (active) setDone(!!entry);
      } catch (error) {
        reportError(error, { scope: "checkin.load", level: "warning" });
        if (active) setDone(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleOpen = () => {
    if (done) {
      haptics.selection();
      toast.info(copy.checkinAlreadyDoneToast);
      return;
    }
    haptics.tapLight();
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCheckin({ urge, mood });
      haptics.success();
      setDone(true);
      setOpen(false);
      toast.success(copy.checkinSavedToast, copy.checkinSavedTitle);
    } catch (error) {
      reportError(error, { scope: "checkin.save" });
      haptics.error();
      toast.error(copy.checkinSaveErrorToast, copy.checkinSaveErrorTitle);
    } finally {
      setSaving(false);
    }
  };

  const activeGradient: readonly [string, string, ...string[]] = done
    ? ["#1E4A38", "#163D2D", "#102E22"]
    : ["#3F578E", "#34467A", "#2A3766"];

  return (
    <>
      <TouchableOpacity activeOpacity={0.88} onPress={handleOpen}>
        <LinearGradient
          colors={activeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.widget}
        >
          <View style={styles.widgetDecor} pointerEvents="none">
            <Ionicons
              name={done ? "checkmark-circle" : "heart"}
              size={90}
              color="rgba(255,255,255,0.12)"
            />
          </View>
          <View style={styles.widgetHeader}>
            <View
              style={[styles.widgetIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}
            >
              <Ionicons name={done ? "checkmark" : "heart"} size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.widgetLabel}>
              {done ? copy.widgetDoneLabel : copy.widgetPendingLabel}
            </Text>
          </View>
          <Text style={styles.widgetValue}>
            {done ? copy.widgetDoneValue : copy.widgetPendingValue}
          </Text>
          <Text style={styles.widgetHint}>
            {done ? copy.widgetDoneHint : copy.widgetPendingHint}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel={copy.closeA11y}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]} accessibilityRole="header">
                {copy.modalTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={copy.closeA11y}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetSub, { color: colors.textMuted }]}> 
              {copy.modalSubtitle}
            </Text>

            <Text style={[styles.scaleLabel, { color: colors.text }]}> 
              {copy.urgeIntensityLabel}:{" "}
              <Text style={{ color: colors.primary, fontWeight: "900" }}>{urge}</Text>/10
            </Text>
            <View style={styles.urgeRow}>
              {Array.from({ length: 11 }).map((_, i) => {
                const isActive = i === urge;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      haptics.selection();
                      setUrge(i);
                    }}
                    style={[
                      styles.urgePip,
                      {
                        backgroundColor: isActive ? colors.primary : `${colors.primary}1F`,
                      },
                    ]}
                    accessibilityRole="adjustable"
                    accessibilityLabel={`${copy.urgeLevelA11yPrefix} ${i}`}
                  >
                    <Text style={[styles.urgePipText, { color: isActive ? "#FFFFFF" : colors.text }]}>
                      {i}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.scaleLabel, { color: colors.text, marginTop: 16 }]}> 
              {copy.overallMoodLabel}
            </Text>
            <View style={styles.moodRow}>
              {moodOptions.map((opt) => {
                const isActive = opt.id === mood;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => {
                      haptics.selection();
                      setMood(opt.id);
                    }}
                    style={[
                      styles.moodOption,
                      {
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                        backgroundColor: isActive ? `${colors.primary}14` : "transparent",
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.moodLabel, { color: colors.text }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title={saving ? copy.saveButtonLoading : copy.saveButtonIdle}
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              variant="primary"
              fullWidth
              leftIcon="checkmark"
              style={styles.saveBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  widget: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 130,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  widgetDecor: {
    position: "absolute",
    right: -18,
    bottom: -18,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  widgetIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  widgetLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  widgetValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  widgetHint: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  sheetSub: { fontSize: 13, lineHeight: 18, marginBottom: 18 },
  scaleLabel: { fontSize: 13, fontWeight: "700", marginBottom: 10 },
  urgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  urgePip: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  urgePipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 4,
  },
  moodOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 11, fontWeight: "700" },
  saveBtn: { marginTop: 18 },
});