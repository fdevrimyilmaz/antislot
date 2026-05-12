import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { addContact, getContacts, removeContact } from "@/store/sosStore";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";

type Helpline = {
  title: string;
  phone?: string;
  sms?: string;
  label: string;
};

const HELPLINES: Helpline[] = [
  {
    title: "112 Acil Çağrı Merkezi",
    phone: "112",
    label: "Hayati tehlike veya acil durum",
  },
  {
    title: "Yeşilay Danışmanlık Merkezi (YEDAM)",
    phone: "115",
    label: "Bağımlılık desteği ve danışmanlık",
  },
  {
    title: "Alo 183 Sosyal Destek Hattı",
    phone: "183",
    sms: "183",
    label: "7/24 ücretsiz destek · SMS: Ad Soyad, TCKN, talep",
  },
];

const COPING_STEPS = [
  "60 saniye durup nefes alın.",
  "Dürtüyü yüksek sesle adlandırın ve 1-10 arasında puanlayın.",
  "Güvenli bir yere geçin veya oda değiştirin.",
  "Güvendiğiniz birini arayın veya mesaj atın.",
  "Günlüğünüzü açın ve bir paragraf yazın.",
  "5 dakikalık dikkat dağıtıcı bir etkinlik yapın.",
];

const GROUNDING_STEPS = [
  "Gördüğünüz 5 şey",
  "Dokunabildiğiniz 4 şey",
  "Duyabildiğiniz 3 şey",
  "Koklayabildiğiniz 2 şey",
  "Tadabildiğiniz 1 şey",
];

const BREATHING_DURATION_SEC = 60;
const DELAY_DURATION_SEC = 600;

export default function SOS() {
  const { colors } = useTheme();
  const toast = useToast();

  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [breathingSeconds, setBreathingSeconds] = useState<number | null>(null);
  const [delaySeconds, setDelaySeconds] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getContacts();
        setContacts(stored);
      } catch (error) {
        reportError(error, { scope: "sos.contacts.load", level: "warning" });
      }
    })();
  }, []);

  useEffect(() => {
    if (breathingSeconds === null) return;
    if (breathingSeconds <= 0) {
      setBreathingSeconds(null);
      haptics.success();
      return;
    }
    const timer = setTimeout(
      () => setBreathingSeconds((prev) => (prev ? prev - 1 : null)),
      1000
    );
    return () => clearTimeout(timer);
  }, [breathingSeconds]);

  useEffect(() => {
    if (delaySeconds === null) return;
    if (delaySeconds <= 0) {
      setDelaySeconds(null);
      haptics.success();
      return;
    }
    const timer = setTimeout(
      () => setDelaySeconds((prev) => (prev ? prev - 1 : null)),
      1000
    );
    return () => clearTimeout(timer);
  }, [delaySeconds]);

  const handleEmergency = () => {
    haptics.tapHeavy();
    Linking.openURL("tel:112");
  };

  const handleCallPhone = (phone: string) => {
    haptics.tapMedium();
    Linking.openURL(`tel:${phone}`);
  };

  const handleSendSms = (sms: string) => {
    haptics.tapLight();
    Linking.openURL(`sms:${sms}`);
  };

  const handleStartBreathing = () => {
    haptics.tapLight();
    setBreathingSeconds(BREATHING_DURATION_SEC);
  };

  const handleStopBreathing = () => {
    haptics.warning();
    setBreathingSeconds(null);
  };

  const handleStartDelay = () => {
    haptics.tapLight();
    setDelaySeconds(DELAY_DURATION_SEC);
  };

  const handleStopDelay = () => {
    haptics.warning();
    setDelaySeconds(null);
  };

  const handleAddContact = async () => {
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();
    if (!trimmedName || !trimmedPhone) {
      toast.warning("İsim ve telefon alanlarını doldurun.", "Eksik Bilgi");
      return;
    }
    try {
      const updated = await addContact(trimmedName, trimmedPhone);
      setContacts(updated);
      setNewName("");
      setNewPhone("");
      haptics.success();
      toast.success(`${trimmedName} eklendi.`, "Kişi Eklendi");
    } catch (error) {
      reportError(error, { scope: "sos.contacts.add" });
      haptics.error();
      toast.error("Kişi eklenemedi. Lütfen tekrar deneyin.", "Hata");
    }
  };

  const handleRemoveContact = async (id: string, name: string) => {
    haptics.warning();
    try {
      const updated = await removeContact(id);
      setContacts(updated);
      toast.info(`${name} kaldırıldı.`);
    } catch (error) {
      reportError(error, { scope: "sos.contacts.remove" });
      haptics.error();
    }
  };

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
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.text}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEmergency}
              style={[styles.emergencyChip, { backgroundColor: colors.danger }]}
              accessibilityRole="button"
              accessibilityLabel="112 Acil aranır"
            >
              <Ionicons name="call" size={14} color="#FFFFFF" />
              <Text style={styles.emergencyChipText}>112 Ara</Text>
            </TouchableOpacity>
          </View>

          <Card variant="hero" style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="heart" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Yalnız değilsiniz
              </Text>
              <Text style={styles.heroSubtitle}>
                Kumar dürtüsü yükseldiğinde hızlı destek ve topraklama adımları burada.
                Hayati tehlike varsa 112’yi arayın.
              </Text>
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Nefes Sıfırlama"
              icon="leaf"
              subtitle="4 saniye al · 4 saniye tut · 6 saniye ver. Süre bitene kadar tekrar edin."
            />
            {breathingSeconds === null ? (
              <Button
                title="60 sn Nefes Başlat"
                onPress={handleStartBreathing}
                variant="primary"
                fullWidth
                leftIcon="play"
              />
            ) : (
              <View style={styles.timerRow}>
                <Text
                  style={[styles.timerText, { color: colors.primary }]}
                  accessibilityLiveRegion="polite"
                >
                  {formattedBreathing}
                </Text>
                <Button
                  title="Durdur"
                  onPress={handleStopBreathing}
                  variant="secondary"
                  leftIcon="stop"
                />
              </View>
            )}
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Dürtüyü Ertele"
              icon="time"
              subtitle="Dürtü yoğunluğunu azaltmak için 10 dakikalık bir ara verin."
            />
            {delaySeconds === null ? (
              <Button
                title="10 dk Ertelemeyi Başlat"
                onPress={handleStartDelay}
                variant="primary"
                fullWidth
                leftIcon="hourglass"
              />
            ) : (
              <View style={styles.timerRow}>
                <Text
                  style={[styles.timerText, { color: colors.primary }]}
                  accessibilityLiveRegion="polite"
                >
                  {formattedDelay}
                </Text>
                <Button
                  title="Durdur"
                  onPress={handleStopDelay}
                  variant="secondary"
                  leftIcon="stop"
                />
              </View>
            )}
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader title="Yardım Hatları" icon="call" />
            <View style={styles.helplineList}>
              {HELPLINES.map((line, index) => (
                <View
                  key={line.title}
                  style={[
                    styles.helplineRow,
                    index < HELPLINES.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.helplineInfo}>
                    <Text style={[styles.helplineTitle, { color: colors.text }]}>
                      {line.title}
                    </Text>
                    <Text style={[styles.helplineSub, { color: colors.textMuted }]}>
                      {line.label}
                    </Text>
                  </View>
                  <View style={styles.helplineActions}>
                    {line.phone ? (
                      <Button
                        title="Ara"
                        onPress={() => handleCallPhone(line.phone!)}
                        variant="primary"
                        leftIcon="call"
                      />
                    ) : null}
                    {line.sms ? (
                      <Button
                        title="SMS"
                        onPress={() => handleSendSms(line.sms!)}
                        variant="secondary"
                        leftIcon="chatbox"
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Topraklama: 5-4-3-2-1"
              icon="compass"
              subtitle="Şu ana dönmek için duyularınıza odaklanın."
            />
            <View style={styles.stepList}>
              {GROUNDING_STEPS.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: `${colors.primary}1F`, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                      {GROUNDING_STEPS.length - index}
                    </Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Hızlı Baş Etme Planı"
              icon="list"
              subtitle="Sıraya göre uygulayın, biri işe yaramadıysa diğerine geçin."
            />
            <View style={styles.stepList}>
              {COPING_STEPS.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepBullet,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.stepBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Güvendiğiniz Kişiler"
              icon="people"
              subtitle="Krizde hızlı ulaşabileceğiniz numaraları saklayın."
            />
            <View style={styles.contactForm}>
              <TextInput
                style={[
                  styles.contactInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="İsim"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                accessibilityLabel="Kişi ismi"
              />
              <TextInput
                style={[
                  styles.contactInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Telefon"
                placeholderTextColor={colors.textMuted}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                accessibilityLabel="Kişi telefonu"
              />
              <Button
                title="Kişi Ekle"
                onPress={handleAddContact}
                variant="secondary"
                fullWidth
                leftIcon="person-add"
              />
            </View>

            {contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Kayıtlı kişi yok
                </Text>
              </View>
            ) : (
              <View style={styles.contactList}>
                {contacts.map((contact, index) => (
                  <View
                    key={contact.id}
                    style={[
                      styles.contactRow,
                      index < contacts.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: colors.text }]}>
                        {contact.name}
                      </Text>
                      <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                        {contact.phone}
                      </Text>
                    </View>
                    <View style={styles.contactActions}>
                      <Button
                        title="Ara"
                        onPress={() => handleCallPhone(contact.phone)}
                        variant="primary"
                        leftIcon="call"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveContact(contact.id, contact.name)}
                        style={styles.removeBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`${contact.name} kaldır`}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, gap: 0 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  emergencyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emergencyChipText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    opacity: 0.92,
    fontSize: 13,
    lineHeight: 18,
  },
  cardSpacing: {
    marginBottom: 14,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
  },
  helplineList: {
    width: "100%",
  },
  helplineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  helplineInfo: {
    flex: 1,
    minWidth: 0,
  },
  helplineTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  helplineSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  helplineActions: {
    flexDirection: "row",
    gap: 8,
  },
  stepList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "800",
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBulletText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  contactForm: {
    gap: 10,
    marginBottom: 4,
  },
  contactInput: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  contactList: {
    marginTop: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 10,
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "700",
  },
  contactPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
  },
});
