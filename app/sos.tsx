import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/ui/toast";
import {
  DEFAULT_BUDDY_MESSAGE,
  getBuddyMessage,
  getContacts,
  type EmergencyContact,
} from "@/store/sosStore";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  CalmBackground,
  GlassCard,
  PrimaryAction,
  Space,
  Type,
} from "@/components/calm";

/**
 * SOS — the crisis companion.
 *
 * Design constraints for this screen are tighter than anywhere else in the
 * app: a user lands here mid-impulse, often with tunnel vision, sometimes
 * with shaky hands. The screen does ONE thing well — guided breathing —
 * and offers two clear escapes (buddy text, helpline call).
 *
 * Everything else (contact list editing, message template editing,
 * coping/grounding checklists) lives behind a footer link, never in the
 * crisis surface itself.
 */

const HELPLINES = [
  { phone: "112", label: "112 Acil" },
  { phone: "115", label: "115 Yeşilay" },
  { phone: "183", label: "Alo 183" },
];

const INHALE_MS = 4000;
const HOLD_MS = 2000;
const EXHALE_MS = 6000;
const TOTAL_BREATH_CYCLES = 5;

export default function SOSScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [buddyMessage, setBuddyMessage] = useState(DEFAULT_BUDDY_MESSAGE);
  const [breathing, setBreathing] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | null>(null);
  const [cyclesLeft, setCyclesLeft] = useState(TOTAL_BREATH_CYCLES);
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    (async () => {
      try {
        const [stored, savedMsg] = await Promise.all([
          getContacts(),
          getBuddyMessage(),
        ]);
        setContacts(stored);
        setBuddyMessage(savedMsg);
      } catch (error) {
        reportError(error, { scope: "sos.calm.load", level: "warning" });
      }
    })();
  }, []);

  const buddy = useMemo(() => contacts.find((c) => c.isBuddy) ?? null, [contacts]);

  // Box-breathing animation: inhale-hold-exhale, repeated for N cycles.
  // We chain Animated.sequence + iterate manually so each phase transition
  // can fire a gentle haptic — turns the screen into a felt experience,
  // not just a visual one.
  useEffect(() => {
    if (!breathing) return;
    if (cyclesLeft <= 0) {
      setBreathing(false);
      setPhase(null);
      haptics.success();
      return;
    }

    let cancelled = false;
    const runCycle = async () => {
      if (cancelled) return;
      setPhase("inhale");
      haptics.tapLight();
      await animateTo(scale, 1, INHALE_MS, Easing.inOut(Easing.sin));
      if (cancelled) return;
      setPhase("hold");
      await wait(HOLD_MS);
      if (cancelled) return;
      setPhase("exhale");
      haptics.tapLight();
      await animateTo(scale, 0.4, EXHALE_MS, Easing.inOut(Easing.sin));
      if (cancelled) return;
      setCyclesLeft((n) => n - 1);
    };

    runCycle();
    return () => {
      cancelled = true;
    };
  }, [breathing, cyclesLeft, scale]);

  const startBreathing = () => {
    haptics.tapMedium();
    setCyclesLeft(TOTAL_BREATH_CYCLES);
    setBreathing(true);
  };

  const stopBreathing = () => {
    haptics.selection();
    setBreathing(false);
    setPhase(null);
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.4,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const callBuddy = () => {
    if (!buddy) return;
    haptics.tapHeavy();
    const encoded = encodeURIComponent(buddyMessage);
    const sep = Platform.OS === "ios" ? "&" : "?";
    Linking.openURL(`sms:${buddy.phone}${sep}body=${encoded}`).catch(() => {
      toast.warning(`${buddy.name} için SMS açılamadı.`, "Hata");
    });
  };

  const callHelpline = (phone: string) => {
    haptics.tapMedium();
    Linking.openURL(`tel:${phone}`);
  };

  const phaseCopy =
    phase === "inhale"
      ? "Nefes al"
      : phase === "hold"
      ? "Tut"
      : phase === "exhale"
      ? "Bırak"
      : "Hazır olduğunda başla";

  return (
    <CalmBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            style={[styles.closeBtn, { borderColor: `${colors.primary}33` }]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroBlock}>
          <Text style={[Type.caption, { color: colors.textMuted }]}>
            ŞU AN
          </Text>
          <Text
            style={[Type.title, styles.heroTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            Bu his geçecek.
          </Text>
          <Text style={[Type.subtitle, styles.heroSub, { color: colors.textMuted }]}>
            Dürtü bir dalga — yükseliyor, doruk yapıyor, sonra geri çekiliyor.
            Birlikte nefes alalım.
          </Text>
        </View>

        {/* Breathing visual */}
        <View style={styles.breathStage}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.breathCircle,
              {
                backgroundColor: `${colors.primary}26`,
                borderColor: `${colors.primary}66`,
                transform: [{ scale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.breathInner,
              {
                backgroundColor: `${colors.primary}40`,
                transform: [{ scale: Animated.multiply(scale, 0.7) }],
              },
            ]}
          />
          <Text style={[Type.subtitle, styles.breathLabel, { color: colors.text }]}>
            {phaseCopy}
          </Text>
        </View>

        {/* Single primary CTA — toggles breathing */}
        <View style={styles.actionBlock}>
          <PrimaryAction
            title={breathing ? "Nefesi Durdur" : "Birlikte Nefes Al"}
            hint={
              breathing
                ? `Kalan tur: ${Math.max(0, cyclesLeft)}`
                : "5 tur · yaklaşık 1 dakika"
            }
            icon={breathing ? "pause" : "leaf"}
            onPress={breathing ? stopBreathing : startBreathing}
            tone={breathing ? "soft" : "primary"}
          />
        </View>

        {/* Quiet support row — buddy + helplines. Never the loudest thing
            on screen; the breathing visual + CTA carry the moment. */}
        <View style={styles.supportShelf}>
          {buddy ? (
            <Pressable
              onPress={callBuddy}
              style={({ pressed }) => [
                styles.supportRow,
                {
                  borderColor: `${colors.primary}33`,
                  backgroundColor: `${colors.card}AA`,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="heart" size={18} color={colors.accent} />
              <Text style={[styles.supportLabel, { color: colors.text }]}>
                {buddy.name}&apos;e yaz
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ) : (
            <GlassCard style={styles.supportEmpty}>
              <Text style={[Type.subtitle, { color: colors.textMuted }]}>
                Henüz destek kişin tanımlı değil.
              </Text>
              <Pressable
                onPress={() => router.push("/sos-contacts" as never)}
                style={({ pressed }) => ({
                  marginTop: Space.sm,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={[Type.subtitle, { color: colors.primary, fontWeight: "600" }]}>
                  Birini ekle →
                </Text>
              </Pressable>
            </GlassCard>
          )}

          <View style={styles.helplineRow}>
            {HELPLINES.map((h) => (
              <Pressable
                key={h.phone}
                onPress={() => callHelpline(h.phone)}
                style={({ pressed }) => [
                  styles.helpline,
                  {
                    borderColor: `${colors.textMuted}33`,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${h.label} arama`}
              >
                <Text style={[styles.helplineText, { color: colors.text }]}>
                  {h.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Footer quiet links — manage contacts + open full crisis plan */}
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => router.push("/modules/crisis-plan" as never)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[Type.subtitle, { color: colors.textMuted, fontWeight: "600" }]}>
              Kriz planımı aç
            </Text>
          </Pressable>
          <View style={[styles.footerDot, { backgroundColor: `${colors.textMuted}66` }]} />
          <Pressable
            onPress={() => router.push("/sos-contacts" as never)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[Type.subtitle, { color: colors.textMuted, fontWeight: "600" }]}>
              Kişileri yönet
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </CalmBackground>
  );
}

function animateTo(
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing: (v: number) => number
): Promise<void> {
  return new Promise((resolve) => {
    Animated.timing(value, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    }).start(() => resolve());
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Space.lg + 4 },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Space.sm,
    marginBottom: Space.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  heroBlock: {
    marginTop: Space.lg,
    marginBottom: Space.xl,
  },
  heroTitle: { fontSize: 32, lineHeight: 38, fontWeight: "700", marginTop: Space.sm },
  heroSub: { marginTop: Space.md, maxWidth: 320 },

  breathStage: {
    flex: 1,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  breathCircle: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
  },
  breathInner: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  breathLabel: {
    position: "absolute",
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  actionBlock: {
    marginTop: Space.xl,
    marginBottom: Space.lg,
  },

  supportShelf: {
    gap: Space.md,
    marginBottom: Space.lg,
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: Space.md + 2,
    paddingHorizontal: Space.lg,
    borderRadius: 18,
    borderWidth: 1,
  },
  supportLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  supportEmpty: {
    paddingVertical: Space.md + 2,
  },

  helplineRow: {
    flexDirection: "row",
    gap: Space.sm,
  },
  helpline: {
    flex: 1,
    paddingVertical: Space.md,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  helplineText: { fontSize: 13, fontWeight: "700" },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Space.md,
    paddingVertical: Space.md,
  },
  footerDot: { width: 3, height: 3, borderRadius: 1.5 },
});
