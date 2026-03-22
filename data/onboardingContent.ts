import type { Language } from "@/i18n/translations";

type LocalizedText = {
  tr: string;
  en: string;
};

export type OnboardingOption = {
  id: string;
  label: LocalizedText;
};

export const ONBOARDING_CONTENT = {
  intro: {
    title: { tr: "ANTISLOT", en: "ANTISLOT" },
    subtitle: {
      tr: "Deneyimini kisisellestirmek icin kisa sorulari yanitla.",
      en: "Answer a few short questions so we can personalize your experience.",
    },
    button: { tr: "Basla", en: "Start" },
  },
  common: {
    back: { tr: "Geri", en: "Back" },
    next: { tr: "Ileri", en: "Next" },
    finish: { tr: "Bitir", en: "Finish" },
    selectOne: { tr: "(birini secin)", en: "(select one)" },
    selectAll: { tr: "(gecerli olanlarin hepsini secin)", en: "(select all that apply)" },
    otherPlaceholder: { tr: "Lutfen belirtin...", en: "Please specify..." },
    saveErrorTitle: { tr: "Hata", en: "Error" },
    saveErrorBody: { tr: "Yanitin kaydedilemedi. Tekrar dene.", en: "Unable to save your answer. Please try again." },
  },
  q1: {
    title: {
      tr: "Antislot'u indirmeye seni ne yoneltti?",
      en: "What brought you to Antislot?",
    },
    options: [
      {
        id: "reduce_or_quit",
        label: {
          tr: "Kumar oynamayi azaltmak veya birakmak",
          en: "Get help to reduce or stop gambling",
        },
      },
      {
        id: "track_progress",
        label: {
          tr: "Davranisimi ve ilerlememi takip etmek",
          en: "Track my behavior and progress",
        },
      },
      {
        id: "urgent_help",
        label: {
          tr: "Acil destek bulmak",
          en: "Get urgent support",
        },
      },
      {
        id: "find_services",
        label: {
          tr: "Destek hizmetleri bulmak",
          en: "Find support services",
        },
      },
      {
        id: "community",
        label: {
          tr: "Topluluk destegine katilmak",
          en: "Join a supportive community",
        },
      },
      {
        id: "talk_to_someone",
        label: {
          tr: "Birisiyle konusmak",
          en: "Talk to someone",
        },
      },
      {
        id: "stay_gambling_free",
        label: {
          tr: "Kumarsiz kalmak icin destek",
          en: "Stay gambling-free",
        },
      },
      {
        id: "other",
        label: {
          tr: "Diger",
          en: "Other",
        },
      },
    ] as OnboardingOption[],
  },
  q2: {
    title: {
      tr: "Kumar davranisini yonetmek icin daha once baska yontemler denedin mi?",
      en: "Have you tried other methods to manage gambling before?",
    },
    options: [
      { id: "yes", label: { tr: "Evet", en: "Yes" } },
      { id: "no", label: { tr: "Hayir", en: "No" } },
    ] as OnboardingOption[],
  },
  q3: {
    title: {
      tr: "Bu surecteki ana hedeflerin neler?",
      en: "What are your main goals in this process?",
    },
    options: [
      {
        id: "reduce_or_quit",
        label: { tr: "Kumar oynamayi azaltmak veya birakmak", en: "Reduce or stop gambling" },
      },
      {
        id: "improve_mental_health",
        label: { tr: "Ruh sagligini guclendirmek", en: "Improve mental health" },
      },
      {
        id: "healthy_habits",
        label: { tr: "Daha saglikli aliskanliklar kurmak", en: "Build healthier habits" },
      },
      {
        id: "track_journey",
        label: { tr: "Ilerlememi takip etmek", en: "Track my progress" },
      },
      {
        id: "coping_skills",
        label: { tr: "Bas etme becerileri ogrenmek", en: "Learn coping skills" },
      },
      {
        id: "urge_support",
        label: { tr: "Durtu aninda destek almak", en: "Get support during urges" },
      },
      {
        id: "gain_control",
        label: { tr: "Daha fazla kontrol hissetmek", en: "Feel more in control" },
      },
      {
        id: "other",
        label: { tr: "Diger", en: "Other" },
      },
    ] as OnboardingOption[],
  },
  q4: {
    title: {
      tr: "Genel olarak ne siklikla kumar oynarsin?",
      en: "How often do you usually gamble?",
    },
    options: [
      { id: "daily", label: { tr: "Her gun", en: "Every day" } },
      { id: "few_per_week", label: { tr: "Haftada birkac kez", en: "A few times a week" } },
      { id: "weekly", label: { tr: "Haftada bir", en: "Once a week" } },
      { id: "few_per_month", label: { tr: "Ayda birkac kez", en: "A few times a month" } },
      { id: "rarely", label: { tr: "Nadiren", en: "Rarely" } },
    ] as OnboardingOption[],
  },
  q5: {
    title: {
      tr: "Genellikle gunun hangi saatlerinde kumar oynarsin?",
      en: "What time of day do you usually gamble?",
    },
    options: [
      { id: "morning", label: { tr: "Sabah", en: "Morning" } },
      { id: "afternoon", label: { tr: "Ogleden sonra", en: "Afternoon" } },
      { id: "evening", label: { tr: "Aksam", en: "Evening" } },
      { id: "late_night", label: { tr: "Gece gec saatler", en: "Late night" } },
      { id: "variable", label: { tr: "Degisken", en: "Varies" } },
    ] as OnboardingOption[],
  },
  q6: {
    title: {
      tr: "Kumar oynamayi en cok ne tetikliyor?",
      en: "What most often triggers gambling?",
    },
    options: [
      { id: "stress_anxiety", label: { tr: "Stres veya kaygi", en: "Stress or anxiety" } },
      { id: "boredom", label: { tr: "Can sikintisi", en: "Boredom" } },
      { id: "loneliness", label: { tr: "Yalnizlik", en: "Loneliness" } },
      { id: "financial_worry", label: { tr: "Maddi endiseler", en: "Financial concerns" } },
      { id: "alcohol_substances", label: { tr: "Alkol veya maddeler", en: "Alcohol or substances" } },
      { id: "ads_and_content", label: { tr: "Reklam veya kumar icerikleri", en: "Ads or gambling content" } },
      { id: "conflict", label: { tr: "Tartisma veya catisma", en: "Conflict or arguments" } },
      { id: "celebration", label: { tr: "Kutlama veya heyecan", en: "Celebration or excitement" } },
    ] as OnboardingOption[],
  },
  q7: {
    title: {
      tr: "Durtu siddetini nasil degerlendirirsin?",
      en: "How strong are your gambling urges?",
    },
    subtitle: { tr: "1 = dusuk, 5 = cok guclu", en: "1 = low, 5 = very strong" },
    options: ["1", "2", "3", "4", "5"],
  },
  q8: {
    title: {
      tr: "Gunluk hatirlatmalar almak ister misin?",
      en: "Would you like daily reminders?",
    },
    options: [
      { id: "yes", label: { tr: "Evet", en: "Yes" } },
      { id: "no", label: { tr: "Hayir", en: "No" } },
    ] as OnboardingOption[],
  },
  q9: {
    title: {
      tr: "Hangi destek turu sana daha uygun?",
      en: "Which types of support do you prefer?",
    },
    options: [
      { id: "self_help_tools", label: { tr: "Kendi kendine yardim araclari", en: "Self-help tools" } },
      { id: "community_support", label: { tr: "Topluluk destegi", en: "Community support" } },
      { id: "professional_help", label: { tr: "Profesyonel destek", en: "Professional help" } },
      { id: "crisis_support", label: { tr: "Kriz veya acil destek", en: "Crisis or urgent support" } },
      { id: "tracking_insights", label: { tr: "Takip ve icgoruler", en: "Tracking and insights" } },
    ] as OnboardingOption[],
  },
  q10: {
    title: {
      tr: "Son adim",
      en: "Final step",
    },
    subtitle: {
      tr: "Devam etmeden once guvenlik ve yasal bildirimleri onayla.",
      en: "Before continuing, review and accept safety and legal notices.",
    },
    consentTitle: {
      tr: "Devam etmek icin onayla:",
      en: "Confirm before continuing:",
    },
    consents: [
      {
        id: "vpn_extension",
        text: {
          tr: "Uygulamanin engelleme ozellikleri icin VPN/Network Extension kullanabildigini biliyorum.",
          en: "I understand the app may use VPN/Network Extension for blocking features.",
        },
      },
      {
        id: "technical_limits",
        text: {
          tr: "DoH, uygulama ici tarayici ve captive portal gibi teknik sinirlamalari okudum.",
          en: "I reviewed technical limitations such as DoH, in-app browsers, and captive portals.",
        },
      },
      {
        id: "privacy_terms",
        text: {
          tr: "Gizlilik Politikasi ve Kullanim Sartlarini kabul ediyorum.",
          en: "I accept the Privacy Policy and Terms of Use.",
        },
      },
      {
        id: "age_confirmation",
        text: {
          tr: "18 yas veya uzerindeyim. Degilsem ebeveyn/yasal temsilci destegi gerekir.",
          en: "I am 18 or older. Otherwise guardian/legal support is required.",
        },
      },
      {
        id: "disclaimer_read",
        text: {
          tr: "Onemli bilgilendirmeyi okudum ve anladim.",
          en: "I read and understood the important disclaimer.",
        },
      },
    ],
    crisisTitle: { tr: "Kriz Uyarisi", en: "Crisis Notice" },
    crisisBody: {
      tr: "Kendine zarar riski veya acil durumda uygulamaya degil, yerel acil yardim hatlarina basvur. Turkiye: 112, ABD: 988.",
      en: "If there is self-harm risk or immediate danger, contact local emergency lines instead of relying on the app. Turkiye: 112, US: 988.",
    },
    links: {
      limitations: { tr: "Sinirlamalar", en: "Limitations" },
      privacy: { tr: "Gizlilik", en: "Privacy" },
      terms: { tr: "Sartlar", en: "Terms" },
      contact: { tr: "Iletisim", en: "Contact" },
      disclaimerDetails: { tr: "Detaylari Gor", en: "View Details" },
    },
  },
} as const;

export function localize(language: Language, text: LocalizedText) {
  return text[language];
}

