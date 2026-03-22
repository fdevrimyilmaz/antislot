import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRESETS = [60, 120, 180] as const;
const GROUNDING_STEPS = [
  "sey gor",
  "seye dokun",
  "ses dinle",
  "koku fark et",
  "tat fark et",
] as const;

function formatSeconds(totalSeconds: number) {
  const minute = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const second = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

export function ProfessionalMindfulnessPlugins() {
  const [selectedPreset, setSelectedPreset] = useState<number>(120);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(120);
  const [timerRunning, setTimerRunning] = useState(false);
  const [grounding, setGrounding] = useState<boolean[]>(new Array(GROUNDING_STEPS.length).fill(false));

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const phase = useMemo(() => {
    if (remainingSeconds === 0) return "Tur tamamlandi";
    const elapsed = selectedPreset - remainingSeconds;
    const cyclePosition = elapsed % 10;
    return cyclePosition < 4 ? "Nefes al" : "Nefes ver";
  }, [remainingSeconds, selectedPreset]);

  const handlePreset = (preset: number) => {
    setSelectedPreset(preset);
    setRemainingSeconds(preset);
    setTimerRunning(false);
  };

  const handleTimerToggle = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(selectedPreset);
      setTimerRunning(true);
      return;
    }
    setTimerRunning((previous) => !previous);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setRemainingSeconds(selectedPreset);
  };

  const toggleGrounding = (index: number) => {
    setGrounding((previous) => previous.map((item, itemIndex) => (itemIndex === index ? !item : item)));
  };

  const resetGrounding = () => {
    setGrounding(new Array(GROUNDING_STEPS.length).fill(false));
  };

  const allGroundingDone = grounding.every(Boolean);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Profesyonel Eklentiler</Text>
      <Text style={styles.sectionSubtitle}>Anlik dengeleme icin hizli calisan araclar</Text>

      <View style={styles.pluginCard}>
        <Text style={styles.pluginTitle}>Nefes Ritmi Zamanlayicisi</Text>
        <Text style={styles.pluginSubtitle}>4 saniye al, 6 saniye ver dongusunu takip et</Text>
        <View style={styles.presetRow}>
          {PRESETS.map((preset) => {
            const selected = preset === selectedPreset;
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.presetButton, selected && styles.presetButtonActive]}
                onPress={() => handlePreset(preset)}
              >
                <Text style={[styles.presetButtonText, selected && styles.presetButtonTextActive]}>{`${preset / 60} dk`}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.timerValue}>{formatSeconds(remainingSeconds)}</Text>
        <Text style={styles.timerPhase}>{phase}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTimerToggle} testID="mindfulness-plugin-breath-toggle">
            <Text style={styles.primaryButtonText}>{timerRunning ? "Duraklat" : "Baslat"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTimerReset}>
            <Text style={styles.secondaryButtonText}>Sifirla</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pluginCard}>
        <Text style={styles.pluginTitle}>5-4-3-2-1 Grounding</Text>
        <Text style={styles.pluginSubtitle}>Dikkatini simdiye geri getir</Text>
        {GROUNDING_STEPS.map((step, index) => {
          const active = grounding[index];
          return (
            <TouchableOpacity key={`${step}-${index}`} style={styles.groundingRow} onPress={() => toggleGrounding(index)}>
              <Text style={[styles.groundingCheck, active && styles.groundingCheckActive]}>{active ? "[x]" : "[ ]"}</Text>
              <Text style={styles.groundingText}>{`${GROUNDING_STEPS.length - index} ${step}`}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.actionRow}>
          <Text style={styles.statusText}>{allGroundingDone ? "Tamamlandi" : "Devam ediyor"}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetGrounding}>
            <Text style={styles.secondaryButtonText}>Yeniden Baslat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButtonDanger} onPress={() => router.push("/sos")}>
          <Text style={styles.quickButtonText}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push("/urge")}>
          <Text style={styles.quickButtonText}>Durtu Destegi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1D4C72", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#667", marginBottom: 10 },
  pluginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5EDF7",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pluginTitle: { fontSize: 15, fontWeight: "800", color: "#1D4C72", marginBottom: 4 },
  pluginSubtitle: { fontSize: 13, color: "#50617A", marginBottom: 10 },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  presetButton: {
    borderWidth: 1,
    borderColor: "#CFE0F2",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#F3F8FE",
  },
  presetButtonActive: { backgroundColor: "#1D4C72", borderColor: "#1D4C72" },
  presetButtonText: { color: "#1D4C72", fontWeight: "700", fontSize: 12 },
  presetButtonTextActive: { color: "#FFFFFF" },
  timerValue: { fontSize: 32, textAlign: "center", color: "#1A2433", fontWeight: "900", marginTop: 2 },
  timerPhase: { fontSize: 13, textAlign: "center", color: "#5B6E87", marginBottom: 10 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#1D4C72",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#E8F0F8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#1D4C72", fontWeight: "700" },
  groundingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D9E4F2",
  },
  groundingCheck: { color: "#8A9BB2", fontSize: 12, width: 24 },
  groundingCheckActive: { color: "#1D4C72" },
  groundingText: { color: "#334155", fontSize: 14, flexShrink: 1 },
  statusText: { color: "#5B6E87", fontWeight: "700", flex: 1 },
  quickActions: { flexDirection: "row", gap: 10 },
  quickButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#1D4C72",
    alignItems: "center",
  },
  quickButtonDanger: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#BE123C",
    alignItems: "center",
  },
  quickButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
