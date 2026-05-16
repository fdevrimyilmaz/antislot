import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { haptics } from "@/services/haptics";
import type { Language } from "@/i18n/translations";

type LanguageOption = {
  id: Language;
  label: string;
  nativeLabel: string;
  flag: string;
};

const OPTIONS: LanguageOption[] = [
  { id: "tr", label: "Turkish", nativeLabel: "Turkce", flag: "TR" },
  { id: "en", label: "English", nativeLabel: "English", flag: "EN" },
  { id: "de", label: "German", nativeLabel: "Deutsch", flag: "DE" },
  { id: "fr", label: "French", nativeLabel: "Francais", flag: "FR" },
  { id: "es", label: "Spanish", nativeLabel: "Espanol", flag: "ES" },
  { id: "it", label: "Italian", nativeLabel: "Italiano", flag: "IT" },
  { id: "pt", label: "Portuguese", nativeLabel: "Portugues", flag: "PT" },
  { id: "ar", label: "Arabic", nativeLabel: "Arabic", flag: "AR" },
  { id: "ru", label: "Russian", nativeLabel: "Russkiy", flag: "RU" },
  { id: "fil", label: "Filipino", nativeLabel: "Filipino", flag: "PH" },
  { id: "sv", label: "Swedish", nativeLabel: "Svenska", flag: "SE" },
  { id: "fi", label: "Finnish", nativeLabel: "Suomi", flag: "FI" },
  { id: "nl", label: "Dutch", nativeLabel: "Nederlands", flag: "NL" },
  { id: "ja", label: "Japanese", nativeLabel: "Nihongo", flag: "JP" },
  { id: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "ID" },
  { id: "th", label: "Thai", nativeLabel: "Phasa Thai", flag: "TH" },
  { id: "hi", label: "Hindi", nativeLabel: "Hindi", flag: "IN" },
  { id: "km", label: "Khmer", nativeLabel: "Khmer", flag: "KH" },
  { id: "el", label: "Greek", nativeLabel: "Ellinika", flag: "GR" },
];

type LanguageSelectorProps = {
  variant?: "card" | "row";
};

export function LanguageSelector({ variant = "card" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.id === language) ?? OPTIONS[0];

  const handleSelect = async (id: Language) => {
    haptics.selection();
    if (id === language) {
      setOpen(false);
      return;
    }
    try {
      await setLanguage(id);
    } finally {
      setOpen(false);
    }
  };

  const handleOpen = () => {
    haptics.tapLight();
    setOpen(true);
  };

  const Trigger = (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={`${t.languageSection}: ${current.nativeLabel}`}
      accessibilityHint={t.languageSectionHint}
      style={[
        styles.trigger,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.triggerIcon, { backgroundColor: `${colors.primary}14` }]}>
        <Ionicons name="language" size={16} color={colors.primary} />
      </View>
      <View style={styles.triggerText}>
        <Text style={[styles.triggerLabel, { color: colors.text }]} numberOfLines={1}>
          {t.languageSection}
        </Text>
        <Text style={[styles.triggerValue, { color: colors.textMuted }]} numberOfLines={1}>
          {current.flag} {current.nativeLabel}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <>
      {variant === "card" ? <Card padding={0}>{Trigger}</Card> : Trigger}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t.generalBack}
          />

          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sheetHeader}>
              <Ionicons name="language" size={18} color={colors.primary} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t.languageSection}</Text>
            </View>
            <Text style={[styles.sheetHint, { color: colors.textMuted }]}>{t.languageSectionHint}</Text>

            <ScrollView
              style={styles.optionsScroll}
              contentContainerStyle={styles.optionList}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {OPTIONS.map((opt) => {
                const selected = opt.id === language;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelect(opt.id)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected ? `${colors.primary}14` : "transparent",
                        borderColor: selected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.nativeLabel} (${opt.label})`}
                  >
                    <Text style={styles.flag}>{opt.flag}</Text>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionNative, { color: colors.text }]}>{opt.nativeLabel}</Text>
                      <Text style={[styles.optionLatin, { color: colors.textMuted }]}>{opt.label}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.cardBorder }]}>
                      {selected ? <View style={[styles.radioInner, { backgroundColor: colors.primary }]} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  triggerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerText: { flex: 1, minWidth: 0 },
  triggerLabel: { fontSize: 14, fontWeight: "700" },
  triggerValue: { fontSize: 12, marginTop: 2 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 4,
    maxHeight: "84%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  sheetHint: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  optionsScroll: {
    maxHeight: 500,
  },
  optionList: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  flag: { fontSize: 24 },
  optionText: { flex: 1, minWidth: 0 },
  optionNative: { fontSize: 15, fontWeight: "800" },
  optionLatin: { fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});
