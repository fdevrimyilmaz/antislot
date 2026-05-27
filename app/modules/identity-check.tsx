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
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";

type Role = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const ROLES: Role[] = [
  { id: "parent", label: "Anne / Baba", icon: "people-circle" },
  { id: "partner", label: "Eş / Sevgili", icon: "heart" },
  { id: "child", label: "Evlat", icon: "home" },
  { id: "friend", label: "Arkadaş", icon: "happy" },
  { id: "professional", label: "Profesyonel", icon: "briefcase" },
  { id: "student", label: "Öğrenci", icon: "school" },
  { id: "citizen", label: "Birey", icon: "person" },
];

type Value = { id: string; label: string };
const VALUES: Value[] = [
  { id: "honesty", label: "Dürüstlük" },
  { id: "freedom", label: "Özgürlük" },
  { id: "family", label: "Aile" },
  { id: "growth", label: "Gelişim" },
  { id: "health", label: "Sağlık" },
  { id: "stability", label: "Huzur" },
  { id: "responsibility", label: "Sorumluluk" },
  { id: "love", label: "Sevgi" },
  { id: "respect", label: "Saygınlık" },
  { id: "discipline", label: "Disiplin" },
  { id: "creativity", label: "Yaratıcılık" },
  { id: "wealth", label: "Refah" },
];

function IdentityCheckModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [fiveYearVision, setFiveYearVision] = useState("");

  const toggleRole = (id: string) => {
    haptics.selection();
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleValue = (id: string) => {
    haptics.selection();
    setSelectedValues((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.warning("En fazla 3 değer seç.", "Sınır");
        haptics.warning();
        return prev;
      }
      return [...prev, id];
    });
  };

  const canAdvance = useMemo(() => {
    if (step === 0) return selectedRoles.length > 0;
    if (step === 1) return selectedValues.length > 0;
    if (step === 2) return fiveYearVision.trim().length > 5;
    return true;
  }, [step, selectedRoles, selectedValues, fiveYearVision]);

  const handleNext = () => {
    if (!canAdvance) return;
    haptics.tapLight();
    setStep(step + 1);
  };

  const handleRestart = () => {
    haptics.warning();
    setStep(0);
    setSelectedRoles([]);
    setSelectedValues([]);
    setFiveYearVision("");
  };

  const summary = useMemo(() => {
    const roleLabels = selectedRoles
      .map((id) => ROLES.find((r) => r.id === id)?.label)
      .filter(Boolean) as string[];
    const valueLabels = selectedValues
      .map((id) => VALUES.find((v) => v.id === id)?.label)
      .filter(Boolean) as string[];
    return {
      roles: roleLabels.join(", "),
      values: valueLabels.join(" · "),
      vision: fiveYearVision.trim(),
    };
  }, [selectedRoles, selectedValues, fiveYearVision]);

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
            colors={["#4A4F8A", "#3F4477", "#353A66"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="person-circle" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="person-circle" size={11} color="#A7AEFF" />
              <Text style={styles.heroBadgeText}>KİMLİK</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Bu kararı kim alıyor?
            </Text>
            <Text style={styles.heroSubtitle}>
              Rolün, değerlerin ve geleceğin ile bahis kararı arasında çelişki
              varsa — değişimin temeli orada başlar.
            </Text>
          </LinearGradient>

          {/* Step progress */}
          <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${((step + 1) / 4) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
            Adım {Math.min(step + 1, 4)} / 4
          </Text>

          {step === 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Hangi rollerdesin?"
                icon="people"
                subtitle="Bugün sahip olduğun rolleri seç (birden fazla seçebilirsin)."
              />
              <View style={styles.optionGrid}>
                {ROLES.map((role) => {
                  const isActive = selectedRoles.includes(role.id);
                  return (
                    <TouchableOpacity
                      key={role.id}
                      onPress={() => toggleRole(role.id)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: isActive ? `${colors.primary}14` : colors.card,
                          borderColor: isActive ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isActive }}
                      accessibilityLabel={role.label}
                    >
                      <Ionicons
                        name={role.icon}
                        size={16}
                        color={isActive ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.roleLabel,
                          { color: isActive ? colors.primary : colors.text },
                        ]}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          ) : null}

          {step === 1 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Hangi 3 değer senin için en önemli?"
                icon="star"
                subtitle="3 tane seç. Çok seçim, hiçbir şey seçmemekle aynı."
              />
              <View style={styles.valueGrid}>
                {VALUES.map((value) => {
                  const isActive = selectedValues.includes(value.id);
                  return (
                    <TouchableOpacity
                      key={value.id}
                      onPress={() => toggleValue(value.id)}
                      style={[
                        styles.valueChip,
                        {
                          backgroundColor: isActive ? colors.primary : colors.card,
                          borderColor: isActive ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isActive }}
                      accessibilityLabel={value.label}
                    >
                      <Text
                        style={[
                          styles.valueLabel,
                          { color: isActive ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {value.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.valueCounter, { color: colors.textMuted }]}>
                {selectedValues.length}/3 seçildi
              </Text>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="5 yıl sonra"
                icon="telescope"
                subtitle="Hangi sıfatlarla anılmak istiyorsun? (1-2 cümle)"
              />
              <TextInput
                style={[
                  styles.visionInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Ör. 'Çocuklarımla iletişimi güçlü, sağlığını koruyan, mesleğinde sözüne güvenilen biri.'"
                placeholderTextColor={colors.textMuted}
                value={fiveYearVision}
                onChangeText={setFiveYearVision}
                multiline
                accessibilityLabel="5 yıl vizyonu"
              />
            </Card>
          ) : null}

          {step === 3 ? (
            <>
              <Card style={styles.cardSpacing}>
                <SectionHeader
                  title="Senin kimliğin"
                  icon="ribbon"
                  subtitle="Bahis kararı bunlarla ne kadar uyumlu?"
                />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                    ROLLER
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {summary.roles}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                    DEĞERLER
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {summary.values}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                    5 YILDA
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {summary.vision}
                  </Text>
                </View>
              </Card>

              <Card style={styles.cardSpacing}>
                <View style={styles.reflectRow}>
                  <Ionicons name="bulb" size={20} color={colors.warning} />
                  <Text style={[styles.reflectTitle, { color: colors.text }]}>
                    Şimdi şu soruyu kendine sor
                  </Text>
                </View>
                <Text style={[styles.reflectBody, { color: colors.text }]}>
                  Bu rolleri taşıyan, bu değerleri seçen, 5 yıl sonra böyle anılmak
                  isteyen biri — sıradaki bahse oynar mı?
                </Text>
              </Card>

              <View style={styles.actionRow}>
                <Button
                  title="Baştan"
                  onPress={handleRestart}
                  variant="secondary"
                  leftIcon="refresh"
                />
                <Button
                  title="Günlüğe Yaz"
                  onPress={() => {
                    haptics.tapLight();
                    router.push("/diary");
                  }}
                  variant="primary"
                  rightIcon="arrow-forward"
                  style={styles.actionPrimary}
                />
              </View>
            </>
          ) : (
            <Button
              title="İleri"
              onPress={handleNext}
              disabled={!canAdvance}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon="arrow-forward"
              style={styles.nextBtn}
            />
          )}
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
    backgroundColor: "rgba(167,174,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,174,255,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#A7AEFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19 },

  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: { height: "100%" },
  stepLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4, marginBottom: 12 },

  cardSpacing: { marginBottom: 14 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleLabel: { fontSize: 13, fontWeight: "700" },

  valueGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  valueChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  valueLabel: { fontSize: 13, fontWeight: "700" },
  valueCounter: { fontSize: 11, fontWeight: "700", marginTop: 10, textAlign: "right" },

  visionInput: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    minHeight: 110,
    borderWidth: 1,
    lineHeight: 20,
    textAlignVertical: "top",
  },

  summaryRow: { marginBottom: 12 },
  summaryLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 },
  summaryValue: { fontSize: 14, lineHeight: 20, fontWeight: "600" },

  reflectRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reflectTitle: { fontSize: 15, fontWeight: "800" },
  reflectBody: { fontSize: 14, lineHeight: 21 },

  actionRow: { flexDirection: "row", gap: 10 },
  actionPrimary: { flex: 1 },
  nextBtn: { marginTop: 4 },
});

export default withPremiumGate(IdentityCheckModule, {
  title: "Kimlik Sorgulama",
  subtitle: "Bu kararı kim alıyor?",
});
