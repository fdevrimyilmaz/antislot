import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { haptics } from "@/services/haptics";
import type { AiConsentText } from "@/i18n/aiConsent";

type AiConsentPanelProps = {
  copy: AiConsentText;
  onAccept: () => void;
  onDecline: () => void;
};

export function AiConsentPanel({ copy, onAccept, onDecline }: AiConsentPanelProps) {
  const { colors } = useTheme();

  const handleAccept = () => {
    haptics.tapMedium();
    onAccept();
  };

  const handleDecline = () => {
    haptics.tapLight();
    onDecline();
  };

  const Bullet = ({
    icon,
    title,
    body,
  }: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    body: string;
  }) => (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletIcon, { backgroundColor: `${colors.primary}14` }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.bulletText}>
        <Text style={[styles.bulletTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.bulletBody, { color: colors.textMuted }]}>{body}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
          <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text style={[styles.intro, { color: colors.textMuted }]}>{copy.intro}</Text>

        <View style={styles.bullets}>
          <Bullet
            icon="document-text"
            title={copy.bullets.what.title}
            body={copy.bullets.what.body}
          />
          <Bullet
            icon="cloud-upload"
            title={copy.bullets.where.title}
            body={copy.bullets.where.body}
          />
          <Bullet
            icon="sparkles"
            title={copy.bullets.why.title}
            body={copy.bullets.why.body}
          />
          <Bullet
            icon="phone-portrait"
            title={copy.bullets.retention.title}
            body={copy.bullets.retention.body}
          />
        </View>

        <Button
          title={copy.acceptCta}
          onPress={handleAccept}
          variant="primary"
          fullWidth
          leftIcon="checkmark"
          style={styles.acceptBtn}
        />
        <Button
          title={copy.declineCta}
          onPress={handleDecline}
          variant="secondary"
          fullWidth
          leftIcon="close"
          style={styles.declineBtn}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 6,
    paddingBottom: 24,
  },
  card: {
    padding: 18,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  bullets: {
    gap: 14,
    marginBottom: 18,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  bulletIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bulletText: { flex: 1 },
  bulletTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  bulletBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  acceptBtn: {
    marginTop: 4,
  },
  declineBtn: {
    marginTop: 10,
  },
});
