import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { OFFLINE_CRISIS_FALLBACK } from "@/services/crisisProtocol";
import { openExternalUrlWithFallback } from "@/services/safeLinking";
import { useAccessibilityStore } from "@/store/accessibilityStore";
import { addContact, getContacts, removeContact } from "@/store/sosStore";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Helpline = {
  title: string;
  phone: string;
  sms?: string;
  label: string;
};

const SOS_COPY = {
  tr: {
    focusTitle: "Kumar icin SOS",
    focusDescription:
      "Durtu yukselince hizli destek adimlariyla guvenli bir aralik ac.",
    introTitle: "Yalniz degilsin",
    dangerHint: "Hayati tehlike varsa 112'yi hemen ara.",
    emergencyHelp: "Acil Yardim",
    breathingTitle: "Nefes Sifirlama",
    breathingSubtitle: "4 saniye al, 4 saniye tut, 6 saniye ver. Sure bitene kadar tekrar et.",
    breathingStart: "60 sn Nefes Baslat",
    stop: "Durdur",
    delayTitle: "Durtuyu Ertele",
    delaySubtitle: "Yogunlugu dusurmek icin 10 dakikalik mola ver.",
    delayStart: "10 dk Ertelemeyi Baslat",
    groundingTitle: "Topraklama: 5-4-3-2-1",
    quickPlanTitle: "Hizli Bas Etme Plani",
    trustedContacts: "Guvenilir Kisiler",
    namePlaceholder: "Isim",
    phonePlaceholder: "Telefon",
    addContact: "Kisi Ekle",
    noContacts: "Kayitli kisi yok",
    call: "Ara",
    message: "Mesaj",
    remove: "Kaldir",
    ready: "Hazirim",
    modalBodySuffix:
      "Bir yardim hattini ara, nefes egzersizi baslat veya guvendigin birine ulas.",
    helplines: [
      {
        title: "112 Acil Cagri Merkezi",
        phone: "112",
        label: "Hayati risk veya acil durum",
      },
      {
        title: "Yesilay Danismanlik Merkezi (YEDAM)",
        phone: "115",
        label: "Bagimlilik destegi ve danismanlik",
      },
      {
        title: "Alo 183 Sosyal Destek Hatti",
        phone: "183",
        sms: "183",
        label: "7/24 ucretsiz destek - SMS: ad, soyad, talep",
      },
    ] as Helpline[],
    copingSteps: [
      "60 saniye durup nefese odaklan.",
      "Durtuyu adlandir ve 1-10 arasi puanla.",
      "Guvenli bir alana gec veya ortam degistir.",
      "Guvendigin birini ara ya da mesaj at.",
      "Gunluge kisa bir not yaz.",
      "5 dakikalik dikkat dagitici bir aktivite yap.",
    ],
    groundingSteps: [
      "Gordugun 5 sey",
      "Dokundugun 4 sey",
      "Duydugun 3 sey",
      "Kokladigin 2 sey",
      "Tadabildigin 1 sey",
    ],
  },
  en: {
    focusTitle: "SOS for Gambling Urges",
    focusDescription:
      "When urges rise, create a safe pause with fast support actions.",
    introTitle: "You are not alone",
    dangerHint: "Call 112 immediately for life-threatening danger.",
    emergencyHelp: "Emergency Help",
    breathingTitle: "Breathing Reset",
    breathingSubtitle:
      "Inhale for 4 seconds, hold for 4 seconds, exhale for 6 seconds. Repeat until time ends.",
    breathingStart: "Start 60s Breathing",
    stop: "Stop",
    delayTitle: "Delay the Urge",
    delaySubtitle: "Take a 10-minute break to reduce urge intensity.",
    delayStart: "Start 10-min Delay",
    groundingTitle: "Grounding: 5-4-3-2-1",
    quickPlanTitle: "Quick Coping Plan",
    trustedContacts: "Trusted Contacts",
    namePlaceholder: "Name",
    phonePlaceholder: "Phone",
    addContact: "Add Contact",
    noContacts: "No saved contacts",
    call: "Call",
    message: "Message",
    remove: "Remove",
    ready: "I'm Ready",
    modalBodySuffix:
      "Call a helpline, start breathing, or contact someone you trust.",
    helplines: [
      {
        title: "112 Emergency Call Center",
        phone: "112",
        label: "Life-threatening risk or urgent emergency",
      },
      {
        title: "Yesilay Counseling Center (YEDAM)",
        phone: "115",
        label: "Addiction support and counseling",
      },
      {
        title: "Alo 183 Social Support Line",
        phone: "183",
        sms: "183",
        label: "24/7 free support - SMS your name and request",
      },
    ] as Helpline[],
    copingSteps: [
      "Pause for 60 seconds and focus on breathing.",
      "Name the urge and rate it from 1 to 10.",
      "Move to a safer place or change environment.",
      "Call or message someone you trust.",
      "Write a short journal note.",
      "Do a 5-minute distraction activity.",
    ],
    groundingSteps: [
      "5 things you can see",
      "4 things you can touch",
      "3 things you can hear",
      "2 things you can smell",
      "1 thing you can taste",
    ],
  },
} as const;

export default function SOS() {
  const { preferences } = useAccessibilityStore();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(SOS_COPY);

  const fontScale = preferences.fontScale;
  const crisisMode = preferences.crisisMode;
  const headingScale = Math.min(fontScale, 1.2);

  const [showIntro, setShowIntro] = useState(true);
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [breathingSeconds, setBreathingSeconds] = useState<number | null>(null);
  const [delaySeconds, setDelaySeconds] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await getContacts();
      setContacts(stored);
    })();
  }, []);

  useEffect(() => {
    if (breathingSeconds === null) return;
    if (breathingSeconds <= 0) {
      setBreathingSeconds(null);
      return;
    }
    const timer = setTimeout(() => {
      setBreathingSeconds((prev) => (prev ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [breathingSeconds]);

  useEffect(() => {
    if (delaySeconds === null) return;
    if (delaySeconds <= 0) {
      setDelaySeconds(null);
      return;
    }
    const timer = setTimeout(() => {
      setDelaySeconds((prev) => (prev ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [delaySeconds]);

  async function handleAddContact() {
    if (!newName.trim() || !newPhone.trim()) return;
    const updated = await addContact(newName.trim(), newPhone.trim());
    setContacts(updated);
    setNewName("");
    setNewPhone("");
  }

  async function handleRemoveContact(id: string) {
    const updated = await removeContact(id);
    setContacts(updated);
  }

  const formattedBreathing = useMemo(() => {
    if (breathingSeconds === null) return "";
    const minutes = Math.floor(breathingSeconds / 60);
    const seconds = breathingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [breathingSeconds]);

  const formattedDelay = useMemo(() => {
    if (delaySeconds === null) return "";
    const minutes = Math.floor(delaySeconds / 60);
    const seconds = delaySeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [delaySeconds]);

  async function openDial(phone: string) {
    await openExternalUrlWithFallback({
      url: `tel:${phone}`,
      fallbackTitle: OFFLINE_CRISIS_FALLBACK.title,
      fallbackMessage: `${OFFLINE_CRISIS_FALLBACK.description}\n\nManual call: ${phone}`,
    });
  }

  async function openSms(phone: string) {
    await openExternalUrlWithFallback({
      url: `sms:${phone}`,
      fallbackTitle: OFFLINE_CRISIS_FALLBACK.title,
      fallbackMessage: `${OFFLINE_CRISIS_FALLBACK.description}\n\nManual SMS: ${phone}`,
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="sos-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="sos-back">
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { fontSize: 28 * headingScale, color: colors.text }]}>{copy.focusTitle}</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="sos-intro-card">
          <View style={[styles.iconWrapper, { backgroundColor: `${colors.warning ?? "#D97706"}1A` }]}> 
            <Text style={[styles.icon, { color: colors.warning ?? "#D97706" }]}>SOS</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{copy.introTitle}</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            {copy.focusDescription} {copy.dangerHint}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]} testID="sos-helplines">
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.emergencyHelp}</Text>
          {copy.helplines.map((line) => (
            <View key={line.title} style={styles.actionRow}>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{line.title}</Text>
                <Text style={[styles.actionSub, { color: colors.textSecondary }]}>{line.label}</Text>
              </View>
              <View style={styles.actionButtons}>
                {line.phone ? (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.warning ?? "#D97706" }]}
                    onPress={() => void openDial(line.phone)}
                    accessibilityRole="button"
                    accessibilityLabel={`${line.title} - ${copy.call}`}
                  >
                    <Text style={styles.primaryButtonText}>{copy.call}</Text>
                  </TouchableOpacity>
                ) : null}
                {line.sms ? (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => void openSms(line.sms!)}
                    accessibilityRole="button"
                    accessibilityLabel={`${line.title} - ${copy.message}`}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.message}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {!crisisMode ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.breathingTitle}</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{copy.breathingSubtitle}</Text>
            {breathingSeconds === null ? (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => setBreathingSeconds(60)}
                testID="sos-breathing-start"
              >
                <Text style={styles.primaryButtonText}>{copy.breathingStart}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerRow}>
                <Text style={[styles.timerText, { color: colors.primary }]}>{formattedBreathing}</Text>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setBreathingSeconds(null)}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.stop}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        {!crisisMode ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.delayTitle}</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{copy.delaySubtitle}</Text>
            {delaySeconds === null ? (
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => setDelaySeconds(600)}>
                <Text style={styles.primaryButtonText}>{copy.delayStart}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerRow}>
                <Text style={[styles.timerText, { color: colors.primary }]}>{formattedDelay}</Text>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setDelaySeconds(null)}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.stop}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.groundingTitle}</Text>
          {copy.groundingSteps.map((step) => (
            <Text key={step} style={[styles.listItem, { color: colors.textSecondary }]}> 
              {`- ${step}`}
            </Text>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.quickPlanTitle}</Text>
          {(crisisMode ? copy.copingSteps.slice(0, 3) : copy.copingSteps).map((step) => (
            <Text key={step} style={[styles.listItem, { color: colors.textSecondary }]}> 
              {`- ${step}`}
            </Text>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.trustedContacts}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={copy.namePlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={copy.phonePlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => void handleAddContact()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.addContact}</Text>
          </TouchableOpacity>

          {contacts.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.noContacts}</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={[styles.contactRow, { borderBottomColor: colors.border }]}> 
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                  <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={() => void openDial(contact.phone)}
                    accessibilityRole="button"
                    accessibilityLabel={`${contact.name} - ${copy.call}`}
                  >
                    <Text style={styles.primaryButtonText}>{copy.call}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => void handleRemoveContact(contact.id)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.remove}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
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

            <View style={[styles.modalIcon, { backgroundColor: `${colors.warning ?? "#D97706"}1A` }]}> 
              <Text style={[styles.modalIconLabel, { color: colors.warning ?? "#D97706" }]}>SOS</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{copy.focusTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {copy.focusDescription} {copy.dangerHint} {copy.modalBodySuffix}
            </Text>

            <TouchableOpacity style={[styles.modalNextBtn, { backgroundColor: colors.primary }]} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>{copy.ready}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.base,
  },
  backBtn: {
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  title: {
    fontFamily: Fonts.display,
    marginBottom: Spacing.base,
  },
  card: {
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: Spacing.base,
    alignItems: "center",
    borderWidth: 1,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    fontFamily: Fonts.displayMedium,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontFamily: Fonts.body,
  },
  section: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: Fonts.body,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  actionInfo: {
    flex: 1,
    minWidth: 0,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 19,
    flexShrink: 1,
  },
  actionSub: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Fonts.body,
    lineHeight: 17,
    flexShrink: 1,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: Fonts.body,
  },
  inputRow: {
    gap: 10,
    marginBottom: 10,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    fontFamily: Fonts.body,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: Fonts.body,
    fontStyle: "italic",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flex: 1,
    paddingRight: 10,
  },
  contactName: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  contactPhone: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Fonts.body,
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerText: {
    fontSize: 22,
    fontFamily: Fonts.displayMedium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: Radius.xl,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    fontFamily: Fonts.bodySemiBold,
  },
  modalIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  modalIconLabel: {
    fontSize: 28,
    fontFamily: Fonts.displayMedium,
  },
  modalTitle: {
    fontSize: 23,
    fontFamily: Fonts.display,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: Fonts.body,
  },
  modalNextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    width: "100%",
    alignItems: "center",
  },
  modalNextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
});
