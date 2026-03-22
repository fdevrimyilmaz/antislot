import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  getProfile,
  normalizeUsername,
  saveProfile,
  USERNAME_MAX_LENGTH,
  type UserProfile,
} from "@/store/profileStore";
import { type Href, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COPY = {
  tr: {
    title: "Kullanici Adi Gerekli",
    subtitle:
      "Ortak sohbete katilmak icin bir kullanici adi belirlemelisin.",
    placeholder: "Kullanici adin",
    save: "Sohbete Devam Et",
    saving: "Kaydediliyor...",
    back: "<- Geri",
    requiredTitle: "Eksik Bilgi",
    requiredBody: "Lutfen gecerli bir kullanici adi gir.",
    failedTitle: "Kayit Hatasi",
    failedBody: "Kullanici adi kaydedilemedi. Tekrar dene.",
  },
  en: {
    title: "Username Required",
    subtitle: "Choose a username to join the shared chat.",
    placeholder: "Your username",
    save: "Continue to Chat",
    saving: "Saving...",
    back: "<- Back",
    requiredTitle: "Missing Info",
    requiredBody: "Please enter a valid username.",
    failedTitle: "Save Error",
    failedBody: "Could not save username. Please try again.",
  },
} as const;

const FALLBACK_NEXT_ROUTE = "/community/rooms";

function resolveNextRoute(param: string | string[] | undefined): Href {
  const raw = typeof param === "string" ? param : Array.isArray(param) ? param[0] : "";
  const next = raw.trim();
  if (!next) return FALLBACK_NEXT_ROUTE as Href;
  if (!next.startsWith("/community")) return FALLBACK_NEXT_ROUTE as Href;
  return next as Href;
}

export default function CommunityUsernameScreen() {
  const { colors } = useTheme();
  const copy = useLocalizedCopy(COPY);
  const params = useLocalSearchParams<{ next?: string }>();
  const nextRoute = useMemo(() => resolveNextRoute(params.next), [params.next]);

  const [username, setUsername] = useState("");
  const [seedProfile, setSeedProfile] = useState<
    Pick<UserProfile, "age" | "gender" | "ethnicity" | "countryState" | "referral">
  >({
    age: "",
    gender: "",
    ethnicity: "",
    countryState: "",
    referral: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const existing = await getProfile();
        if (!active) return;

        if (existing) {
          setUsername(normalizeUsername(existing.username));
          setSeedProfile({
            age: existing.age ?? "",
            gender: existing.gender ?? "",
            ethnicity: existing.ethnicity ?? "",
            countryState: existing.countryState ?? "",
            referral: existing.referral ?? "",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      Alert.alert(copy.requiredTitle, copy.requiredBody);
      return;
    }

    try {
      setSaving(true);
      await saveProfile({
        username: normalized,
        age: seedProfile.age,
        gender: seedProfile.gender,
        ethnicity: seedProfile.ethnicity,
        countryState: seedProfile.countryState,
        referral: seedProfile.referral,
      });
      router.replace(nextRoute);
    } catch {
      Alert.alert(copy.failedTitle, copy.failedBody);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{copy.back}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={copy.placeholder}
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                maxLength={USERNAME_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  (!normalizeUsername(username) || saving) && [styles.saveBtnDisabled, { backgroundColor: colors.disabled }],
                ]}
                onPress={handleSave}
                disabled={!normalizeUsername(username) || saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{copy.save}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: {
    fontSize: 15,
    fontFamily: Fonts.bodyMedium,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80,
  },
  title: {
    fontSize: 27,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 18,
  },
  loaderWrap: {
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    minHeight: 50,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.body,
    marginBottom: 14,
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
  },
  saveBtnDisabled: {
    opacity: 0.85,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
});
