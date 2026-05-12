import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Card } from "@/components/ui/card";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { setOnboardingDone } from "@/store/onboardingFlag";

type ConsentKey = "vpn" | "limitations" | "privacy";

const CONSENTS: { key: ConsentKey; text: string }[] = [
  {
    key: "vpn",
    text: "Uygulamanın kumar sitelerini engellemek için VPN/Network Extension kullandığını biliyorum.",
  },
  {
    key: "limitations",
    text: "DoH, uygulama içi tarayıcılar ve captive portal sınırlamalarını okudum.",
  },
  {
    key: "privacy",
    text: "Gizlilik Politikası ve Kullanım Şartlarını kabul ediyorum.",
  },
];

export default function OnboardingQ10() {
  const router = useRouter();
  const { colors } = useTheme();
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    vpn: false,
    limitations: false,
    privacy: false,
  });
  const [finishing, setFinishing] = useState(false);

  const canFinish = useMemo(
    () => consents.vpn && consents.limitations && consents.privacy,
    [consents]
  );

  const toggle = (key: ConsentKey) => {
    haptics.selection();
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLink = (route: string) => {
    haptics.tapLight();
    router.push(route as never);
  };

  async function finish() {
    if (!canFinish || finishing) return;
    setFinishing(true);
    haptics.tapMedium();
    try {
      await setOnboardingDone();
      haptics.success();
      router.replace("/(tabs)");
    } catch (error) {
      reportError(error, { scope: "onboarding.finish" });
      haptics.error();
      setFinishing(false);
    }
  }

  return (
    <OnboardingShell
      step={10}
      title="Her şey hazır!"
      subtitle="Soruları yanıtladığınız için teşekkürler. Antislot’u size göre uyarlayacağız."
      onNext={finish}
      nextDisabled={!canFinish}
      nextLoading={finishing}
      nextLabel={finishing ? "Bitiriliyor" : "Bitir"}
      nextIcon="checkmark"
    >
      <Card style={styles.consentCard} padding={16}>
        <Text style={[styles.consentTitle, { color: colors.text }]}>
          Devam etmek için onaylayın:
        </Text>

        <View style={styles.consentList}>
          {CONSENTS.map((item) => {
            const checked = consents[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.consentRow}
                onPress={() => toggle(item.key)}
                activeOpacity={0.85}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={item.text}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: checked ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {checked ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={[styles.consentText, { color: colors.text }]}>{item.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity
            onPress={() => handleLink("/limitations")}
            accessibilityRole="link"
            hitSlop={6}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Sınırlamaları Gör
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleLink("/privacy")}
            accessibilityRole="link"
            hitSlop={6}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Gizlilik</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleLink("/terms")}
            accessibilityRole="link"
            hitSlop={6}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Şartlar</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  consentCard: {
    width: "100%",
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  consentList: {
    gap: 14,
    marginBottom: 16,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  linkText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
