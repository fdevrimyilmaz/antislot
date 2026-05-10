import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { type Theme } from "@/store/themeStore";
import { safeAiReply } from "@/services/aiSafety";
import {
  clearAiMessages,
  loadAiMessages,
  saveAiMessages,
  type AiMessage,
} from "@/store/aiChatStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

const QUICK_PROMPTS = [
  "Su an durtu cok yukseldi.",
  "Kisa bir nefes egzersizi oner.",
  "Bugun kendimi suclu hissediyorum.",
  "Kriz plani hazirlamama yardim et.",
];

const FALLBACK_REPLY =
  "Su an baglanti sorunu var. Yalniz degilsin. 10-15 saniye sonra tekrar dene. Bu sirada su icmek, kisa bir yuruyus veya ortam degistirmek durtuyu azaltabilir.";

const AI_TIMEOUT_MS = 15000;
const TREND_BASE = [20, 34, 46, 58, 70, 83];

const THEME_ICONS: Record<Theme, { hero: string; chart: string; chip: string; focus: string }> = {
  white: { hero: "🧠", chart: "📈", chip: "💬", focus: "🎯" },
  "twitter-blue": { hero: "🛰️", chart: "📊", chip: "🔹", focus: "⚡" },
  black: { hero: "🖤", chart: "📉", chip: "✦", focus: "🎯" },
  sunset: { hero: "🔥", chart: "📈", chip: "🌤️", focus: "🎯" },
  forest: { hero: "🌿", chart: "📊", chip: "🍃", focus: "🎯" },
  midnight: { hero: "🌌", chart: "📈", chip: "💫", focus: "🎯" },
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((res) => {
        clearTimeout(id);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

export default function AiScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, colors } = useTheme();
  const icons = THEME_ICONS[theme];

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await loadAiMessages();
      setMessages(stored);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages, loading]);

  const assistantCount = useMemo(
    () => messages.filter((item) => item.role === "assistant").length,
    [messages]
  );
  const userCount = useMemo(
    () => messages.filter((item) => item.role === "user").length,
    [messages]
  );

  const focusScore = useMemo(() => {
    const raw = 28 + assistantCount * 6 + userCount * 3 + (sending ? 5 : 0);
    return Math.max(20, Math.min(100, raw));
  }, [assistantCount, userCount, sending]);

  const trendBars = useMemo(
    () =>
      TREND_BASE.map((base, index) => ({
        key: `trend-${index}`,
        label: `D${index + 1}`,
        value: Math.min(100, Math.max(10, Math.round(base * (focusScore / 82)))),
      })),
    [focusScore]
  );

  const handleSend = async (preset?: string) => {
    if (loading || sending) return;

    const content = (preset ?? input).trim();
    if (!content) return;

    const createdAt = Date.now();
    const userMessage: AiMessage = {
      id: `${createdAt}-user`,
      role: "user",
      content,
      createdAt,
    };

    const nextMessages = [...messages, userMessage];

    setErrorMessage(null);
    setMessages(nextMessages);
    setInput("");
    await saveAiMessages(nextMessages);

    setSending(true);

    try {
      const { text } = await withTimeout(
        safeAiReply(content, { locale: "tr" }),
        AI_TIMEOUT_MS
      );

      const replyAt = Date.now();
      const assistantMessage: AiMessage = {
        id: `${replyAt}-assistant`,
        role: "assistant",
        content: text,
        createdAt: replyAt,
      };

      const updatedMessages = [...nextMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveAiMessages(updatedMessages);
    } catch (error: any) {
      const uiError =
        error?.message === "timeout"
          ? "AI yaniti gecikti (timeout). Internetini kontrol edip tekrar dene."
          : "Su an AI'ye baglanamiyorum. Biraz sonra tekrar deneyelim.";

      setErrorMessage(uiError);

      const replyAt = Date.now();
      const assistantMessage: AiMessage = {
        id: `${replyAt}-assistant`,
        role: "assistant",
        content: FALLBACK_REPLY,
        createdAt: replyAt,
      };

      const updatedMessages = [...nextMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveAiMessages(updatedMessages);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    Alert.alert("Sohbeti Temizle", "Tum sohbet gecmisi silinecek.", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await clearAiMessages();
          setMessages([]);
          setErrorMessage(null);
        },
      },
    ]);
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
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.clearText, { color: colors.primary }]}>Sohbeti temizle</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroIcon}>{icons.hero}</Text>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Yapay ANTI Destek</Text>
            <Text style={styles.heroSubtitle}>
              {icons.focus} Fokus: {focusScore}% · AI yaniti: {assistantCount}
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.graphCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.graphHeader}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              {icons.chart} Duygu Stabilite Trendi
            </Text>
            <Text style={[styles.graphMeta, { color: colors.primary }]}>{focusScore}%</Text>
          </View>
          <Text style={[styles.graphSubtitle, { color: colors.textMuted }]}>
            Mesaj akisina gore destek momentumunuzun gorsel ozet grafigi.
          </Text>
          <View style={styles.chartRow}>
            {trendBars.map((bar) => (
              <View key={bar.key} style={styles.chartCol}>
                <View style={[styles.chartTrack, { backgroundColor: colors.cardBorder }]}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.chartFill, { height: `${bar.value}%` }]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Yukleniyor...</Text>
          ) : messages.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Bir sey paylasarak baslayabilirsin.
            </Text>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor:
                      message.role === "user" ? colors.primary : colors.card,
                    borderColor:
                      message.role === "user" ? colors.primary : colors.cardBorder,
                  },
                  message.role === "user" ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: message.role === "user" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.quickRow}>
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={[
                styles.quickChip,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                (loading || sending) && styles.quickChipDisabled,
              ]}
              onPress={() => handleSend(prompt)}
              disabled={loading || sending}
            >
              <Text style={[styles.quickChipText, { color: colors.primary }]}>
                {icons.chip} {prompt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {sending && <Text style={[styles.statusText, { color: colors.textMuted }]}>Yanit hazirlaniyor...</Text>}
        {!!errorMessage && <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder },
            ]}
            placeholder="Ne hissediyorsun?"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }, (loading || sending) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={loading || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? "Gonderiliyor..." : "Gonder"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
  },
  heroCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroIcon: {
    fontSize: 30,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.92,
  },
  graphCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  graphTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  graphMeta: {
    fontSize: 13,
    fontWeight: "700",
  },
  graphSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 7,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
  },
  chartTrack: {
    height: 74,
    width: "100%",
    borderRadius: 8,
    padding: 3,
    justifyContent: "flex-end",
  },
  chartFill: {
    width: "100%",
    borderRadius: 6,
    minHeight: 8,
  },
  chartLabel: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
  },
  messages: {
    paddingVertical: 6,
    paddingBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 38,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "86%",
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  assistantBubble: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  quickChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickChipDisabled: {
    opacity: 0.5,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 12,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
