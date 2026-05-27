import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
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

type Horizon = 1 | 3 | 5 | 10;
const HORIZONS: Horizon[] = [1, 3, 5, 10];

const PRESETS = [100, 250, 500, 1000];

/**
 * Simple savings-vs-loss projection.
 *   loss(years)    = dailySpend * 365 * years         (linear)
 *   savings(years) = dailySpend daily into a 25% nominal account, compounded
 * 25% reflects Turkish risk-free deposit rates in 2026 (rounded conservatively).
 */
function project(dailySpend: number, years: number) {
  const totalLoss = dailySpend * 365 * years;
  const annualRate = 0.25;
  // Approximate: contribute daily, compound annually.
  let balance = 0;
  for (let y = 0; y < years; y++) {
    balance = (balance + dailySpend * 365) * (1 + annualRate);
  }
  return {
    loss: Math.round(totalLoss),
    savings: Math.round(balance),
  };
}

function FutureSimulationModule() {
  const { colors } = useTheme();
  const [dailyInput, setDailyInput] = useState("250");
  const [horizon, setHorizon] = useState<Horizon>(5);

  const daily = useMemo(() => {
    const parsed = parseInt(dailyInput.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [dailyInput]);

  const result = useMemo(() => project(daily, horizon), [daily, horizon]);
  const difference = result.savings + result.loss;

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

          <LinearGradient
            colors={["#264D8A", "#1F4378", "#173460"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="trending-up" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="telescope" size={11} color="#7BB8FF" />
              <Text style={styles.heroBadgeText}>SİMÜLASYON</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Gelecek Simülasyonu
            </Text>
            <Text style={styles.heroSubtitle}>
              Mevcut hızla devam edersen kaybedeceğin tutar ile aynı parayı
              biriktirip yatırdığında oluşacak fark.
            </Text>
          </LinearGradient>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Günlük Harcama"
              icon="cash"
              subtitle="Ortalama bir günde bahis/kumar için ayırdığın TL."
            />
            <View
              style={[
                styles.amountInputWrap,
                { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.amountSign, { color: colors.primary }]}>₺</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={dailyInput}
                onChangeText={setDailyInput}
                keyboardType="numeric"
                placeholder="250"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Günlük tutar"
              />
              <Text style={[styles.amountSuffix, { color: colors.textMuted }]}>
                / gün
              </Text>
            </View>
            <View style={styles.presetRow}>
              {PRESETS.map((preset) => {
                const isActive = daily === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => {
                      haptics.selection();
                      setDailyInput(String(preset));
                    }}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: isActive ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      ₺{preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader title="Süre" icon="time" subtitle="Yıllar." />
            <View style={styles.horizonRow}>
              {HORIZONS.map((h) => {
                const isActive = horizon === h;
                return (
                  <TouchableOpacity
                    key={h}
                    onPress={() => {
                      haptics.selection();
                      setHorizon(h);
                    }}
                    style={[
                      styles.horizonChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.horizonValue,
                        { color: isActive ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {h}
                    </Text>
                    <Text
                      style={[
                        styles.horizonLabel,
                        { color: isActive ? "rgba(255,255,255,0.85)" : colors.textMuted },
                      ]}
                    >
                      yıl
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Comparison */}
          <View style={styles.comparisonRow}>
            <LinearGradient
              colors={["#B14040", "#A03838", "#8E2F2F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compareCard}
            >
              <View style={styles.compareIcon}>
                <Ionicons name="trending-down" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.compareLabel}>DEVAM EDERSEN</Text>
              <Text style={styles.compareValue}>
                {formatCurrency(-result.loss, "₺")}
              </Text>
              <Text style={styles.compareHint}>{horizon} yıl sonra net kayıp</Text>
            </LinearGradient>

            <LinearGradient
              colors={["#0E5C44", "#0A4A37", "#073A2B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compareCard}
            >
              <View style={styles.compareIcon}>
                <Ionicons name="trending-up" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.compareLabel}>BUGÜN DURURSAN</Text>
              <Text style={styles.compareValue}>
                +{formatCurrency(result.savings, "₺")}
              </Text>
              <Text style={styles.compareHint}>
                {horizon} yıl boyunca yıllık %25 ile biriktirirsen
              </Text>
            </LinearGradient>
          </View>

          {/* Net difference */}
          <Card style={styles.cardSpacing}>
            <View style={styles.diffHeader}>
              <Ionicons name="swap-vertical" size={18} color={colors.primary} />
              <Text style={[styles.diffTitle, { color: colors.text }]}>
                İki yol arasındaki fark
              </Text>
            </View>
            <Text style={[styles.diffValue, { color: colors.primary }]}>
              {formatCurrency(difference, "₺")}
            </Text>
            <Text style={[styles.diffHint, { color: colors.textMuted }]}>
              Aynı kişi, aynı yıllar, aynı para — farklı seçim.
            </Text>
          </Card>

          <View
            style={[
              styles.disclaimerBox,
              { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}55` },
            ]}
          >
            <Ionicons name="information-circle" size={14} color={colors.warning} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              Yatırım getirisi geçmiş yıllar baz alınarak tahmin edilmiştir.
              Gerçek getiri farklılık gösterebilir; yatırım tavsiyesi değildir.
            </Text>
          </View>

          <Button
            title="İlerlememi Takip Et"
            onPress={() => {
              haptics.tapMedium();
              router.push("/progress");
            }}
            variant="primary"
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
    backgroundColor: "rgba(123, 184, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(123, 184, 255, 0.34)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#7BB8FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
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
  amountSuffix: { fontSize: 14, fontWeight: "600" },
  presetRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetText: { fontSize: 13, fontWeight: "800" },

  horizonRow: { flexDirection: "row", gap: 8 },
  horizonChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  horizonValue: { fontSize: 22, fontWeight: "900" },
  horizonLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },

  comparisonRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  compareCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 150,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  compareIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  compareLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  compareValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  compareHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    lineHeight: 14,
  },

  diffHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  diffTitle: { fontSize: 14, fontWeight: "800" },
  diffValue: { fontSize: 32, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  diffHint: { fontSize: 12, lineHeight: 17 },

  disclaimerBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  disclaimerText: { fontSize: 11, lineHeight: 15, flex: 1 },

  ctaBtn: { marginTop: 4 },
});

export default withPremiumGate(FutureSimulationModule, {
  title: "Gelecek Simülasyonu",
  subtitle: "Devam edersen / Bugün durursan",
});
