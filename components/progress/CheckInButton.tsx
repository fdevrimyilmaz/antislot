import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  cleanToday: boolean;
  onCheckIn: () => void;
  disabled?: boolean;
};

export function CheckInButton({ cleanToday, onCheckIn, disabled }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Bugün</Text>
      </View>
      {cleanToday ? (
        <View style={styles.checkedRow}>
          <LinearGradient
            colors={GRADIENTS.success}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkBadge}
          >
            <Text style={styles.checkIcon}>✓</Text>
          </LinearGradient>
          <View style={styles.checkedTextWrap}>
            <Text style={styles.checkedLabel}>Bugün temiz kaldın</Text>
            <Text style={styles.checkedSublabel}>Kayıt onaylandı</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onCheckIn}
          disabled={disabled}
          activeOpacity={0.85}
          style={styles.touchWrap}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.btn, disabled && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>Bugün temiz kaldım</Text>
            <Text style={styles.btnSubtext}>Onayla</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
  titleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.2 },
  checkedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  checkBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  checkIcon: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  checkedTextWrap: { flex: 1 },
  checkedLabel: { fontSize: 16, fontWeight: "700", color: "#065F46" },
  checkedSublabel: { fontSize: 12, color: "#047857", marginTop: 2 },
  touchWrap: { borderRadius: 14, overflow: "hidden", ...progressCardStyles.cardShadow },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  btnSubtext: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 4 },
});
