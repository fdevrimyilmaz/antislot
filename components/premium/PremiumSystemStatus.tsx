import { Fonts, Radius } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PremiumSystemStatusProps = {
  lastSync: number;
  syncError: string | null;
  onSync?: () => void | Promise<unknown>;
  cardColor?: string;
  borderColor?: string;
  textColor?: string;
  locale?: string;
  lastSyncPrefix?: string;
  noSyncLabel?: string;
  errorPrefix?: string;
  refreshLabel?: string;
};

export function PremiumSystemStatus({
  lastSync,
  syncError,
  onSync,
  cardColor = "#fff",
  borderColor = "rgba(0,0,0,0.08)",
  textColor = "#111",
  locale = "tr-TR",
  lastSyncPrefix = "Son senkron:",
  noSyncLabel = "Henüz senkron yok",
  errorPrefix = "Hata",
  refreshLabel = "Yenile",
}: PremiumSystemStatusProps) {
  const syncLabel =
    lastSync > 0
      ? `${lastSyncPrefix} ${new Date(lastSync).toLocaleString(locale)}`
      : noSyncLabel;
  const statusLabel = syncError ? `${errorPrefix}: ${syncError}` : syncLabel;

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{statusLabel}</Text>
      {onSync ? (
        <TouchableOpacity
          style={[styles.syncBtn, { borderColor: textColor }]}
          onPress={onSync}
        >
          <Text style={[styles.syncBtnText, { color: textColor }]}>{refreshLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: { fontSize: 12, flex: 1, fontFamily: Fonts.body },
  syncBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  syncBtnText: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
});
