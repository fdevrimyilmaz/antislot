import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = ["1", "2", "3", "4", "5"];

export default function OnboardingQ7() {
  const [value, setValue] = useState<string | null>(null);
  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (value) {
      await setAnswer("q7", value);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Link href="/onboarding/q6" style={styles.back}>← Geri</Link>
        <Text style={styles.step}>7 / 10</Text>
      </View>

      <Text style={styles.title}>Kumar oynama dürtüleriniz ne kadar güçlü?</Text>
      <Text style={styles.subtitle}>1 = düşük, 5 = çok güçlü</Text>

      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <TouchableOpacity key={opt} style={[styles.pill, selected && styles.pillSelected]} onPress={() => setValue(opt)}>
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Link href="/onboarding/q8" asChild>
        <TouchableOpacity 
          style={[styles.nextBtn, !canGoNext && styles.disabled]} 
          disabled={!canGoNext}
          onPress={onNext}
        >
          <Text style={styles.nextText}>İleri</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF", padding: 24 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 8 },
  back: { color: "#1D4C72", fontSize: 16 },
  step: { color: "#777", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 10 },
  pill: { flex: 1, backgroundColor: "white", paddingVertical: 14, borderRadius: 14, alignItems: "center", elevation: 2 },
  pillSelected: { backgroundColor: "#1D4C72" },
  pillText: { fontSize: 18, fontWeight: "800", color: "#1D4C72" },
  pillTextSelected: { color: "white" },
  nextBtn: { marginTop: "auto", backgroundColor: "#1D4C72", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  disabled: { opacity: 0.5 },
  nextText: { color: "white", fontSize: 18, fontWeight: "800" },
});
