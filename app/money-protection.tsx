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
import { ThemeTexture } from "@/components/theme-texture";
import { useTheme } from "@/contexts/ThemeContext";
import { useProgressStore } from "@/store/progressStore";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function MoneyProtectionScreen() {
  const { colors } = useTheme();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const [dailyLimit, setDailyLimit] = useState("1000");
  const [spentToday, setSpentToday] = useState("0");
  const [urgeLevel, setUrgeLevel] = useState(40);

  const riskScore = useMemo(() => {
    const limit = Number(dailyLimit) || 0;
    const spent = Number(spentToday) || 0;
    const limitRatio = limit > 0 ? clamp((spent / limit) * 100, 0, 100) : 0;
    const streakPenalty = gamblingFreeDays <= 3 ? 18 : gamblingFreeDays <= 7 ? 10 : 4;
    const score = Math.round(limitRatio * 0.45 + urgeLevel * 0.4 + streakPenalty);
    return clamp(score, 0, 100);
  }, [dailyLimit, spentToday, urgeLevel, gamblingFreeDays]);

  const riskMeta = useMemo(() => {
    if (riskScore >= 70) {
      return {
        label: "Yuksek",
        title: "Su an riskliyim",
        advice: "Risk yukselince tek tikla kilit, durtu akisi ve destek adimlarini devreye al.",
      };
    }
    if (riskScore >= 40) {
      return {
        label: "Orta",
        title: "Su an dikkatliyim",
        advice: "Bugun para hareketlerini not al ve 10 dakikalik geciktirme kuralini uygula.",
      };
    }
    return {
      label: "Dusuk",
      title: "Su an dengedeyim",
      advice: "Planli devam et, gunluk limiti koru ve tetikleyicileri not et.",
    };
  }, [riskScore]);

  const quickUrgeSteps = [20, 40, 60, 80];

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.text }]}>{"<- Geri"}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Para Koruma Modu</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Bugun parani korumaya yardimci olacak basit bir kendi kendine kontrol listesi.
          </Text>

          <LinearGradient
            colors={colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroHeader}>
              <Text style={styles.heroIcon}>{"[Kalkan]"}</Text>
              <View style={styles.riskChip}>
                <Text style={styles.riskChipText}>Risk seviyesi</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Para Koruma</Text>
            <Text style={styles.heroSub}>Bugun param guvende mi?</Text>
            <Text style={styles.heroDesc}>Gunluk limit belirleyin, harcamayi kaydedin ve gerekirse acil kilit baslatin.</Text>
          </LinearGradient>

          <View style={[styles.alertCard, { borderColor: colors.danger + "55", backgroundColor: colors.card }]}>
            <View style={styles.alertLeft}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>Risk seviyesi</Text>
              <Text style={[styles.alertDesc, { color: colors.textMuted }]}>{riskMeta.advice}</Text>
            </View>
            <Text style={[styles.alertPercent, { color: colors.danger }]}>{riskScore}%</Text>
          </View>

          <View style={[styles.statusCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
            <View>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Para Koruma</Text>
              <Text style={[styles.statusTitle, { color: colors.warning }]}>{riskMeta.title}</Text>
              <Text style={[styles.statusSub, { color: colors.danger }]}>Risk seviyesi: {riskMeta.label}</Text>
            </View>
            <View style={[styles.scoreCircle, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.scoreText, { color: colors.text }]}>{riskScore}%</Text>
              <Text style={[styles.scoreSub, { color: colors.textMuted }]}>4/7</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durtu hizli secim</Text>
            <Text style={[styles.sectionText, { color: colors.textMuted }]}>
              Bugunku durtu seviyeni secerek risk skorunu hizli guncelleyebilirsin.
            </Text>
            <View style={styles.pillRow}>
              {quickUrgeSteps.map((step) => {
                const selected = urgeLevel === step;
                return (
                  <TouchableOpacity
                    key={step}
                    style={[
                      styles.pill,
                      {
                        borderColor: selected ? colors.primary : colors.cardBorder,
                        backgroundColor: selected ? colors.primary + "20" : "transparent",
                      },
                    ]}
                    onPress={() => setUrgeLevel(step)}
                  >
                    <Text style={[styles.pillText, { color: selected ? colors.primary : colors.textMuted }]}>
                      %{step}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.sectionCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Detayli Risk Analizi</Text>
            <Text style={[styles.sectionText, { color: colors.textMuted }]}>
              Daha derin analiz premium planinda acilir.
            </Text>
            <View style={[styles.lockedBadge, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.lockedText, { color: colors.textMuted }]}>Kilitli</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Proaktif Mudahale</Text>
            <Text style={[styles.sectionText, { color: colors.textMuted }]}>
              Risk yukselirse tek tikla kilit, durtu akisi ve destek adimlarini devreye al.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/blocker")}
            >
              <Text style={styles.primaryBtnText}>Acil Kilit Baslat</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gunluk Limit Plani</Text>
            <Text style={[styles.sectionText, { color: colors.textMuted }]}>
              Basit bir gunluk para plani ile kendini guvenceye al.
            </Text>
            <TextInput
              value={dailyLimit}
              onChangeText={setDailyLimit}
              keyboardType="numeric"
              placeholder="Gunluk limit"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            />
            <TextInput
              value={spentToday}
              onChangeText={setSpentToday}
              keyboardType="numeric"
              placeholder="Bugun harcanan"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  backBtn: { alignSelf: "flex-start", marginBottom: 2 },
  backText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 34, fontWeight: "900", marginBottom: 4 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 4 },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  heroIcon: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  riskChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  riskChipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  heroTitle: { color: "#FFFFFF", fontSize: 40, fontWeight: "800" },
  heroSub: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 2 },
  heroDesc: { color: "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 20, marginTop: 8 },
  alertCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertLeft: { flex: 1, paddingRight: 10 },
  alertTitle: { fontSize: 34, fontWeight: "800", marginBottom: 4 },
  alertDesc: { fontSize: 13, lineHeight: 19 },
  alertPercent: { fontSize: 28, fontWeight: "900" },
  statusCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  statusTitle: { fontSize: 28, fontWeight: "900", marginBottom: 2 },
  statusSub: { fontSize: 14, fontWeight: "700" },
  scoreCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: { fontSize: 24, fontWeight: "900" },
  scoreSub: { fontSize: 14, fontWeight: "700" },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: { fontSize: 21, fontWeight: "800", marginBottom: 6 },
  sectionText: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  lockedBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  lockedText: { fontSize: 12, fontWeight: "700" },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  pillRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillText: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
});
