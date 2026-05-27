export type ModuleFocus = "psikolojik" | "finansal" | "deger";

export type InteractiveModule = {
  id: string;
  title: string;
  subtitle: string;
  /** Long-form one-paragraph description shown in the gallery card. */
  description: string;
  /** Ionicon for the leading bubble. */
  icon: string;
  /** Decorative background icon for the gallery card. */
  decorIcon: string;
  /** Color tone used on the gallery card. */
  tone:
    | "coral"
    | "teal"
    | "indigo"
    | "emerald"
    | "ocean"
    | "slate"
    | "amber"
    | "violet";
  focus: ModuleFocus;
  premium?: boolean;
  /** Estimated time to complete, displayed as a chip. */
  durationLabel: string;
  /**
   * Route to the module's interactive screen. Stored as a plain string
   * because Expo Router's typed-routes map is generated at build time and
   * doesn't include modules/* until the dev server has run at least once.
   */
  route: string;
};

export const INTERACTIVE_MODULES: InteractiveModule[] = [
  {
    id: "urge-log",
    title: "Dürtü Defteri",
    subtitle: "Her dürtüyü kaydet, patern çıkar",
    description:
      "Dürtü hissettiğinde 30 saniyede kaydet — yoğunluk, tetikleyici, sonuç. Zamanla saatlik dağılım ve direniş oranın görünür hale gelir.",
    icon: "pulse",
    decorIcon: "stats-chart",
    tone: "coral",
    focus: "psikolojik",
    premium: true,
    durationLabel: "30 sn",
    route: "/modules/urge-log",
  },
  {
    id: "loss-ledger",
    title: "Kayıp Defteri",
    subtitle: "Gerçek toplam — caydırıcı ayna",
    description:
      "Bahsten geçmiş yıllarda ne kadar kaybettin? Dönem dönem yaz, toplam tablo otomatik çıksın. Tek bir bahis değil — tüm yolun ücreti.",
    icon: "receipt",
    decorIcon: "calculator",
    tone: "amber",
    focus: "finansal",
    premium: true,
    durationLabel: "5 dk",
    route: "/modules/loss-ledger",
  },
  {
    id: "goals",
    title: "Hedefler",
    subtitle: "Streak / birikim / alışkanlık",
    description:
      "Net hedefler koy: '90 gün temiz', '50.000 TL birikim', 'haftada 3 yürüyüş'. Otomatik ilerleme barı streak ve birikimi referans alır.",
    icon: "flag",
    decorIcon: "trophy",
    tone: "ocean",
    focus: "deger",
    premium: true,
    durationLabel: "3 dk",
    route: "/modules/goals",
  },
  {
    id: "crisis-plan",
    title: "Kriz Planı",
    subtitle: "Kararı önceden ver",
    description:
      "Uyarı işaretleri, riskli durumlar, baş etme adımları ve güvendiğin kişinin telefonu — hepsi önceden hazır. Krizde sadece oku ve uygula.",
    icon: "alert-circle",
    decorIcon: "shield-checkmark",
    tone: "coral",
    focus: "psikolojik",
    premium: true,
    durationLabel: "8 dk",
    route: "/modules/crisis-plan",
  },
  {
    id: "affirmations",
    title: "Olumlamalar",
    subtitle: "30 farklı kart, günde 1 öne çıkıyor",
    description:
      "Güç, kimlik, huzur, finansal, ilişki, gelecek kategorilerinde 30 olumlama. Her gün bir tanesi öne çıkar; dürtü anında yüksek sesle oku.",
    icon: "sparkles",
    decorIcon: "star",
    tone: "violet",
    focus: "deger",
    premium: true,
    durationLabel: "1 dk",
    route: "/modules/affirmations",
  },
  {
    id: "pledge",
    title: "Bugünün Sözü",
    subtitle: "Günlük taahhüt — sadece bugün için",
    description:
      "Her sabah küçük, somut bir niyet yaz. Bahis kararı geldiğinde bu cümle önüne çıkar. I Am Sober tarzı günlük pledge sistemi — streak takipli.",
    icon: "hand-right",
    decorIcon: "checkmark-circle",
    tone: "ocean",
    focus: "deger",
    premium: true,
    durationLabel: "1 dk",
    route: "/modules/pledge",
  },
  {
    id: "reasons",
    title: "Sebepler Koleksiyonu",
    subtitle: "Neden bırakıyorum?",
    description:
      "Krizde okuyacağın kişisel sebepler. Soyut 'kötü' yerine somut 'kızımın gülüşü için' tarzı kalıcı kart koleksiyonu.",
    icon: "heart",
    decorIcon: "heart-outline",
    tone: "coral",
    focus: "deger",
    premium: true,
    durationLabel: "5 dk",
    route: "/modules/reasons",
  },
  {
    id: "milestones",
    title: "Kilometre Taşları",
    subtitle: "11 rozet, bronzdan efsaneye",
    description:
      "1 günden 5 yıla 11 milestone rozet. Her birinin neyi temsil ettiği klinik açıklamasıyla; kazandığında animasyonlu açılır.",
    icon: "trophy",
    decorIcon: "ribbon",
    tone: "violet",
    focus: "deger",
    premium: true,
    durationLabel: "Görüntüle",
    route: "/modules/milestones",
  },
  {
    id: "recovery-timeline",
    title: "Toparlanma Zaman Çizelgesi",
    subtitle: "İlk saat → 5 yıl",
    description:
      "Kumarı bıraktıktan sonra zihnin ve bedeninde ne zaman ne değişir. Uyku, dopamin, ilişkiler, finansal toparlanma — bilim-temelli yol haritası.",
    icon: "leaf",
    decorIcon: "fitness",
    tone: "emerald",
    focus: "psikolojik",
    premium: true,
    durationLabel: "Görüntüle",
    route: "/modules/recovery-timeline",
  },
  {
    id: "money-alternative",
    title: "Para Alternatifi",
    subtitle: "Kumara ayıracağın para neler alabilir?",
    description:
      "Kumar için ayıracağın tutarı gir. Aynı parayla bugün, 1 yılda veya 5 yılda neler yapabileceğini somut bir liste ile gör. Soyut “kayıp” yerine somut “alabileceklerim”.",
    icon: "cash",
    decorIcon: "wallet",
    tone: "emerald",
    focus: "finansal",
    premium: true,
    durationLabel: "3 dk",
    route: "/modules/money-alternative",
  },
  {
    id: "future-simulation",
    title: "Gelecek Simülasyonu",
    subtitle: "Devam edersen / Bugün durursan",
    description:
      "Günlük harcamanı ve süreyi seç. Mevcut hızla devam ettiğinde kaybedeceğin tutar ile bugünden başlayıp aynı parayı biriktirdiğinde ulaşacağın rakamı yan yana karşılaştır.",
    icon: "telescope",
    decorIcon: "trending-up",
    tone: "ocean",
    focus: "finansal",
    premium: true,
    durationLabel: "2 dk",
    route: "/modules/future-simulation",
  },
  {
    id: "reverse-debt",
    title: "Kumar Borcunu Simule Et",
    subtitle: "Tersine borc: 1 oyun = saatlerce emek",
    description:
      "Bir kerelik oyun dusuncesini tersine cevirir: Hayali olarak bahis atilir (%1 kazanma, %99 kaybetme). Kaybedilen para icin geri kazanma emegi saat saat gosterilir ve gercek bir hatirlatma alarmi kurulabilir.",
    icon: "warning",
    decorIcon: "hourglass",
    tone: "amber",
    focus: "finansal",
    premium: true,
    durationLabel: "2 dk",
    route: "/modules/reverse-debt",
  },
  {
    id: "hidden-costs",
    title: "Görünmez Maliyetler",
    subtitle: "Zaman · İlişki · Odak · Uyku",
    description:
      "Kumarın paradan başka neler aldığını ölçer. Birkaç hızlı soru ile son ay yaşadığın saat, ilişki, odak ve uyku kayıplarını görselleştirir.",
    icon: "eye-off",
    decorIcon: "eye-outline",
    tone: "slate",
    focus: "psikolojik",
    premium: true,
    durationLabel: "4 dk",
    route: "/modules/hidden-costs",
  },
  {
    id: "identity-check",
    title: "Kimlik Sorgulama",
    subtitle: "Bu kararı kim alıyor?",
    description:
      "Sahip olduğun roller, değerler ve gelecek vizyonun ile kumar oynama davranışı arasındaki çelişkiyi açığa çıkarır. Kişisel “kim olmak istiyorum” cümlesi oluşturmana yardım eder.",
    icon: "person-circle",
    decorIcon: "person",
    tone: "violet",
    focus: "deger",
    premium: true,
    durationLabel: "5 dk",
    route: "/modules/identity-check",
  },
  {
    id: "brain-hygiene",
    title: "Beyin Hijyeni",
    subtitle: "Dopamin döngüsünü onar",
    description:
      "Kumarın beyninin ödül sistemini nasıl çaldığını açıklar ve onarım için 7 günlük somut görevler sunar. Yürüyüş, soğuk duş, derin nefes, ekran orucu gibi pratik adımlar.",
    icon: "fitness",
    decorIcon: "pulse",
    tone: "coral",
    focus: "psikolojik",
    premium: true,
    durationLabel: "7 gün",
    route: "/modules/brain-hygiene",
  },
  {
    id: "trigger-map",
    title: "Tetikleyici Haritası",
    subtitle: "Kişisel tetikleyici profili",
    description:
      "Saat, mekân, duygu ve dürtü nedenini birlikte haritalar. Senin için en riskli kombinasyonları çıkarır ve her birine karşı özel baş etme önerileri sunar.",
    icon: "git-network",
    decorIcon: "map",
    tone: "amber",
    focus: "psikolojik",
    premium: true,
    durationLabel: "6 dk",
    route: "/modules/trigger-map",
  },
  {
    id: "time-machine",
    title: "Zaman Makinesi",
    subtitle: "Kaybedilen ve geri kazanılan saat",
    description:
      "Eski rutinde kumara harcadığın ortalama süreyi gir. Bugüne kadar kaç saat kaybettiğini, temiz kaldıkça geri kazandığın saatleri ve bu sürede neleri yapabileceğini somut karşılaştırmalarla gör.",
    icon: "hourglass",
    decorIcon: "time",
    tone: "indigo",
    focus: "deger",
    premium: true,
    durationLabel: "2 dk",
    route: "/modules/time-machine",
  },
];

export function getModuleById(id: string | undefined): InteractiveModule | undefined {
  if (!id) return undefined;
  return INTERACTIVE_MODULES.find((m) => m.id === id);
}
