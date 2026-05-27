import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
import {
  Linking,
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
import { reportError } from "@/services/monitoring";
import { getCrisisPlan, saveCrisisPlan, type CrisisPlan } from "@/store/crisisPlanStore";

const WARNING_SIGN_SUGGESTIONS = [
  "Kayıp telafi düşüncesi",
  "Gece geç saatlerde telefonda gezinme",
  "Bahis sitelerini “sadece bakmak” için açma",
  "Maaş günü heyecanı",
  "Aşırı stres / öfke",
];

const RISK_SITUATION_SUGGESTIONS = [
  "Yalnız kaldığım uzun akşamlar",
  "Maaş aldığım gün",
  "İş stresi yüksek günler",
  "Arkadaşlarla bahis konuşulması",
  "Maç günleri",
];

const COPING_SUGGESTIONS = [
  "60 saniye nefes egzersizi başlat",
  "Yürüyüşe çık, telefonu evde bırak",
  "Güvendiğim kişiyi ara",
  "Bahis sitesini engelleyici listede tut",
  "10 dakika erteleme zamanlayıcısı kur",
];

type ListEditorProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  subtitle: string;
  items: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
  colors: ReturnType<typeof useTheme>["colors"];
};

function ListEditor({ title, icon, subtitle, items, suggestions, onChange, colors }: ListEditorProps) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (trimmed.length < 2) return;
    haptics.selection();
    onChange([...items, trimmed]);
    setDraft("");
  };

  const handleSuggestion = (text: string) => {
    if (items.includes(text)) return;
    haptics.selection();
    onChange([...items, text]);
  };

  const handleRemove = (index: number) => {
    haptics.warning();
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Card style={styles.cardSpacing}>
      <SectionHeader title={title} icon={icon} subtitle={subtitle} />

      {items.length > 0 ? (
        <View style={styles.itemList}>
          {items.map((item, i) => (
            <View
              key={`${item}-${i}`}
              style={[
                styles.itemRow,
                { backgroundColor: `${colors.primary}0B`, borderColor: `${colors.primary}33` },
              ]}
            >
              <Text style={[styles.itemNumber, { color: colors.primary }]}>{i + 1}</Text>
              <Text style={[styles.itemText, { color: colors.text }]}>{item}</Text>
              <TouchableOpacity
                onPress={() => handleRemove(i)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Kaldır"
              >
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              color: colors.text,
            },
          ]}
          placeholder="Kendi maddeni yaz..."
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleAdd}
          maxLength={120}
          accessibilityLabel="Yeni madde"
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={draft.trim().length < 2}
          style={[
            styles.addBtn,
            {
              backgroundColor: draft.trim().length < 2 ? `${colors.primary}55` : colors.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ekle"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 ? (
        <>
          <Text style={[styles.suggestionLabel, { color: colors.textMuted }]}>
            ÖRNEKLER
          </Text>
          <View style={styles.suggestionList}>
            {suggestions.map((s) => {
              const added = items.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleSuggestion(s)}
                  disabled={added}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: added ? `${colors.success}1A` : colors.card,
                      borderColor: added ? colors.success : colors.cardBorder,
                      opacity: added ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={added ? "checkmark" : "add"}
                    size={12}
                    color={added ? colors.success : colors.primary}
                  />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}
    </Card>
  );
}

function CrisisPlanModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [plan, setPlan] = useState<CrisisPlan>({
    warningSigns: [],
    highRiskSituations: [],
    copingActions: [],
    updatedAt: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setPlan(await getCrisisPlan());
      } catch (error) {
        reportError(error, { scope: "crisisPlan.load", level: "warning" });
      }
    })();
  }, []);

  const handleSave = async () => {
    if (
      plan.warningSigns.length === 0 &&
      plan.highRiskSituations.length === 0 &&
      plan.copingActions.length === 0
    ) {
      haptics.warning();
      toast.warning("En az bir madde ekle.", "Plan boş");
      return;
    }
    setSaving(true);
    haptics.tapMedium();
    try {
      await saveCrisisPlan(plan);
      haptics.success();
      toast.success("Krizde okuyabileceğin plan hazır.", "Kaydedildi");
    } catch (error) {
      reportError(error, { scope: "crisisPlan.save" });
      haptics.error();
      toast.error("Plan kaydedilemedi.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleCallSafePerson = () => {
    if (!plan.safePersonPhone) return;
    haptics.tapMedium();
    Linking.openURL(`tel:${plan.safePersonPhone}`);
  };

  const totalItems =
    plan.warningSigns.length + plan.highRiskSituations.length + plan.copingActions.length;

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
            colors={["#B14040", "#A03838", "#8E2F2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="alert-circle" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="alert-circle" size={11} color="#FF8A66" />
              <Text style={styles.heroBadgeText}>KRİZ PLANI</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Kararı önceden ver
            </Text>
            <Text style={styles.heroSubtitle}>
              Dürtü anında düşünme — önce hazırla. Uyarı işaretlerini, riskli
              durumları ve baş etme adımlarını şimdi yaz; krizde sadece oku.
            </Text>
          </LinearGradient>

          {/* Warning signs */}
          <ListEditor
            title="Uyarı İşaretleri"
            icon="warning"
            subtitle="Kayıpa yaklaştığını gösteren erken işaretler."
            items={plan.warningSigns}
            suggestions={WARNING_SIGN_SUGGESTIONS}
            onChange={(next) => setPlan({ ...plan, warningSigns: next })}
            colors={colors}
          />

          {/* High risk situations */}
          <ListEditor
            title="Yüksek Riskli Durumlar"
            icon="time"
            subtitle="Senin için en tehlikeli zaman ve koşullar."
            items={plan.highRiskSituations}
            suggestions={RISK_SITUATION_SUGGESTIONS}
            onChange={(next) => setPlan({ ...plan, highRiskSituations: next })}
            colors={colors}
          />

          {/* Coping actions */}
          <ListEditor
            title="Baş Etme Adımları"
            icon="shield-checkmark"
            subtitle="Dürtü yükseldiğinde yapacağın sıralı adımlar."
            items={plan.copingActions}
            suggestions={COPING_SUGGESTIONS}
            onChange={(next) => setPlan({ ...plan, copingActions: next })}
            colors={colors}
          />

          {/* Safe person */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Güvendiğin Kişi"
              icon="call"
              subtitle="Tek bir kişi — krizde tek dokunuşla aramak için."
            />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>İsim</Text>
            <TextInput
              style={[
                styles.simpleInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Annem"
              placeholderTextColor={colors.textMuted}
              value={plan.safePersonName ?? ""}
              onChangeText={(text) => setPlan({ ...plan, safePersonName: text })}
              maxLength={50}
              accessibilityLabel="Güvenli kişi adı"
            />
            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>
              Telefon
            </Text>
            <TextInput
              style={[
                styles.simpleInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor={colors.textMuted}
              value={plan.safePersonPhone ?? ""}
              onChangeText={(text) => setPlan({ ...plan, safePersonPhone: text })}
              keyboardType="phone-pad"
              maxLength={30}
              accessibilityLabel="Güvenli kişi telefonu"
            />
            {plan.safePersonPhone ? (
              <Button
                title={`${plan.safePersonName ?? "Ara"} - ${plan.safePersonPhone}`}
                onPress={handleCallSafePerson}
                variant="primary"
                leftIcon="call"
                fullWidth
                style={styles.callBtn}
              />
            ) : null}
          </Card>

          {/* Save */}
          <Button
            title={saving ? "Kaydediliyor" : "Planı Kaydet"}
            onPress={handleSave}
            loading={saving}
            disabled={saving || totalItems === 0}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="save"
            style={styles.saveBtn}
          />

          {/* Tip */}
          <Card style={styles.cardSpacing}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Krizde nasıl kullanılır?
              </Text>
            </View>
            <Text style={[styles.tipBody, { color: colors.text }]}>
              Dürtü geldiğinde bahis sitesi yerine bu sayfayı aç. Üstten
              başlayıp aşağıya doğru oku ve adımları sırayla uygula. Liste
              bittiğinde dürtü genelde sönmüş olur.
            </Text>
          </Card>
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
    backgroundColor: "rgba(255,138,102,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,138,102,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FF8A66",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19 },

  cardSpacing: { marginBottom: 14 },

  itemList: { gap: 8, marginBottom: 12 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemNumber: { fontSize: 14, fontWeight: "900", minWidth: 18 },
  itemText: { flex: 1, fontSize: 13, lineHeight: 18 },

  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  addBtn: {
    width: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  suggestionLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  suggestionList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 11, fontWeight: "700" },

  fieldLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  simpleInput: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  callBtn: { marginTop: 14 },
  saveBtn: { marginBottom: 14 },

  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 15, fontWeight: "800" },
  tipBody: { fontSize: 13, lineHeight: 19 },
});

export default withPremiumGate(CrisisPlanModule, {
  title: "Kriz Planı",
  subtitle: "Kararı önceden ver",
});
