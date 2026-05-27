import React, { useEffect, useState, type ComponentType } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Button } from "@/components/ui/button";
import { haptics } from "@/services/haptics";
import { reconcilePremiumEntitlement } from "@/services/premiumEntitlement";
import { reportError } from "@/services/monitoring";

/**
 * Premium paywall wrapper. Mirrors the inline paywall trigger-map and
 * brain-hygiene already use, so the experience stays consistent across
 * every gated module:
 *
 *   - null  → empty soft splash while we resolve entitlement
 *   - false → amber lock-screen hero + "Premium ile Kilidi Aç" CTA
 *   - true  → render children (the actual module)
 *
 * Children mount only when entitlement is confirmed, so their own data
 * fetches and timers don't run on the locked screen.
 */
export interface PremiumGateProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function PremiumGate({ title, subtitle, children }: PremiumGateProps) {
  const { colors } = useTheme();
  const [premiumActive, setPremiumActive] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const state = await reconcilePremiumEntitlement({ reason: "screen_load" });
        if (active) setPremiumActive(state.isActive);
      } catch (error) {
        reportError(error, { scope: "premiumGate.reconcile", level: "warning" });
        // Fail closed: a network error while resolving entitlement should
        // surface the paywall, not the module. Premium users who already
        // resolved once will still get the cached `true` from earlier calls.
        if (active) setPremiumActive(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (premiumActive === null) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <SafeAreaView style={styles.fill} />
      </LinearGradient>
    );
  }

  if (premiumActive === false) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <ThemeTexture
          primary={colors.primary}
          secondary={colors.secondary}
          accent={colors.accent}
        />
        <SafeAreaView style={styles.fill}>
          <ScrollView contentContainerStyle={styles.content}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>

            <LinearGradient
              colors={["#8B6614", "#7A580F", "#5A4108"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroDecor} pointerEvents="none">
                <Ionicons
                  name="lock-closed"
                  size={140}
                  color="rgba(255,255,255,0.14)"
                />
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="diamond" size={11} color="#FFD074" />
                <Text style={styles.heroBadgeText}>PREMIUM MODÜL</Text>
              </View>
              <Text style={styles.heroTitle} accessibilityRole="header">
                {title}
              </Text>
              <Text style={styles.heroSubtitle}>{subtitle}</Text>
            </LinearGradient>

            <Button
              title="Premium ile Kilidi Aç"
              onPress={() => {
                haptics.tapMedium();
                router.push("/premium");
              }}
              variant="gradient"
              size="lg"
              fullWidth
              leftIcon="diamond"
              style={styles.unlockBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return <>{children}</>;
}

/**
 * Ergonomic HOC. Each gated module's file becomes:
 *
 *   function MyModule() { ... }
 *   export default withPremiumGate(MyModule, {
 *     title: "Module Title",
 *     subtitle: "One-line value prop",
 *   });
 */
export function withPremiumGate<P extends object>(
  Component: ComponentType<P>,
  meta: { title: string; subtitle: string }
): ComponentType<P> {
  function Gated(props: P) {
    return (
      <PremiumGate title={meta.title} subtitle={meta.subtitle}>
        <Component {...props} />
      </PremiumGate>
    );
  }
  Gated.displayName = `withPremiumGate(${Component.displayName ?? Component.name ?? "Module"})`;
  return Gated;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: 22,
    paddingBottom: 36,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  heroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    minHeight: 220,
    justifyContent: "flex-end",
  },
  heroDecor: {
    position: "absolute",
    right: -18,
    top: -18,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 208, 116, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 208, 116, 0.45)",
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  heroBadgeText: {
    color: "#FFD074",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
  },
  unlockBtn: { marginTop: 4 },
});
