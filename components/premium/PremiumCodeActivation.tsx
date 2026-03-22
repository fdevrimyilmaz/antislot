import { Fonts, Radius } from "@/constants/theme";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type PremiumCodeActivationProps = {
  onApply: (code: string) => Promise<void>;
  cardColor?: string;
  borderColor?: string;
  textColor?: string;
  placeholderColor?: string;
  buttonColor?: string;
  title?: string;
  subtitle?: string;
  inputPlaceholder?: string;
  actionLabel?: string;
  loadingLabel?: string;
};

export function PremiumCodeActivation({
  onApply,
  cardColor = "#fff",
  borderColor = "rgba(0,0,0,0.08)",
  textColor = "#111",
  placeholderColor = "rgba(0,0,0,0.5)",
  buttonColor = "#0a7ea4",
  title = "Erişim Kodu",
  subtitle = "Beta veya kampanya kodunuz varsa girerek Premium erişimini açabilirsiniz.",
  inputPlaceholder = "Erişim kodu",
  actionLabel = "Kodu Kullan",
  loadingLabel = "...",
}: PremiumCodeActivationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const canApply = code.trim().length > 0 && !loading;

  const handleApply = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    try {
      await onApply(normalized);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: placeholderColor }]}>{subtitle}</Text>
      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: cardColor, color: textColor, borderColor },
          ]}
          placeholder={inputPlaceholder}
          placeholderTextColor={placeholderColor}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          editable={!loading}
        />
        <TouchableOpacity
          style={[
            styles.btn,
            { borderColor },
            !canApply && styles.btnDisabled,
          ]}
          onPress={handleApply}
          disabled={!canApply}
        >
          <Text style={[styles.btnText, { color: buttonColor }]}>
            {loading ? loadingLabel : actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: Radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: { fontSize: 15, fontFamily: Fonts.bodySemiBold, marginBottom: 6 },
  subtitle: { fontSize: 13, fontFamily: Fonts.body, lineHeight: 18, marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    fontFamily: Fonts.body,
  },
  btn: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: Fonts.bodySemiBold },
});
