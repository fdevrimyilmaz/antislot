import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { useAutoTranslatedValue } from "@/hooks/useLocalizedCopy";
import { saveProfile } from "@/store/profileStore";
import { Fonts, Radius } from "@/constants/theme";

type SelectFieldKey = "gender" | "ethnicity" | "countryState" | "referral";

type SelectOption = {
  value: string;
  label: string;
};

export default function ContinueScreen() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSelect, setOpenSelect] = useState<SelectFieldKey | null>(null);
  const [form, setForm] = useState({
    username: "",
    age: "",
    gender: "",
    ethnicity: "",
    countryState: "",
    referral: "",
  });
  const { t, language } = useLanguage();
  const { colors } = useTheme();

    const baseSelectOptions = useMemo<Record<SelectFieldKey, SelectOption[]>>(
    () =>
      language === "tr"
        ? {
            gender: [
              { value: "male", label: "Erkek" },
              { value: "female", label: "Kad\u0131n" },
              { value: "prefer_not_to_say", label: "Belirtmek \u0130stemiyorum" },
            ],
            ethnicity: [
              { value: "turkish", label: "T\u00fcrk" },
              { value: "kurdish", label: "K\u00fcrt" },
              { value: "arab", label: "Arap" },
              { value: "laz", label: "Laz" },
              { value: "circassian", label: "\u00c7erkes" },
              { value: "zaza", label: "Zaza" },
              { value: "pomak", label: "Pomak" },
              { value: "bosniak", label: "Bo\u015fnak" },
              { value: "albanian", label: "Arnavut" },
              { value: "georgian", label: "G\u00fcrc\u00fc" },
              { value: "tatar", label: "Tatar" },
              { value: "romani", label: "Roman" },
              { value: "armenian", label: "Ermeni" },
              { value: "greek", label: "Rum" },
              { value: "assyrian", label: "S\u00fcryani" },
              { value: "other", label: "Di\u011fer" },
              { value: "prefer_not_to_say", label: "Belirtmek \u0130stemiyorum" },
            ],
            countryState: [
              { value: "turkiye", label: "T\u00fcrkiye" },
              { value: "almanya", label: "Almanya" },
              { value: "hollanda", label: "Hollanda" },
              { value: "birlesik_krallik", label: "Birle\u015fik Krall\u0131k" },
              { value: "abd", label: "Amerika Birle\u015fik Devletleri" },
              { value: "azerbaycan", label: "Azerbaycan" },
              { value: "fransa", label: "Fransa" },
              { value: "belcika", label: "Bel\u00e7ika" },
              { value: "avusturya", label: "Avusturya" },
              { value: "isvicre", label: "\u0130svi\u00e7re" },
              { value: "isvec", label: "\u0130sve\u00e7" },
              { value: "norvec", label: "Norve\u00e7" },
              { value: "danimarka", label: "Danimarka" },
              { value: "kanada", label: "Kanada" },
              { value: "avustralya", label: "Avustralya" },
              { value: "bae", label: "Birle\u015fik Arap Emirlikleri" },
              { value: "katar", label: "Katar" },
              { value: "suudi_arabistan", label: "Suudi Arabistan" },
              { value: "rusya", label: "Rusya" },
              { value: "italya", label: "\u0130talya" },
              { value: "ispanya", label: "\u0130spanya" },
              { value: "diger", label: "Di\u011fer" },
              { value: "prefer_not_to_say", label: "Belirtmek \u0130stemiyorum" },
            ],
            referral: [
              { value: "app_store_search", label: "App Store / Play Store aramas\u0131" },
              { value: "social_media", label: "Sosyal medya" },
              { value: "friend_family", label: "Arkada\u015f / aile \u00f6nerisi" },
              { value: "therapist", label: "Terapist / uzman \u00f6nerisi" },
              { value: "web_search", label: "\u0130nternet aramas\u0131" },
              { value: "ad", label: "Reklam" },
              { value: "other", label: "Di\u011fer" },
              { value: "dont_remember", label: "Hat\u0131rlam\u0131yorum" },
            ],
          }
        : {
            gender: [
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "prefer_not_to_say", label: "Prefer not to say" },
            ],
            ethnicity: [
              { value: "turkish", label: "Turkish" },
              { value: "kurdish", label: "Kurdish" },
              { value: "arab", label: "Arab" },
              { value: "laz", label: "Laz" },
              { value: "circassian", label: "Circassian" },
              { value: "zaza", label: "Zaza" },
              { value: "pomak", label: "Pomak" },
              { value: "bosniak", label: "Bosniak" },
              { value: "albanian", label: "Albanian" },
              { value: "georgian", label: "Georgian" },
              { value: "tatar", label: "Tatar" },
              { value: "romani", label: "Romani" },
              { value: "armenian", label: "Armenian" },
              { value: "greek", label: "Greek" },
              { value: "assyrian", label: "Assyrian/Syriac" },
              { value: "other", label: "Other" },
              { value: "prefer_not_to_say", label: "Prefer not to say" },
            ],
            countryState: [
              { value: "turkiye", label: "T\u00fcrkiye" },
              { value: "germany", label: "Germany" },
              { value: "netherlands", label: "Netherlands" },
              { value: "united_kingdom", label: "United Kingdom" },
              { value: "united_states", label: "United States" },
              { value: "azerbaijan", label: "Azerbaijan" },
              { value: "france", label: "France" },
              { value: "belgium", label: "Belgium" },
              { value: "austria", label: "Austria" },
              { value: "switzerland", label: "Switzerland" },
              { value: "sweden", label: "Sweden" },
              { value: "norway", label: "Norway" },
              { value: "denmark", label: "Denmark" },
              { value: "canada", label: "Canada" },
              { value: "australia", label: "Australia" },
              { value: "united_arab_emirates", label: "United Arab Emirates" },
              { value: "qatar", label: "Qatar" },
              { value: "saudi_arabia", label: "Saudi Arabia" },
              { value: "russia", label: "Russia" },
              { value: "italy", label: "Italy" },
              { value: "spain", label: "Spain" },
              { value: "other", label: "Other" },
              { value: "prefer_not_to_say", label: "Prefer not to say" },
            ],
            referral: [
              { value: "app_store_search", label: "App Store / Play Store search" },
              { value: "social_media", label: "Social media" },
              { value: "friend_family", label: "Friend / family recommendation" },
              { value: "therapist", label: "Therapist / professional recommendation" },
              { value: "web_search", label: "Web search" },
              { value: "ad", label: "Advertisement" },
              { value: "other", label: "Other" },
              { value: "dont_remember", label: "I don't remember" },
            ],
          },
    [language]
  );
  const selectOptions = useAutoTranslatedValue(baseSelectOptions);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getSelectedLabel = (field: SelectFieldKey) =>
    selectOptions[field].find((option) => option.value === form[field])?.label ?? "";

  const canContinue =
    confirmed &&
    form.username.trim().length > 0 &&
    form.age.trim().length > 0 &&
    !saving;

  const handleContinue = async () => {
    if (!confirmed) return;
    if (!form.username.trim()) {
      Alert.alert(t.continueMissingInfoTitle, t.continueMissingInfoBody);
      return;
    }
    if (!form.age.trim() || Number.isNaN(Number(form.age))) {
      Alert.alert(t.continueInvalidAgeTitle, t.continueInvalidAgeBody);
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

      router.replace("/onboarding/q1");
    } catch (error) {
      Alert.alert(t.continueSaveErrorTitle, t.continueSaveErrorBody);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderSelectField = (field: SelectFieldKey, placeholder: string, testIdPrefix: string) => {
    const selectedLabel = getSelectedLabel(field);
    const expanded = openSelect === field;

    return (
      <View style={styles.selectWrapper}>
        <TouchableOpacity
          style={[
            styles.selectTrigger,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.text,
            },
          ]}
          onPress={() => setOpenSelect((prev) => (prev === field ? null : field))}
          activeOpacity={0.86}
          testID={`${testIdPrefix}-trigger`}
        >
          <Text
            style={[
              styles.selectTriggerText,
              { color: selectedLabel ? colors.text : colors.textSecondary },
            ]}
          >
            {selectedLabel || placeholder}
          </Text>
          <Text style={[styles.selectChevron, { color: colors.textSecondary }]}>{expanded ? "â–´" : "â–¾"}</Text>
        </TouchableOpacity>

        {expanded ? (
          <View
            style={[
              styles.selectDropdown,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.text,
              },
            ]}
          >
            {selectOptions[field].map((option, index) => {
              const isSelected = form[field] === option.value;
              const isLast = index === selectOptions[field].length - 1;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOptionRow,
                    {
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                      backgroundColor: isSelected ? `${colors.primary}18` : "transparent",
                    },
                  ]}
                  onPress={() => {
                    updateField(field, option.value);
                    setOpenSelect(null);
                  }}
                  activeOpacity={0.85}
                  testID={`${testIdPrefix}-option-${option.value}`}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? <Text style={[styles.selectOptionCheck, { color: colors.primary }]}>âœ“</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        testID="continue-screen"
      >
        <Link href="/(tabs)" style={[styles.backButton, { color: colors.text }]}>
          {t.back}
        </Link>

        <Text style={[styles.title, { color: colors.text }]}>{t.createAccount}</Text>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder={t.username}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
                shadowColor: colors.text,
              },
            ]}
            placeholderTextColor={colors.textSecondary}
            value={form.username}
            onChangeText={(value) => updateField("username", value)}
            onFocus={() => setOpenSelect(null)}
          />

          <TextInput
            placeholder={t.age}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
                shadowColor: colors.text,
              },
            ]}
            placeholderTextColor={colors.textSecondary}
            value={form.age}
            onChangeText={(value) => updateField("age", value)}
            onFocus={() => setOpenSelect(null)}
          />

          {renderSelectField("gender", t.gender, "continue-gender")}
          {renderSelectField("ethnicity", t.ethnicity, "continue-ethnicity")}
          {renderSelectField("countryState", t.countryState, "continue-country")}
          {renderSelectField("referral", t.howDidYouFindUs, "continue-referral")}
        </View>

        <View style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.text + "15" }]}>
          <Text style={[styles.policyTitle, { color: colors.text }]}>{t.continuePolicyTitle}</Text>
          <Text style={[styles.policyText, { color: colors.text }]}>{t.continuePolicyBody}</Text>
          <View style={styles.policyLinks}>
            <TouchableOpacity onPress={() => router.push("/privacy")}>
              <Text style={[styles.policyLink, { color: colors.primary }]}>{t.continuePolicyPrivacy}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/terms")}>
              <Text style={[styles.policyLink, { color: colors.primary }]}>{t.continuePolicyTerms}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/limitations")}>
              <Text style={[styles.policyLink, { color: colors.primary }]}>{t.continuePolicyLimitations}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxSquare,
              { borderColor: colors.primary },
              confirmed && [styles.checkboxChecked, { backgroundColor: colors.primary }],
            ]}
          >
            {confirmed ? <Text style={styles.checkMark}>âœ“</Text> : null}
          </View>

          <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t.confirmInfo}</Text>
        </TouchableOpacity>

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
              <Text style={styles.nextButtonText}>{saving ? t.continueSaving : t.next.replace(" â†’", "")}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.nextButton, styles.nextButtonDisabled]}>
              <Text style={[styles.nextButtonText, styles.nextButtonTextDisabled]}>
                {saving ? t.continueSaving : t.next.replace(" â†’", "")}
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
    fontFamily: Fonts.bodyMedium,
  },

  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 32,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  inputGroup: {
    marginBottom: 20,
  },

  input: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: Radius.xl,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.body,
    borderWidth: 1.5,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  selectWrapper: {
    marginBottom: 16,
  },
  selectTrigger: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  selectTriggerText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.body,
    paddingRight: 10,
  },
  selectChevron: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  selectDropdown: {
    marginTop: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  selectOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.body,
    paddingRight: 10,
  },
  selectOptionCheck: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
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
    borderRadius: Radius.sm,
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
    fontFamily: Fonts.bodySemiBold,
    marginTop: -1,
  },

  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.body,
    lineHeight: 22,
  },

  nextButtonContainer: {
    width: "100%",
    borderRadius: Radius.xl,
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
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    color: "#333",
    letterSpacing: 0.4,
  },
  nextButtonTextDisabled: {
    color: "#999",
    textShadowColor: "transparent",
  },
  policyCard: {
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  policyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: Fonts.body,
  },
  policyLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  policyLink: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
});
