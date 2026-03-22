/**
 * Design system: colors, spacing, radius, shadows, typography.
 * Used across the app for a consistent, professional look.
 */

import { Platform, ViewStyle } from "react-native";

const palette = {
  ink: "#0F172A",
  inkMuted: "#475569",
  inkSoft: "#64748B",
  paper: "#F6F7FB",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  primary: "#0F5B7A",
  primarySoft: "#DCECF3",
  accent: "#F2C94C",
  success: "#1E7A55",
  warning: "#D97706",
  danger: "#D14343",
  night: "#0B1220",
  nightSurface: "#111827",
  nightBorder: "rgba(248, 250, 252, 0.08)",
  nightText: "#F8FAFC",
};

const tintColorLight = palette.primary;
const tintColorDark = "#8BC4DD";

export const Colors = {
  light: {
    /** Base */
    text: palette.ink,
    textSecondary: palette.inkSoft,
    background: palette.paper,
    surface: palette.surface,
    border: palette.border,

    /** Brand / accents */
    tint: tintColorLight,
    primary: palette.primary,
    primarySoft: palette.primarySoft,
    accent: palette.accent,

    /** States */
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,

    /** Navigation */
    icon: palette.inkMuted,
    tabIconDefault: palette.inkMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    /** Base */
    text: palette.nightText,
    textSecondary: "rgba(248, 250, 252, 0.72)",
    background: palette.night,
    surface: palette.nightSurface,
    border: palette.nightBorder,

    /** Brand / accents */
    tint: tintColorDark,
    primary: tintColorDark,
    primarySoft: "rgba(139, 196, 221, 0.16)",
    accent: palette.accent,

    /** States */
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#F87171",

    /** Navigation */
    icon: "rgba(248, 250, 252, 0.7)",
    tabIconDefault: "rgba(248, 250, 252, 0.6)",
    tabIconSelected: tintColorDark,
  },
};

/** Spacing scale (4px base) */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  jumbo: 48,
} as const;

/** Border radius scale */
export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 999,
} as const;

/** Elevation shadows for cards and surfaces */
export const Shadows: Record<
  "card" | "cardHover" | "modal" | "button",
  ViewStyle
> = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardHover: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 8,
  },
  modal: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  button: {
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
};

const systemSans = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const Fonts = {
  display: systemSans,
  displayMedium: systemSans,
  body: systemSans,
  bodyMedium: systemSans,
  bodySemiBold: systemSans,
  mono: Platform.select({
    ios: "SFMono-Regular",
    android: "monospace",
    default: "monospace",
  }),
};

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: "500",
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
};
