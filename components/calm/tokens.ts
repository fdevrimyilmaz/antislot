/**
 * Spacing + type scale. Numbers feel arbitrary but they're deliberately
 * generous — `lg` and `xl` are bigger than the existing app's defaults so
 * cards literally breathe further apart. Resist the urge to tighten these
 * when "the screen looks empty" — empty IS the design.
 */

import { Platform, type TextStyle } from "react-native";

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
  xxl: 48,
} as const;

const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

/**
 * Typography. We only use four sizes here — display, title, body, caption —
 * because too many sizes is itself cognitive load.
 */
export const Type = {
  display: {
    fontFamily,
    fontSize: 56,
    fontWeight: "200" as TextStyle["fontWeight"],
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  title: {
    fontFamily,
    fontSize: 22,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily,
    fontSize: 15,
    fontWeight: "500" as TextStyle["fontWeight"],
    letterSpacing: -0.1,
    lineHeight: 21,
  },
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: "400" as TextStyle["fontWeight"],
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: 1.4,
    lineHeight: 16,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },
} as const;
