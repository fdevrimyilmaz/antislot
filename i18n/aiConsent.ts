import type { Language } from "@/i18n/translations";

export type AiConsentText = {
  title: string;
  intro: string;
  bullets: {
    what: { title: string; body: string };
    where: { title: string; body: string };
    why: { title: string; body: string };
    retention: { title: string; body: string };
  };
  acceptCta: string;
  declineCta: string;
  declinedTitle: string;
  declinedBody: string;
  declinedCta: string;
  /** Inline notice shown above the input when user hasn't decided yet but somehow reached chat. */
  blockedNotice: string;
  /** Settings section. */
  settingsSectionTitle: string;
  settingsSectionSubtitle: string;
  settingsToggleLabel: string;
  settingsToggleHint: string;
  settingsStatusGranted: string;
  settingsStatusDenied: string;
  settingsStatusUnknown: string;
};

const EN: AiConsentText = {
  title: "AI Support — data sharing",
  intro:
    "The AI assistant works only if you agree to share your messages with our backend and an external AI provider. Please review and choose.",
  bullets: {
    what: {
      title: "What is shared",
      body: "The text of the message you write and basic technical logs (e.g. error/timeout codes). No name, contact, or device identifier is sent.",
    },
    where: {
      title: "Where it is sent",
      body: "Antislot backend, then forwarded to Google (Gemini 2.5 Flash) to generate a reply. No other AI provider receives your messages.",
    },
    why: {
      title: "Why",
      body: "Only to generate an AI reply for you. Your messages are not used for advertising or profiling.",
    },
    retention: {
      title: "On your device",
      body: "Your chat history is stored on this device. You can clear it any time from the AI screen.",
    },
  },
  acceptCta: "Accept and use AI",
  declineCta: "Reject",
  declinedTitle: "AI is off",
  declinedBody:
    "You chose not to share messages with the AI. The rest of the app keeps working. You can change this in Settings → Privacy and Legal.",
  declinedCta: "Change my choice",
  blockedNotice: "AI is off — you have not granted data sharing yet.",
  settingsSectionTitle: "AI Data Sharing",
  settingsSectionSubtitle:
    "Controls whether your AI messages can be sent to our backend and the external AI provider.",
  settingsToggleLabel: "Share my messages with the AI",
  settingsToggleHint:
    "When off, the AI screen is read-only and /chat is not called. You can re-enable any time.",
  settingsStatusGranted: "Granted",
  settingsStatusDenied: "Denied",
  settingsStatusUnknown: "Not chosen yet",
};

const TR: AiConsentText = {
  title: "Yapay Zekâ Desteği — veri paylaşımı",
  intro:
    "Yapay zekâ asistanı yalnızca mesajlarını bizim sunucumuz ve harici bir AI sağlayıcısı ile paylaşmaya açıkça izin verirsen çalışır. Lütfen oku ve seç.",
  bullets: {
    what: {
      title: "Hangi veri paylaşılır?",
      body: "Yazdığın mesajın metni ve temel teknik loglar (örn. hata/timeout kodları). İsim, iletişim bilgisi veya cihaz kimliği gönderilmez.",
    },
    where: {
      title: "Nereye gönderilir?",
      body: "Önce Antislot sunucumuza, ardından yanıt üretmesi için Google'a (Gemini 2.5 Flash) iletilir. Başka bir AI sağlayıcısına gönderilmez.",
    },
    why: {
      title: "Ne için kullanılır?",
      body: "Sadece sana AI yanıt üretmek için kullanılır. Reklam veya profilleme amacıyla kullanılmaz.",
    },
    retention: {
      title: "Cihazında ne kalır?",
      body: "Sohbet geçmişin yalnızca bu cihazda saklanır. AI ekranından istediğin zaman temizleyebilirsin.",
    },
  },
  acceptCta: "Kabul et ve AI'yi kullan",
  declineCta: "Reddet",
  declinedTitle: "AI kapalı",
  declinedBody:
    "Mesajlarını AI ile paylaşmamayı seçtin. Uygulamanın geri kalanı çalışmaya devam ediyor. Bu seçimi Ayarlar → Gizlilik ve Yasal bölümünden değiştirebilirsin.",
  declinedCta: "Seçimimi değiştir",
  blockedNotice: "AI kapalı — henüz veri paylaşımına izin vermedin.",
  settingsSectionTitle: "AI Veri Paylaşımı",
  settingsSectionSubtitle:
    "AI mesajlarının sunucumuza ve harici AI sağlayıcısına gönderilip gönderilmeyeceğini kontrol eder.",
  settingsToggleLabel: "Mesajlarımın AI ile paylaşılmasına izin ver",
  settingsToggleHint:
    "Kapalıyken AI ekranı salt okunurdur ve /chat çağrısı yapılmaz. İstediğin zaman tekrar açabilirsin.",
  settingsStatusGranted: "İzin verildi",
  settingsStatusDenied: "Reddedildi",
  settingsStatusUnknown: "Henüz seçilmedi",
};

const DE: AiConsentText = {
  title: "KI-Unterstützung — Datenfreigabe",
  intro:
    "Der KI-Assistent funktioniert nur, wenn du der Weitergabe deiner Nachrichten an unser Backend und einen externen KI-Anbieter zustimmst.",
  bullets: {
    what: {
      title: "Was wird geteilt",
      body: "Der Text deiner Nachricht und einfache technische Logs (z. B. Fehler-/Timeout-Codes). Name, Kontakt oder Gerätekennung werden nicht gesendet.",
    },
    where: {
      title: "Wohin",
      body: "Antislot-Backend und von dort an Google (Gemini 2.5 Flash) zur Antworterzeugung. An keinen weiteren KI-Anbieter.",
    },
    why: {
      title: "Wofür",
      body: "Nur um eine KI-Antwort für dich zu erstellen. Nicht für Werbung oder Profiling.",
    },
    retention: {
      title: "Auf deinem Gerät",
      body: "Dein Chatverlauf bleibt auf diesem Gerät. Du kannst ihn jederzeit aus dem KI-Bildschirm löschen.",
    },
  },
  acceptCta: "Akzeptieren und KI nutzen",
  declineCta: "Ablehnen",
  declinedTitle: "KI ist aus",
  declinedBody:
    "Du hast gewählt, keine Nachrichten mit der KI zu teilen. Der Rest der App funktioniert weiter. Du kannst das jederzeit in Einstellungen → Datenschutz und Recht ändern.",
  declinedCta: "Auswahl ändern",
  blockedNotice: "KI ist aus — du hast noch keine Datenfreigabe erteilt.",
  settingsSectionTitle: "KI-Datenfreigabe",
  settingsSectionSubtitle:
    "Steuert, ob deine KI-Nachrichten an unser Backend und den externen KI-Anbieter gesendet werden dürfen.",
  settingsToggleLabel: "Meine Nachrichten mit der KI teilen",
  settingsToggleHint:
    "Wenn aus, ist der KI-Bildschirm schreibgeschützt und /chat wird nicht aufgerufen.",
  settingsStatusGranted: "Erteilt",
  settingsStatusDenied: "Abgelehnt",
  settingsStatusUnknown: "Noch nicht gewählt",
};

export const AI_CONSENT_LOCALES: Record<Language, AiConsentText> = {
  tr: TR,
  en: EN,
  de: DE,
  // The remaining languages fall back to English. We can localise later.
  fr: EN,
  es: EN,
  it: EN,
  pt: EN,
  ar: EN,
  ru: EN,
  fil: EN,
  sv: EN,
  fi: EN,
  nl: EN,
  ja: EN,
  id: EN,
  th: EN,
  hi: EN,
  km: EN,
  el: EN,
};

export function getAiConsentLocale(language: Language): AiConsentText {
  return AI_CONSENT_LOCALES[language] ?? EN;
}
