/**
 * 30-day structured recovery journey. Each day is a tight, single-sitting
 * lesson with one reflection question and one concrete action.
 *
 * Tone: warm but plain. No fluff, no fake science. Where we cite a
 * mechanism, it is one a clinical practitioner would recognize.
 */

export type CurriculumDay = {
  /** 1-indexed day number, 1..30 */
  day: number;
  /** Short title shown in the timeline. */
  title: string;
  /** One-line summary used on cards. */
  summary: string;
  /** Body lesson — paragraphs separated by \n\n. */
  lesson: string;
  /** Reflection question — single sentence. */
  reflection: string;
  /** Concrete action for today — single sentence. */
  action: string;
  /** Estimated read + reflect time in minutes. */
  durationMin: number;
  /** Phase label used for grouping in the timeline. */
  phase: "foundation" | "awareness" | "skills" | "identity" | "future";
};

export const RECOVERY_DAYS: CurriculumDay[] = [
  // PHASE 1: Foundation (Days 1-7)
  {
    day: 1,
    title: "Bugün ilk gün",
    summary: "Cesaret, irade değil — bir başlangıçtır.",
    lesson:
      "Bu uygulamayı açtıysan, içinde bir parça artık yetmediğini söyleyen bir ses var. Onu duydun. Bu, iradenden çok daha değerli — çünkü irade yorulur, farkındalık kalır.\n\nİlk gün “asla oynamayacağım” demek değildir. İlk gün sadece bugün için, sadece bu 24 saat için bir niyet koymaktır. Yarın yine bir gün. Bugünü kurtarmak — yeter.\n\nKumar, hayatına giren bir alışkanlıktır. Alışkanlıklar zamanla yerleşir, zamanla çözülür. Aceleci olma. Sabırlı ol.",
    reflection:
      "Bugün uygulamayı açmama sebep olan o iç ses ne dedi?",
    action: "Bugün için tek cümlelik bir niyet yaz — Bugünün Sözü modülünde kaydet.",
    durationMin: 4,
    phase: "foundation",
  },
  {
    day: 2,
    title: "Beynin nasıl kandırıldı",
    summary: "Dopamin, değişken ödül, ve neden 'sadece bir tane' işe yaramaz.",
    lesson:
      "Kumar sistemleri, beynin ödül merkezini hedefler. Her bahis, dopamin saldığı kesin olmayan bir an yaratır: kazanma ihtimali ve kayıp arasındaki belirsizlik tam da bağımlılığın yakıtıdır.\n\nBeyin, kesinlikten çok değişken ödülü sever. Her zaman kazansaydın sıkılırdın; hiç kazanmasaydın bırakırdın. Bu “bazen kazanma” kalıbı, en güçlü öğrenme döngülerinden biridir.\n\n“Bir tane oynayıp dururum” cümlesi yalandır. Çünkü beyin bir tek bahse değil, o belirsizlik anının kendisine bağımlıdır. Bunu bilmek — kendine kızmamak — iyileşmenin ilk adımıdır.",
    reflection: "Son bahsinde gerçekten ne hissetmiştin: kazanma sevinci mi, belirsizliğin getirdiği canlanma mı?",
    action: "Bir sonraki dürtüde, dopamin patlamasını fark et ve yüksek sesle “bu duygu geçici” de.",
    durationMin: 5,
    phase: "foundation",
  },
  {
    day: 3,
    title: "Bedenin sesi",
    summary: "Dürtü zihne değil, bedene gelir önce.",
    lesson:
      "Dürtüler, düşünce olarak görünür — ama gerçekte bedensel bir olaydır. Göğüste sıkışma, midede burkulma, ellerde titreme, çenede gerilim, kalp çarpıntısı.\n\nBu uyarı işaretlerini öğrenmek, kararlarını geri kazanmanın en hızlı yoludur. Beden “bir şey oluyor” derken, zihin henüz hikâyeyi anlatmamıştır. O ara — birkaç saniyelik o ara — seçim yapabileceğin yegâne andır.\n\nBugün küçük bir alıştırma: her dürtüde önce nefesini fark et, sonra bedenini tara: göğüs, omuz, çene. Hikâyeye geçme. Sadece tanı.",
    reflection: "Dürtü geldiğinde bedeninde en sık nerede hissediyorsun?",
    action: "Bugün bir kere — dürtü olsun olmasın — 60 saniye gözlerini kapat ve bedenini tara.",
    durationMin: 4,
    phase: "foundation",
  },
  {
    day: 4,
    title: "Tetikleyiciler haritası",
    summary: "Rastgele değil — kalıp var. Onu görmek, kontrolü geri vermek demektir.",
    lesson:
      "“Birden geldi” diye anlattığın dürtüler, çoğu zaman birkaç tanıdık tetikleyicinin birleşimidir: bir saat, bir mekân, bir duygu, bir kişi. Yorgunluk + yalnızlık + akşam = klasik bir kombinasyon. Maaş günü + maç gecesi = bir başka.\n\nTetikleyici haritası, “neden ben” diye kendine sormaktan kurtarır. Cevap: rastgele değilsin, biyolojin de değilsin — bir kalıbın var ve kalıplar öğrenilebilir.\n\nGözlemci ol. Yargılama. Sadece kaydet.",
    reflection: "Son 3 dürtün hangi saatte ve hangi duygunun içinde geldi?",
    action: "Dürtü Defteri modülünde bugünkü dürtülerini (varsa) kaydet; tetikleyici alanını boş bırakma.",
    durationMin: 5,
    phase: "foundation",
  },
  {
    day: 5,
    title: "Gerçek tablo",
    summary: "Toplam kayıp — caydırıcı değil, ayna.",
    lesson:
      "Bahsin görünmez yanı, ne kazanılmadığını saklamasıdır. Aklın “bir defa şu kadar kazanmıştım” der; ama bütün dönemleri toplayan tabloyu görmez.\n\nBu adım acı verebilir. O yüzden bugün sadece bir dönemi yazmaya çalış. Hatırladığın kadarıyla, son 1 yıl — yaklaşık bile olsa.\n\nAmaç kendini suçlamak değil. Amaç, beynin “şanslıyım, kazanacağım” yalanını gerçeklerle yıkmak. Kayıp tablosunu gördükçe, bir sonraki dürtüde içsel argüman değişecek.",
    reflection: "Şu ana kadar tahmini olarak kumara ne kadar para verdin?",
    action: "Kayıp Defteri modülünü aç, sadece son 12 ayı yaz — kaba tahmin yeterli.",
    durationMin: 6,
    phase: "foundation",
  },
  {
    day: 6,
    title: "Uyku ve dürtü",
    summary: "Az uyumak, irade kasını söndürür.",
    lesson:
      "6 saatten az uyuduğun gecelerin ertesi günü, dürtü kontrolün ölçülebilir biçimde düşer. Prefrontal korteks — yani “dur” diyen beyin bölgesi — yorgunluğa en duyarlı bölgedir.\n\nBu bir mazeret değil, bir kaldıraçtır: uyku düzeltilirse dürtü direnci artar. Hiçbir psikolojik teknik, kronik uyku borcunu yenemez.\n\nBu gece için tek bir kural: telefon yatak odasının dışında. Şarjı koridorda, mutfakta — neredeyse. Sabaha kadar elin uzanmasın.",
    reflection: "Son bir hafta ortalama kaç saat uyudun?",
    action: "Telefon şarjını bu gece yatak odasının DIŞINA al; alarm için saat kullan.",
    durationMin: 4,
    phase: "foundation",
  },
  {
    day: 7,
    title: "Bir hafta!",
    summary: "Yarış değil, yön değişikliği.",
    lesson:
      "Bir haftayı geride bıraktın. Bu, hafife alınacak bir şey değil — beynin ödül sisteminde küçük ama gerçek bir kalibrasyon başladı. İlk hafta en zor haftalardan biridir çünkü beyin “normalin” geri gelmesini bekler.\n\nŞimdi durup geriye bakman önemli. Hangi an seni en zorladı? Hangi kararın seni gururlandırdı? Bunları hatırlamak, ileride benzer anlarda kullanacağın referans noktaları olacak.\n\nKendine bir ödül ver. Para değil — bir şey. Bir film, bir yürüyüş, bir özel yemek. Beyin ödülsüz öğrenmez.",
    reflection: "Bu haftanın en zor anı hangisiydi ve onu nasıl atlattın?",
    action: "Bu hafta gözlemlerini Günlük modülüne kısa bir not olarak yaz.",
    durationMin: 5,
    phase: "foundation",
  },

  // PHASE 2: Awareness (Days 8-14)
  {
    day: 8,
    title: "Risk pencereleri",
    summary: "Aynı saatler, aynı duygular — kaydet.",
    lesson:
      "Tetikleyici haritan birikmeye başladıkça, belirli zaman dilimlerinin tekrar ettiğini fark edeceksin. Hafta sonu geceleri, maç akşamları, maaş günü, uykusuz geceler — bunlar “risk pencereleridir”.\n\nRisk Pencereleri modülü tam da bunun için var. Penceren aktifken uygulama uyarı verir, SOS yolu kısalır, içinde fazladan bir çift göz olur.\n\nKendini bu pencerelerde başka bir aktiviteyle kapatman — sosyalleşme, spor, üretim — boş zamanın tehlikesini kapatır.",
    reflection: "Hangi gün ve hangi saat senin için en yüksek risk?",
    action: "Risk Pencereleri modülünde en az bir tane pencere tanımla.",
    durationMin: 5,
    phase: "awareness",
  },
  {
    day: 9,
    title: "Sıkışmış duygular",
    summary: "Kumar çoğu zaman duygulardan kaçmak için.",
    lesson:
      "Klinik gözlem nettir: tekrar eden bahis çoğunlukla bir duygunun üzerini örtmek için yapılır. Sıkışmış öfke, çözülmemiş yas, kronik sıkıntı, görünmez bir yalnızlık.\n\nKumar “bir şey hissetmemenin” yolu olur. Kazanırsan zafer, kaybedersen meşgul — her halükârda iç dünyandan birkaç saat uzak kalmış olursun.\n\nBu yüzden “neden oynuyorum” sorusu yetersizdir. Doğru soru: “Şu an oynamasam ne hissedecektim?”. Cevabı bul ve ona sevecen bak — o duygu çözümün başlangıcıdır.",
    reflection: "Son dürtün gelmeden önce hangi duyguyu hissetmemeye çalışıyordun?",
    action: "Bugün bir dürtü gelirse — önce 60 saniye sadece duyguyu dinle, sonra karar ver.",
    durationMin: 5,
    phase: "awareness",
  },
  {
    day: 10,
    title: "Hayır demek",
    summary: "Davete, reklama, kendi içsel sesine.",
    lesson:
      "Hayır demek bir beceridir, doğuştan gelmez. Pratik gerektirir. Hem dışarıdan gelen davetlere (arkadaşın bahis daveti, reklamlar, “bonus” bildirimleri) hem içsel sese (“sadece bir kere”) hayır demeyi öğrenirsin.\n\nÖnce kalıbı hazırla: “Şu an oynamıyorum.” — bu kadar. Açıklama, savunma, mazeret yok. Ne kadar kısa, o kadar güçlü.\n\nİkinci adım: bahis reklamlarını her platformda engelle, bildirimleri kapat, e-posta filtresi koy. Çevre kontrolü, irade gücünün yarısını tasarruf ettirir.",
    reflection: "Hayatında “hayır” diyemediğin en sık tetikleyici davet kim ya da ne?",
    action: "Sosyal medyada bahis hesaplarını “mute/unfollow” yap (en az 3 tane).",
    durationMin: 5,
    phase: "awareness",
  },
  {
    day: 11,
    title: "Para psikolojisi",
    summary: "Para sadece bir araç — neden bu kadar acıtıyor?",
    lesson:
      "Para kayıpları yalnızca finansal değildir — kimliksel bir yaraya dönüşür. “Aile için kazanıyordum, geleceğim için biriktiriyordum” — bu hikâyeleri kumar siler.\n\nBu yüzden kayıp, “şu kadar lira gitti” değil, “şu kadar ben gitti” gibi hissedilir. Bu hissin gerçek olduğunu kabul et. Bastırma.\n\nAma şunu da hatırla: kayıp paranın tamamı geri gelmeyebilir, ama kayıp kimlik geri gelir. Bu uygulamayı kullandığın her gün, o kimliği yeniden inşa ediyorsun.",
    reflection: "Kumara giden paranın asıl gitmesini istediğin yer neresiydi?",
    action: "Para Alternatifi modülünde günlük harcama miktarını gir, bir yıl içinde nelere yetebileceğini gör.",
    durationMin: 6,
    phase: "awareness",
  },
  {
    day: 12,
    title: "Kayıp kovalama tuzağı",
    summary: "Kaybettiğini geri kazanmak, en pahalı yanılgıdır.",
    lesson:
      "“Bir daha oynasam belki geri alırım” — bu cümle bağımlılığın imzasıdır. Buna “chasing losses” denir ve klinik araştırmalar onu en güçlü nüks belirleyicisi olarak gösterir.\n\nMatematik basittir: her bahis, evin lehinedir. Kovaladığın para, daha fazla kayıpla geri gelir. İçindeki ses haklıymış gibi konuşur — ama gerçekte sadece beynin “bir şey yapmalıyım” acılığını dindirmenin yolunu arıyor.\n\nKayıp kovalama dürtüsünü tanı ve şu cümleyi yüksek sesle söyle: “Bu para gitti. Kovalamak onu geri getirmez, daha çok kaybettirir.”",
    reflection: "En son ne zaman “kaybımı geri almak için” oynadın ve ne oldu?",
    action: "Krize girersen okuyacağın o tek cümleyi Sebepler Koleksiyonu modülüne ekle.",
    durationMin: 5,
    phase: "awareness",
  },
  {
    day: 13,
    title: "Sosyal baskı",
    summary: "Bahis kültürünün içinde temiz kalmak — mümkün, ama strateji ister.",
    lesson:
      "Türkiye'de bahis sohbeti her köşede: işyerinde, taksi yolculuğunda, akşam buluşmalarında. Tamamen kaçınmak zor; ama tetikleyici sohbetlerden uzaklaşmak mümkün.\n\nBirkaç hazır cümle bul: “Ben bu konudan uzağım”, “Bana sorma, oynamıyorum”, “Konuyu değiştirelim”. Tartışmaya girme, ikna etmeye çalışma. Sadece konumunu belirt ve devam et.\n\nEğer yakın çevrende bahis çok konuşuluyorsa, en az bir kişiye “şu an bunu bırakıyorum” demeyi düşün. Bir kişi bile yeter — hesap verebilirlik dürtüden güçlüdür.",
    reflection: "Yakın çevrende kim seni bu süreçte gerçekten destekleyebilir?",
    action: "O kişiye bugün bir mesaj at — “bahsi bırakıyorum, bunu bilmeni istedim” yeter.",
    durationMin: 5,
    phase: "awareness",
  },
  {
    day: 14,
    title: "İki hafta — başlangıç değil, dönüm",
    summary: "Beynin dopamin tabanı yerleşmeye başladı.",
    lesson:
      "İki haftada bedeninde ve zihninde küçük değişiklikler hissetmiş olabilirsin: daha az gergin, biraz daha iyi uyku, daha kararlı ruh hali. Bunlar dopamin temel seviyenin yeniden ayarlanmaya başladığının işaretleridir.\n\nDikkat: bu noktada bir “yalancı güven” gelebilir. “Artık bıraktım” hissi — tehlikelidir. Çünkü ilk büyük tetikleyicide hazırlıksız yakalanabilirsin.\n\nİki haftayı kutla — ama gardını indirme. Şimdi öğrendiğin becerileri pekiştirme zamanı.",
    reflection: "Bu iki haftada bedeninde veya ruh halinde fark ettiğin en somut değişiklik ne?",
    action: "Toparlanma Zaman Çizelgesi modülünü aç ve 2 haftalık değişimleri oku.",
    durationMin: 4,
    phase: "awareness",
  },

  // PHASE 3: Skills (Days 15-21)
  {
    day: 15,
    title: "Dürtü dalgası",
    summary: "Dürtü kalıcı değil — 5-15 dakika içinde geçer.",
    lesson:
      "Klinik veri net: çoğu yoğun dürtü, müdahale edilmediğinde 5 ila 15 dakika içinde tepe yapıp düşer. Bir dalga gibi — yüksel, kırıl, geri çekil.\n\n“Urge surfing” tekniği bu prensibe dayanır: dürtüyle savaşmak yerine, üzerine bin ve geçişini izle. Düşman değildir; sadece geçici bir nörolojik dalgadır.\n\nBugünkü egzersiz: Bir dürtü geldiğinde, telefonun zamanlayıcısını 10 dakikaya kur. Sadece nefes al ve bekle. Bittiğinde, dürtünün şiddetini yeniden değerlendir.",
    reflection: "En son dürtüde ne kadar süre dayandın ve sonra ne hissettin?",
    action: "Bugün bir dürtü gelirse — 10 dakikalık geri sayım kur, ondan önce hiçbir bahis sitesi açma.",
    durationMin: 5,
    phase: "skills",
  },
  {
    day: 16,
    title: "Yer değiştirme alışkanlığı",
    summary: "Çıkar, doldur, yerine koy.",
    lesson:
      "Beyin boşluktan hoşlanmaz. Bir alışkanlığı çıkarınca, yerine başka bir alışkanlık koymalısın — yoksa eski alışkanlık geri döner.\n\n“Akşamları bahis siteleri yerine ne?” sorusu büyüktür. Yürüyüş, kitap, müzik, bir ders, bir oyun — somut, hazır, kolay erişilebilir bir alternatif gerekir.\n\nİdeal alternatif üç şey sağlar: meşguliyet (zihni doldurur), küçük ödül (dopamin verir), ve değer (önemsediğin bir şeyle bağlantılı). Bir kişiye yardım etmek, bir hobi öğrenmek — bunlar uzun süreli kazançtır.",
    reflection: "Bahis için ayırdığın zamanın yerine hangi tek aktivite gelebilir?",
    action: "Bugün için o alternatif aktiviteyi takvimine somut bir saat olarak koy.",
    durationMin: 5,
    phase: "skills",
  },
  {
    day: 17,
    title: "Stresi atlatmak",
    summary: "Strese dayanmak — değil, hızla bedenden çıkarmak.",
    lesson:
      "Stres hormonu kortizol bedenden çıkmadığında dürtü artar. Üç hızlı bedensel çıkarma yöntemi öğrenmen yeterli:\n\n1) 5 dakikalık hızlı yürüyüş — kortizol metabolize olur.\n2) Soğuk su yüze ya da bileklere — vagus siniri aktive olur, sinir sistemi yatışır.\n3) Box breathing (4-4-4-4 nefes) — 2 dakikada kalp atış hızı düşer.\n\nBunlar “gevşeme” teknikleri değil — fizyolojik müdahalelerdir. Düşüncenle çözemediğin bir stresi, bedeninle çözebilirsin.",
    reflection: "Sen stres altındayken en sık hangi davranışa yöneliyorsun?",
    action: "Bugün stres anında 3 yöntemden birini dene; hangisi sana uydu, not et.",
    durationMin: 5,
    phase: "skills",
  },
  {
    day: 18,
    title: "Vücudunu kullan",
    summary: "Egzersiz, kumara karşı doğal dopamin pompasıdır.",
    lesson:
      "Düzenli fiziksel aktivite, kumarın simüle ettiği dopamin patlamalarına benzer ama sağlıklı bir alternatif sunar. Araştırmalar haftada 3-4 kez 30 dakikalık orta yoğunlukta hareketin dürtü sıklığını belirgin biçimde düşürdüğünü gösteriyor.\n\nSpor salonu şart değil. Hızlı yürüyüş, bisiklet, ev egzersizleri yeter. Önemli olan kalp atış hızını yükseltmek ve düzenlilik.\n\nSabah egzersizi tercih edilir: günün geri kalanında dopamin temel seviye yüksek tutulur, akşam dürtüleri daha zayıf olur.",
    reflection: "Şu an düzenli yaptığın herhangi bir fiziksel aktivite var mı?",
    action: "Yarın 20 dakikalık bir yürüyüş için sabah saatinde alarm kur.",
    durationMin: 4,
    phase: "skills",
  },
  {
    day: 19,
    title: "Farkındalık 101",
    summary: "Düşünceni izlemek, ona inanmak zorunda olmadığını öğretir.",
    lesson:
      "Mindfulness, dini ya da egzotik bir şey değildir. Basit bir gözlem becerisidir: aklında olanı, yargılamadan, fark etmek.\n\nKumar dürtüsü bir düşünce olarak gelir — “şimdi oynasam fena olmaz”. Mindfulness pratiği yaptıkça, bu düşünceyi bir gerçek olarak değil, sadece bir düşünce olarak görmeye başlarsın. Düşünce ≠ gerçek. Düşünce ≠ emir.\n\nBir tek günlük 5 dakikalık nefes pratiği bile, 4-6 hafta sonra dürtü kontrolünde ölçülebilir fark yaratır.",
    reflection: "Şu an aklından geçen düşünceyi sadece izleyebilir misin, ona inanmak zorunda olmadan?",
    action: "Farkındalık modülünden 5 dakikalık nefes seansını dinle.",
    durationMin: 6,
    phase: "skills",
  },
  {
    day: 20,
    title: "Kendine şefkat",
    summary: "Kendini suçlamak iyileşmeyi yavaşlatır.",
    lesson:
      "Klinik araştırma şaşırtıcı bir şey gösteriyor: kendine sert olanlar, sevecen olanlardan daha sık nüks eder. Çünkü utanç, çözüm değil — başka bir tetikleyicidir.\n\nKumara döndüğünde, “ne aptalım” yerine “bu zormuş, yeniden başlıyorum” demeyi öğren. Bir arkadaşına nasıl konuşacaksan kendine de öyle konuş.\n\nBu zayıflık değil, stratejidir. Sevecen olduğun nispette daha hızlı kalkar, daha az utanırsın, daha az saklamaya çalışırsın.",
    reflection: "En son nüks ettiğinde içsel sesin sana ne dedi? Bunu sevecen bir tonla yeniden söyleyebilir misin?",
    action: "Olumlamalar modülünden bir kart aç ve yüksek sesle oku.",
    durationMin: 4,
    phase: "skills",
  },
  {
    day: 21,
    title: "Üç hafta!",
    summary: "Yeni alışkanlıklar yerleşmeye başlıyor.",
    lesson:
      "Üç hafta, sinir biliminde bir eşiktir. Yeni nöral bağlantılar daha kalıcı hale gelmeye başlar. Bahis dürtüsünün artık beynin “otomatik tepki” listesinin başında olmaması mümkündür.\n\nDikkat: bu eşik aynı zamanda “gardını indirme” riskidir. “Artık iyiyim” hissi — tıbbi olarak — bir nükse en yakın andır.\n\nÜç haftayı kutla, ama günlük rutinine sadık kal. Streak, hız değil ritimdir.",
    reflection: "Üç hafta önceki halinle bugünkü halin arasındaki en büyük fark ne?",
    action: "Kilometre Taşları modülünde 21 günlük rozetini gör; hak ettin.",
    durationMin: 4,
    phase: "skills",
  },

  // PHASE 4: Identity (Days 22-28)
  {
    day: 22,
    title: "Değerlerin ne?",
    summary: "Davranış değil — kimlik değiştir.",
    lesson:
      "Kalıcı değişim, “şunu yapmamaya çalışıyorum”dan değil, “şu tip biri olmak istiyorum”dan gelir. Davranış yenilenir, ama kimlik kalır.\n\nDeğerlerinin listesi: aile, dürüstlük, sağlık, özgürlük, üretkenlik, kendine saygı, başkalarına yardım — herkes farklı. Senin için en önemli üçü hangileri?\n\nO üç değerin, kumar oynamayla nasıl çeliştiğini gör. Bu, dış disiplinden iç tutarlılığa geçişin başlangıcıdır.",
    reflection: "Sana göre yaşamak istediğin üç değer hangileri?",
    action: "Kimlik Sorgulama modülünü aç ve “kim olmak istiyorum” cümleni yaz.",
    durationMin: 6,
    phase: "identity",
  },
  {
    day: 23,
    title: "İlişkilerini onar",
    summary: "Bağımlılık ilişkilere zarar verir — onarım mümkündür.",
    lesson:
      "Kumar dönemleri çoğu zaman sevdiklerine yalan söyleme, gizleme, mesafelenme dönemleridir. Bunu kendine itiraf etmen iyileşmenin en zor — ve en önemli — adımlarından biri.\n\nOnarım, suçluluktan değil sorumluluktan başlar. Geçmişi anlatmak değil — bugünden itibaren farklı olmak. Eylemler, kelimelerden çok daha güçlü.\n\nBir kişiyi seç. Bugün ona zaman ayır, yalansız konuş, küçük bir iyilik yap. Tek bir bağ — onarımı başlatır.",
    reflection: "Bağımlılık döneminde en çok kimi ihmal ettin?",
    action: "O kişiye bugün bir telefon aç ya da bir mesaj at — kumar konusunu açma, sadece bağ kur.",
    durationMin: 5,
    phase: "identity",
  },
  {
    day: 24,
    title: "Yeni kimlik",
    summary: "“Eski kumarbazım” değil — “bahisten uzak yaşayan biriyim”.",
    lesson:
      "Kimlik dili önemlidir. “Kumar bağımlısıydım” geçmiş bir etiket. “Şu an bahisten uzak yaşıyorum” — bir kimlik. Cümle yapısı kim olduğunu şekillendirir.\n\n“Asla oynamam” gibi mutlak cümlelerden kaç. Beyin mutlaklara isyan eder. Yerine: “Bugün oynamıyorum, bu yaşam tarzımın parçası.”\n\nKendine üçüncü kişiden bahset, kâğıda yaz: “(Adın) artık parasıyla, dikkatiyle, zamanıyla başka şeyler yapan biridir.” Bu cümleyi günde bir kez sessizce oku — 30 gün sürdür.",
    reflection: "Kendinden bahsederken kullandığın dil seni hangi kimliğe götürüyor?",
    action: "Bir kâğıda yeni kimlik cümleni yaz, gözünün göreceği yere koy.",
    durationMin: 5,
    phase: "identity",
  },
  {
    day: 25,
    title: "Hedef seç",
    summary: "Bir somut hedef — dürtüden güçlüdür.",
    lesson:
      "Soyut hedefler (“mutlu olmak”, “daha iyi biri olmak”) işe yaramaz. Somut hedefler (“60 günde 25.000 TL biriktirmek”, “3 ayda 8 kilo vermek”, “6 ayda diploma bitirmek”) işe yarar.\n\nKumara giden enerji + para + dikkat, müthiş bir kaynaktır — eğer yönlendirirsen. Hedefe yönlendir.\n\nBir hedef belirle. Süresi olsun. Ölçülebilir olsun. Birime bağlı olsun. Aksi takdirde, hedef değil, dilek olur.",
    reflection: "Bugünden 90 gün sonra hangi somut sonucu görmek istersin?",
    action: "Hedefler modülünde bir hedef oluştur — net tarih, net rakam.",
    durationMin: 5,
    phase: "identity",
  },
  {
    day: 26,
    title: "Geleceğin sen",
    summary: "Bir yıl sonra hayata teşekkür edecek senin ne yapmasını ister?",
    lesson:
      "Klinik bir egzersiz: gözlerini kapat, 1 yıl sonraya git. Bu sürede oynamamış bir kişisin. Hayatın nasıl görünüyor? Kim çevrende? Nelere para harcıyorsun? Nasıl uyuyorsun?\n\nBu “gelecek-ben”, soyut bir hayal değildir — kararların yön bulmasına yardım eden bir referans noktasıdır. Şu an verdiğin her küçük karar, o kişiye bir adım yaklaştırır ya da uzaklaştırır.\n\nGelecek-ben şu an seni izliyor. Ona ne yapmasını isterdin?",
    reflection: "1 yıl sonraki sen, bugünkü sana ne der?",
    action: "Gelecek Simülasyonu modülünü aç, kendi rakamlarınla simülasyonu çalıştır.",
    durationMin: 6,
    phase: "identity",
  },
  {
    day: 27,
    title: "Kendini affet",
    summary: "Suçluluk taşımak iyileşmeyi yavaşlatır.",
    lesson:
      "Affetmek = onaylamak değil. Affetmek = artık taşımamak. Geçmişteki kararların sonuçlarını taşırsın — ama o anılarla ağırlık taşımak zorunda değilsin.\n\nKendinde affedemediklerin var. Yalan söyledikler, ihmal ettikler, kaybettikler. Hepsi gerçek. Ama her gün kendine “yine de devam ediyorum” diyebilmek — bu, başka tür bir güçtür.\n\nAf, bir karardır. Bir kez verilir, defalarca yenilenir. Bugün ilk kararı ver.",
    reflection: "Geçmişte kendini en çok hangi şey için suçluyorsun?",
    action: "Bir kâğıda “artık taşımıyorum” diye yaz, üstüne o şeyi yaz, sonra kâğıdı yırt ya da yak.",
    durationMin: 5,
    phase: "identity",
  },
  {
    day: 28,
    title: "Sürekli iyileşme",
    summary: "İyileşme bir mesele değil — bir yaşam tarzıdır.",
    lesson:
      "Bu 30 günlük yol bitiyor — ama iyileşme yolculuğu bitmez. Bağımlılık, “kapanmış bir dosya” değil; uyanık tutulması gereken bir farkındalıktır.\n\nİyi haber: gardını sürekli yüksek tutmana gerek yok. Sadece tetikleyici durumlarda — risk pencereleri, stresli dönemler, sosyal yalnızlık — alarm çalsın yeter. Bunu uygulama senin için yapacak.\n\nKalıcı iyileşme = düşük seviyede sürekli farkındalık + yüksek riskli anlarda yoğun pratik.",
    reflection: "Hangi 3 araç — bu uygulamadan ya da dışından — senin için en işe yarayanı oldu?",
    action: "O 3 aracı bir liste haline getir ve telefonun ana ekranında erişilebilir tut.",
    durationMin: 5,
    phase: "future",
  },

  // PHASE 5: Future (Days 29-30)
  {
    day: 29,
    title: "Nüks planı",
    summary: "Olursa ne yapacağını şimdi karar ver.",
    lesson:
      "Nüks, başarısızlık değildir — iyileşme yolunun bilinen bir riskidir. Hazırlıklı olmak utanç değildir; akıllılıktır.\n\nNüks planı 3 bölümdür:\n1) Erken uyarı işaretleri (yorgunluk, sosyal izolasyon, “sadece kontrol etmek” düşüncesi)\n2) Acil müdahale adımları (telefonu uzaklaştır, SOS'a bas, güvendiğin kişiyi ara)\n3) Sonrasında ne (kendini suçlama, sayacı sıfırla, planı güncelle, devam et)\n\nBunu krizde değil, şimdi yaz. Çünkü krizde rasyonel düşünemezsin — okumak yeterli.",
    reflection: "Olası bir nükse karşı şu an kafanda hazır olan bir plan var mı?",
    action: "Kriz Planı modülünde bu 3 bölümü doldur.",
    durationMin: 6,
    phase: "future",
  },
  {
    day: 30,
    title: "Devam — yeni başlangıç",
    summary: "30 gün geride. Şimdi yola çıkıyorsun.",
    lesson:
      "Bu 30 günde ne yaptın: kumarın beyninde nasıl çalıştığını öğrendin, tetikleyicilerini haritaladın, bedenini dinlemeye başladın, yeni alışkanlıklar yerleştirdin, kimliğine yeniden anlam verdin.\n\nBunlar küçük şeyler değil. Çoğu insan bu yolun yarısında durur. Sen bütününü yaptın.\n\nŞimdi yapacağın: 30 günü kapatmak değil, 31. günü başlatmak. Uygulamayı kullanmaya devam et. Streak'i sürdür. Modülleri tekrar ziyaret et. Bir kişiye anlat. Ve günde bir kez, yüksek sesle: “Bugün oynamıyorum. Yarın yine bir karar.”\n\nİyi yola.",
    reflection: "Bu 30 günde değişen en önemli şey ne oldu — içsel ya da dışsal?",
    action: "Bugün bir kişiye — sevdiğin birine — bu 30 günü atlattığını söyle.",
    durationMin: 5,
    phase: "future",
  },
];

export function getDay(day: number): CurriculumDay | undefined {
  return RECOVERY_DAYS.find((d) => d.day === day);
}

export const TOTAL_DAYS = RECOVERY_DAYS.length;

export const PHASE_LABELS: Record<CurriculumDay["phase"], { label: string; color: string }> = {
  foundation: { label: "Temel", color: "#3EC9E8" },
  awareness: { label: "Farkındalık", color: "#F59E0B" },
  skills: { label: "Beceriler", color: "#34D399" },
  identity: { label: "Kimlik", color: "#B580FF" },
  future: { label: "Gelecek", color: "#FF6F9C" },
};
