import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/contexts/ThemeContext";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "gradient";
type ButtonSize = "md" | "lg";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const sizeStyle = size === "lg" ? styles.sizeLg : styles.sizeMd;
  const textSize = size === "lg" ? styles.textLg : styles.textMd;

  const palette = (() => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          textColor: colors.primary,
          borderWidth: 1,
        };
      case "destructive":
        return {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          textColor: "#FFFFFF",
          borderWidth: 0,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: colors.primary,
          borderWidth: 0,
        };
      case "gradient":
      case "primary":
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: "#FFFFFF",
          borderWidth: 0,
        };
    }
  })();

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={palette.textColor} size="small" />
      ) : (
        <>
          {leftIcon ? (
            <Ionicons name={leftIcon} size={18} color={palette.textColor} style={styles.leftIcon} />
          ) : null}
          <Text style={[styles.text, textSize, { color: palette.textColor }, textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {rightIcon ? (
            <Ionicons name={rightIcon} size={18} color={palette.textColor} style={styles.rightIcon} />
          ) : null}
        </>
      )}
    </View>
  );

  if (variant === "gradient") {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.base,
          styles.gradientWrapper,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={[colors.warning, "#F59E0B", colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientFill, sizeStyle]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyle,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: palette.borderWidth,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sizeLg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 16,
    letterSpacing: 0.4,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  gradientWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
  gradientFill: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
