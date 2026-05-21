import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { haptics } from "@/services/haptics";
import { formatCurrency } from "@/store/savingsStore";

type Alternative = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  unitPrice: number;
  label: string;
  unitNoun: string;
  /** Optional message instead of unit-count, e.g. "yıllık geçim" */
  customDescription?: (amount: number) => string | null;
  /** Optional concrete copy when the number rounds to 0 or 1. */
  hint?: string;
};

/**
 * Alternatives — rough TRY estimates for 2026. They are intentionally
 * conservative; the goal is to put a tangible image in front of the user
 * rather than to be perfectly accurate.
 */
const ALTERNATIVES: Alternative[] = [
  {
    icon: "airplane",
    unitPrice: 25000,
    label: "Tatil",
    unitNoun: "kişi · 1 hafta yurt içi tatil",
    hint: "Antalya, Kapadokya, Karadeniz turu — 1 kişilik paket",
  },
  {
    icon: "bed",
    unitPrice: 18000,
    label: "Aylık kira",
    unitNoun: "ay kira (Anadolu şehri 1+1)",
  },
  {
    icon: "phone-portrait",
    unitPrice: 35000,
    label: "Yeni telefon",
    unitNoun: "orta-üst segment telefon",
  },
  {
    icon: "fitness",
    unitPrice: 1500,
    label: "Spor salonu",
    unitNoun: "ay üyelik",
    hint: "Kişisel antrenörlü paket",
  },
  {
    icon: "school",
    unitPrice: 8000,
    label: "Profesyonel kurs",
    unitNoun: "kurs (Udemy/Bootcamp/dil)",
    hint: "Yazılım, dil veya tasarım sertifikası",
  },
  {
    icon: "bicycle",
    unitPrice: 15000,
    label: "Bisiklet",
    unitNoun: "şehir/dağ bisikleti",
  },
  {
    icon: "laptop",
    unitPrice: 28000,
    label: "Dizüstü bilgisayar",
    unitNoun: "orta segment laptop",
  },
  {
    icon: "trending-up",
    unitPrice: 1,
    label: "Borsa endeks fonu",
    unitNoun: "",
    customDescription: (amount) => {
      // Very rough — TR endeks ortalama nominal getiri ~%30/yıl son 10y.
      // 5y compound at 30%: x * 1.3^5 ≈ x * 3.71
      const fiveYear = Math.round(amount * 3.71);
      return `5 yılda ~${formatCurrency(fiveYear, "₺")} (geçmiş %30 yıllık ortalama)`;
    },
  },
  {
    icon: "diamond",
    unitPrice: 1,
    label: "Altın (gram)",
    unitNoun: "",
    customDescription: (amount) => {
      // Gram altın varsayım ~₺4500 (2026 erken yıl)
      const grams = (amount / 4500).toFixed(1);
      return `~${grams} gram altın bugün`;
    },
  },
  {
    icon: "home",
    unitPrice: 1,
    label: "Ev peşinatı",
    unitNoun: "",
    customDescription: (amount) => {
      // Ortalama 2+1 ev fiyatı ~₺2.5M, %20 peşinat = ₺500k
      const ratio = ((amount / 500000) * 100).toFixed(1);
      return `Ortalama bir ev peşinatının %${ratio}'i`;
    },
  },
];

const PRESETS = [10000, 25000, 50000, 100000, 250000];

function buildAlternativeLabel(amount: number, alt: Alternative): string {
  if (alt.customDescription) {
    return alt.customDescription(amount) ?? "";
  }
  const count = amount / alt.unitPrice;
  if (count < 1) {
    return alt.hint ? `${alt.hint} (yarım üyelik)` : "Henüz yetmez";
  }
  const rounded = count < 10 ? count.toFixed(1) : Math.floor(count).toString();
  return `${rounded} ${alt.unitNoun}`;
}

export default function MoneyAlternativeModule() {
  const { colors } = useTheme();
  const [amountInput, setAmountInput] = useState("100000");

  const amount = useMemo(() => {
    const parsed = parseInt(amountInput.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  const handlePreset = (value: number) => {
    haptics.selection();
    setAmountInput(String(value));
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          {/* Hero */}
          <LinearGradient
            colors={["#0E5C44", "#0A4A37", "#073A2B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="wallet" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="cash" size={11} color="#A7F3D0" />
              <Text style={styles.heroBadgeText}>FİNANSAL</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Para Alternatifi
            </Text>
            <Text style={styles.heroSubtitle}>
              Kumar için ayıracağın parayla başka neler yapabileceğini gör. Bu
              soyut bir kayıp değil — somut olarak kaçırdığın şeyler.
            </Text>
          </LinearGradient>

          {/* Amount input */}
          <Card style={styles.cardSpacing}>
            <SectionHeader title="Tutar" icon="calculator" subtitle="Kumar için ayıracağın TL miktarı." />
            <View
              style={[
                styles.amountInputWrap,
                { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.amountSign, { color: colors.primary }]}>₺</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
                placeholder="100000"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Tutar"
              />
            </View>
            <View style={styles.presetRow}>
              {PRESETS.map((preset) => {
                const isActive = amount === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => handlePreset(preset)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${preset} TL`}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: isActive ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Results header */}
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {formatCurrency(amount, "₺")} ile yapabileceklerin
            </Text>
            <Text style={[styles.resultsHint, { color: colors.textMuted }]}>
              Tahmini değerler — 2026 yılı ortalamaları. Sayılar yön gösterir,
              kesin değildir.
            </Text>
          </View>

          {/* Alternatives list */}
          <View style={styles.alternativesList}>
            {ALTERNATIVES.map((alt) => {
              const label = buildAlternativeLabel(amount, alt);
              return (
                <Card key={alt.label} padding={14} style={styles.altCard}>
                  <View style={styles.altRow}>
                    <View
                      style={[
                        styles.altIcon,
                        { backgroundColor: `${colors.primary}14` },
                      ]}
                    >
                      <Ionicons name={alt.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.altText}>
                      <Text
                        style={[styles.altLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {alt.label}
                      </Text>
                      <Text
                        style={[styles.altValue, { color: colors.textMuted }]}
                        numberOfLines={2}
                      >
                        {label}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>

          {/* Reflective question */}
          <Card style={styles.cardSpacing}>
            <View style={styles.reflectRow}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.reflectTitle, { color: colors.text }]}>
                Bir an dur
              </Text>
            </View>
            <Text style={[styles.reflectBody, { color: colors.text }]}>
              Yukarıdaki listenin sana ait olabileceğini hatırla. Aynı paranın
              gittiği bir bahsi düşün — kazansaydın bile kazancın 2 katına
              çıkması için aynı miktarı tekrar riske atman gerekiyor. Liste
              kaybolmuyor; sadece sırayı değiştiriyor.
            </Text>
          </Card>

          <Button
            title="Bugün başla — 7 Günü Dene"
            onPress={() => {
              haptics.tapMedium();
              router.push("/premium");
            }}
            variant="gradient"
            size="lg"
            fullWidth
            rightIcon="arrow-forward"
            style={styles.ctaBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: { position: "absolute", right: -20, bottom: -20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(167, 243, 208, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.34)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#A7F3D0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
  },

  cardSpacing: { marginBottom: 14 },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  amountSign: { fontSize: 26, fontWeight: "900" },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "900", paddingVertical: 14 },
  presetRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetText: { fontSize: 13, fontWeight: "800" },

  resultsHeader: { marginBottom: 12, marginTop: 4 },
  resultsTitle: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
  resultsHint: { fontSize: 12, lineHeight: 17 },

  alternativesList: { gap: 8, marginBottom: 14 },
  altCard: {},
  altRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  altIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  altText: { flex: 1, minWidth: 0 },
  altLabel: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  altValue: { fontSize: 13, lineHeight: 17 },

  reflectRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reflectTitle: { fontSize: 15, fontWeight: "800" },
  reflectBody: { fontSize: 13, lineHeight: 19 },

  ctaBtn: { marginTop: 4 },
});
