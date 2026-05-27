import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { haptics } from "@/services/haptics";
import {
  getTodayCheckin,
  saveCheckin,
  type CheckinMood,
} from "@/store/checkinStore";
import { reportError } from "@/services/monitoring";
import { GlassCard } from "./glass-card";
import { Type, Space } from "./tokens";

/**
 * Inline emotional check-in for the Home screen.
 *
 * Design rationale: the previous home opened a full modal sheet for this,
 * which is more friction than the value justifies in a crisis-prone app.
 * Five emoji taps, no modal, no slider. We pre-bind urge to the mood's
 * canonical value (sad→8, hard→6, ok→4, good→2, great→1) so the data
 * model stays compatible with the existing diary aggregations.
 *
 * When already done, the card collapses to a single warm confirmation
 * line — never blank, never noisy.
 */
const OPTIONS: { id: CheckinMood; emoji: string; urge: number; label: string }[] = [
  { id: "kotu", emoji: "\u{1F61E}", urge: 8, label: "kötü" },
  { id: "zor", emoji: "\u{1F623}", urge: 6, label: "zor" },
  { id: "idare", emoji: "\u{1F610}", urge: 4, label: "idare" },
  { id: "iyi", emoji: "\u{1F642}", urge: 2, label: "iyi" },
  { id: "harika", emoji: "\u{1F604}", urge: 1, label: "harika" },
];

export function EmotionalCheckin() {
  const { colors } = useTheme();
  const [done, setDone] = useState<CheckinMood | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const entry = await getTodayCheckin();
      setDone(entry?.mood ?? null);
    } catch (error) {
      reportError(error, { scope: "calm.checkin.load", level: "warning" });
      setDone(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-check when home regains focus — user may have completed it elsewhere.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handlePick = async (option: (typeof OPTIONS)[number]) => {
    haptics.selection();
    setDone(option.id);
    try {
      await saveCheckin({ urge: option.urge, mood: option.id });
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "calm.checkin.save" });
      haptics.error();
      setDone(null);
    }
  };

  if (done === undefined) {
    // First-paint placeholder — collapsed silent skeleton so the layout
    // doesn't jump.
    return <GlassCard style={styles.cardLoading} />;
  }

  if (done) {
    const picked = OPTIONS.find((o) => o.id === done);
    return (
      <GlassCard>
        <Text style={[Type.caption, { color: colors.textMuted }]}>
          BUGÜN
        </Text>
        <Text
          style={[
            Type.subtitle,
            styles.doneLine,
            { color: colors.text, fontWeight: "600" },
          ]}
        >
          {picked?.emoji}  Kendini “{picked?.label}” hissettin.
        </Text>
        <Text style={[Type.subtitle, { color: colors.textMuted, marginTop: Space.xs }]}>
          Bu his geçici. Bugünü olduğun gibi karşıladığın için iyi yaptın.
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Text style={[Type.caption, { color: colors.textMuted }]}>
        DUYGUSAL KONTROL
      </Text>
      <Text
        style={[
          Type.subtitle,
          styles.prompt,
          { color: colors.text, fontWeight: "600" },
        ]}
      >
        Bugün nasıl hissediyorsun?
      </Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => handlePick(opt)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            style={[
              styles.option,
              {
                backgroundColor: `${colors.primary}14`,
                borderColor: `${colors.primary}26`,
              },
            ]}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  cardLoading: { minHeight: 96 },
  prompt: { marginTop: Space.sm, marginBottom: Space.lg },
  doneLine: { marginTop: Space.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Space.sm,
  },
  option: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  emoji: { fontSize: 28 },
});
