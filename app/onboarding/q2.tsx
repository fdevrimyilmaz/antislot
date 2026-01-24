import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setAnswer } from "@/store/onboardingStore";

export default function OnboardingQ2() {
  const [value, setValue] = useState<"yes" | "no" | null>(null);

  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (!value) return;
    await setAnswer("q2", value);
  }

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topRow}>
        <Link href="/onboarding/q1" style={styles.back}>
          ← Geri
        </Link>
        <Text style={styles.step}>2 / 10</Text>
      </View>

      <Text style={styles.title}>
        Kumar davranışınızı yönetmek için başka yöntemler denediniz mi?
      </Text>

      {/* OPTIONS */}
      <TouchableOpacity
        style={[styles.option, value === "yes" && styles.optionSelected]}
        onPress={() => setValue("yes")}
        activeOpacity={0.85}
      >
        <View style={[styles.radio, value === "yes" && styles.radioSelected]}>
          {value === "yes" ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.optionText}>Evet</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, value === "no" && styles.optionSelected]}
        onPress={() => setValue("no")}
        activeOpacity={0.85}
      >
        <View style={[styles.radio, value === "no" && styles.radioSelected]}>
          {value === "no" ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.optionText}>Hayır</Text>
      </TouchableOpacity>

      {/* İLERİ */}
      <Link href="/onboarding/q3" asChild>
        <TouchableOpacity
          style={[styles.nextBtn, !canGoNext && styles.nextBtnDisabled]}
          disabled={!canGoNext}
          onPress={onNext}
          activeOpacity={0.9}
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

  title: { fontSize: 26, fontWeight: "900", marginBottom: 18 },

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

  optionText: { fontSize: 18, fontWeight: "800", color: "#222" },

  nextBtn: {
    marginTop: "auto",
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextText: { color: "white", fontSize: 18, fontWeight: "900" },
});
