import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { trackEvent } from "@/services/analytics";
import { safeAiReply } from "@/services/aiSafety";
import { getStoredUsername } from "@/store/profileStore";
import {
  COMMUNITY_AI_BOT,
  ensureAnonymousUser,
  getRoomMeta,
  getCommunitySendErrorCode,
  LIVE_SUPPORT_AGENT,
  listenToDirectSupportMessages,
  joinRoomPresence,
  joinDirectSupportPresence,
  listenToRoomMessages,
  listenToRoomOnlineCount,
  sendDirectSupportMessage,
  sendRoomMessage,
  type CommunitySendErrorCode,
  type CommunityMessage,
  type CommunityRoomId,
} from "@/lib/community";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VALID_ROOM_IDS: CommunityRoomId[] = [
  "kriz",
  "kumar",
  "finans",
  "motivasyon",
  "gunluk",
  "dinleme",
];

const MESSAGE_SEND_TIMEOUT_MS = 12_000;
const MAX_MESSAGE_LENGTH = 500;
const AI_REPLY_DEDUP_WINDOW_MS = 15_000;

function normalizeDraftText(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_MESSAGE_LENGTH);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("community-send-timeout"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

const COMMUNITY_ROOM_COPY = {
  tr: {
    roomNotFound: "Oda bulunamadi.",
    connectionErrorBanner: "Baglanti kurulamadi. Lutfen tekrar dene.",
    retry: "Yeniden Dene",
    retryMessage: "Mesaji Tekrar Gonder",
    retryHint: "Son mesaj gonderilemedi.",
    moderationBlocked: "Mesaj guvenlik filtresine takildi. Daha guvenli bir dille tekrar yaz.",
    rateLimited: "Cok hizli mesaj gonderdin. Kisa bir ara verip tekrar dene.",
    duplicateBlocked: "Ayni mesaji tekrar gondermeyi engelledik.",
    onlineSuffix: "cevrimici",
    connectionErrorShort: "Baglanti Hatasi",
    loadingStatus: "...",
    emptyMessages: "Henuz mesaj yok. Ilk mesaji sen yaz.",
    inputPlaceholder: "Mesaj yaz...",
    send: "Gonder",
    sosTitle: "Su an yalniz degilsin",
    sosSubtitle: "Hizli erisim: kriz odasi, nefes egzersizi veya destek ekrani.",
    sosRoom: "Kriz Sohbet Odasi",
    sosBreathing: "Nefes Egzersizi",
    sosSupport: "Destek Ekrani",
    close: "Kapat",
    liveSupportTitle: "Canli Destek",
    liveSupportOnline: "birebir destek baglantisi",
    liveSupportOffline: "baglanti bekleniyor",
    composerStatus: "Guvenli ve destekleyici yazismaya odaklan.",
  },
  en: {
    roomNotFound: "Room not found.",
    connectionErrorBanner: "Connection failed. Please try again.",
    retry: "Retry",
    retryMessage: "Resend Message",
    retryHint: "Last message could not be sent.",
    moderationBlocked: "Message was blocked by the safety filter. Rephrase and try again.",
    rateLimited: "You are sending too fast. Pause briefly and try again.",
    duplicateBlocked: "Duplicate message was blocked.",
    onlineSuffix: "online",
    connectionErrorShort: "Connection error",
    loadingStatus: "...",
    emptyMessages: "No messages yet. Be the first to post.",
    inputPlaceholder: "Type a message...",
    send: "Send",
    sosTitle: "You are not alone right now",
    sosSubtitle: "Quick access: crisis room, breathing exercise, or support screen.",
    sosRoom: "Crisis Chat Room",
    sosBreathing: "Breathing Exercise",
    sosSupport: "Support Screen",
    close: "Close",
    liveSupportTitle: "Live Support",
    liveSupportOnline: "private support channel",
    liveSupportOffline: "waiting for connection",
    composerStatus: "Focus on safe and supportive conversation.",
  },
} as const;

const LOCALIZED_ROOM_META: Record<
  "tr" | "en",
  Record<CommunityRoomId, { name: string; description: string }>
> = {
  tr: {
    kriz: {
      name: "Sohbet",
      description: "Kullanici adiyla ortak sohbet. Acil durumda hizli yazisma alani.",
    },
    kumar: {
      name: "Kumar",
      description: "Kumar durtusu ve geri donus riskleri icin.",
    },
    finans: {
      name: "Finans",
      description: "Maddi kaygilar ve borc yonetimi uzerine.",
    },
    motivasyon: {
      name: "Motivasyon",
      description: "Kucuk basarilar ve hedef paylasimlari.",
    },
    gunluk: {
      name: "Gunluk",
      description: "Gunun nasil gectigini toplulukla paylas.",
    },
    dinleme: {
      name: "Dinleme",
      description: "Sadece dinlenmek ve dinlemek isteyenler icin.",
    },
  },
  en: {
    kriz: {
      name: "Chat",
      description: "Shared live chat with usernames for urgent moments.",
    },
    kumar: {
      name: "Gambling",
      description: "For gambling urges and relapse risk moments.",
    },
    finans: {
      name: "Finance",
      description: "For money stress and debt management support.",
    },
    motivasyon: {
      name: "Motivation",
      description: "Share small wins and next-step goals.",
    },
    gunluk: {
      name: "Daily Check-in",
      description: "Post how your day went with the community.",
    },
    dinleme: {
      name: "Listening",
      description: "For people who want to listen or be heard.",
    },
  },
};

function isRoomId(id: string): id is CommunityRoomId {
  return VALID_ROOM_IDS.includes(id as CommunityRoomId);
}

export default function CommunityRoomScreen() {
  const { t, selectedLanguage } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(COMMUNITY_ROOM_COPY);
  const localizedRoomMeta = useLocalizedCopy(LOCALIZED_ROOM_META);
  const liveSupportName = useLocalizedCopy({ tr: LIVE_SUPPORT_AGENT.nameTR, en: LIVE_SUPPORT_AGENT.nameEN });
  const aiBotName = useLocalizedCopy({ tr: COMMUNITY_AI_BOT.nameTR, en: COMMUNITY_AI_BOT.nameEN });

  const params = useLocalSearchParams<{ id?: string; direct?: string }>();
  const rawId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const rawDirect =
    typeof params.direct === "string"
      ? params.direct
      : Array.isArray(params.direct)
        ? params.direct[0]
        : "";
  const isDirectSupport =
    rawDirect === "1" || rawDirect.toLowerCase() === "true" || rawDirect.toLowerCase() === "yes";
  const roomId = isRoomId(rawId) ? rawId : "kriz";
  const room = getRoomMeta(roomId) ?? getRoomMeta("kriz");
  const localizedRoom = useMemo(() => localizedRoomMeta[roomId], [localizedRoomMeta, roomId]);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const leavePresenceRef = useRef<(() => Promise<void>) | null>(null);
  const listRef = useRef<FlatList<CommunityMessage>>(null);
  const redirectedToUsernameRef = useRef(false);
  const lastAiPromptRef = useRef<string | null>(null);
  const lastAiPromptAtRef = useRef(0);

  const retryConnection = useCallback(() => {
    setConnectionError(false);
    setLastFailedMessage(null);
    setComposerNotice(null);
    setReady(false);
    setUserId(null);
    setUsername(null);
    redirectedToUsernameRef.current = false;
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [uid, storedUsername] = await Promise.all([ensureAnonymousUser(), getStoredUsername()]);
        if (!mounted) return;
        setUserId(uid);
        if (!storedUsername) {
          setUsername(null);
          if (!redirectedToUsernameRef.current) {
            redirectedToUsernameRef.current = true;
            const nextPath = isDirectSupport
              ? `/community/room/${roomId}?direct=1`
              : `/community/room/${roomId}`;
            router.replace({
              pathname: "/community/username",
              params: { next: nextPath },
            });
          }
          return;
        }
        setUsername(storedUsername);
        setConnectionError(false);
      } catch {
        if (mounted) {
          setConnectionError(true);
          setReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [retryCount, isDirectSupport, roomId]);

  useEffect(() => {
    if (!userId || !username) return;
    setConnectionError(false);
    let mounted = true;
    (async () => {
      try {
        const leave = isDirectSupport
          ? await joinDirectSupportPresence(userId, LIVE_SUPPORT_AGENT.id, userId)
          : await joinRoomPresence(roomId, userId);
        if (!mounted) {
          leave().catch(() => {});
          return;
        }
        leavePresenceRef.current = leave;
        setReady(true);
      } catch {
        if (mounted) {
          setConnectionError(true);
          setReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
      leavePresenceRef.current?.().catch(() => {});
      leavePresenceRef.current = null;
    };
  }, [isDirectSupport, roomId, userId, username]);

  useEffect(() => {
    if (isDirectSupport) {
      if (!userId) return;
      const unsubMessages = listenToDirectSupportMessages(userId, LIVE_SUPPORT_AGENT.id, (next) => setMessages(next));
      setOnlineCount(1);
      return () => {
        unsubMessages();
      };
    }

    const unsubMessages = listenToRoomMessages(roomId, (next) => setMessages(next));
    const unsubCount = listenToRoomOnlineCount(roomId, setOnlineCount);
    return () => {
      unsubMessages();
      unsubCount();
    };
  }, [isDirectSupport, roomId, userId]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length]);

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

  const mapSendErrorNotice = useCallback(
    (code: CommunitySendErrorCode): string => {
      if (code === "community_rate_limited") return copy.rateLimited;
      if (code === "community_duplicate_message") return copy.duplicateBlocked;
      return copy.moderationBlocked;
    },
    [copy.duplicateBlocked, copy.moderationBlocked, copy.rateLimited]
  );

  const mapSendErrorReason = useCallback(
    (code: CommunitySendErrorCode): "message_blocked" | "rate_limited" | "duplicate" => {
      if (code === "community_rate_limited") return "rate_limited";
      if (code === "community_duplicate_message") return "duplicate";
      return "message_blocked";
    },
    []
  );

  const sendChatGptReply = useCallback(
    async (sourceText: string) => {
      if (isDirectSupport) return;

      const userPrompt = normalizeDraftText(sourceText);
      if (!userPrompt) return;
      const promptKey = `${roomId}:${userPrompt.toLocaleLowerCase()}`;
      const now = Date.now();
      if (
        lastAiPromptRef.current === promptKey &&
        now - lastAiPromptAtRef.current < AI_REPLY_DEDUP_WINDOW_MS
      ) {
        return;
      }
      lastAiPromptRef.current = promptKey;
      lastAiPromptAtRef.current = now;

      try {
        const ai = await safeAiReply(userPrompt, { locale: selectedLanguage });
        const reply = ai.text.trim();
        if (!reply) return;

        await sendRoomMessage(
          roomId,
          COMMUNITY_AI_BOT.id,
          aiBotName || COMMUNITY_AI_BOT.nameTR || COMMUNITY_AI_BOT.nameEN || "ChatGPT-4",
          reply
        );
      } catch {
        // If AI generation fails, user message remains in the room without blocking chat flow.
      }
    },
    [isDirectSupport, selectedLanguage, roomId, aiBotName]
  );

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const source = typeof overrideText === "string" ? overrideText : inputText;
      const trimmed = normalizeDraftText(source);
      if (!trimmed || !userId || !username || sending) return;

      setSending(true);
      setInputText("");
      setComposerNotice(null);
      try {
        if (isDirectSupport) {
          await withTimeout(
            sendDirectSupportMessage(userId, LIVE_SUPPORT_AGENT.id, userId, username, trimmed),
            MESSAGE_SEND_TIMEOUT_MS
          );
          setConnectionError(false);
          setLastFailedMessage(null);
          return;
        }

        await withTimeout(sendRoomMessage(roomId, userId, username, trimmed), MESSAGE_SEND_TIMEOUT_MS);
        setConnectionError(false);
        setLastFailedMessage(null);
        void sendChatGptReply(trimmed);
      } catch (error: unknown) {
        const sendErrorCode = getCommunitySendErrorCode(error);
        if (sendErrorCode) {
          trackEvent("community_send_guard_triggered", {
            reason: mapSendErrorReason(sendErrorCode),
            channel: isDirectSupport ? "direct_support" : "room",
            roomId,
          });
          setConnectionError(false);
          setComposerNotice(mapSendErrorNotice(sendErrorCode));
          if (sendErrorCode === "community_rate_limited") {
            setLastFailedMessage(trimmed);
            setInputText((current) => (normalizeDraftText(current).length === 0 ? trimmed : current));
          } else {
            setLastFailedMessage(null);
          }
          return;
        }

        setConnectionError(true);
        setLastFailedMessage(trimmed);
        setInputText((current) => (normalizeDraftText(current).length === 0 ? trimmed : current));
      } finally {
        setSending(false);
      }
    },
    [
      inputText,
      isDirectSupport,
      mapSendErrorNotice,
      mapSendErrorReason,
      userId,
      username,
      sending,
      roomId,
      sendChatGptReply,
    ]
  );

  const handleRetryMessage = useCallback(() => {
    if (!lastFailedMessage || sending) return;
    void handleSend(lastFailedMessage);
  }, [handleSend, lastFailedMessage, sending]);

  const canSendMessage =
    !!userId && !!username && !sending && normalizeDraftText(inputText).length > 0;

  useEffect(() => {
    if (!composerNotice) return;
    if (normalizeDraftText(inputText).length === 0) return;
    setComposerNotice(null);
  }, [composerNotice, inputText]);

  const renderMessage = useCallback(
    ({ item }: { item: CommunityMessage }) => {
      const isSelf = item.userId === userId;
      return (
        <View style={[styles.bubbleWrap, isSelf ? styles.bubbleWrapSelf : styles.bubbleWrapOther]}>
          <View
            style={[
              styles.bubble,
              isSelf
                ? [styles.bubbleSelf, { backgroundColor: colors.primary }]
                : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }],
            ]}
          >
            <View style={styles.bubbleMeta}>
              <Text
                style={[
                  styles.bubbleAuthor,
                  {
                    color: isSelf ? "rgba(255,255,255,0.82)" : colors.textSecondary,
                  },
                ]}
              >
                {item.username}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  {
                    color: isSelf ? "rgba(255,255,255,0.72)" : colors.textSecondary,
                  },
                ]}
              >
                {formatTime(item.createdAt)}
              </Text>
            </View>
            <Text
              style={[
                styles.bubbleText,
                isSelf ? styles.bubbleTextSelf : styles.bubbleTextOther,
                { color: isSelf ? "#FFFFFF" : colors.text },
              ]}
              selectable
            >
              {item.text}
            </Text>
          </View>
        </View>
      );
    },
    [colors.border, colors.card, colors.primary, colors.text, colors.textSecondary, formatTime, userId]
  );

  const headerTitle = isDirectSupport
    ? liveSupportName
    : (localizedRoom?.name ?? room?.name ?? copy.liveSupportTitle);
  const headerStatus = isDirectSupport
    ? ready && !connectionError
      ? copy.liveSupportOnline
      : connectionError
        ? copy.connectionErrorShort
        : copy.liveSupportOffline
    : ready && !connectionError
      ? `${onlineCount} ${copy.onlineSuffix}`
      : connectionError
        ? copy.connectionErrorShort
        : copy.loadingStatus;

  if (!room) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{copy.roomNotFound}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Text style={[styles.headerBackText, { color: colors.primary }]}>{"<-"}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{headerTitle}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{headerStatus}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScreenHero
        icon={isDirectSupport ? "headset-outline" : "chatbubbles-outline"}
        title={headerTitle}
        subtitle={headerStatus}
        description={localizedRoom?.description ?? room?.description}
        badge={isDirectSupport ? copy.liveSupportTitle : localizedRoom?.name}
        gradient={isDirectSupport ? ["#0E3E6E", "#2C5F9B"] : ["#1C4E73", "#2C7AA8"]}
        compact
        style={styles.heroPanel}
      />

      {connectionError && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: `${colors.warning ?? "#D97706"}22`,
              borderBottomColor: `${colors.warning ?? "#D97706"}55`,
            },
          ]}
        >
          <View style={styles.errorBannerCopyWrap}>
            <Text style={[styles.errorBannerText, { color: colors.text }]}>{copy.connectionErrorBanner}</Text>
            {!!lastFailedMessage && (
              <Text style={[styles.errorBannerHint, { color: colors.textSecondary }]}>{copy.retryHint}</Text>
            )}
          </View>

          <View style={styles.errorActions}>
            {!!lastFailedMessage && (
              <TouchableOpacity
                style={[styles.retryMessageBtn, { borderColor: colors.border }]}
                onPress={handleRetryMessage}
                activeOpacity={0.85}
              >
                <Text style={[styles.retryMessageBtnText, { color: colors.text }]}>{copy.retryMessage}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={retryConnection}
              activeOpacity={0.85}
            >
              <Text style={styles.retryBtnText}>{copy.retry}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
          ListEmptyComponent={
            ready ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.emptyMessages}</Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )
          }
        />

        <SectionLead
          icon="send-outline"
          title={copy.send}
          subtitle={copy.composerStatus}
          tone="primary"
          style={styles.chatLead}
        />

        {!!composerNotice && (
          <SectionLead
            icon="warning-outline"
            title={composerNotice}
            tone="warning"
            style={styles.composerNotice}
          />
        )}

        <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
          <View style={styles.inputWrap}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={copy.inputPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <Text style={[styles.counterText, { color: colors.textSecondary }]}>
              {normalizeDraftText(inputText).length}/{MAX_MESSAGE_LENGTH}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              !canSendMessage && [
                styles.sendBtnDisabled,
                { backgroundColor: colors.disabled },
              ],
            ]}
            onPress={() => void handleSend()}
            disabled={!canSendMessage}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendBtnText}>{copy.send}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <TouchableOpacity
        style={[styles.sosButton, { backgroundColor: colors.warning ?? "#D06B5C" }]}
        onPress={() => setSosVisible(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.sosButtonText}>SOS</Text>
      </TouchableOpacity>

      <Modal
        visible={sosVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>{copy.sosTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{copy.sosSubtitle}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSosVisible(false);
                router.push("/community/room/kriz");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>{copy.sosRoom}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSosVisible(false);
                router.push("/urge/breathing");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>{copy.sosBreathing}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSosVisible(false);
                router.push("/sos");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>{copy.sosSupport}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setSosVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{copy.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: { fontSize: 16, fontFamily: Fonts.body, marginBottom: 16 },
  errorBanner: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    borderBottomWidth: 1,
    gap: 10,
  },
  errorBannerCopyWrap: { gap: 4 },
  errorBannerText: { fontSize: 14, fontFamily: Fonts.body },
  errorBannerHint: { fontSize: 12, fontFamily: Fonts.body },
  errorActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  retryMessageBtn: {
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  retryMessageBtnText: { fontSize: 13, fontFamily: Fonts.bodySemiBold },
  retryBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  retryBtnText: { fontSize: 14, color: "#FFFFFF", fontFamily: Fonts.bodySemiBold },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBack: { padding: 8 },
  headerBackText: { fontSize: 22, fontFamily: Fonts.bodySemiBold },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: Fonts.bodySemiBold },
  headerSub: { fontSize: 12, marginTop: 2, fontFamily: Fonts.body },
  headerRight: { width: 40 },
  heroPanel: {
    marginHorizontal: Spacing.base,
    marginTop: 12,
    marginBottom: 8,
  },
  chatLead: {
    marginHorizontal: Spacing.base,
    marginBottom: 8,
  },
  composerNotice: {
    marginHorizontal: Spacing.base,
    marginBottom: 8,
  },
  chatArea: { flex: 1 },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  bubbleWrap: {
    marginBottom: 10,
    alignItems: "flex-start",
  },
  bubbleWrapSelf: { alignItems: "flex-end" },
  bubbleWrapOther: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  bubbleSelf: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  bubbleAuthor: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    flex: 1,
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: Fonts.body,
  },
  bubbleText: { fontSize: 15, fontFamily: Fonts.body },
  bubbleTextSelf: {},
  bubbleTextOther: {},
  emptyWrap: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontFamily: Fonts.body },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    width: "100%",
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.body,
    borderWidth: 1,
  },
  inputWrap: {
    flex: 1,
    gap: 6,
  },
  counterText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    textAlign: "right",
    paddingHorizontal: 4,
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
  },
  sendBtnDisabled: { opacity: 0.85 },
  sendBtnText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  sosButton: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sosButtonText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.display,
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Fonts.body,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: 10,
  },
  modalBtnText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  modalCancel: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelText: { fontFamily: Fonts.bodyMedium, fontSize: 15 },
  backBtn: { marginTop: 8 },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
});

