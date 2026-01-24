import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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
import { addContact, getContacts, removeContact } from "@/store/sosStore";
// SOS screen focuses on gambling support.

const HELPLINES = [
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
    label: "7/24 ücretsiz destek • SMS: Ad Soyad, TCKN, talep",
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

const SOS_FOCUS_COPY = {
  title: "Kumar için SOS",
  description: "Kumar dürtüsü yükseldiğinde hızlıca destek ve topraklama adımlarını kullanın.",
};

export default function SOS() {
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
    const timer = setTimeout(() => setBreathingSeconds((prev) => (prev ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [breathingSeconds]);

  useEffect(() => {
    if (delaySeconds === null) return;
    if (delaySeconds <= 0) {
      setDelaySeconds(null);
      return;
    }
    const timer = setTimeout(() => setDelaySeconds((prev) => (prev ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [delaySeconds]);

  const handleAddContact = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const updated = await addContact(newName, newPhone);
    setContacts(updated);
    setNewName("");
    setNewPhone("");
  };

  const handleRemoveContact = async (id: string) => {
    const updated = await removeContact(id);
    setContacts(updated);
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

  const focusCopy = SOS_FOCUS_COPY;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{focusCopy.title}</Text>

        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🆘</Text>
          </View>
          <Text style={styles.cardTitle}>Yalnız değilsiniz</Text>
          <Text style={styles.cardText}>
          {focusCopy.description} Hayati tehlike varsa 112&apos;yi arayın.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acil Yardım</Text>
          {HELPLINES.map((line) => (
            <View key={line.title} style={styles.actionRow}>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{line.title}</Text>
                <Text style={styles.actionSub}>{line.label}</Text>
              </View>
              {line.phone && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => Linking.openURL(`tel:${line.phone}`)}
                >
                  <Text style={styles.primaryButtonText}>Ara</Text>
                </TouchableOpacity>
              )}
              {line.sms && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => Linking.openURL(`sms:${line.sms}`)}
                >
                  <Text style={styles.secondaryButtonText}>Mesaj</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nefes Sıfırlama</Text>
          <Text style={styles.sectionSub}>
            4 saniye nefes al, 4 saniye tut, 6 saniye ver. Süre bitene kadar tekrar edin.
          </Text>
          {breathingSeconds === null ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => setBreathingSeconds(60)}>
              <Text style={styles.primaryButtonText}>60 sn Nefes Başlat</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>{formattedBreathing}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setBreathingSeconds(null)}>
                <Text style={styles.secondaryButtonText}>Durdur</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dürtüyü Ertele</Text>
          <Text style={styles.sectionSub}>Dürtü yoğunluğunu azaltmak için 10 dakikalık bir ara verin.</Text>
          {delaySeconds === null ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => setDelaySeconds(600)}>
              <Text style={styles.primaryButtonText}>10 dk Ertelemeyi Başlat</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>{formattedDelay}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setDelaySeconds(null)}>
                <Text style={styles.secondaryButtonText}>Durdur</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topraklama: 5-4-3-2-1</Text>
          {GROUNDING_STEPS.map((step) => (
            <Text key={step} style={styles.listItem}>• {step}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Baş Etme Planı</Text>
          {COPING_STEPS.map((step) => (
            <Text key={step} style={styles.listItem}>• {step}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Güvenilir Kişiler</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="İsim"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddContact}>
            <Text style={styles.secondaryButtonText}>Kişi Ekle</Text>
          </TouchableOpacity>
          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>Kayıtlı kişi yok</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  >
                    <Text style={styles.primaryButtonText}>Ara</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleRemoveContact(contact.id)}
                  >
                    <Text style={styles.secondaryButtonText}>Kaldır</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showIntro}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntro(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Text style={styles.modalIconEmoji}>🆘</Text>
            </View>

            <Text style={styles.modalTitle}>{focusCopy.title}</Text>
            <Text style={styles.modalSubtitle}>
              {focusCopy.description} Hayati tehlike varsa 112&apos;yi arayın; bir yardım hattını arayın,
              nefes egzersizi başlatın veya güvendiğiniz birine ulaşın.
            </Text>

            <TouchableOpacity style={styles.modalNextBtn} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>Hazırım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 16, color: "#222" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 46 },
  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8, color: "#222" },
  cardText: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1D4C72", marginBottom: 12 },
  sectionSub: { fontSize: 13, color: "#666", marginBottom: 10, lineHeight: 18 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  actionInfo: { flex: 1, marginRight: 12 },
  actionTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  actionSub: { fontSize: 12, color: "#666" },
  primaryButton: {
    backgroundColor: "#D06B5C",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#E8F0F8",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#1D4C72", fontWeight: "700" },
  listItem: { fontSize: 14, color: "#444", marginBottom: 6 },
  inputRow: { gap: 10 },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: "#999", fontStyle: "italic" },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  contactName: { fontSize: 14, fontWeight: "700", color: "#222" },
  contactPhone: { fontSize: 13, color: "#666" },
  contactActions: { flexDirection: "row", gap: 8 },
  timerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timerText: { fontSize: 22, fontWeight: "800", color: "#1D4C72" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  closeBtn: { position: "absolute", top: 16, right: 16 },
  closeText: { fontSize: 24, color: "#999", fontWeight: "300" },
  modalIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconEmoji: { fontSize: 54 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#D06B5C", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16 },
  modalNextBtn: {
    backgroundColor: "#1D4C72",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  modalNextText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
