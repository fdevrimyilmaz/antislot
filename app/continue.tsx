import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { saveProfile } from "@/store/profileStore";

type FormState = {
  username: string;
  age: string;
  gender: string;
  ethnicity: string;
  countryState: string;
  referral: string;
};

const INITIAL_FORM: FormState = {
  username: "",
  age: "",
  gender: "",
  ethnicity: "",
  countryState: "",
  referral: "",
};

export default function ContinueScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const toast = useToast();

  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue =
    confirmed && form.username.trim().length > 0 && form.age.trim().length > 0 && !saving;

  const handleContinue = async () => {
    if (!confirmed) return;
    if (!form.username.trim()) {
      haptics.warning();
      toast.warning("Lütfen bir kullanıcı adı girin.", "Eksik Bilgi");
      return;
    }
    if (!form.age.trim() || Number.isNaN(Number(form.age))) {
      haptics.warning();
      toast.warning("Lütfen geçerli bir yaş girin.", "Geçersiz Yaş");
      return;
    }

    setSaving(true);
    haptics.tapMedium();
    try {
      await saveProfile({
        username: form.username.trim(),
        age: form.age.trim(),
        gender: form.gender.trim(),
        ethnicity: form.ethnicity.trim(),
        countryState: form.countryState.trim(),
        referral: form.referral.trim(),
      });
      haptics.success();
      router.push("/onboarding");
    } catch (error) {
      reportError(error, { scope: "continue.saveProfile" });
      haptics.error();
      toast.error("Profil kaydedilemedi.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleLink = (route: string) => {
    haptics.tapLight();
    router.push(route as never);
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
            accessibilityLabel={t.back}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.backText, { color: colors.text }]}>{t.back}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {t.createAccount}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Profilin sadece cihazında saklanır. Sadece kullanıcı adı ve yaş zorunlu.
          </Text>

          <View style={styles.formGroup}>
            <FormInput
              label={t.username}
              icon="person"
              value={form.username}
              onChangeText={(v) => updateField("username", v)}
              colors={colors}
              required
            />
            <FormInput
              label={t.age}
              icon="calendar"
              value={form.age}
              onChangeText={(v) => updateField("age", v)}
              keyboardType="numeric"
              colors={colors}
              required
            />
            <FormInput
              label={t.gender}
              icon="person-outline"
              value={form.gender}
              onChangeText={(v) => updateField("gender", v)}
              colors={colors}
            />
            <FormInput
              label={t.ethnicity}
              icon="globe-outline"
              value={form.ethnicity}
              onChangeText={(v) => updateField("ethnicity", v)}
              colors={colors}
            />
            <FormInput
              label={t.countryState}
              icon="location-outline"
              value={form.countryState}
              onChangeText={(v) => updateField("countryState", v)}
              colors={colors}
            />
            <FormInput
              label={t.howDidYouFindUs}
              icon="megaphone-outline"
              value={form.referral}
              onChangeText={(v) => updateField("referral", v)}
              colors={colors}
            />
          </View>

          <Card style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={[styles.policyTitle, { color: colors.text }]}>
                Gizlilik ve Bilgilendirme
              </Text>
            </View>
            <Text style={[styles.policyText, { color: colors.textMuted }]}>
              Devam etmeden önce Gizlilik Politikası, Kullanım Şartları ve Sınırlamaları
              inceleyebilirsin.
            </Text>
            <View style={styles.policyLinks}>
              <TouchableOpacity
                onPress={() => handleLink("/privacy")}
                accessibilityRole="link"
                hitSlop={6}
              >
                <Text style={[styles.policyLink, { color: colors.primary }]}>Gizlilik</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleLink("/terms")}
                accessibilityRole="link"
                hitSlop={6}
              >
                <Text style={[styles.policyLink, { color: colors.primary }]}>Şartlar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleLink("/limitations")}
                accessibilityRole="link"
                hitSlop={6}
              >
                <Text style={[styles.policyLink, { color: colors.primary }]}>Sınırlamalar</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => {
              haptics.selection();
              setConfirmed(!confirmed);
            }}
            activeOpacity={0.85}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmed }}
            accessibilityLabel={t.confirmInfo}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: colors.primary,
                  backgroundColor: confirmed ? colors.primary : "transparent",
                },
              ]}
            >
              {confirmed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
            </View>
            <Text style={[styles.consentLabel, { color: colors.text }]}>{t.confirmInfo}</Text>
          </TouchableOpacity>

          <Button
            title={saving ? "Kaydediliyor" : t.next.replace(" →", "")}
            onPress={handleContinue}
            disabled={!canContinue}
            loading={saving}
            variant="gradient"
            size="lg"
            fullWidth
            rightIcon="arrow-forward"
            style={styles.nextBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type FormInputProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric";
  required?: boolean;
  colors: {
    primary: string;
    text: string;
    textMuted: string;
    card: string;
    cardBorder: string;
  };
};

function FormInput({
  label,
  icon,
  value,
  onChangeText,
  keyboardType,
  required,
  colors,
}: FormInputProps) {
  return (
    <View style={styles.inputBlock}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>
        {label}
        {required ? <Text style={{ color: colors.primary }}> *</Text> : null}
      </Text>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? "default"}
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
        />
      </View>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
  },
  formGroup: {
    gap: 14,
    marginBottom: 18,
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  policyCard: {
    marginBottom: 18,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  policyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  policyLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  policyLink: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  consentLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  nextBtn: {
    marginTop: 4,
  },
});
