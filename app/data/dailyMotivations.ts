/**
 * Rotating daily motivation copy.
 *
 * The DailyStreakCard pulls a stage-appropriate quote based on the current
 * streak length, and rotates within that stage via day-of-year so the user
 * gets a different message every day even at the same streak length.
 *
 * Tone: short, concrete, no toxic-positivity. Targeted at Turkish-speaking
 * problem-gambling recovery.
 */

export type MotivationStage = "start" | "early" | "week" | "month" | "deep" | "veteran";

export type DailyMotivation = {
  headline: string;
  message: string;
};

const BY_STAGE: Record<MotivationStage, DailyMotivation[]> = {
  start: [
    {
      headline: "Bugün yeni bir başlangıç",
      message: "İlk adımı attın. 10 dakika bile çok değerli.",
    },
    {
      headline: "İlk gün her şey gibi zordur",
      message: "Buradayız. Sadece bugünü düşün — yarın yarın gelir.",
    },
    {
      headline: "Karar bir andır",
      message: "Bugün verdiğin karar yarınki seni hazırlıyor.",
    },
    {
      headline: "Hiçbir şey kaybetmedin",
      message: "Bugün hiç bahse oynamaman, bir kazançtır. Tek başına.",
    },
    {
      headline: "Tek bir kural: bugün",
      message: "Yarını düşünme. Sadece bu 24 saati gör — yeter.",
    },
  ],
  early: [
    {
      headline: "{days}. gün — ivme yakalanıyor",
      message: "Küçük zaferler birikiyor. Bugüne bir nefes daha ekle.",
    },
    {
      headline: "{days} gün — beyin uyum sağlıyor",
      message: "Dürtü dalgaları hâlâ gelebilir; her dalga sadece 90 saniye.",
    },
    {
      headline: "Üst üste {days} gün",
      message: "Vücudun değişimi hissediyor. Uyku, nefes, his — her şey ince ince düzeliyor.",
    },
    {
      headline: "{days}. günde bir hatırlatma",
      message: "Geri dönmek 5 saniye, ileri gitmek bu kadar uğraş. Bugünü harcama.",
    },
    {
      headline: "Henüz erken ama gerçek",
      message: "{days} gün — istatistikler senin tarafında: ilk 14 gün geçince risk yarıya düşer.",
    },
  ],
  week: [
    {
      headline: "Streak büyüyor",
      message: "{days} gün arkanda. Bedenin ve zihnin sana teşekkür ediyor.",
    },
    {
      headline: "Bir hafta sınırını geçtin",
      message: "İlk haftayı tamamlayanların %70'i ikinci haftaya da devam ediyor.",
    },
    {
      headline: "{days} gün — odak geri geliyor",
      message: "Bir kitap, bir sohbet, bir yürüyüş — artık fark edebilir hale geliyorsun.",
    },
    {
      headline: "Hatırla — kazandın",
      message: "Bahis sitesini açmadığın her saat, küçük ama gerçek bir başarı.",
    },
  ],
  month: [
    {
      headline: "Yeni alışkanlık şekilleniyor",
      message: "{days} günü geçtin. Beyin yolakları yeniden yazılıyor.",
    },
    {
      headline: "{days} gün — kim olduğun değişti",
      message: "Artık 'denemek' değil, 'devam etmek' aşamasındasın.",
    },
    {
      headline: "Bu çevre dönüştü",
      message: "{days} gün boyunca bahse oynamadın — sosyal çevren bunu fark etmeye başladı.",
    },
    {
      headline: "Klinik eşik yakın",
      message: "90 gün altın çizgidir. {days} gündesin — neredeyse oradasın.",
    },
  ],
  deep: [
    {
      headline: "Toparlanmanın derin evresi",
      message: "{days} gün — ilerlemeni koru, bu noktaya gelen az insan var.",
    },
    {
      headline: "{days} gün — kimliğin yenilendi",
      message: "Artık 'kumar oynayan biri' değil, 'oynamayan biri'sin.",
    },
    {
      headline: "Geriye bakma anı",
      message: "{days} gün önceki sen, bugünkü seni gurur duyurur.",
    },
  ],
  veteran: [
    {
      headline: "{days} gün — gerçek değişim",
      message: "Bahis düşüncesi artık zayıf bir misafir. Sen ev sahibisin.",
    },
    {
      headline: "Olağanüstü dayanım",
      message: "{days} gün boyunca tutarlı seçim yaptın — bu istisnai bir başarı.",
    },
    {
      headline: "Yolun bir parçası oldu",
      message: "{days} gün — toparlanma artık karakterin, bir görevin değil.",
    },
  ],
};

function stageFor(days: number): MotivationStage {
  if (days <= 0) return "start";
  if (days < 7) return "early";
  if (days < 30) return "week";
  if (days < 90) return "month";
  if (days < 365) return "deep";
  return "veteran";
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function pickDailyMotivation(days: number, now: Date = new Date()): DailyMotivation {
  const stage = stageFor(days);
  const pool = BY_STAGE[stage];
  const index = dayOfYear(now) % pool.length;
  const template = pool[index];
  return {
    headline: template.headline.replace("{days}", String(days)),
    message: template.message.replace("{days}", String(days)),
  };
}
