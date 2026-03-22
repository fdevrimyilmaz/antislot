import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremium } from "@/hooks/usePremium";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import type { SupportedLanguage } from "@/i18n/translations";
import { buildAccountabilityMessage, openAccountabilityPartnerSms } from "@/services/accountability";
import { safeAiReply } from "@/services/aiSafety";
import { inferUrgeFromContext } from "@/services/urgeTriggerInference";
import { useAccountabilityStore } from "@/store/accountabilityStore";
import {
  clearAiMessages,
  incrementAiUsage,
  loadAiMessages,
  loadAiUsage,
  saveAiMessages,
  type AiMessage,
} from "@/store/aiChatStore";
import { useMoneyProtectionStore } from "@/store/moneyProtectionStore";
import { usePremiumStore } from "@/store/premiumStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AI_TIMEOUT_MS = 15_000;
const AI_CONTEXT_LIMIT = 8;
const MAX_PERSISTED_MESSAGES = 120;
const FREE_DAILY_LIMIT = 12;
const MAX_INPUT_LENGTH = 500;

const AI_COPY = {
  tr: {
    heroTitle: "AI Destek Sohbeti",
    heroSubtitle: "Anlik destek ve planlama",
    heroDescription: "Kisa, guvenli ve uygulanabilir adimlarla bu ani birlikte yonetebiliriz.",
    quickPromptsTitle: "Hizli Baslangic",
    quickPromptsSubtitle: "Tek dokunusla sohbeti baslat.",
    quickPrompts: [
      "Su an durtu cok yukseldi.",
      "Kisa bir nefes egzersizi oner.",
      "Bugun kendimi suclu hissediyorum.",
      "Kriz plani hazirlamama yardim et.",
    ],
    premiumPromptsTitle: "Premium Ipuclari",
    premiumPromptsSubtitle: "Daha derin analiz ve planlama icin.",
    premiumPrompts: [
      "Tetikleyici durumlarimi analiz et ve kisisel bir plan oner.",
      "Haftalik ilerleme degerlendirmemi yap.",
      "Durtu yonetimi icin bilissel davranisci teknik oner.",
      "Bagimlilik dongusunu kirmak icin motivasyonel gorusme yap.",
      "Gece durtuleriyle basa cikmak icin stratejiler oner.",
      "Mali toparlanma plani olusturmama yardim et.",
    ],
    fallbackReply:
      "Su an baglanti sorunu var. Yalniz degilsin. 10-15 saniye sonra tekrar dene. Bu sirada su icmek, kisa bir yuruyus veya ortam degistirmek durtuyu azaltabilir.",
    limitTitle: "Gunluk limit doldu",
    limitDescription:
      "Bugun icin ucretsiz AI mesaj limitine ulastin. Kilidi ac - Premium ile sinirsiz erisim.",
    close: "Kapat",
    unlock: "Erisimi Ac",
    clearTitle: "Sohbeti Temizle",
    clearDescription: "Tum sohbet gecmisi silinecek.",
    clearConfirm: "Sil",
    clearButton: "Sohbeti temizle",
    loading: "Yukleniyor...",
    empty: "Bir sey paylasarak baslayabilirsin.",
    premiumActive: "Aktif",
    premiumLocked: "Kilitli",
    premiumLockedTitle: "Premium ozelligi",
    premiumLockedDescription:
      "Bu gelismis AI promptlari yalnizca Premium kullanicilara aciktir.",
    generating: "Yanit hazirlaniyor...",
    timeoutError: "AI yaniti gecikti (timeout). Internetini kontrol edip tekrar dene.",
    connectionError: "Su an AI'ye baglanamiyorum. Biraz sonra tekrar deneyelim.",
    localFallbackNotice:
      "Sunucuya ulasilamadi. Simdilik yerel destek modu aktif; yanitlar daha genel olabilir.",
    proactiveLockStarted: "Yuksek risk sinyali algilandi. 20 dakikalik koruma kilidi baslatildi.",
    proactiveLockAlready: "Yuksek risk sinyali var. Koruma kilidi zaten aktif.",
    partnerPromptTitle: "Partner accountability",
    partnerPromptBody: "Yuksek risk sinyali algilandi. Partnerine bildirim gondermek ister misin?",
    partnerPromptSend: "Mesaj ac",
    partnerPromptSkip: "Daha sonra",
    partnerAlertOpened: "Partner bildirimi gonderildi.",
    partnerAlertUnavailable: "Partner bildirimi acilamadi.",
    inputPlaceholder: "Ne hissediyorsun?",
    retry: "Yeniden dene",
    retryHint: "Son mesaji tekrar gonder",
    sending: "Gonderiliyor...",
    send: "Gonder",
  },
  en: {
    heroTitle: "AI Support Chat",
    heroSubtitle: "Real-time support and planning",
    heroDescription: "Let's manage this moment with concise, safe, and actionable steps.",
    quickPromptsTitle: "Quick Start",
    quickPromptsSubtitle: "Kick off the conversation in one tap.",
    quickPrompts: [
      "My urge is very high right now.",
      "Suggest a short breathing exercise.",
      "I feel guilty today.",
      "Help me prepare a crisis plan.",
    ],
    premiumPromptsTitle: "Premium Prompts",
    premiumPromptsSubtitle: "For deeper analysis and planning.",
    premiumPrompts: [
      "Analyze my triggers and suggest a personal plan.",
      "Review my weekly progress.",
      "Suggest CBT techniques for urge control.",
      "Run a motivational interviewing style check-in.",
      "Suggest strategies for nighttime urges.",
      "Help me build a financial recovery plan.",
    ],
    fallbackReply:
      "There is a connection issue right now. You are not alone. Try again in 10-15 seconds. Drinking water, a short walk, or changing your environment can reduce urges.",
    limitTitle: "Daily limit reached",
    limitDescription:
      "You reached today's free AI message limit. Unlock Premium for unlimited access.",
    close: "Close",
    unlock: "Unlock Access",
    clearTitle: "Clear Chat",
    clearDescription: "All chat history will be deleted.",
    clearConfirm: "Delete",
    clearButton: "Clear chat",
    loading: "Loading...",
    empty: "You can start by sharing how you feel.",
    premiumActive: "Active",
    premiumLocked: "Locked",
    premiumLockedTitle: "Premium feature",
    premiumLockedDescription:
      "These advanced AI prompts are available only for Premium users.",
    generating: "Preparing response...",
    timeoutError: "AI response timed out. Check your internet and try again.",
    connectionError: "I can't reach AI right now. Please try again shortly.",
    localFallbackNotice:
      "Could not reach the AI server. Local support mode is active for now; replies may be more generic.",
    proactiveLockStarted: "High-risk relapse signals detected. A 20-minute protection lock was started.",
    proactiveLockAlready: "High-risk relapse signals detected. Protection lock is already active.",
    partnerPromptTitle: "Partner accountability",
    partnerPromptBody: "High-risk signals were detected. Do you want to notify your trusted contact now?",
    partnerPromptSend: "Open message",
    partnerPromptSkip: "Later",
    partnerAlertOpened: "Partner alert sent.",
    partnerAlertUnavailable: "Could not open partner alert.",
    inputPlaceholder: "How are you feeling?",
    retry: "Retry",
    retryHint: "Resend last message",
    sending: "Sending...",
    send: "Send",
  },
} as const;

function clampMessages(messages: AiMessage[]): AiMessage[] {
  return messages.slice(-MAX_PERSISTED_MESSAGES);
}

async function requestAi(content: string, locale: SupportedLanguage, history: AiMessage[] = []) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const sanitizedHistory = history
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({
        role: item.role,
        content: item.content,
      }))
      .slice(-AI_CONTEXT_LIMIT);

    return await safeAiReply(content, {
      locale,
      signal: controller.signal,
      history: sanitizedHistory,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function AiScreen() {
  const router = useRouter();
  const { t, selectedLanguage } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(AI_COPY);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [messagesToday, setMessagesToday] = useState(0);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);

  const listRef = useRef<FlatList<AiMessage>>(null);
  const mountedRef = useRef(true);
  const { hasFeature } = usePremium();
  const hasAiFeature = hasFeature("premium_ai_features");

  const hydratePremium = usePremiumStore((s) => s.hydrate);
  const hydrateMoneyProtection = useMoneyProtectionStore((s) => s.hydrate);
  const moneyProtectionHydrated = useMoneyProtectionStore((s) => s.hydrated);
  const moneyLockActive = useMoneyProtectionStore((s) => s.lockActive);
  const startMoneyLock = useMoneyProtectionStore((s) => s.startLock);

  const hydrateAccountability = useAccountabilityStore((s) => s.hydrate);
  const hasPartner = useAccountabilityStore((s) => s.hasPartner);
  const partnerPhone = useAccountabilityStore((s) => s.partnerPhone);
  const proactiveInterventionEnabled = useAccountabilityStore((s) => s.proactiveInterventionEnabled);
  const shouldNotifyForRisk = useAccountabilityStore((s) => s.shouldNotifyForRisk);
  const canSendAlert = useAccountabilityStore((s) => s.canSendAlert);
  const recordAlert = useAccountabilityStore((s) => s.recordAlert);

  useEffect(() => {
    hydratePremium();
    hydrateAccountability();
    if (!moneyProtectionHydrated) {
      hydrateMoneyProtection();
    }
  }, [hydratePremium, hydrateAccountability, hydrateMoneyProtection, moneyProtectionHydrated]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedMessages, usage] = await Promise.all([loadAiMessages(), loadAiUsage()]);
        if (cancelled || !mountedRef.current) return;

        setMessages(clampMessages(storedMessages));
        setMessagesToday(usage.messagesToday);
      } catch {
        if (!cancelled && mountedRef.current) {
          setErrorMessage(copy.connectionError);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [copy.connectionError]);

  useEffect(() => {
    if (loading || messages.length === 0) return;
    const timeoutId = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [messages.length, loading]);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(selectedLanguage === "tr" ? "tr-TR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [selectedLanguage]
  );

  const formatTime = useCallback(
    (timestamp: number) => {
      try {
        return timeFormatter.format(new Date(timestamp));
      } catch {
        return "";
      }
    },
    [timeFormatter]
  );

  const promptPartnerAlert = useCallback(
    (riskLevel: "high" | "critical", suggestedIntensity: number) => {
      if (!hasPartner || !partnerPhone.trim()) return;
      if (riskLevel === "critical" && !shouldNotifyForRisk("critical")) return;
      if (riskLevel === "high" && !shouldNotifyForRisk("high")) return;
      if (!canSendAlert()) return;

      const reason = riskLevel === "critical" ? "critical_urge_detected" : "high_risk_detected";
      const score = Math.max(0, Math.min(100, Math.round((11 - suggestedIntensity) * 10)));

      Alert.alert(copy.partnerPromptTitle, copy.partnerPromptBody, [
        { text: copy.partnerPromptSkip, style: "cancel" },
        {
          text: copy.partnerPromptSend,
          onPress: () => {
            void (async () => {
              const message = buildAccountabilityMessage({
                language: selectedLanguage,
                reason,
                riskLevel,
                score,
              });

              const sent = await openAccountabilityPartnerSms({
                phone: partnerPhone,
                message,
                language: selectedLanguage,
              });

              if (sent) {
                await recordAlert();
                if (mountedRef.current) {
                  setSafetyNotice(copy.partnerAlertOpened);
                }
                return;
              }

              if (mountedRef.current) {
                setSafetyNotice(copy.partnerAlertUnavailable);
              }
            })();
          },
        },
      ]);
    },
    [
      canSendAlert,
      copy.partnerAlertOpened,
      copy.partnerAlertUnavailable,
      copy.partnerPromptBody,
      copy.partnerPromptSend,
      copy.partnerPromptSkip,
      copy.partnerPromptTitle,
      hasPartner,
      partnerPhone,
      recordAlert,
      selectedLanguage,
      shouldNotifyForRisk,
    ]
  );

  const runProactiveIntervention = useCallback(
    async (content: string) => {
      const inference = inferUrgeFromContext(content);
      if (!inference.hasSignals) return;
      if (inference.riskLevel !== "high" && inference.riskLevel !== "critical") return;

      if (proactiveInterventionEnabled && moneyProtectionHydrated) {
        if (moneyLockActive) {
          setSafetyNotice(copy.proactiveLockAlready);
        } else {
          const lockMinutes = inference.riskLevel === "critical" ? 30 : 20;
          await startMoneyLock(lockMinutes);
          if (mountedRef.current) {
            setSafetyNotice(copy.proactiveLockStarted);
          }
        }
      }

      promptPartnerAlert(inference.riskLevel, inference.suggestedIntensity);
    },
    [
      proactiveInterventionEnabled,
      moneyProtectionHydrated,
      moneyLockActive,
      copy.proactiveLockAlready,
      copy.proactiveLockStarted,
      startMoneyLock,
      promptPartnerAlert,
    ]
  );

  const persistMessages = useCallback(async (next: AiMessage[]) => {
    const clamped = clampMessages(next);
    if (mountedRef.current) {
      setMessages(clamped);
    }
    await saveAiMessages(clamped);
  }, []);

  const handleSend = useCallback(
    async (preset?: string, requiresPremium = false) => {
      if (loading || sending) return;

      const content = (preset ?? input).trim();
      if (!content) return;

      if (requiresPremium && !hasAiFeature) {
        Alert.alert(copy.premiumLockedTitle, copy.premiumLockedDescription, [
          { text: copy.close, style: "cancel" },
          { text: copy.unlock, onPress: () => router.push("/premium") },
        ]);
        return;
      }

      if (!hasAiFeature && messagesToday >= FREE_DAILY_LIMIT) {
        Alert.alert(copy.limitTitle, copy.limitDescription, [
          { text: copy.close, style: "cancel" },
          { text: copy.unlock, onPress: () => router.push("/premium") },
        ]);
        return;
      }

      const createdAt = Date.now();
      const userMessage: AiMessage = {
        id: `${createdAt}-user`,
        role: "user",
        content,
        createdAt,
      };

      const nextMessages = clampMessages([...messages, userMessage]);
      setErrorMessage(null);
      setSafetyNotice(null);
      setLastFailedInput(null);
      setInput("");
      setMessages(nextMessages);
      setSending(true);

      try {
        await runProactiveIntervention(content);
        await saveAiMessages(nextMessages);

        const usage = await incrementAiUsage();
        if (mountedRef.current) {
          setMessagesToday(usage.messagesToday);
        }

        const { text, source } = await requestAi(content, selectedLanguage, messages);
        if (source === "local_fallback" && mountedRef.current) {
          setSafetyNotice(copy.localFallbackNotice);
        }

        const replyAt = Date.now();
        const assistantMessage: AiMessage = {
          id: `${replyAt}-assistant`,
          role: "assistant",
          content: text,
          createdAt: replyAt,
        };

        await persistMessages([...nextMessages, assistantMessage]);
      } catch (error: unknown) {
        const timeout = error instanceof Error && error.name === "AbortError";
        if (mountedRef.current) {
          setErrorMessage(timeout ? copy.timeoutError : copy.connectionError);
          setLastFailedInput(content);
        }

        const replyAt = Date.now();
        const assistantMessage: AiMessage = {
          id: `${replyAt}-assistant`,
          role: "assistant",
          content: copy.fallbackReply,
          createdAt: replyAt,
        };

        await persistMessages([...nextMessages, assistantMessage]);
      } finally {
        if (mountedRef.current) {
          setSending(false);
        }
      }
    },
    [
      copy.close,
      copy.connectionError,
      copy.fallbackReply,
      copy.limitDescription,
      copy.limitTitle,
      copy.localFallbackNotice,
      copy.premiumLockedDescription,
      copy.premiumLockedTitle,
      copy.timeoutError,
      copy.unlock,
      hasAiFeature,
      input,
      loading,
      messages,
      messagesToday,
      persistMessages,
      router,
      runProactiveIntervention,
      selectedLanguage,
      sending,
    ]
  );

  const handleRetryLast = useCallback(() => {
    if (!lastFailedInput || loading || sending) return;
    void handleSend(lastFailedInput);
  }, [handleSend, lastFailedInput, loading, sending]);

  const handleClear = useCallback(() => {
    Alert.alert(copy.clearTitle, copy.clearDescription, [
      { text: copy.close, style: "cancel" },
      {
        text: copy.clearConfirm,
        style: "destructive",
        onPress: () => {
          void (async () => {
            await clearAiMessages();
            if (!mountedRef.current) return;
            setMessages([]);
            setErrorMessage(null);
            setSafetyNotice(null);
            setLastFailedInput(null);
          })();
        },
      },
    ]);
  }, [copy.clearConfirm, copy.clearDescription, copy.clearTitle, copy.close]);

  const renderMessage = useCallback(
    ({ item }: { item: AiMessage }) => {
      const isUser = item.role === "user";
      return (
        <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapSelf : styles.bubbleWrapOther]}>
          <View
            style={[
              styles.messageBubble,
              isUser
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userText : styles.assistantText,
                { color: isUser ? "#FFFFFF" : colors.text },
              ]}
              selectable
            >
              {item.content}
            </Text>
            <Text style={[styles.messageTime, { color: isUser ? "rgba(255,255,255,0.76)" : colors.textSecondary }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    },
    [colors.border, colors.card, colors.primary, colors.text, colors.textSecondary, formatTime]
  );

  const premiumBadgeLabel = hasAiFeature ? copy.premiumActive : copy.premiumLocked;
  const usageText = `${messagesToday}/${FREE_DAILY_LIMIT}`;
  const canSend = !loading && !sending && input.trim().length > 0;

  return (
    <LinearGradient
      colors={colors.backgroundGradient as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} activeOpacity={0.85}>
            <Text style={[styles.clearText, { color: colors.text }]}>{copy.clearButton}</Text>
          </TouchableOpacity>
        </View>

        <ScreenHero
          icon="chatbubbles-outline"
          title={copy.heroTitle}
          subtitle={copy.heroSubtitle}
          description={copy.heroDescription}
          badge={usageText}
          compact
          style={styles.heroPanel}
        />

        {!!safetyNotice && (
          <SectionLead
            icon="shield-checkmark-outline"
            title={safetyNotice}
            tone="success"
            style={styles.noticeBlock}
          />
        )}

        {!!errorMessage && (
          <SectionLead
            icon="warning-outline"
            title={errorMessage}
            subtitle={lastFailedInput ? copy.retryHint : undefined}
            tone="warning"
            badge={lastFailedInput ? copy.retry : undefined}
            style={styles.noticeBlock}
          />
        )}

        <SectionLead
          icon="flash-outline"
          title={copy.quickPromptsTitle}
          subtitle={copy.quickPromptsSubtitle}
          tone="primary"
          style={styles.quickLead}
        />
        <View style={styles.quickRow}>
          {copy.quickPrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={[
                styles.quickChip,
                { backgroundColor: colors.card, borderColor: colors.border },
                (loading || sending) && styles.quickChipDisabled,
              ]}
              onPress={() => {
                void handleSend(prompt);
              }}
              disabled={loading || sending}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickChipText, { color: colors.primary }]}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLead
          icon="sparkles-outline"
          title={copy.premiumPromptsTitle}
          subtitle={copy.premiumPromptsSubtitle}
          tone="warning"
          badge={premiumBadgeLabel}
          style={styles.quickLead}
        />
        <View style={styles.quickRow}>
          {copy.premiumPrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={[
                styles.premiumChip,
                (loading || sending) && styles.quickChipDisabled,
                !hasAiFeature && styles.premiumChipLocked,
              ]}
              onPress={() => {
                void handleSend(prompt, true);
              }}
              disabled={loading || sending}
              activeOpacity={0.85}
            >
              <Text style={styles.premiumChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            ref={listRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            inverted
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              loading ? (
                <View style={styles.emptyWrap}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.loading}</Text>
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.empty}</Text>
                </View>
              )
            }
          />

          {sending && (
            <View style={[styles.typingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>{copy.generating}</Text>
            </View>
          )}

          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={copy.inputPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={MAX_INPUT_LENGTH}
              textAlignVertical="top"
            />
            <View style={styles.inputFooter}>
              <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                {input.length}/{MAX_INPUT_LENGTH}
              </Text>

              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    (!lastFailedInput || loading || sending) && styles.retryButtonDisabled,
                  ]}
                  onPress={handleRetryLast}
                  disabled={!lastFailedInput || loading || sending}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.retryButtonText, { color: colors.textSecondary }]}>{copy.retry}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.primary },
                    !canSend && [styles.sendButtonDisabled, { backgroundColor: colors.disabled }],
                  ]}
                  onPress={() => {
                    void handleSend();
                  }}
                  disabled={!canSend}
                  activeOpacity={0.85}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>{copy.send}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  clearText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  heroPanel: {
    marginBottom: 10,
  },
  noticeBlock: {
    marginBottom: 8,
  },
  quickLead: {
    marginTop: 2,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    maxWidth: "100%",
  },
  quickChipDisabled: {
    opacity: 0.55,
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  premiumChip: {
    backgroundColor: "rgba(250, 204, 21, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.4)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    maxWidth: "100%",
  },
  premiumChipLocked: {
    opacity: 0.88,
  },
  premiumChipText: {
    fontSize: 12,
    color: "#92400E",
    fontFamily: Fonts.bodySemiBold,
  },
  chatArea: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingVertical: 10,
  },
  bubbleWrap: {
    marginBottom: 10,
  },
  bubbleWrapSelf: {
    alignItems: "flex-end",
  },
  bubbleWrapOther: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "84%",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    borderColor: "transparent",
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  userText: {},
  assistantText: {},
  messageTime: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    alignSelf: "flex-end",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  typingText: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  inputCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 10,
  },
  input: {
    minHeight: 70,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  inputFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  counterText: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  retryButtonDisabled: {
    opacity: 0.45,
  },
  retryButtonText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.92,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
});
