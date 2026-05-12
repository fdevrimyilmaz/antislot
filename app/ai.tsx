import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { PremiumBarChart } from "@/components/ui/premium-bar-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { safeAiReply } from "@/services/aiSafety";
import { addBreadcrumb, reportError } from "@/services/monitoring";
import { haptics } from "@/services/haptics";
import {
  clearAiMessages,
  loadAiMessages,
  saveAiMessages,
  type AiMessage,
  type AiMessageRole,
} from "@/store/aiChatStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  type ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK_PROMPTS = [
  "Şu an dürtü çok yükseldi.",
  "Kısa bir nefes egzersizi öner.",
  "Bugün kendimi suçlu hissediyorum.",
  "Kriz planı hazırlamama yardım et.",
];

const FALLBACK_REPLY =
  "Şu an bağlantı sorunu var. Yalnız değilsin. 10-15 saniye sonra tekrar dene. Bu sırada su içmek, kısa bir yürüyüş veya ortam değiştirmek dürtüyü azaltabilir.";

const AI_TIMEOUT_MS = 15000;
const ACTIVITY_DAYS = 7;
const ACTIVITY_DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildDailyActivity(messages: AiMessage[], now: number, days: number) {
  const todayStart = startOfLocalDay(now);
  const counts: number[] = new Array(days).fill(0);

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    const dayStart = startOfLocalDay(msg.createdAt);
    const offset = Math.round((todayStart - dayStart) / MS_PER_DAY);
    if (offset >= 0 && offset < days) {
      counts[days - 1 - offset] += 1;
    }
  }

  return counts;
}

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

type MessageBubbleProps = {
  content: string;
  role: AiMessageRole;
};

function MessageListSkeleton() {
  return (
    <View
      style={styles.skeletonList}
      accessible
      accessibilityLabel="Sohbet yükleniyor"
      accessibilityState={{ busy: true }}
    >
      <View style={[styles.skeletonBubble, styles.assistantBubble]}>
        <Skeleton width="92%" height={12} />
        <Skeleton width="68%" height={12} style={styles.skeletonLineGap} />
      </View>
      <View style={[styles.skeletonBubble, styles.userBubble]}>
        <Skeleton width="80%" height={12} />
      </View>
      <View style={[styles.skeletonBubble, styles.assistantBubble]}>
        <Skeleton width="88%" height={12} />
        <Skeleton width="74%" height={12} style={styles.skeletonLineGap} />
        <Skeleton width="56%" height={12} style={styles.skeletonLineGap} />
      </View>
    </View>
  );
}

const MessageBubble = React.memo(function MessageBubble({ content, role }: MessageBubbleProps) {
  const { colors } = useTheme();
  const isUser = role === "user";
  return (
    <View
      style={[
        styles.messageBubble,
        {
          backgroundColor: isUser ? colors.primary : colors.card,
          borderColor: isUser ? colors.primary : colors.cardBorder,
        },
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
      accessible
      accessibilityLabel={`${isUser ? "Senin mesajın" : "Yapay ANTI yanıtı"}: ${content}`}
    >
      <Text
        style={[styles.messageText, { color: isUser ? "#FFFFFF" : colors.text }]}
      >
        {content}
      </Text>
    </View>
  );
});

export default function AiScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const listRef = useRef<FlatList<AiMessage> | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await loadAiMessages();
      setMessages(stored);
      setLoading(false);
    })();
  }, []);

  const handleContentSizeChange = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const keyExtractor = useCallback((item: AiMessage) => item.id, []);

  const renderMessage = useCallback<ListRenderItem<AiMessage>>(
    ({ item }) => <MessageBubble content={item.content} role={item.role} />,
    []
  );

  const dailyActivity = useMemo(() => {
    const counts = buildDailyActivity(messages, Date.now(), ACTIVITY_DAYS);
    const maxCount = counts.reduce((max, c) => Math.max(max, c), 0);
    const todayWeekday = new Date().getDay();

    return counts.map((count, index) => {
      const dayOffset = ACTIVITY_DAYS - 1 - index;
      const weekday = (todayWeekday - dayOffset + 7) % 7;
      const labelIndex = (weekday + 6) % 7;
      const ratio = maxCount > 0 ? count / maxCount : 0;
      const value = count === 0 ? 0 : Math.max(12, Math.round(ratio * 100));
      return {
        key: `day-${index}`,
        label: ACTIVITY_DAY_LABELS[labelIndex],
        value,
        inactive: count === 0,
        valueLabel: count > 0 ? String(count) : "0",
        count,
      };
    });
  }, [messages]);

  const todayCount = dailyActivity[dailyActivity.length - 1]?.count ?? 0;
  const weeklyTotal = dailyActivity.reduce((sum, item) => sum + item.count, 0);
  const averageReference = useMemo(() => {
    const max = dailyActivity.reduce((m, d) => Math.max(m, d.count), 0);
    if (max === 0) return undefined;
    const avg = weeklyTotal / dailyActivity.length;
    return {
      value: (avg / max) * 100,
      label: `Ort. ${avg < 10 ? avg.toFixed(1) : avg.toFixed(0)}`,
    };
  }, [dailyActivity, weeklyTotal]);

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
    haptics.tapLight();
    addBreadcrumb("ai.chat", "send", { length: content.length });

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
    } catch (error: unknown) {
      const isTimeout = error instanceof Error && error.message === "timeout";
      const uiError = isTimeout
        ? "AI yanıtı gecikti (timeout). İnternetini kontrol edip tekrar dene."
        : "Şu an AI'ye bağlanamıyorum. Biraz sonra tekrar deneyelim.";

      setErrorMessage(uiError);
      haptics.error();
      reportError(error, {
        scope: "ai.chat",
        level: "warning",
        tags: { reason: isTimeout ? "timeout" : "upstream" },
        extra: { messageLength: content.length },
      });

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
    haptics.warning();
    Alert.alert("Sohbeti Temizle", "Tüm sohbet geçmişi silinecek.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await clearAiMessages();
          setMessages([]);
          setErrorMessage(null);
          haptics.success();
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.back}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Sohbeti temizle"
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={16} color={colors.primary} />
            <Text style={[styles.clearText, { color: colors.primary }]}>Sohbeti temizle</Text>
          </TouchableOpacity>
        </View>

        <Card variant="hero" style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="sparkles" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Yapay ANTI Destek
            </Text>
            <Text
              style={styles.heroSubtitle}
              accessibilityLabel={`Bugün ${todayCount} mesaj, son 7 günde toplam ${weeklyTotal} mesaj`}
            >
              Bugün: {todayCount} · Son 7 gün: {weeklyTotal}
            </Text>
          </View>
        </Card>

        <Card style={styles.graphCard}>
          <SectionHeader
            title="Sohbet Aktivitesi"
            icon="pulse"
            subtitle="Son 7 günde gönderdiğiniz mesaj sayısının günlük dağılımı."
            meta={`${weeklyTotal} mesaj`}
          />
          <PremiumBarChart
            data={dailyActivity}
            colors={colors}
            chartHeight={118}
            referenceLine={averageReference}
          />
        </Card>

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messages}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={11}
          removeClippedSubviews
          ListEmptyComponent={
            loading ? (
              <MessageListSkeleton />
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Bir şey paylaşarak başlayabilirsin.
              </Text>
            )
          }
        />

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
              accessibilityRole="button"
              accessibilityLabel={prompt}
              accessibilityState={{ disabled: loading || sending }}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={12}
                color={colors.primary}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.quickChipText, { color: colors.primary }]}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {sending && (
          <Text
            style={[styles.statusText, { color: colors.textMuted }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            Yanıt hazırlanıyor...
          </Text>
        )}
        {!!errorMessage && (
          <Text
            style={[styles.errorText, { color: colors.danger }]}
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
          >
            {errorMessage}
          </Text>
        )}

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
            accessibilityLabel="Mesaj girişi"
          />
          <Button
            title={sending ? "Gönderiliyor" : "Gönder"}
            onPress={() => handleSend()}
            disabled={loading || sending}
            loading={sending}
            variant="primary"
            leftIcon="send"
          />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    marginBottom: 12,
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
  skeletonList: {
    paddingVertical: 6,
  },
  skeletonBubble: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "86%",
    minWidth: "55%",
  },
  skeletonLineGap: {
    marginTop: 6,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
});
