import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { safeAiReply } from "@/services/aiSafety";
import {
  clearAiMessages,
  loadAiMessages,
  saveAiMessages,
  type AiMessage,
} from "@/store/aiChatStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  "Şu an dürtü çok yükseldi.",
  "Kısa bir nefes egzersizi öner.",
  "Bugün kendimi suçlu hissediyorum.",
  "Kriz planı hazırlamama yardım et.",
];

// Daha “insani” fallback (kısa + güvenli)
const FALLBACK_REPLY =
  "Şu an bağlantı sorunu var. Yalnız değilsin. 10–15 saniye sonra tekrar dene. Bu sırada su içmek, kısa bir yürüyüş veya ortam değiştirmek dürtüyü azaltabilir.";

// Timeout süresi (ms)
const AI_TIMEOUT_MS = 15000;

// Promise timeout helper
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
  const { colors } = useTheme();

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
      // 1) AI çağrısını timeout ile sar
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
      // 2) Kırmızı LogBox’u azdırmamak için console.error yerine daha yumuşak log
      console.log("AI yanıtı alınamadı:", error?.message ?? error);

      // 3) Kullanıcıya UI üzerinden “hata” da göster
      const uiError =
        error?.message === "timeout"
          ? "AI yanıtı gecikti (timeout). İnternetini kontrol edip tekrar dene."
          : "Şu an AI’ye bağlanamıyorum. Biraz sonra tekrar deneyelim.";

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
    Alert.alert("Sohbeti Temizle", "Tüm sohbet geçmişi silinecek.", [
      { text: "İptal", style: "cancel" },
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
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.clearText, { color: colors.text }]}>Sohbeti temizle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
          {loading ? (
            <Text style={styles.emptyText}>Yükleniyor...</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.emptyText}>Bir şey paylaşarak başlayabilirsin.</Text>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === "user" ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === "user" ? styles.userText : styles.assistantText,
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
              style={[styles.quickChip, (loading || sending) && styles.quickChipDisabled]}
              onPress={() => handleSend(prompt)}
              disabled={loading || sending}
            >
              <Text style={styles.quickChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {sending && <Text style={styles.statusText}>Yanıt hazırlanıyor...</Text>}
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Ne hissediyorsun?"
            placeholderTextColor={colors.text + "80"}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (loading || sending) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={loading || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? "Gönderiliyor..." : "Gönder"}</Text>
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
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
  },
  messages: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 40,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#1D4C72",
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#FFFFFF",
  },
  assistantText: {
    color: "#333",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  quickChipDisabled: {
    opacity: 0.5,
  },
  quickChipText: {
    fontSize: 12,
    color: "#1D4C72",
    fontWeight: "600",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#B00020",
    marginBottom: 8,
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
  },
  sendButton: {
    backgroundColor: "#1D4C72",
    paddingVertical: 12,
    paddingHorizontal: 18,
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