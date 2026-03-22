import type { Href } from "expo-router";

export type LocaleText = {
  tr: string;
  en: string;
};

export type SupportTopicSection = {
  title: LocaleText;
  body: LocaleText;
  bullets?: LocaleText[];
};

export type SupportTopicAction = {
  label: LocaleText;
  route?: Href;
  externalUrl?: string;
};

export type SupportTopic = {
  id: string;
  title: LocaleText;
  subtitle: LocaleText;
  emoji: string;
  tags: LocaleText[];
  accent: string;
  background: string;
  sections: SupportTopicSection[];
  actions?: SupportTopicAction[];
};

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: "urge-control",
    title: { tr: "Durtu Yonetimi", en: "Urge Management" },
    subtitle: { tr: "Kumar istegi yukseldiginde hizli plan.", en: "Rapid plan when gambling urges spike." },
    emoji: "UM",
    tags: [
      { tr: "durtu", en: "urge" },
      { tr: "nefes", en: "breathing" },
      { tr: "acil", en: "urgent" },
    ],
    accent: "#1D4C72",
    background: "#EAF3FF",
    sections: [
      {
        title: { tr: "90 Saniyelik Kural", en: "90-Second Rule" },
        body: {
          tr: "Durtu dalgasi genelde 90 saniye icinde yukselip azalir. Kisa bir planla bu pencereyi gec.",
          en: "Urge waves often rise and fall within about 90 seconds. Use a short plan to outlast this window.",
        },
        bullets: [
          { tr: "Nefese don: 4 saniye al, 6 saniye ver", en: "Return to breath: inhale 4 seconds, exhale 6 seconds" },
          { tr: "Durtuyu adlandir: Bu gecici bir durtu", en: "Name the urge: This is temporary" },
          { tr: "Ortam degistir veya kisa bir yuruyus yap", en: "Change environment or take a short walk" },
        ],
      },
      {
        title: { tr: "Durtu Sorfu", en: "Urge Surfing" },
        body: {
          tr: "Durtuyu bastirmak yerine gozlemleyerek gecmesine izin ver.",
          en: "Instead of suppressing the urge, observe it and let it pass.",
        },
        bullets: [
          { tr: "Bedendeki gerilimi fark et", en: "Notice tension in your body" },
          { tr: "Durtuyu 1-10 arasinda puanla", en: "Rate urge intensity from 1 to 10" },
          { tr: "5 dakika sonra tekrar puanla", en: "Rate again after 5 minutes" },
        ],
      },
    ],
    actions: [
      { label: { tr: "SOS Ac", en: "Open SOS" }, route: "/sos" },
      { label: { tr: "Farkindalik", en: "Mindfulness" }, route: "/mindfulness" },
    ],
  },
  {
    id: "crisis-plan",
    title: { tr: "Kriz Plani", en: "Crisis Plan" },
    subtitle: { tr: "Yuksek riskli anlar icin hazir plan.", en: "Prepared plan for high-risk moments." },
    emoji: "CP",
    tags: [
      { tr: "kriz", en: "crisis" },
      { tr: "plan", en: "plan" },
      { tr: "acil", en: "urgent" },
    ],
    accent: "#D06B5C",
    background: "#FFF0EE",
    sections: [
      {
        title: { tr: "Kirmizi Bayraklar", en: "Red Flags" },
        body: {
          tr: "Seni tetikleyen durumlari onceden belirle.",
          en: "Identify your trigger situations in advance.",
        },
        bullets: [
          { tr: "Yalnizlik, ofke veya yogun stres", en: "Loneliness, anger, or intense stress" },
          { tr: "Bakiye kontrol etme veya bahis dusuncesi", en: "Compulsive balance checking or betting thoughts" },
          { tr: "Gece gec saatlerde amacsiz gezinme", en: "Late-night aimless browsing" },
        ],
      },
      {
        title: { tr: "Hizli Mudahale", en: "Rapid Intervention" },
        body: {
          tr: "Kriz basladiginda uygulanacak 3 adimi onceden yaz ve gorunur tut.",
          en: "Write 3 steps you will follow when crisis starts and keep them visible.",
        },
        bullets: [
          { tr: "Destek kisini ara veya mesaj at", en: "Call or text a support person" },
          { tr: "10 dakikalik erteleme zamanlayicisi baslat", en: "Start a 10-minute delay timer" },
          { tr: "Gunluge kisa bir not dus", en: "Write a short diary note" },
        ],
      },
    ],
    actions: [
      { label: { tr: "Destek Agi", en: "Support Network" }, route: "/community/room/kriz" },
      { label: { tr: "Gunluk", en: "Diary" }, route: "/diary" },
    ],
  },
  {
    id: "financial-guardrails",
    title: { tr: "Finansal Sinirlar", en: "Financial Guardrails" },
    subtitle: { tr: "Maddi riskleri azaltacak onlemler.", en: "Measures to lower financial risk." },
    emoji: "FG",
    tags: [
      { tr: "finans", en: "finance" },
      { tr: "koruma", en: "protection" },
      { tr: "plan", en: "plan" },
    ],
    accent: "#3B75B8",
    background: "#EDF4FF",
    sections: [
      {
        title: { tr: "Onleyici Adimlar", en: "Preventive Steps" },
        body: {
          tr: "Parasal tetikleyicileri azaltmak icin kucuk bariyerler olustur.",
          en: "Create small barriers to reduce money-related triggers.",
        },
        bullets: [
          { tr: "Kumar harcama limiti belirle", en: "Set hard gambling spending limits" },
          { tr: "Otomatik odeme talimatlarini gozden gecir", en: "Review automatic payment settings" },
          { tr: "Nakit tasimayi azalt", en: "Reduce available cash in hand" },
        ],
      },
      {
        title: { tr: "Gorunurluk", en: "Visibility" },
        body: {
          tr: "Finansal farkindalik geri donus riskini dusurur.",
          en: "Financial visibility lowers relapse risk.",
        },
        bullets: [
          { tr: "Haftalik butce ozeti cikar", en: "Create a weekly budget summary" },
          { tr: "Kucuk finansal kazanclari not et", en: "Track small financial wins" },
          { tr: "Hedef birikim listesi olustur", en: "Define a target savings list" },
        ],
      },
    ],
    actions: [
      { label: { tr: "Engelleyici", en: "Blocker" }, route: "/blocker" },
      { label: { tr: "Destek Agi", en: "Support Network" }, route: "/community/room/kriz" },
    ],
  },
  {
    id: "trigger-mapping",
    title: { tr: "Tetikleyici Haritasi", en: "Trigger Mapping" },
    subtitle: { tr: "Kisisel risk haritani cikar.", en: "Map your personal risk patterns." },
    emoji: "TM",
    tags: [
      { tr: "tetikleyici", en: "trigger" },
      { tr: "farkindalik", en: "awareness" },
      { tr: "plan", en: "plan" },
    ],
    accent: "#6C63FF",
    background: "#F0EFFF",
    sections: [
      {
        title: { tr: "Tetikleyicileri Tani", en: "Identify Triggers" },
        body: {
          tr: "Kumar durtusunu artiran kisisel oruntuleri belirle.",
          en: "Identify personal patterns that raise gambling urges.",
        },
        bullets: [
          { tr: "Duygusal: stres, utanc, sikilma", en: "Emotional: stress, shame, boredom" },
          { tr: "Mekansal: bahis uygulamalari, belirli mekanlar", en: "Environmental: betting apps, specific places" },
          { tr: "Zamansal: maas gunu, gece saatleri", en: "Temporal: payday, late-night hours" },
        ],
      },
      {
        title: { tr: "Karsilik Plani", en: "Counter Plan" },
        body: {
          tr: "Her tetikleyici icin bir alternatif davranis yaz.",
          en: "Assign an alternative behavior to each trigger.",
        },
        bullets: [
          { tr: "Nefes egzersizi, kisa yuruyus, birine mesaj", en: "Breathing, short walk, text someone" },
          { tr: "Ekran suresini sinirlama", en: "Limit high-risk screen exposure" },
          { tr: "Engelleyiciyi aktif tut", en: "Keep blocker protection active" },
        ],
      },
    ],
    actions: [
      { label: { tr: "Gunluk", en: "Diary" }, route: "/diary" },
      { label: { tr: "Farkindalik", en: "Mindfulness" }, route: "/mindfulness" },
    ],
  },
  {
    id: "support-network",
    title: { tr: "Destek Agi Kurma", en: "Building a Support Network" },
    subtitle: { tr: "Yalniz kalmamak icin kucuk adimlar.", en: "Small steps to avoid isolation." },
    emoji: "SN",
    tags: [
      { tr: "destek", en: "support" },
      { tr: "iletisim", en: "connection" },
      { tr: "plan", en: "plan" },
    ],
    accent: "#2E7D6B",
    background: "#E7F6F0",
    sections: [
      {
        title: { tr: "Kimlere Ulasabilirsin", en: "Who Can You Contact" },
        body: {
          tr: "Guvendigin kisiler ve profesyonel kaynaklari listele.",
          en: "List trusted people and professional resources.",
        },
        bullets: [
          { tr: "Yakin arkadas veya aile uyesi", en: "Close friend or family member" },
          { tr: "Danisman veya terapist", en: "Counselor or therapist" },
          { tr: "Kriz hatlari ve topluluklar", en: "Crisis lines and peer communities" },
        ],
      },
      {
        title: { tr: "Iletisim Rutini", en: "Communication Routine" },
        body: {
          tr: "Duzenli iletisim kirilgan anlarda daha etkili olur.",
          en: "Consistent communication helps during fragile moments.",
        },
        bullets: [
          { tr: "Haftalik kisa check-in planla", en: "Schedule a short weekly check-in" },
          { tr: "Acil durum mesaj sablonu olustur", en: "Prepare an emergency message template" },
          { tr: "Birlikte kucuk hedefler belirle", en: "Set small shared accountability goals" },
        ],
      },
    ],
    actions: [
      { label: { tr: "Destek Agi", en: "Support Network" }, route: "/community/room/kriz" },
      { label: { tr: "SOS", en: "SOS" }, route: "/sos" },
    ],
  },
  {
    id: "journal-prompts",
    title: { tr: "Gunluk ve Yansima", en: "Journaling and Reflection" },
    subtitle: { tr: "Duygulari duzenlemek icin yazi egzersizleri.", en: "Writing prompts to regulate emotions." },
    emoji: "JR",
    tags: [
      { tr: "gunluk", en: "journal" },
      { tr: "yazi", en: "writing" },
      { tr: "farkindalik", en: "awareness" },
    ],
    accent: "#9C6ADE",
    background: "#F6F0FF",
    sections: [
      {
        title: { tr: "3 Dakikalik Yazi", en: "3-Minute Writing" },
        body: {
          tr: "Kisa bir yazi durtu siddetini azaltabilir.",
          en: "Short writing can reduce urge intensity.",
        },
        bullets: [
          { tr: "Bugun beni en cok zorlayan sey neydi", en: "What challenged me most today" },
          { tr: "Su an neye ihtiyacim var", en: "What do I need right now" },
          { tr: "Bu durtu gectiginde ne hissediyorum", en: "How do I feel after this urge passes" },
        ],
      },
      {
        title: { tr: "Gun Sonu Degerlendirmesi", en: "End-of-Day Review" },
        body: {
          tr: "Aksamlari 2-3 cumle ile gunu kapat.",
          en: "Close your day with 2-3 reflective sentences.",
        },
        bullets: [
          { tr: "Bugun neyi iyi yonettim", en: "What did I manage well today" },
          { tr: "Yarin icin kucuk niyetim ne", en: "What is one small intention for tomorrow" },
        ],
      },
    ],
    actions: [
      { label: { tr: "Gunluk", en: "Diary" }, route: "/diary" },
      { label: { tr: "Farkindalik", en: "Mindfulness" }, route: "/mindfulness" },
    ],
  },
  {
    id: "sos",
    title: { tr: "SOS Hizli Destek", en: "SOS Quick Support" },
    subtitle: { tr: "Yuksek risk aninda anlik destek adimlari.", en: "Immediate support steps for high-risk moments." },
    emoji: "SOS",
    tags: [
      { tr: "acil", en: "urgent" },
      { tr: "destek", en: "support" },
      { tr: "guvenlik", en: "safety" },
    ],
    accent: "#D06B5C",
    background: "#FFF0EE",
    sections: [
      {
        title: { tr: "Ilk 2 Dakika", en: "First 2 Minutes" },
        body: {
          tr: "Dur, nefesini yavaslat ve guvenli bir ortama gec.",
          en: "Pause, slow breathing, and move to a safer environment.",
        },
        bullets: [
          { tr: "4 saniye al, 6 saniye ver ritmine gec", en: "Switch to 4-second inhale and 6-second exhale" },
          { tr: "Tetikleyici uygulama veya sayfayi kapat", en: "Close the triggering app or page" },
          { tr: "Guvendigin birine kisa bir mesaj gonder", en: "Send a short message to someone you trust" },
        ],
      },
      {
        title: { tr: "Destek Baglantisi", en: "Support Connection" },
        body: {
          tr: "Yalniz kalmadan destek kanallarina gecis yap.",
          en: "Move into support channels instead of staying isolated.",
        },
        bullets: [
          { tr: "SOS ekranindan yardim hatlarini ac", en: "Open helplines from the SOS screen" },
          { tr: "Kriz sohbet odasina katil", en: "Join the crisis chat room" },
          { tr: "Nefes egzersizi ile sinir sistemini sakinlestir", en: "Use breathing exercise to calm your nervous system" },
        ],
      },
    ],
    actions: [
      { label: { tr: "SOS Ekrani", en: "SOS Screen" }, route: "/sos" },
      { label: { tr: "Kriz Odasi", en: "Crisis Room" }, route: "/community/room/kriz" },
      { label: { tr: "Nefes Egzersizi", en: "Breathing Exercise" }, route: "/urge/breathing" },
    ],
  },
];

export function getSupportTopic(id?: string) {
  if (!id) return null;
  return SUPPORT_TOPICS.find((topic) => topic.id === id) || null;
}
