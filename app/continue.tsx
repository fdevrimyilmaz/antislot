import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { saveProfile } from "@/store/profileStore";

export default function ContinueScreen() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    age: "",
    gender: "",
    ethnicity: "",
    countryState: "",
    referral: "",
  });
  const { t } = useLanguage();
  const { colors } = useTheme();

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue =
    confirmed &&
    form.username.trim().length > 0 &&
    form.age.trim().length > 0 &&
    !saving;

  const handleContinue = async () => {
    if (!confirmed) return;
    if (!form.username.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen bir kullanıcı adı girin.");
      return;
    }
    if (!form.age.trim() || Number.isNaN(Number(form.age))) {
      Alert.alert("Geçersiz Yaş", "Lütfen geçerli bir yaş girin.");
      return;
    }

    try {
      setSaving(true);
      await saveProfile({
        username: form.username.trim(),
        age: form.age.trim(),
        gender: form.gender.trim(),
        ethnicity: form.ethnicity.trim(),
        countryState: form.countryState.trim(),
        referral: form.referral.trim(),
      });
      router.push("/onboarding");
    } catch (error) {
      Alert.alert("Hata", "Profil kaydedilemedi.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* GERİ DÜĞMESİ */}
        <Link href="/(tabs)" style={[styles.backButton, { color: colors.text }]}>
          {t.back}
        </Link>

        {/* TITLE */}
        <Text style={[styles.title, { color: colors.text }]}>{t.createAccount}</Text>

        {/* INPUTS */}
        <View style={styles.inputGroup}>
          <TextInput 
            placeholder={t.username} 
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.text + "20", color: colors.text, shadowColor: colors.text }]} 
            placeholderTextColor={colors.text + "80"} 
            value={form.username}
            onChangeText={(value) => updateField("username", value)}
          />

          <TextInput
            placeholder={t.age}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.text + "20", color: colors.text, shadowColor: colors.text }]}
            placeholderTextColor={colors.text + "80"}
            value={form.age}
            onChangeText={(value) => updateField("age", value)}
          />

          <TextInput 
            placeholder={t.gender} 
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.text + "20", color: colors.text, shadowColor: colors.text }]} 
            placeholderTextColor={colors.text + "80"} 
            value={form.gender}
            onChangeText={(value) => updateField("gender", value)}
          />

          <TextInput 
            placeholder={t.ethnicity} 
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.text + "20", color: colors.text, shadowColor: colors.text }]} 
            placeholderTextColor={colors.text + "80"} 
            value={form.ethnicity}
            onChangeText={(value) => updateField("ethnicity", value)}
          />

          <TextInput 
            placeholder={t.countryState} 
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.text + "20", color: colors.text, shadowColor: colors.text }]} 
            placeholderTextColor={colors.text + "80"} 
            value={form.countryState}
            onChangeText={(value) => updateField("countryState", value)}
          />

          <TextInput 
            placeholder={t.howDidYouFindUs} 
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.text + "20", color: colors.text, shadowColor: colors.text }]} 
            placeholderTextColor={colors.text + "80"} 
            value={form.referral}
            onChangeText={(value) => updateField("referral", value)}
          />
        </View>

        <View style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.text + "15" }]}>
          <Text style={[styles.policyTitle, { color: colors.text }]}>Gizlilik ve Bilgilendirme</Text>
          <Text style={[styles.policyText, { color: colors.text }]}>
            Devam etmeden önce Gizlilik Politikası, Kullanım Şartları ve Sınırlamaları inceleyebilirsin.
          </Text>
          <View style={styles.policyLinks}>
            <TouchableOpacity onPress={() => router.push("/privacy")}>
              <Text style={[styles.policyLink, { color: colors.primary }]}>Gizlilik</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/terms")}>
              <Text style={[styles.policyLink, { color: colors.primary }]}>Şartlar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/limitations")}>
              <Text style={[styles.policyLink, { color: colors.primary }]}>Sınırlamalar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHECKBOX (tıklanabilir) */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.checkboxSquare, 
            { borderColor: colors.primary },
            confirmed && [styles.checkboxChecked, { backgroundColor: colors.primary }]
          ]}>
            {confirmed ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>

          <Text style={[styles.checkboxLabel, { color: colors.text }]}>
            {t.confirmInfo}
          </Text>
        </TouchableOpacity>

        {/* İLERİ DÜĞMESİ → ONBOARDING GİRİŞİ */}
        <TouchableOpacity
          style={styles.nextButtonContainer}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={handleContinue}
        >
          {canContinue ? (
            <LinearGradient
              colors={["#F7C948", "#FFB800", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>{saving ? "Kaydediliyor..." : t.next.replace(" →", "")}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.nextButton, styles.nextButtonDisabled]}>
              <Text style={[styles.nextButtonText, styles.nextButtonTextDisabled]}>
                {saving ? "Kaydediliyor..." : t.next.replace(" →", "")}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    padding: 28,
    flexGrow: 1,
  },

  backButton: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: "600",
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 32,
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  inputGroup: {
    marginBottom: 20,
  },

  input: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1.5,

    // iOS gölgesi
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // Android gölgesi
    elevation: 4,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  checkboxSquare: {
    width: 24,
    height: 24,
    borderWidth: 2.5,
    marginRight: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  checkboxChecked: {
    borderColor: "#2A5F8F",
  },

  checkMark: {
    color: "white",
    fontWeight: "bold",
    marginTop: -1,
  },

  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    lineHeight: 22,
  },

  nextButtonContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 8,
  },
  nextButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F7C948",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  nextButtonDisabled: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  nextButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextButtonTextDisabled: {
    color: "#999",
    textShadowColor: "transparent",
  },
  policyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  policyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  policyLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  policyLink: {
    fontSize: 13,
    fontWeight: "700",
  },
});
