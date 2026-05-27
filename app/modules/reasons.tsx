import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  addReason,
  getReasons,
  removeReason,
  type Reason,
} from "@/store/reasonsStore";

const EMOJI_OPTIONS = ["❤️", "👨‍👩‍👧", "🏠", "💼", "🧠", "🌱", "🎯", "💪", "📚", "✨"];

const SUGGESTIONS = [
  { emoji: "👨‍👩‍👧", text: "Çocuklarımın gözlerinde gurur görmek için." },
  { emoji: "❤️", text: "Eşimle güvenli bir gelecek kurmak için." },
  { emoji: "🏠", text: "Evimi kaybetmek korkusundan kurtulmak için." },
  { emoji: "💼", text: "İşimde gerçekten odaklanabilmek için." },
  { emoji: "🧠", text: "Zihnimi geri kazanmak — sürekli düşünmemek için." },
  { emoji: "💪", text: "Kendime tekrar saygı duymak için." },
];

function ReasonsModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState<string>("❤️");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setReasons(await getReasons());
      } catch (error) {
        reportError(error, { scope: "reasons.load", level: "warning" });
      }
    })();
  }, []);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 4) {
      haptics.warning();
      toast.warning("Daha uzun, sana özel bir sebep yaz.", "Çok kısa");
      return;
    }
    setAdding(true);
    haptics.tapMedium();
    try {
      const updated = await addReason(trimmed, emoji);
      setReasons(updated);
      setText("");
      haptics.success();
      toast.success("Sebep koleksiyonuna eklendi.", "Eklendi");
    } catch (error) {
      reportError(error, { scope: "reasons.add" });
      haptics.error();
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (id: string) => {
    haptics.warning();
    Alert.alert("Sebebi Kaldır", "Bu sebebi listenden çıkarmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await removeReason(id);
            setReasons(updated);
            haptics.success();
          } catch (error) {
            reportError(error, { scope: "reasons.remove" });
            haptics.error();
          }
        },
      },
    ]);
  };

  const handleSuggestion = (suggestion: typeof SUGGESTIONS[0]) => {
    haptics.selection();
    setEmoji(suggestion.emoji);
    setText(suggestion.text);
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
            colors={["#B14040", "#A03838", "#8E2F2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="heart" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="heart" size={11} color="#FF8A66" />
              <Text style={styles.heroBadgeText}>NEDEN BIRAKIYORUM</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Sebepler Koleksiyonu
            </Text>
            <Text style={styles.heroSubtitle}>
              Krizde / dürtü anında telefonu açıp okuyacağın kişisel sebepler.
              Soyut “kötü bir şey” yerine somut “ne için” cevapları.
            </Text>
          </LinearGradient>

          {/* Add form */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Yeni Sebep Ekle"
              icon="add-circle"
              subtitle="Kişisel, somut ve duygusal — soyut değil."
            />
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => {
                const isActive = e === emoji;
                return (
                  <TouchableOpacity
                    key={e}
                    onPress={() => {
                      haptics.selection();
                      setEmoji(e);
                    }}
                    style={[
                      styles.emojiOption,
                      {
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                        backgroundColor: isActive
                          ? `${colors.primary}14`
                          : "transparent",
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Emoji ${e}`}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Kızımın yüzünde gördüğüm gülümseme için..."
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={280}
              accessibilityLabel="Sebep metni"
            />
            <Text style={[styles.counter, { color: colors.textMuted }]}>
              {text.length} / 280
            </Text>
            <Button
              title={adding ? "Ekleniyor" : "Listeye Ekle"}
              onPress={handleAdd}
              loading={adding}
              disabled={adding || text.trim().length < 4}
              variant="primary"
              fullWidth
              leftIcon="add"
              style={styles.addBtn}
            />
          </Card>

          {/* Suggestions */}
          {reasons.length === 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Başlangıç İçin Öneriler"
                icon="bulb"
                subtitle="Birinden ilham al, sonra kendine göre uyarla."
              />
              <View style={styles.suggestionList}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.text}
                    onPress={() => handleSuggestion(s)}
                    style={[
                      styles.suggestionCard,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Öneri: ${s.text}`}
                  >
                    <Text style={styles.suggestionEmoji}>{s.emoji}</Text>
                    <Text style={[styles.suggestionText, { color: colors.text }]}>
                      {s.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ) : null}

          {/* Saved reasons */}
          {reasons.length > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Sebeplerin"
                icon="bookmark"
                meta={`${reasons.length}`}
              />
              <View style={styles.reasonList}>
                {reasons.map((reason) => (
                  <View
                    key={reason.id}
                    style={[
                      styles.reasonCard,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
                  >
                    <Text style={styles.reasonEmoji}>{reason.emoji || "✨"}</Text>
                    <Text style={[styles.reasonText, { color: colors.text }]}>
                      {reason.text}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemove(reason.id)}
                      style={styles.removeBtn}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Sebebi kaldır"
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {/* Tip */}
          <Card style={styles.cardSpacing}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Dürtü anında ne yap?
              </Text>
            </View>
            <Text style={[styles.tipBody, { color: colors.text }]}>
              Telefonu aç, bu listeye gel. Yüksek sesle bir sebebini oku.
              Bahis sitesini açmadan önce buraya bak — bu liste seni
              hatırlatacak.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: { position: "absolute", right: -20, bottom: -20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,138,102,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,138,102,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FF8A66",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19 },

  cardSpacing: { marginBottom: 14 },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 20 },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    minHeight: 90,
    borderWidth: 1,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  counter: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 10,
  },
  addBtn: { marginTop: 4 },

  suggestionList: { gap: 8 },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionEmoji: { fontSize: 20 },
  suggestionText: { flex: 1, fontSize: 13, lineHeight: 18 },

  reasonList: { gap: 10 },
  reasonCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reasonEmoji: { fontSize: 24, marginTop: -2 },
  reasonText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
  },

  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 15, fontWeight: "800" },
  tipBody: { fontSize: 13, lineHeight: 19 },
});

export default withPremiumGate(ReasonsModule, {
  title: "Sebepler Koleksiyonu",
  subtitle: "Neden bırakıyorum?",
});
