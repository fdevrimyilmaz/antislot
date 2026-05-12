import React, { type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const TOTAL_STEPS = 10;

type OnboardingShellProps = {
  step: number; // 1-indexed; 0 = intro
  title: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  /** Customize the bottom CTA. */
  nextLabel?: string;
  nextIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onNext: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  /** Override back navigation. Default: router.back() */
  onBack?: () => void;
  hideBack?: boolean;
};

export function OnboardingShell({
  step,
  title,
  subtitle,
  hint,
  children,
  contentStyle,
  scrollable = true,
  nextLabel = "İleri",
  nextIcon = "arrow-forward",
  onNext,
  nextDisabled = false,
  nextLoading = false,
  onBack,
  hideBack = false,
}: OnboardingShellProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const Content = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: [styles.contentArea, contentStyle],
        showsVerticalScrollIndicator: false,
      }
    : { style: [styles.contentArea, contentStyle] };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.topBar}>
          {hideBack ? (
            <View style={styles.backPlaceholder} />
          ) : (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          )}

          <ProgressDots step={step} total={TOTAL_STEPS} />
        </View>

        <Content {...contentProps}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
          {hint ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
          ) : null}

          <View style={styles.body}>{children}</View>
        </Content>

        <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
          <Button
            title={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={nextIcon}
          />
        </SafeAreaView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type ProgressDotsProps = { step: number; total: number };

function ProgressDots({ step, total }: ProgressDotsProps) {
  const { colors } = useTheme();
  const safeStep = Math.max(0, Math.min(total, step));

  return (
    <View
      style={styles.dotsRow}
      accessible
      accessibilityLabel={`Adım ${safeStep} / ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const isActive = idx === safeStep;
        const isPast = idx < safeStep;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: isPast
                  ? colors.primary
                  : isActive
                  ? colors.primary
                  : `${colors.cardBorder}AA`,
                width: isActive ? 18 : 6,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minWidth: 60,
  },
  backPlaceholder: {
    minWidth: 60,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  contentArea: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
  },
  body: {
    marginTop: 14,
  },
  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
