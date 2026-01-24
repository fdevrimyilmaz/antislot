import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Kendi kendine yardım araçları",
  "Topluluk desteği",
  "Profesyonel yardım",
  "Kriz / acil destek",
  "Takip ve içgörüler",
];

export default function OnboardingQ9() {
  const [selected, setSelected] = useState<string[]>([]);
  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(opt: string) {
    setSelected((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));
  }

  async function onNext() {
    if (selected.length > 0) {
      await setAnswer("q9", selected);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Link href="/onboarding/q8" style={styles.back}>← Geri</Link>
        <Text style={styles.step}>9 / 10</Text>
      </View>

      <Text style={styles.title}>Hangi desteği tercih edersiniz?</Text>
      <Text style={styles.subtitle}>(geçerli olanların hepsini seçin)</Text>

      <View style={{ gap: 12, marginBottom: 22 }}>
        {OPTIONS.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <TouchableOpacity key={opt} style={[styles.item, checked && styles.itemSelected]} onPress={() => toggle(opt)} activeOpacity={0.85}>
              <View style={[styles.box, checked && styles.boxChecked]}>{checked ? <Text style={styles.tick}>✓</Text> : null}</View>
              <Text style={styles.itemText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Link href="/onboarding/q10" asChild>
        <TouchableOpacity 
          style={[styles.nextBtn, !canGoNext && styles.disabled]} 
          disabled={!canGoNext}
          onPress={onNext}
        >
          <Text style={styles.nextText}>İleri</Text>
        </TouchableOpacity>
      </Link>
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
