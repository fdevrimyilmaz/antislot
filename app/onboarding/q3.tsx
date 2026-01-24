import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Kumar oynamayı azaltmak veya bırakmak",
  "Ruh sağlığımı iyileştirmek",
  "Daha sağlıklı alışkanlıklar geliştirmek",
  "İlerlememi takip etmek",
  "Baş etme stratejileri öğrenmek",
  "Dürtü hissettiğimde destek almak",
  "Daha fazla kontrol sahibi hissetmek",
  "Diğer",
];

export default function OnboardingQ3() {
  const [selected, setSelected] = useState<string[]>([]);
  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(option: string) {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    );
  }

  async function onNext() {
    if (selected.length > 0) {
      await setAnswer("q3", selected);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topRow}>
        <Link href="/onboarding/q2" style={styles.back}>
          ← Geri
        </Link>
        <Text style={styles.step}>3 / 10</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>Hedefleriniz nelerdir?</Text>
      <Text style={styles.subtitle}>(geçerli olanların hepsini seçin)</Text>

      {/* OPTIONS */}
      <View style={styles.list}>
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

      {/* İLERİ */}
      <Link href="/onboarding/q4" asChild>
        <TouchableOpacity
          style={[styles.nextBtn, !canGoNext && styles.nextBtnDisabled]}
          disabled={!canGoNext}
          activeOpacity={0.9}
          onPress={onNext}
        >
          <Text style={styles.nextText}>İleri</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#F4F9FF",
    flexGrow: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  back: {
    color: "#1D4C72",
    fontSize: 16,
  },
  step: {
    color: "#777",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 18,
  },
  list: {
    gap: 12,
    marginBottom: 22,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: "#1D4C72",
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1D4C72",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: "#1D4C72",
  },
  tick: {
    color: "white",
    fontWeight: "800",
    marginTop: -1,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    lineHeight: 20,
  },
  nextBtn: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
});
