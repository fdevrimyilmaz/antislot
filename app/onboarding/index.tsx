import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Button } from "@/components/ui/button";
import { haptics } from "@/services/haptics";

export default function OnboardingIntro() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleStart = () => {
    haptics.tapMedium();
    router.push("/onboarding/q1");
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.brandIcon}
              resizeMode="contain"
              accessibilityLabel="Antislot logosu"
            />
            <Text style={[styles.brandTitle, { color: colors.text }]} accessibilityRole="header">
              ANTISLOT
            </Text>
          </View>

          <Text style={[styles.headline, { color: colors.text }]}>
            Kumardan uzak, kontrolün senin elinde.
          </Text>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sana özel bir deneyim için birkaç kısa soruyu yanıtla. Cevaplar
            cihazında güvenle saklanır.
          </Text>

          <View style={styles.bullets}>
            <BulletPoint colors={colors} text="Anonim ve gizli — verin senin." />
            <BulletPoint colors={colors} text="2 dakika sürer." />
            <BulletPoint colors={colors} text="İstediğin zaman değiştirebilirsin." />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Başla"
            onPress={handleStart}
            variant="primary"
            size="lg"
            fullWidth
            rightIcon="arrow-forward"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BulletPoint({
  colors,
  text,
}: {
  colors: { primary: string; textMuted: string };
  text: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.bulletText, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  brandIcon: {
    width: 40,
    height: 40,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headline: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  bullets: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    paddingVertical: 16,
  },
});
