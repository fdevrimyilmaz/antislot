import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { enqueueTherapyCallbackRequest } from "@/services/therapyApi";
import { buildTherapyCallbackMailto, isValidTherapyPhone } from "@/services/therapyReferral";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LocalizedText = {
  tr: string;
  en: string;
};

type SupportResourceDefinition = {
  id: string;
  category: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  phone?: string;
  website?: string;
};

const SUPPORT_COPY = {
  tr: {
    title: "Destek Agi",
    subtitle: "Kumardan uzaklasma surecinde guvenilir destek kaynaklari.",
    searchPlaceholder: "Destek kaynaklarinda ara...",
    call: "Ara",
    website: "Web Sitesi",
    therapyTitle: "Telefon Terapi Yonu",
    therapySubtitle: "Istersen geri aranma talebi olusturabilir veya yardim hattini arayabilirsin.",
    therapyPhonePlaceholder: "Telefon numaran",
    therapyNamePlaceholder: "Isim (istege bagli)",
    therapyTimePlaceholder: "Musait oldugun saat araligi (istege bagli)",
    therapyNotePlaceholder: "Kisa not (istege bagli)",
    therapyCallNow: "Hat Uzerinden Ara",
    therapyRequestCall: "Geri Aranma Talebi Gonder",
    therapyPhoneInvalid: "Gecerli bir telefon numarasi gir.",
    therapyRequestQueued: "Talep kuyruga alindi. Destek ekibi en kisa surede seni arayacak.",
    therapyRequestSent: "E-posta taslagi hazirlandi. Gondererek talebi tamamlayabilirsin.",
    modalTitle: "Destek Haritasi",
    modalSubtitle: "Ihtiyacina uygun yardim kaynagini hizlica bul ve baglanti kur.",
    showResources: "Kaynaklari Goster",
    close: "Kapat",
    noResults: "Aramana uygun kaynak bulunamadi.",
    errorTitle: "Hata",
    callError: "Arama baslatilamadi.",
    websiteError: "Web sitesi acilamadi.",
  },
  en: {
    title: "Support Network",
    subtitle: "Trusted resources for recovery, wellbeing, and stability.",
    searchPlaceholder: "Search support resources...",
    call: "Call",
    website: "Website",
    therapyTitle: "Phone Therapy Access",
    therapySubtitle: "Request a callback or call a support line now.",
    therapyPhonePlaceholder: "Your phone number",
    therapyNamePlaceholder: "Name (optional)",
    therapyTimePlaceholder: "Best time window (optional)",
    therapyNotePlaceholder: "Short note (optional)",
    therapyCallNow: "Call Helpline Now",
    therapyRequestCall: "Send Callback Request",
    therapyPhoneInvalid: "Please enter a valid phone number.",
    therapyRequestQueued: "Request queued successfully. Support team will call you soon.",
    therapyRequestSent: "Email draft opened. Send it to complete your callback request.",
    modalTitle: "Support Map",
    modalSubtitle: "Find the right help resource quickly and take action.",
    showResources: "Show Resources",
    close: "Close",
    noResults: "No resources match your search.",
    errorTitle: "Error",
    callError: "Call could not be started.",
    websiteError: "Website could not be opened.",
  },
} as const;

const RESOURCE_DEFINITIONS: SupportResourceDefinition[] = [
  {
    id: "gambling-ncpg",
    category: { tr: "Kumar Destegi", en: "Gambling Support" },
    title: { tr: "Ulusal Problemli Kumar Konseyi", en: "National Council on Problem Gambling" },
    description: {
      tr: "Kumar bagimliligindan iyilesme icin yardim hatti ve kaynaklar.",
      en: "Helpline and resources for gambling addiction recovery.",
    },
    phone: "18005224700",
    website: "https://www.ncpgambling.org",
  },
  {
    id: "gamblers-anon",
    category: { tr: "Kumar Destegi", en: "Gambling Support" },
    title: { tr: "Kumarbazlar Anonim", en: "Gamblers Anonymous" },
    description: {
      tr: "Akran destek toplantilari ve iyilesme toplulugu.",
      en: "Peer support meetings and recovery community.",
    },
    website: "https://www.gamblersanonymous.org",
  },
  {
    id: "mental-988",
    category: { tr: "Ruh Sagligi", en: "Mental Health" },
    title: { tr: "Intihar ve Kriz Destek Hatti", en: "Suicide & Crisis Lifeline" },
    description: {
      tr: "Telefon veya mesajla 7/24 kriz destegi.",
      en: "24/7 crisis support by call or text.",
    },
    phone: "988",
    website: "https://988lifeline.org",
  },
  {
    id: "crisis-text",
    category: { tr: "Ruh Sagligi", en: "Mental Health" },
    title: { tr: "Kriz SMS Hatti", en: "Crisis Text Line" },
    description: {
      tr: "Kriz anlarinda mesajla destek.",
      en: "Text-based support during crisis moments.",
    },
    website: "https://www.crisistextline.org",
  },
  {
    id: "nfcc",
    category: { tr: "Finansal Destek", en: "Financial Support" },
    title: { tr: "Ulusal Kredi Danismanligi Vakfi", en: "National Foundation for Credit Counseling" },
    description: {
      tr: "Butce planlama ve borc destegi.",
      en: "Budget planning and debt guidance.",
    },
    website: "https://www.nfcc.org",
  },
  {
    id: "hud",
    category: { tr: "Barinma Destegi", en: "Housing Support" },
    title: { tr: "HUD Barinma Kaynaklari", en: "HUD Housing Resources" },
    description: {
      tr: "Barinma destegi ve yerel programlar.",
      en: "Housing support and local assistance programs.",
    },
    website: "https://www.hud.gov/topics/housing_assistance",
  },
  {
    id: "community",
    category: { tr: "Topluluk", en: "Community" },
    title: { tr: "Akran Destek Toplulugu", en: "Peer Support Community" },
    description: {
      tr: "Denetlenen iyilesme sohbetlerine katilin.",
      en: "Join moderated recovery chats.",
    },
    website: "https://www.recovery.org",
  },
];

const THERAPY_CALLBACK_PHONE = "18005224700";

type ResolvedSupportResource = {
  id: string;
  category: string;
  title: string;
  description: string;
  phone?: string;
  website?: string;
};

export default function Support() {
  const { t, selectedLanguage } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(SUPPORT_COPY);

  const [showIntro, setShowIntro] = useState(true);
  const [query, setQuery] = useState("");
  const [therapyPhone, setTherapyPhone] = useState("");
  const [therapyName, setTherapyName] = useState("");
  const [therapyTime, setTherapyTime] = useState("");
  const [therapyNote, setTherapyNote] = useState("");

  const resourcesByBaseLanguage = useMemo<{ tr: ResolvedSupportResource[]; en: ResolvedSupportResource[] }>(
    () => ({
      tr: RESOURCE_DEFINITIONS.map((resource) => ({
        id: resource.id,
        category: resource.category.tr,
        title: resource.title.tr,
        description: resource.description.tr,
        phone: resource.phone,
        website: resource.website,
      })),
      en: RESOURCE_DEFINITIONS.map((resource) => ({
        id: resource.id,
        category: resource.category.en,
        title: resource.title.en,
        description: resource.description.en,
        phone: resource.phone,
        website: resource.website,
      })),
    }),
    []
  );

  const localizedResources = useLocalizedCopy(resourcesByBaseLanguage);

  const filteredResources = useMemo(() => {
    if (!query.trim()) return localizedResources;
    const q = query.toLowerCase();
    return localizedResources.filter(
      (resource) =>
        resource.title.toLowerCase().includes(q) ||
        resource.category.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q)
    );
  }, [localizedResources, query]);

  const handleCall = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert(copy.errorTitle, copy.callError);
    }
  };

  const handleOpenWebsite = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(copy.errorTitle, copy.websiteError);
    }
  };

  const handleTherapyCallbackRequest = async () => {
    if (!isValidTherapyPhone(therapyPhone)) {
      Alert.alert(copy.errorTitle, copy.therapyPhoneInvalid);
      return;
    }

    try {
      const apiResult = await enqueueTherapyCallbackRequest({
        phone: therapyPhone,
        name: therapyName || undefined,
        preferredTime: therapyTime || undefined,
        note: therapyNote || undefined,
        locale: selectedLanguage,
      });

      if (apiResult) {
        setTherapyPhone("");
        setTherapyName("");
        setTherapyTime("");
        setTherapyNote("");
        Alert.alert(copy.modalTitle, copy.therapyRequestQueued);
        return;
      }
    } catch {
      // Fallback to email draft flow when API intake is unavailable.
    }

    try {
      const mailto = buildTherapyCallbackMailto({
        phone: therapyPhone,
        name: therapyName,
        preferredTime: therapyTime,
        note: therapyNote,
        locale: selectedLanguage,
      });
      await Linking.openURL(mailto);
      Alert.alert(copy.modalTitle, copy.therapyRequestSent);
    } catch {
      Alert.alert(copy.errorTitle, copy.websiteError);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={copy.searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={[styles.therapyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.therapyTitle, { color: colors.text }]}>{copy.therapyTitle}</Text>
          <Text style={[styles.therapySubtitle, { color: colors.textSecondary }]}>{copy.therapySubtitle}</Text>

          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.therapyPhonePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={therapyPhone}
            onChangeText={setTherapyPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.therapyNamePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={therapyName}
            onChangeText={setTherapyName}
          />
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.therapyTimePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={therapyTime}
            onChangeText={setTherapyTime}
          />
          <TextInput
            style={[styles.searchInput, styles.therapyNoteInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder={copy.therapyNotePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={therapyNote}
            onChangeText={setTherapyNote}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.resourceActions}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => handleCall(THERAPY_CALLBACK_PHONE)}
            >
              <Text style={styles.primaryButtonText}>{copy.therapyCallNow}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={handleTherapyCallbackRequest}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.therapyRequestCall}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredResources.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{copy.noResults}</Text>
          </View>
        ) : null}

        {filteredResources.map((resource) => (
          <View
            key={resource.id}
            style={[
              styles.resourceCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.resourceHeader}>
              <View>
                <Text style={[styles.resourceCategory, { color: colors.primary }]}>{resource.category}</Text>
                <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
              </View>
            </View>
            <Text style={[styles.resourceDescription, { color: colors.textSecondary }]}>{resource.description}</Text>
            <View style={styles.resourceActions}>
              {resource.phone ? (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleCall(resource.phone!)}
                >
                  <Text style={styles.primaryButtonText}>{copy.call}</Text>
                </TouchableOpacity>
              ) : null}
              {resource.website ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => handleOpenWebsite(resource.website!)}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.website}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showIntro}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntro(false)}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>x</Text>
            </TouchableOpacity>

            <View style={[styles.modalIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={styles.modalIconEmoji}>SP</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{copy.modalTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{copy.modalSubtitle}</Text>

            <TouchableOpacity style={[styles.modalNextBtn, { backgroundColor: colors.primary }]} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>{copy.showResources}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowIntro(false)}>
              <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>{copy.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.base },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 28, fontFamily: Fonts.display, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: Fonts.body, marginBottom: Spacing.base },
  searchBox: { marginBottom: Spacing.base },
  searchInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 14,
    borderWidth: 1,
    fontFamily: Fonts.body,
  },
  therapyCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  therapyTitle: { fontSize: 17, fontFamily: Fonts.bodySemiBold, marginBottom: 6 },
  therapySubtitle: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.body, marginBottom: 10 },
  therapyNoteInput: { minHeight: 80 },
  emptyState: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  emptyStateText: { fontSize: 14, fontFamily: Fonts.body },
  resourceCard: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  resourceHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  resourceCategory: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  resourceTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold },
  resourceDescription: { fontSize: 14, fontFamily: Fonts.body, marginBottom: 12, lineHeight: 20 },
  resourceActions: { flexDirection: "row", gap: 10 },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: { fontFamily: Fonts.bodySemiBold },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 1,
  },
  closeBtn: { position: "absolute", top: 16, right: 16 },
  closeText: { fontSize: 24, fontFamily: Fonts.body },
  modalIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  modalIconEmoji: { fontSize: 52 },
  modalTitle: { fontSize: 24, fontFamily: Fonts.display, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 16, fontFamily: Fonts.body },
  modalNextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.md,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  modalNextText: { color: "#FFFFFF", fontSize: 16, fontFamily: Fonts.bodySemiBold },
  modalCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
});
