import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  addContact,
  DEFAULT_BUDDY_MESSAGE,
  getBuddyMessage,
  getContacts,
  removeContact,
  setBuddy,
  setBuddyMessage,
  type EmergencyContact,
} from "@/store/sosStore";
import {
  CalmBackground,
  CalmHeader,
  GlassCard,
  PrimaryAction,
  Space,
  Type,
} from "@/components/calm";

/**
 * SOS contacts + buddy message template management.
 *
 * Split out of /sos so the crisis screen itself stays focused on
 * breathing + one-tap escapes. Edit-style screens are not appropriate
 * for a user mid-impulse; they belong here.
 */
export default function SOSContactsScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [template, setTemplate] = useState(DEFAULT_BUDDY_MESSAGE);

  useEffect(() => {
    (async () => {
      try {
        const [list, msg] = await Promise.all([
          getContacts(),
          getBuddyMessage(),
        ]);
        setContacts(list);
        setTemplate(msg);
      } catch (error) {
        reportError(error, { scope: "sos-contacts.load", level: "warning" });
      }
    })();
  }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (name.length < 2 || phone.length < 4) {
      haptics.warning();
      toast.warning("İsim ve telefon gerekli.", "Eksik");
      return;
    }
    try {
      const list = await addContact(name, phone);
      setContacts(list);
      setNewName("");
      setNewPhone("");
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "sos-contacts.add" });
      haptics.error();
      toast.error("Eklenemedi.", "Hata");
    }
  };

  const handleRemove = (contact: EmergencyContact) => {
    haptics.warning();
    Alert.alert(
      "Kişiyi Kaldır",
      `${contact.name} listeden çıkarılsın mı?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: async () => {
            try {
              const list = await removeContact(contact.id);
              setContacts(list);
              haptics.success();
            } catch (error) {
              reportError(error, { scope: "sos-contacts.remove" });
              haptics.error();
            }
          },
        },
      ]
    );
  };

  const handleToggleBuddy = async (contact: EmergencyContact) => {
    haptics.selection();
    try {
      const list = await setBuddy(contact.isBuddy ? null : contact.id);
      setContacts(list);
    } catch (error) {
      reportError(error, { scope: "sos-contacts.buddy" });
      haptics.error();
    }
  };

  const handleSaveTemplate = async () => {
    const trimmed = template.trim();
    if (trimmed.length < 6) {
      haptics.warning();
      toast.warning("Mesaj çok kısa.", "Eksik");
      return;
    }
    try {
      await setBuddyMessage(trimmed);
      haptics.success();
      toast.success("Mesaj kaydedildi.", "Tamam");
    } catch (error) {
      reportError(error, { scope: "sos-contacts.template" });
      haptics.error();
      toast.error("Kaydedilemedi.", "Hata");
    }
  };

  return (
    <CalmBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <CalmHeader
            showBack
            eyebrow="SOS"
            title="Destek Kişilerin"
            subtitle="Kriz anında yazılacak güvendiğin kişi(ler)i ekle."
          />

          {/* Existing list */}
          {contacts.length > 0 ? (
            <View style={styles.list}>
              {contacts.map((c) => (
                <GlassCard key={c.id} style={styles.contactCard}>
                  <View style={styles.contactRow}>
                    <View style={styles.contactInfo}>
                      <Text style={[Type.subtitle, { color: colors.text, fontWeight: "700" }]}>
                        {c.name}
                      </Text>
                      <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                        {c.phone}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleBuddy(c)}
                      style={[
                        styles.buddyChip,
                        {
                          backgroundColor: c.isBuddy
                            ? `${colors.accent}26`
                            : "transparent",
                          borderColor: c.isBuddy ? colors.accent : `${colors.textMuted}55`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={c.isBuddy ? "heart" : "heart-outline"}
                        size={14}
                        color={c.isBuddy ? colors.accent : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.buddyChipText,
                          { color: c.isBuddy ? colors.accent : colors.textMuted },
                        ]}
                      >
                        {c.isBuddy ? "Buddy" : "Buddy yap"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(c)}
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <Text style={[styles.removeText, { color: colors.danger }]}>
                      Kaldır
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          ) : (
            <GlassCard style={styles.emptyCard}>
              <Text style={[Type.subtitle, { color: colors.textMuted, textAlign: "center" }]}>
                Henüz kişi eklenmedi.
              </Text>
            </GlassCard>
          )}

          {/* Add new */}
          <GlassCard style={styles.addCard}>
            <Text style={[Type.caption, { color: colors.textMuted }]}>
              YENİ KİŞİ
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="İsim"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: `${colors.primary}33`,
                  backgroundColor: `${colors.background}66`,
                },
              ]}
              accessibilityLabel="İsim"
            />
            <TextInput
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Telefon"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: `${colors.primary}33`,
                  backgroundColor: `${colors.background}66`,
                },
              ]}
              accessibilityLabel="Telefon"
            />
            <View style={styles.addBtnWrap}>
              <PrimaryAction
                title="Kişiyi Ekle"
                onPress={handleAdd}
                icon="person-add"
                tone="soft"
                disabled={!newName.trim() || !newPhone.trim()}
              />
            </View>
          </GlassCard>

          {/* Template */}
          <GlassCard style={styles.templateCard}>
            <Text style={[Type.caption, { color: colors.textMuted }]}>
              BUDDY MESAJI
            </Text>
            <Text style={[Type.subtitle, styles.templateHint, { color: colors.textMuted }]}>
              Kriz anında buddy&apos;ne otomatik gidecek mesaj.
            </Text>
            <TextInput
              value={template}
              onChangeText={setTemplate}
              multiline
              maxLength={240}
              style={[
                styles.templateInput,
                {
                  color: colors.text,
                  borderColor: `${colors.primary}33`,
                  backgroundColor: `${colors.background}66`,
                },
              ]}
              accessibilityLabel="Mesaj şablonu"
            />
            <Text style={[styles.counter, { color: colors.textMuted }]}>
              {template.trim().length}/240
            </Text>
            <View style={styles.saveBtnWrap}>
              <PrimaryAction
                title="Mesajı Kaydet"
                onPress={handleSaveTemplate}
                icon="checkmark"
              />
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Space.lg + 4,
    paddingTop: Space.md,
    paddingBottom: Space.xxl,
    gap: Space.lg,
  },
  list: { gap: Space.md },
  contactCard: {
    paddingVertical: Space.md + 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
  },
  contactInfo: { flex: 1, minWidth: 0 },
  contactPhone: { marginTop: 2, fontSize: 13, fontWeight: "500" },
  buddyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Space.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  buddyChipText: { fontSize: 12, fontWeight: "700" },
  removeBtn: { alignSelf: "flex-end", marginTop: Space.sm },
  removeText: { fontSize: 12, fontWeight: "700" },
  emptyCard: { alignItems: "center", paddingVertical: Space.lg },
  addCard: { gap: Space.sm },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Space.md + 2,
    paddingVertical: Space.md,
    fontSize: 15,
    fontWeight: "500",
    marginTop: Space.sm,
  },
  addBtnWrap: { marginTop: Space.md },
  templateCard: { gap: Space.xs },
  templateHint: { marginTop: Space.xs, marginBottom: Space.sm },
  templateInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Space.md + 2,
    paddingVertical: Space.md,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    minHeight: 100,
    textAlignVertical: "top",
  },
  counter: { fontSize: 11, fontWeight: "600", textAlign: "right", marginTop: 4 },
  saveBtnWrap: { marginTop: Space.md },
});
