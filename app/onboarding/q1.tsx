import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Kumar oynamayı azaltmak veya bırakmak için yardım",
  "Kumar davranışlarımı ve ilerlememi öğrenmek ve takip etmek",
  "Kumar davranışım için acil yardım",
  "Kumar destek hizmetleri bulmak",
  "Çevrimiçi bir topluluğa katılmak",
  "Birisiyle konuşmak",
  "Kumarsız kalmak için destek",
  "Diğer (lütfen belirtin)",
];

const OTHER_LABEL = "Diğer (lütfen belirtin)";

export default function OnboardingQ1() {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  const otherSelected = selected.includes(OTHER_LABEL);

  const canGoNext = useMemo(() => {
    if (selected.length === 0) return false;
    if (otherSelected && otherText.trim().length === 0) return false;
    return true;
  }, [selected, otherSelected, otherText]);

  function toggle(option: string) {
    setSelected((prev) => {
      const exists = prev.includes(option);

      // seçiliyse kaldır
      if (exists) {
        const next = prev.filter((x) => x !== option);
        // "Other" kalktıysa text'i de temizle
        if (option === OTHER_LABEL) setOtherText("");
        return next;
      }

      // seçili değilse ekle
      return [...prev, option];
    });
  }

  async function onNext() {
    // Eğer "Diğer" seçiliyse, listede "Diğer: ..." şeklinde kaydedelim
    const cleaned = selected
      .filter((x) => x !== OTHER_LABEL)
      .concat(otherSelected ? [`Diğer: ${otherText.trim()}`] : []);

    await setAnswer("q1", cleaned);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topRow}>
        <Link href="/onboarding" style={styles.back}>
          ← Geri
        </Link>
        <Text style={styles.step}>1 / 10</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>Antislot&apos;u indirmeye sizi ne yöneltti?</Text>
      <Text style={styles.subtitle}>(geçerli olanların hepsini seçin)</Text>

      {/* OPTIONS */}
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const checked = selected.includes(opt);

          return (
            <View key={opt} style={styles.optionBlock}>
              <TouchableOpacity
                style={[styles.item, checked && styles.itemSelected]}
                onPress={() => toggle(opt)}
                activeOpacity={0.85}
              >
                <View style={[styles.box, checked && styles.boxChecked]}>
                  {checked ? <Text style={styles.tick}>✓</Text> : null}
                </View>
                <Text style={styles.itemText}>{opt}</Text>
              </TouchableOpacity>

              {/* Other seçilirse input aç */}
              {opt === OTHER_LABEL && otherSelected ? (
                <TextInput
                  value={otherText}
                  onChangeText={setOtherText}
                  placeholder="Lütfen belirtin..."
                  style={styles.otherInput}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* İLERİ */}
      <Link href="/onboarding/q2" asChild>
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

  optionBlock: {
    gap: 10,
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

  otherInput: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#D7E6F5",
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
