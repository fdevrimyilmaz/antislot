/**
 * Affirmation library — short, present-tense Turkish lines targeted at
 * gambling-recovery rather than generic positive thinking.
 *
 * Buckets keep them context-relevant; the UI either rotates by day or
 * lets the user filter by mood.
 */

export type AffirmationCategory =
  | "guc" // strength
  | "kimlik" // identity
  | "huzur" // calm
  | "para" // money
  | "iliski" // relationships
  | "gelecek"; // future

export type Affirmation = {
  id: number;
  category: AffirmationCategory;
  text: string;
};

export const CATEGORY_META: Record<
  AffirmationCategory,
  { label: string; emoji: string }
> = {
  guc: { label: "Güç", emoji: "💪" },
  kimlik: { label: "Kimlik", emoji: "🪞" },
  huzur: { label: "Huzur", emoji: "🌿" },
  para: { label: "Finansal", emoji: "💰" },
  iliski: { label: "İlişki", emoji: "❤️" },
  gelecek: { label: "Gelecek", emoji: "🔭" },
};

export const AFFIRMATIONS: Affirmation[] = [
  // Güç
  { id: 1,  category: "guc",     text: "Bugün bir kez daha 'hayır' demek elimde." },
  { id: 2,  category: "guc",     text: "Dürtü bir dalgadır — sürmeyi öğreniyorum, kapılmıyorum." },
  { id: 3,  category: "guc",     text: "Direnmek de bir kas; her gün biraz daha güçleniyor." },
  { id: 4,  category: "guc",     text: "Geçmişim beni belirlemiyor; bir sonraki seçimim belirliyor." },
  { id: 5,  category: "guc",     text: "Zayıf değilim — bağımlılığı tanıyorum, ona göre hareket ediyorum." },

  // Kimlik
  { id: 6,  category: "kimlik",  text: "Ben kumar oynayan biri değilim. Bahse oynamayan biriyim." },
  { id: 7,  category: "kimlik",  text: "Kararlarım kim olduğumu yansıtıyor — bugünkü karar da öyle." },
  { id: 8,  category: "kimlik",  text: "Bahsi bırakmak benim için kayıp değil, geri kazanım." },
  { id: 9,  category: "kimlik",  text: "Hayatımın hikayesini ben yazıyorum, kumar değil." },
  { id: 10, category: "kimlik",  text: "Sahip olduğum değerler bahsin getirisinden çok daha büyük." },

  // Huzur
  { id: 11, category: "huzur",   text: "Sakinlik yavaş yavaş geri geliyor — buna izin veriyorum." },
  { id: 12, category: "huzur",   text: "Nefesim her seferinde beni şu ana getiriyor." },
  { id: 13, category: "huzur",   text: "Sıkıntı geçici, kararım kalıcı." },
  { id: 14, category: "huzur",   text: "Kontrol etmem gereken şey bahis değil — bedenim ve nefesim." },
  { id: 15, category: "huzur",   text: "Bugüne odaklanmak yetiyor; yarınla zihinim yormuyor." },

  // Finansal
  { id: 16, category: "para",    text: "Cebimde kalan her TL artık benimle birlikte büyüyor." },
  { id: 17, category: "para",    text: "Geri çekilmek bir kayıp değil; biriken paraya 'evet' demek." },
  { id: 18, category: "para",    text: "Aynı parayı kendime, aileme ve hayallerime ayırıyorum." },
  { id: 19, category: "para",    text: "Bahis kapısını kapadım; başka kapılar birer birer açılıyor." },
  { id: 20, category: "para",    text: "Yatırım yapmadığım her bahis, geleceğime yapılan yatırımdır." },

  // İlişki
  { id: 21, category: "iliski",  text: "Bugünkü dürüstlüğüm yarınki güvenin temeli." },
  { id: 22, category: "iliski",  text: "Yanlızlık kumar değil, dürtüdür; cevabım bağlantı." },
  { id: 23, category: "iliski",  text: "Sevdiğim insanların yüzleri, herhangi bir bahisten daha gerçek." },
  { id: 24, category: "iliski",  text: "Kumara harcadığım dikkati, ilişkilerime veriyorum." },
  { id: 25, category: "iliski",  text: "Affedilebilirim, ama önce kendimi affetmem gerekiyor." },

  // Gelecek
  { id: 26, category: "gelecek", text: "5 yıl sonraki ben, bugünkü kararıma teşekkür ediyor." },
  { id: 27, category: "gelecek", text: "Bahis olmayan bir hayat — bunu hayal edebiliyorum, yapabilirim." },
  { id: 28, category: "gelecek", text: "Tek bir gün — bütün bir hayatın inşaat malzemesi." },
  { id: 29, category: "gelecek", text: "Yeni alışkanlığım, eski refleksimden daha güçlü." },
  { id: 30, category: "gelecek", text: "Yarın iyi olacak çünkü bugün doğru olanı yapıyorum." },
];

export function pickDailyAffirmation(now: Date = new Date()): Affirmation {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}
