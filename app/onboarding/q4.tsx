import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Her gün",
  "Haftada birkaç kez",
  "Haftada bir",
  "Ayda birkaç kez",
  "Nadiren",
];

export default function OnboardingQ4() {
  const [value, setValue] = useState<string | null>(null);
  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (!value) return;
    await setAnswer("q4", value);
  }

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topRow}>
        <Link href="/onboarding/q3" style={styles.back}>
          ← Geri
        </Link>
        <Text style={styles.step}>4 / 10</Text>
      </View>

      <Text style={styles.title}>Ne sıklıkla kumar oynarsınız?</Text>
      <Text style={styles.subtitle}>(birini seçin)</Text>

      {OPTIONS.map((opt) => {
        const selected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setValue(opt)}
            activeOpacity={0.85}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {/* İLERİ */}
      <Link href="/onboarding/q5" asChild>
        <TouchableOpacity
          style={[styles.nextBtn, !canGoNext && styles.nextBtnDisabled]}
          disabled={!canGoNext}
          activeOpacity={0.9}
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  back: { color: "#1D4C72", fontSize: 16 },
  step: { color: "#777", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 18 },

  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  optionSelected: { borderWidth: 2, borderColor: "#1D4C72" },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#1D4C72",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { backgroundColor: "#1D4C72" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "white" },

  optionText: { fontSize: 16, fontWeight: "700", color: "#222" },

  nextBtn: {
    marginTop: "auto",
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { color: "white", fontSize: 18, fontWeight: "800" },
});
