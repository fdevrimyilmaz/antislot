import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { type ThemeColors } from "@/contexts/ThemeContext";

export type PremiumBarChartDatum = {
  key: string;
  label: string;
  /** 0-100 normalized value for visual bar height. */
  value: number;
  /** When true, the bar is rendered as a thin dimmed marker. */
  inactive?: boolean;
  /** Optional display text used in the peak badge instead of `${value}%`. */
  valueLabel?: string;
};

export type PremiumBarChartReferenceLine = {
  /** 0-100 normalized position. */
  value: number;
  /** Optional pill label rendered next to the line. */
  label?: string;
};

type PremiumBarChartColors = Pick<
  ThemeColors,
  "text" | "textMuted" | "primary" | "accent" | "warning" | "card" | "cardBorder"
>;

type PremiumBarChartProps = {
  data: readonly PremiumBarChartDatum[];
  colors: PremiumBarChartColors;
  chartHeight?: number;
  /** Optional dashed reference line (avg, target, last week, etc). */
  referenceLine?: PremiumBarChartReferenceLine;
  /** Show value as a small pill above the peak bar. Default true. */
  highlightPeak?: boolean;
};

const STAGGER_STEP_MS = 70;
const BAR_MIN_WIDTH = 10;
const BAR_MAX_WIDTH = 22;
const BAR_INACTIVE_WIDTH = 4;
const LABEL_AREA_HEIGHT = 22;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

type PreparedDatum = PremiumBarChartDatum & {
  safeValue: number;
  fillHeight: number;
};

type BarItemProps = {
  item: PreparedDatum;
  index: number;
  chartHeight: number;
  barWidth: number;
  isPeak: boolean;
  showPeakBadge: boolean;
  colors: PremiumBarChartColors;
  delay: number;
  animKey: string;
};

function BarItem({
  item,
  chartHeight,
  barWidth,
  isPeak,
  showPeakBadge,
  colors,
  delay,
  animKey,
}: BarItemProps) {
  const progress = useSharedValue(0);
  const badgeProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    badgeProgress.value = 0;
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 14,
        stiffness: 110,
        mass: 0.7,
        overshootClamping: false,
      })
    );
    if (showPeakBadge) {
      badgeProgress.value = withDelay(
        delay + 220,
        withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animKey, delay, progress, badgeProgress, showPeakBadge]);

  const animatedHeight = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [2, item.fillHeight]),
  }));

  const animatedBadge = useAnimatedStyle(() => ({
    opacity: badgeProgress.value,
    transform: [
      {
        translateY: interpolate(badgeProgress.value, [0, 1], [4, 0]),
      },
    ],
  }));

  if (item.inactive) {
    return (
      <View style={[styles.barColumn, { width: barWidth }]}>
        <View style={styles.inactiveTrack}>
          <Animated.View
            style={[
              styles.inactiveFill,
              animatedHeight,
              { backgroundColor: colors.cardBorder },
            ]}
          />
        </View>
        <Text
          style={[styles.barLabel, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </View>
    );
  }

  const fillColor = isPeak ? colors.accent : colors.primary;
  const fillRadius = Math.max(4, barWidth / 2);

  return (
    <View style={[styles.barColumn, { width: barWidth }]}>
      {showPeakBadge ? (
        <Animated.View
          style={[
            styles.peakBadge,
            animatedBadge,
            {
              backgroundColor: colors.card,
              borderColor: `${colors.accent}66`,
            },
          ]}
        >
          <Text style={[styles.peakBadgeText, { color: colors.accent }]}>
            {item.valueLabel ?? `${item.safeValue}`}
          </Text>
        </Animated.View>
      ) : null}

      <View style={styles.activeTrack}>
        <Animated.View
          style={[
            styles.activeFill,
            animatedHeight,
            {
              backgroundColor: fillColor,
              borderTopLeftRadius: fillRadius,
              borderTopRightRadius: fillRadius,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={[
              styles.activeGloss,
              {
                borderTopLeftRadius: fillRadius,
                borderTopRightRadius: fillRadius,
              },
            ]}
            pointerEvents="none"
          />
        </Animated.View>
      </View>

      <Text
        style={[
          styles.barLabel,
          { color: isPeak ? colors.text : colors.textMuted, fontWeight: isPeak ? "800" : "600" },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </View>
  );
}

export function PremiumBarChart({
  data,
  colors,
  chartHeight = 128,
  referenceLine,
  highlightPeak = true,
}: PremiumBarChartProps) {
  const preparedData = useMemo<PreparedDatum[]>(
    () =>
      data.map((item) => {
        const safeValue = Math.max(0, Math.min(100, Math.round(item.value)));
        const normalized = clamp01(safeValue / 100);
        const fillHeight =
          safeValue <= 0 ? 3 : Math.max(8, Math.round(normalized * chartHeight));
        return {
          ...item,
          safeValue,
          fillHeight,
        };
      }),
    [data, chartHeight]
  );

  const animKey = useMemo(
    () =>
      preparedData
        .map((item) => `${item.key}:${item.safeValue}:${item.inactive ? 1 : 0}`)
        .join("|"),
    [preparedData]
  );

  if (preparedData.length === 0) {
    return null;
  }

  const maxValue = preparedData.reduce(
    (max, item) => (item.inactive ? max : Math.max(max, item.safeValue)),
    0
  );
  const peakIndex = preparedData.findIndex(
    (item) => !item.inactive && item.safeValue === maxValue && maxValue > 0
  );

  const normalizedReference =
    referenceLine && Number.isFinite(referenceLine.value)
      ? {
          value: Math.max(0, Math.min(100, referenceLine.value)),
          label: referenceLine.label,
        }
      : null;

  // Bar width responds to data density. We let flexbox handle spacing; barWidth
  // caps each column so dense charts stay airy and sparse charts don't blow up.
  const barWidth = Math.min(
    BAR_MAX_WIDTH,
    Math.max(BAR_MIN_WIDTH, Math.round(140 / Math.max(preparedData.length, 1)))
  );

  const a11ySummary = preparedData
    .map((item) => `${item.label}: ${item.valueLabel ?? `${item.safeValue}`}`)
    .join(", ");
  const a11yLabel = normalizedReference?.label
    ? `${a11ySummary}. ${normalizedReference.label}.`
    : a11ySummary;

  return (
    <View
      style={styles.wrapper}
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
    >
      <View
        style={[styles.plotArea, { height: chartHeight + LABEL_AREA_HEIGHT }]}
        importantForAccessibility="no-hide-descendants"
      >
        {normalizedReference !== null ? (
          <View
            pointerEvents="none"
            style={[
              styles.refLineWrap,
              {
                bottom: LABEL_AREA_HEIGHT + (normalizedReference.value / 100) * chartHeight,
              },
            ]}
          >
            <ReferenceLine color={`${colors.textMuted}99`} />
            {normalizedReference.label ? (
              <View
                style={[
                  styles.refBadge,
                  {
                    backgroundColor: colors.card,
                    borderColor: `${colors.textMuted}55`,
                  },
                ]}
              >
                <Text style={[styles.refBadgeText, { color: colors.textMuted }]}>
                  {normalizedReference.label}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View
          pointerEvents="none"
          style={[
            styles.baseline,
            { bottom: LABEL_AREA_HEIGHT, backgroundColor: colors.cardBorder },
          ]}
        />

        <View style={styles.barRow}>
          {preparedData.map((item, index) => (
            <BarItem
              key={item.key}
              item={item}
              index={index}
              chartHeight={chartHeight}
              barWidth={item.inactive ? BAR_INACTIVE_WIDTH : barWidth}
              isPeak={highlightPeak && index === peakIndex}
              showPeakBadge={highlightPeak && index === peakIndex && !!item.valueLabel}
              colors={colors}
              delay={index * STAGGER_STEP_MS}
              animKey={animKey}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function ReferenceLine({ color }: { color: string }) {
  const segments = Array.from({ length: 22 });
  return (
    <View style={styles.refLineDashRow} pointerEvents="none">
      {segments.map((_, i) => (
        <View key={i} style={[styles.refDash, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  plotArea: {
    width: "100%",
    paddingTop: 14,
    position: "relative",
  },
  baseline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  barRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 0,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  activeTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  activeFill: {
    width: "100%",
    overflow: "hidden",
  },
  activeGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 14,
  },
  inactiveTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  inactiveFill: {
    width: "100%",
    opacity: 0.5,
    borderRadius: 999,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  peakBadge: {
    position: "absolute",
    top: -14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 24,
    alignItems: "center",
    zIndex: 2,
  },
  peakBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  refLineWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  refLineDashRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 1,
    gap: 4,
  },
  refDash: {
    flex: 1,
    height: 1,
  },
  refBadge: {
    marginLeft: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  refBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
