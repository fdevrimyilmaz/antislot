import { StyleSheet } from "react-native";
import { Radius, Shadows } from "@/constants/theme";

export const cardShadow = Shadows.card;
export const cardShadowSoft = {
  shadowColor: "#1D4C72",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export const progressCardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 20,
    overflow: "hidden",
    ...Shadows.card,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  cardWithAccent: {
    borderLeftWidth: 4,
    borderLeftColor: "#1D4C72",
  },
  progressBarTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "#1D4C72",
  },
  cardShadow: Shadows.card,
});

export const COLORS = {
  primary: "#1D4C72",
  primaryLight: "#2A5F8F",
  primaryDark: "#0F3460",
  success: "#22C55E",
  successLight: "#4ADE80",
  danger: "#EF4444",
  dangerLight: "#F87171",
  muted: "#94A3B8",
  background: "#F4F9FF",
  card: "#FFFFFF",
  border: "#E2E8F0",
  gold: "#EAB308",
  goldLight: "#FDE047",
};

/** Gradient color arrays for LinearGradient */
export const GRADIENTS = {
  primary: ["#1D4C72", "#2A5F8F", "#3B82A6"] as const,
  primaryShort: ["#1D4C72", "#2A5F8F"] as const,
  success: ["#16A34A", "#22C55E", "#4ADE80"] as const,
  gold: ["#CA8A04", "#EAB308", "#FDE047"] as const,
  warm: ["#EA580C", "#F97316"] as const,
  muted: ["#94A3B8", "#CBD5E1"] as const,
} as const;
