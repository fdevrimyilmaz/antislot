import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useProgressStore } from "@/store/progressStore";
import { useCurriculumStore } from "@/store/curriculumStore";
import { useRiskWindowsStore } from "@/store/riskWindowsStore";
import {
  formatRemaining,
  isLockoutActive,
  remainingMs,
  useLockoutStore,
} from "@/store/lockoutStore";
import {
  calculateSavings,
  formatCurrency,
  getSavingsConfig,
} from "@/store/savingsStore";
import { TOTAL_DAYS } from "@/app/data/recoveryCurriculum";

/**
 * "Senin durumun" header card for the Settings screen. Aggregates the
 * user's most relevant state numbers in one glance — streak, savings,
 * curriculum progress, and a count of active commitments.
 */
export function ProfileSummary() {
  const { colors } = useTheme();
  const gamblingFreeDays = useProgressStore((s) => s.gamblingFreeDays);
  const curriculum = useCurriculumStore((s) => s.state);
  const riskWindows = useRiskWindowsStore((s) => s.windows);
  const lockoutState = useLockoutStore((s) => s.state);

  const [dailyAverage, setDailyAverage] = useState(200);
  const [currency, setCurrency] = useState("₺");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const config = await getSavingsConfig();
        if (active) {
          setDailyAverage(config.dailyAverage);
          setCurrency(config.currency);
        }
      } catch {
        // best-effort; defaults are fine
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;
  const savedAmount = useMemo(
    () => calculateSavings(safeDays, dailyAverage),
    [safeDays, dailyAverage]
  );
  const savedLabel = useMemo(
    () => formatCurrency(savedAmount, currency),
    [savedAmount, currency]
  );

  const curriculumPct = Math.round(
    (curriculum.completed.length / TOTAL_DAYS) * 100
  );

  const lockoutActive = isLockoutActive(lockoutState);
  const lockoutRemain = lockoutActive ? formatRemaining(remainingMs(lockoutState)) : null;

  // Active commitments line items
  const commitments = useMemo(() => {
    const items: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }[] = [];
    if (lockoutActive && lockoutRemain) {
      items.push({ icon: "lock-closed", text: `Öz-Kısıtlama — ${lockoutRemain}` });
    }
    if (riskWindows.length > 0) {
      items.push({
        icon: "time",
        text: `${riskWindows.length} risk penceresi aktif`,
      });
    }
    if (curriculum.startedAt !== null) {
      items.push({
        icon: "leaf",
        text: `30 Günlük Yol — ${curriculum.completed.length}/${TOTAL_DAYS}`,
      });
    }
    return items;
  }, [lockoutActive, lockoutRemain, riskWindows.length, curriculum]);

  return (
    <LinearGradient
      colors={colors.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.decor} pointerEvents="none">
        <Ionicons name="person-circle" size={120} color="rgba(255,255,255,0.10)" />
      </View>

      <Text style={styles.label}>SENİN DURUMUN</Text>

      <View style={styles.kpiRow}>
        <Kpi big={String(safeDays)} small="gün" />
        <View style={styles.kpiDivider} />
        <Kpi big={savedLabel} small="tasarruf" />
        <View style={styles.kpiDivider} />
        <Kpi big={`${curriculumPct}%`} small="yol" />
      </View>

      {commitments.length > 0 ? (
        <View style={styles.commitments}>
          {commitments.map((c, i) => (
            <View key={i} style={styles.commitRow}>
              <Ionicons name={c.icon} size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.commitText} numberOfLines={1}>
                {c.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}

function Kpi({ big, small }: { big: string; small: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiBig} numberOfLines={1} adjustsFontSizeToFit>
        {big}
      </Text>
      <Text style={styles.kpiSmall}>{small}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    marginBottom: 14,
  },
  decor: {
    position: "absolute",
    right: -20,
    top: -20,
  },
  label: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  kpi: { flex: 1, alignItems: "center" },
  kpiBig: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  kpiSmall: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: 6,
  },
  commitments: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    gap: 6,
  },
  commitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commitText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
});
