export type SupportTopicSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type SupportTopicAction = {
  label: string;
  route?: string;
  externalUrl?: string;
};

export type SupportTopic = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  tags: string[];
  accent: string;
  background: string;
  route: string;
  sections: SupportTopicSection[];
  actions?: SupportTopicAction[];
};

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: "urge-control",
    title: "Dürtü Yönetimi",
    subtitle: "Kumar isteği yükseldiğinde hızlı plan.",
    emoji: "🌀",
    tags: ["dürtü", "nefes", "acil"],
    accent: "#1D4C72",
    background: "#EAF3FF",
    route: "/support-topic/urge-control",
    sections: [
      {
        title: "90 Saniyelik Kural",
        body: "Dürtü dalgası genelde 90 saniye içinde yükselip azalır. Bu süreyi atlatmak için kısa bir plan yap.",
        bullets: [
          "Nefese dön: 4 saniye al, 6 saniye ver",
          "Dürtüyü isimlendir: “Bu geçici bir dürtü”",
          "Oda değiştir veya küçük bir yürüyüş yap",
        ],
      },
      {
        title: "Dürtü Sörfü",
        body: "Dürtüyü bastırmak yerine gözlemleyerek geçmesine izin ver.",
        bullets: [
          "Vücudundaki gerilimi fark et",
          "Dürtüyü 1-10 arasında puanla",
          "5 dakika sonra tekrar puanla",
        ],
      },
    ],
    actions: [
      { label: "SOS Aç", route: "/sos" },
      { label: "Farkındalık", route: "/mindfulness" },
    ],
  },
  {
    id: "crisis-plan",
    title: "Kriz Planı",
    subtitle: "Yüksek riskli anlar için hazır plan.",
    emoji: "🧭",
    tags: ["kriz", "plan", "acil"],
    accent: "#D06B5C",
    background: "#FFF0EE",
    route: "/support-topic/crisis-plan",
    sections: [
      {
        title: "Kırmızı Bayraklar",
        body: "Seni tetikleyen durumları önceden belirle.",
        bullets: [
          "Yalnızlık, öfke veya yoğun stres",
          "Bakiye kontrol etme, bahis sitelerini düşünme",
          "Gece geç saatlerde amaçsız gezinme",
        ],
      },
      {
        title: "Hızlı Müdahale",
        body: "Kriz başladığında uygulanacak 3 adımı seç ve görünür bir yere yaz.",
        bullets: [
          "Destek kişisini ara veya mesaj at",
          "10 dakikalık erteleme zamanlayıcısı başlat",
          "Günlüğe kısa bir not düş",
        ],
      },
    ],
    actions: [
      { label: "Destek Ağı", route: "/support" },
      { label: "Günlük", route: "/diary" },
    ],
  },
  {
    id: "financial-guardrails",
    title: "Finansal Sınırlar",
    subtitle: "Maddi riskleri azaltacak önlemler.",
    emoji: "💳",
    tags: ["finans", "koruma", "plan"],
    accent: "#3B75B8",
    background: "#EDF4FF",
    route: "/support-topic/financial-guardrails",
    sections: [
      {
        title: "Önleyici Adımlar",
        body: "Parasal tetikleyicileri azaltmak için küçük bariyerler oluştur.",
        bullets: [
          "Kumarla ilgili harcama limitleri belirle",
          "Otomatik ödeme talimatlarını gözden geçir",
          "Nakit taşımayı azalt",
        ],
      },
      {
        title: "Görünürlük",
        body: "Finansal farkındalık, geri dönüş riskini düşürür.",
        bullets: [
          "Haftalık bütçe özeti çıkar",
          "Kayıpları yazmak yerine kazanımları not et",
          "Hedef birikim listesi oluştur",
        ],
      },
    ],
    actions: [
      { label: "Engelleyici", route: "/blocker" },
      { label: "Destek Ağı", route: "/support" },
    ],
  },
  {
    id: "trigger-mapping",
    title: "Tetikleyici Haritası",
    subtitle: "Kişisel risk haritanı çıkar.",
    emoji: "🗺️",
    tags: ["tetikleyici", "farkındalık", "plan"],
    accent: "#6C63FF",
    background: "#F0EFFF",
    route: "/support-topic/trigger-mapping",
    sections: [
      {
        title: "Tetikleyicileri Tanı",
        body: "Kumar dürtüsünü artıran kişisel örüntüleri belirle.",
        bullets: [
          "Duygusal tetikleyiciler (stres, utanç, sıkılma)",
          "Mekânsal tetikleyiciler (bahis uygulamaları, belirli kafeler)",
          "Zamansal tetikleyiciler (maaş günü, gece saatleri)",
        ],
      },
      {
        title: "Karşılık Planı",
        body: "Her tetikleyici için bir alternatif davranış yaz.",
        bullets: [
          "Nefes egzersizi, kısa yürüyüş, birine mesaj",
          "Ekran süresini sınırlama",
          "Engelleyiciyi aktif tutma",
        ],
      },
    ],
    actions: [
      { label: "Günlük", route: "/diary" },
      { label: "Farkındalık", route: "/mindfulness" },
    ],
  },
  {
    id: "support-network",
    title: "Destek Ağı Kurma",
    subtitle: "Yalnız kalmamak için küçük adımlar.",
    emoji: "🤝",
    tags: ["destek", "iletişim", "plan"],
    accent: "#2E7D6B",
    background: "#E7F6F0",
    route: "/support-topic/support-network",
    sections: [
      {
        title: "Kimlere Ulaşabilirsin?",
        body: "Güvendiğin kişiler ve profesyonel kaynakları listele.",
        bullets: [
          "Bir yakın arkadaş veya aile üyesi",
          "Danışman veya terapist",
          "Kriz hatları / topluluklar",
        ],
      },
      {
        title: "İletişim Rutini",
        body: "Düzenli iletişim, kırılgan anlarda etkili olur.",
        bullets: [
          "Haftalık kısa bir check-in",
          "Acil durum mesaj şablonu oluştur",
          "Birlikte hedef belirleyin",
        ],
      },
    ],
    actions: [
      { label: "Destek Ağı", route: "/support" },
      { label: "SOS", route: "/sos" },
    ],
  },
  {
    id: "journal-prompts",
    title: "Günlük ve Yansıma",
    subtitle: "Duyguları düzenlemek için yazı egzersizleri.",
    emoji: "📓",
    tags: ["günlük", "yazı", "farkındalık"],
    accent: "#9C6ADE",
    background: "#F6F0FF",
    route: "/support-topic/journal-prompts",
    sections: [
      {
        title: "3 Dakikalık Yazı",
        body: "Kısa bir yazı, dürtü şiddetini azaltabilir.",
        bullets: [
          "Bugün beni en çok zorlayan şey neydi?",
          "Şu an ihtiyaç duyduğum şey ne?",
          "Bu dürtü geçtikten sonra ne hissediyorum?",
        ],
      },
      {
        title: "Gün Sonu Değerlendirmesi",
        body: "Akşamları 2-3 cümle ile günü kapat.",
        bullets: [
          "Bugün neleri iyi yönettim?",
          "Yarın için küçük bir niyetim ne?",
        ],
      },
    ],
    actions: [
      { label: "Günlük", route: "/diary" },
      { label: "Farkındalık", route: "/mindfulness" },
    ],
  },
];

export function getSupportTopic(id?: string) {
  if (!id) return null;
  return SUPPORT_TOPICS.find((topic) => topic.id === id) || null;
}

export default function SupportTopicsRoute() {
  return null;
}
