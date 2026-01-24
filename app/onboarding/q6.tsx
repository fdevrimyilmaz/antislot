import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Stres veya kaygı",
  "Can sıkıntısı",
  "Yalnızlık",
  "Maddi endişeler",
  "Alkol / maddeler",
  "Reklam veya kumar içerikleri görmek",
  "Tartışma veya çatışma",
  "Kutlama / heyecan",
];

export default function OnboardingQ6() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(opt: string) {
    setSelected((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));
  }

  async function onNext() {
    if (!canGoNext) return;
    await setAnswer("q6", selected);
    router.push("/onboarding/q7");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Link href="/onboarding/q5" style={styles.back}>← Geri</Link>
        <Text style={styles.step}>6 / 10</Text>
      </View>

      <Text style={styles.title}>Kumar oynamayı ne tetikler?</Text>
      <Text style={styles.subtitle}>(geçerli olanların hepsini seçin)</Text>

      <View style={{ gap: 12, marginBottom: 22 }}>
        {OPTIONS.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.item, checked && styles.itemSelected]}
              onPress={() => toggle(opt)}
              activeOpacity={0.85}
            >
              <View style={[styles.box, checked && styles.boxChecked]}>
                {checked ? <Text style={styles.tick}>✓</Text> : null}
              </View>
              <Text style={styles.itemText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, !canGoNext && styles.disabled]}
        disabled={!canGoNext}
        onPress={onNext}
        activeOpacity={0.9}
      >
        <Text style={styles.nextText}>İleri</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#F4F9FF", flexGrow: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 8 },
  back: { color: "#1D4C72", fontSize: 16 },
  step: { color: "#777", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 18 },
  item: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", padding: 14, borderRadius: 14, elevation: 2 },
  itemSelected: { borderWidth: 2, borderColor: "#1D4C72" },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#1D4C72", marginRight: 12, alignItems: "center", justifyContent: "center", marginTop: 2 },
  boxChecked: { backgroundColor: "#1D4C72" },
  tick: { color: "white", fontWeight: "800", marginTop: -1 },
  itemText: { flex: 1, fontSize: 15, color: "#222", lineHeight: 20 },
  nextBtn: { backgroundColor: "#1D4C72", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: "auto" },
  disabled: { opacity: 0.5 },
  nextText: { color: "white", fontSize: 18, fontWeight: "800" },
});
