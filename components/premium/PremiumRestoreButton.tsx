import { Fonts, Radius } from "@/constants/theme";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type PremiumRestoreButtonProps = {
  onRestore: () => Promise<void>;
  cardColor?: string;
  borderColor?: string;
  textColor?: string;
  label?: string;
  loadingLabel?: string;
};

export function PremiumRestoreButton({
  onRestore,
  cardColor = "#fff",
  borderColor = "rgba(0,0,0,0.08)",
  textColor = "#0a7ea4",
  label = "Satın alımı geri yükle",
  loadingLabel = "Geri yükleniyor...",
}: PremiumRestoreButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await onRestore();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: cardColor, borderColor }]}
      onPress={handlePress}
      disabled={loading}
      testID="premium-restore-btn"
    >
      <Text style={[styles.label, { color: textColor }]}>
        {loading ? loadingLabel : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  label: { fontFamily: Fonts.bodySemiBold },
});
