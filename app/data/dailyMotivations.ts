import type { Language } from "@/i18n/translations";

export type MotivationStage = "start" | "early" | "week" | "month" | "deep" | "veteran";

export type DailyMotivation = {
  headline: string;
  message: string;
};

type MotivationPools = Record<MotivationStage, DailyMotivation[]>;

const TR_POOLS: MotivationPools = {
  start: [
    { headline: "Bugun yeni bir baslangic", message: "Ilk adimi attin. 10 dakika bile cok degerli." },
    { headline: "Ilk gun her sey gibi zordur", message: "Buradayiz. Sadece bugunu dusun - yarin yarin gelir." },
    { headline: "Karar bir andir", message: "Bugun verdigin karar yarinki seni hazirliyor." },
  ],
  early: [
    { headline: "{days}. gun - ivme yakalaniyor", message: "Kucuk zaferler birikiyor. Bugune bir nefes daha ekle." },
    { headline: "{days} gun - beyin uyum sagliyor", message: "Durtu dalgalari gelebilir; her dalga gecicidir." },
  ],
  week: [
    { headline: "Streak buyuyor", message: "{days} gun arkanda. Bedenin ve zihnin tesekkur ediyor." },
    { headline: "Bir hafta sinirini gectin", message: "Her gun tekrar secim yapman asil gucun." },
  ],
  month: [
    { headline: "Yeni aliskanlik sekilleniyor", message: "{days} gunu gectin. Beyin yollari yeniden yaziliyor." },
    { headline: "{days} gun - kim oldugun degisti", message: "Artik denemek degil, devam etmek asamasindasin." },
  ],
  deep: [
    { headline: "Toparlanmanin derin evresi", message: "{days} gun - ilerlemeni koru, bu noktaya gelen az insan var." },
  ],
  veteran: [
    { headline: "{days} gun - gercek degisim", message: "Bahis dusuncesi artik zayif bir misafir. Sen ev sahibisin." },
  ],
};

const EN_POOLS: MotivationPools = {
  start: [
    { headline: "Today is a fresh start", message: "You took the first step. Even 10 minutes matters." },
    { headline: "Day one is hard for everyone", message: "You are not alone. Focus only on today." },
    { headline: "A decision is a moment", message: "Your choice today prepares who you are tomorrow." },
  ],
  early: [
    { headline: "Day {days} - momentum is building", message: "Small wins are stacking up. Add one more safe breath today." },
    { headline: "{days} days - your brain is adapting", message: "Urge waves can come, but every wave passes." },
  ],
  week: [
    { headline: "Your streak is growing", message: "{days} days behind you. Your body and mind are recovering." },
    { headline: "You passed the first-week wall", message: "The real power is choosing again each day." },
  ],
  month: [
    { headline: "A new habit is forming", message: "You passed {days} days. Your recovery pathways are getting stronger." },
    { headline: "{days} days - your identity is shifting", message: "This is no longer trying. This is continuing." },
  ],
  deep: [
    { headline: "Deep recovery phase", message: "{days} days - protect the progress you fought for." },
  ],
  veteran: [
    { headline: "{days} days - real change", message: "The gambling thought is now a weak visitor, not the owner." },
  ],
};

const DE_POOLS: MotivationPools = {
  start: [
    { headline: "Heute ist ein neuer Start", message: "Du hast den ersten Schritt gemacht. Selbst 10 Minuten zahlen." },
    { headline: "Tag eins ist fur alle schwer", message: "Du bist nicht allein. Fokus nur auf heute." },
    { headline: "Eine Entscheidung ist ein Moment", message: "Deine Wahl heute bereitet dein Morgen vor." },
  ],
  early: [
    { headline: "Tag {days} - der Schwung baut sich auf", message: "Kleine Siege summieren sich. Noch ein ruhiger Atemzug heute." },
    { headline: "{days} Tage - dein Gehirn passt sich an", message: "Drangwellen kommen, aber jede Welle geht vorbei." },
  ],
  week: [
    { headline: "Deine Serie wachst", message: "{days} Tage liegen hinter dir. Korper und Geist erholen sich." },
    { headline: "Du hast die erste Woche geknackt", message: "Wahre Kraft ist, jeden Tag neu zu wahlen." },
  ],
  month: [
    { headline: "Eine neue Gewohnheit entsteht", message: "Du hast {days} Tage geschafft. Deine Erholung wird starker." },
    { headline: "{days} Tage - deine Identitat verandert sich", message: "Das ist nicht mehr nur versuchen. Das ist weitermachen." },
  ],
  deep: [
    { headline: "Tiefe Erholungsphase", message: "{days} Tage - schutze den Fortschritt, den du dir erarbeitet hast." },
  ],
  veteran: [
    { headline: "{days} Tage - echte Veranderung", message: "Der Spielgedanke ist nur noch ein schwacher Gast, nicht der Besitzer." },
  ],
};

const FR_POOLS: MotivationPools = {
  start: [
    { headline: "Aujourd'hui, nouveau depart", message: "Tu as fait le premier pas. Meme 10 minutes comptent." },
    { headline: "Le premier jour est difficile pour tous", message: "Tu n'es pas seul. Concentre-toi sur aujourd'hui." },
    { headline: "Une decision est un instant", message: "Ton choix d'aujourd'hui prepare la personne de demain." },
  ],
  early: [
    { headline: "Jour {days} - l'elan grandit", message: "Les petites victoires s'accumulent. Ajoute une respiration de plus." },
    { headline: "{days} jours - ton cerveau s'adapte", message: "Les vagues d'envie viennent, mais chacune passe." },
  ],
  week: [
    { headline: "Ta serie grandit", message: "{days} jours derriere toi. Ton corps et ton esprit recuperent." },
    { headline: "Tu as passe le mur de la premiere semaine", message: "La vraie force, c'est de rechoisir chaque jour." },
  ],
  month: [
    { headline: "Une nouvelle habitude se forme", message: "Tu as passe {days} jours. Tes circuits de recuperation se renforcent." },
    { headline: "{days} jours - ton identite evolue", message: "Ce n'est plus essayer. C'est continuer." },
  ],
  deep: [
    { headline: "Phase de recuperation profonde", message: "{days} jours - protege le progres pour lequel tu t'es battu." },
  ],
  veteran: [
    { headline: "{days} jours - vrai changement", message: "La pensee du jeu n'est plus qu'une visiteuse faible." },
  ],
};

const ES_POOLS: MotivationPools = {
  start: [
    { headline: "Hoy es un nuevo comienzo", message: "Diste el primer paso. Incluso 10 minutos cuentan." },
    { headline: "El dia uno es dificil para todos", message: "No estas solo. Enfocate solo en hoy." },
    { headline: "Una decision es un instante", message: "Tu eleccion de hoy prepara tu version de manana." },
  ],
  early: [
    { headline: "Dia {days} - el impulso crece", message: "Las pequenas victorias se acumulan. Suma una respiracion mas." },
    { headline: "{days} dias - tu cerebro se adapta", message: "Pueden venir olas de impulso, pero siempre pasan." },
  ],
  week: [
    { headline: "Tu racha crece", message: "{days} dias detras de ti. Tu cuerpo y mente se recuperan." },
    { headline: "Superaste la barrera de la primera semana", message: "El poder real es volver a elegir cada dia." },
  ],
  month: [
    { headline: "Se forma un nuevo habito", message: "Superaste {days} dias. Tus rutas de recuperacion se fortalecen." },
    { headline: "{days} dias - tu identidad cambia", message: "Ya no es intentarlo. Es continuar." },
  ],
  deep: [
    { headline: "Fase de recuperacion profunda", message: "{days} dias - protege el progreso que tanto costo." },
  ],
  veteran: [
    { headline: "{days} dias - cambio real", message: "La idea de apostar ahora es una visita debil, no el dueno." },
  ],
};

const IT_POOLS: MotivationPools = {
  start: [
    { headline: "Oggi e un nuovo inizio", message: "Hai fatto il primo passo. Anche 10 minuti contano." },
    { headline: "Il primo giorno e difficile per tutti", message: "Non sei solo. Concentrati solo su oggi." },
    { headline: "Una decisione e un momento", message: "La scelta di oggi prepara la persona che sarai domani." },
  ],
  early: [
    { headline: "Giorno {days} - lo slancio cresce", message: "Le piccole vittorie si sommano. Aggiungi un respiro sicuro." },
    { headline: "{days} giorni - il cervello si adatta", message: "Le ondate di impulso arrivano, ma ogni ondata passa." },
  ],
  week: [
    { headline: "La tua serie cresce", message: "{days} giorni alle spalle. Corpo e mente stanno recuperando." },
    { headline: "Hai superato il muro della prima settimana", message: "La vera forza e scegliere di nuovo ogni giorno." },
  ],
  month: [
    { headline: "Si forma una nuova abitudine", message: "Hai superato {days} giorni. I percorsi di recupero si rafforzano." },
    { headline: "{days} giorni - la tua identita cambia", message: "Non e piu provare. E continuare." },
  ],
  deep: [
    { headline: "Fase di recupero profondo", message: "{days} giorni - proteggi il progresso che hai conquistato." },
  ],
  veteran: [
    { headline: "{days} giorni - vero cambiamento", message: "Il pensiero del gioco ora e un ospite debole, non il padrone." },
  ],
};

const PT_POOLS: MotivationPools = {
  start: [
    { headline: "Hoje e um novo comeco", message: "Deste o primeiro passo. Ate 10 minutos contam." },
    { headline: "O primeiro dia e dificil para todos", message: "Nao estas sozinho. Foca-te apenas em hoje." },
    { headline: "Uma decisao e um momento", message: "A tua escolha de hoje prepara quem seras amanha." },
  ],
  early: [
    { headline: "Dia {days} - o embalo cresce", message: "Pequenas vitorias acumulam. Soma mais uma respiracao segura." },
    { headline: "{days} dias - o teu cerebro adapta-se", message: "As ondas de impulso podem vir, mas passam sempre." },
  ],
  week: [
    { headline: "A tua serie cresce", message: "{days} dias para tras. Corpo e mente estao a recuperar." },
    { headline: "Passaste o muro da primeira semana", message: "O verdadeiro poder e escolher de novo todos os dias." },
  ],
  month: [
    { headline: "Forma-se um novo habito", message: "Passaste {days} dias. As rotas de recuperacao estao mais fortes." },
    { headline: "{days} dias - a tua identidade muda", message: "Isto ja nao e tentar. E continuar." },
  ],
  deep: [
    { headline: "Fase de recuperacao profunda", message: "{days} dias - protege o progresso que conquistaste." },
  ],
  veteran: [
    { headline: "{days} dias - mudanca real", message: "O pensamento do jogo e agora um visitante fraco, nao o dono." },
  ],
};

const FIL_POOLS: MotivationPools = {
  start: [
    { headline: "Bagong simula ngayon", message: "Nagawa mo ang unang hakbang. Kahit 10 minuto mahalaga." },
    { headline: "Mahirap ang unang araw para sa lahat", message: "Hindi ka nag-iisa. Tumutok lang sa ngayon." },
    { headline: "Sandali ang desisyon", message: "Ang desisyon mo ngayon ang naghahanda sa bukas mo." },
  ],
  early: [
    { headline: "Araw {days} - lumalakas ang momentum", message: "Naiipon ang maliliit na panalo. Isang mahinahong hinga pa." },
    { headline: "{days} araw - umaangkop ang utak mo", message: "Dumarating ang alon ng urge, pero lumilipas din." },
  ],
  week: [
    { headline: "Lumalaki ang streak mo", message: "{days} araw na ang nalampasan mo. Gumagaling ang isip at katawan." },
    { headline: "Nalampasan mo ang unang linggo", message: "Ang totoong lakas ay muling pumili araw-araw." },
  ],
  month: [
    { headline: "Nabubuo ang bagong ugali", message: "Nalampasan mo ang {days} araw. Lumalakas ang recovery pathways mo." },
    { headline: "{days} araw - nagbabago ang identidad mo", message: "Hindi na ito simpleng pagsubok. Ito ay pagpapatuloy." },
  ],
  deep: [
    { headline: "Malalim na yugto ng pagbangon", message: "{days} araw - ingatan ang pinaghirapang progreso." },
  ],
  veteran: [
    { headline: "{days} araw - tunay na pagbabago", message: "Mahinang bisita na lang ang sugal na isipin, hindi na may-ari." },
  ],
};

const ID_POOLS: MotivationPools = {
  start: [
    { headline: "Hari ini adalah awal baru", message: "Kamu mengambil langkah pertama. Bahkan 10 menit itu berarti." },
    { headline: "Hari pertama sulit bagi semua orang", message: "Kamu tidak sendirian. Fokus pada hari ini saja." },
    { headline: "Keputusan adalah momen", message: "Pilihanmu hari ini menyiapkan dirimu untuk besok." },
  ],
  early: [
    { headline: "Hari {days} - momentum bertumbuh", message: "Kemenangan kecil menumpuk. Tambah satu napas aman lagi." },
    { headline: "{days} hari - otakmu beradaptasi", message: "Gelombang dorongan bisa datang, tapi semua gelombang berlalu." },
  ],
  week: [
    { headline: "Rangkaiamu terus tumbuh", message: "{days} hari di belakangmu. Tubuh dan pikiranmu pulih." },
    { headline: "Kamu melewati tembok minggu pertama", message: "Kekuatan sejati adalah memilih lagi setiap hari." },
  ],
  month: [
    { headline: "Kebiasaan baru sedang terbentuk", message: "Kamu melewati {days} hari. Jalur pemulihanmu makin kuat." },
    { headline: "{days} hari - identitasmu bergeser", message: "Ini bukan sekadar mencoba. Ini adalah melanjutkan." },
  ],
  deep: [
    { headline: "Fase pemulihan mendalam", message: "{days} hari - jaga kemajuan yang kamu perjuangkan." },
  ],
  veteran: [
    { headline: "{days} hari - perubahan nyata", message: "Pikiran berjudi kini hanya tamu lemah, bukan pemilik." },
  ],
};

const AR_POOLS: MotivationPools = {
  start: [{ headline: "Al-yawm bidaya jadida", message: "Khatawt al-khutwa al-ula. Hatta 10 daqaiq muhimma." }],
  early: [{ headline: "Yawm {days} - al-zakhm yazdad", message: "Al-intisarat al-saghira tatajamma. Zid nafasan hadian alyawm." }],
  week: [{ headline: "Silsilatuk takbar", message: "{days} ayyam khalfak. Jasaduk wa dhihnuk yataafayan." }],
  month: [{ headline: "Ada jadida tatashakkal", message: "Tajawazta {days} ayyam. Masarat al-taafi tastamirr fi al-quwwa." }],
  deep: [{ headline: "Marhala taafi amiq", message: "{days} ayyam - ihfaz altaqaddum alladhi kasabta." }],
  veteran: [{ headline: "{days} ayyam - taghyir haqiqi", message: "Fikrat al-qimar asbahat daifan zairan la sahib al-bayt." }],
};

const RU_POOLS: MotivationPools = {
  start: [{ headline: "Segodnya novyy start", message: "Ty sdelal pervyy shag. Dazhe 10 minut imeyut znachenie." }],
  early: [{ headline: "Den {days} - nabor impulsa", message: "Malenkie pobedy nakaplivayutsya. Dobav eshche odin spokojnyy vdoh." }],
  week: [{ headline: "Tvoya seriya rastet", message: "{days} dney pozadi. Telo i razum vosstanavlivayutsya." }],
  month: [{ headline: "Formiruetsya novaya privychka", message: "Ty proshel {days} dney. Puti vosstanovleniya ukreplyayutsya." }],
  deep: [{ headline: "Glubokaya faza vosstanovleniya", message: "{days} dney - beregi progress, za kotoryy ty borolsya." }],
  veteran: [{ headline: "{days} dney - realnye peremeny", message: "Mysl o stavke teper slabyy gost, a ne hozyain." }],
};

const SV_POOLS: MotivationPools = {
  start: [{ headline: "I dag ar en ny start", message: "Du tog forsta steget. Till och med 10 minuter raknas." }],
  early: [{ headline: "Dag {days} - momentum vaxer", message: "Sma segrar staplas. Lagg till ett lugnt andetag till i dag." }],
  week: [{ headline: "Din streak vaxer", message: "{days} dagar bakom dig. Kropp och sinne aterhamtar sig." }],
  month: [{ headline: "En ny vana formas", message: "Du har passerat {days} dagar. Dina aterhamtningsbanor blir starkare." }],
  deep: [{ headline: "Djup aterhamtningsfas", message: "{days} dagar - skydda framstegen du har kampat for." }],
  veteran: [{ headline: "{days} dagar - verklig forandring", message: "Speltanken ar nu en svag gast, inte agaren." }],
};

const FI_POOLS: MotivationPools = {
  start: [{ headline: "Tanaan on uusi alku", message: "Otit ensimmaisen askeleen. Jopa 10 minuuttia merkitsee." }],
  early: [{ headline: "Paiva {days} - vauhti kasvaa", message: "Pienet voitot kasaantuvat. Lisaa tanaan yksi rauhallinen hengitys." }],
  week: [{ headline: "Putkesi kasvaa", message: "{days} paivaa takana. Keho ja mieli palautuvat." }],
  month: [{ headline: "Uusi tapa muotoutuu", message: "Olet ylittanyt {days} paivaa. Toipumisen polut vahvistuvat." }],
  deep: [{ headline: "Syva toipumisvaihe", message: "{days} paivaa - suojele edistysta, jonka eteen taistelit." }],
  veteran: [{ headline: "{days} paivaa - todellinen muutos", message: "Pelaamisajatus on nyt heikko vieras, ei omistaja." }],
};

const NL_POOLS: MotivationPools = {
  start: [{ headline: "Vandaag is een nieuwe start", message: "Je hebt de eerste stap gezet. Zelfs 10 minuten telt." }],
  early: [{ headline: "Dag {days} - momentum groeit", message: "Kleine overwinningen stapelen op. Voeg nog een rustige adem toe." }],
  week: [{ headline: "Je reeks groeit", message: "{days} dagen achter je. Lichaam en geest herstellen." }],
  month: [{ headline: "Een nieuwe gewoonte vormt", message: "Je bent voorbij {days} dagen. Je herstelpaden worden sterker." }],
  deep: [{ headline: "Diepe herstelfase", message: "{days} dagen - bescherm de vooruitgang waar je voor vocht." }],
  veteran: [{ headline: "{days} dagen - echte verandering", message: "De gokgedachte is nu een zwakke bezoeker, niet de eigenaar." }],
};

const JA_POOLS: MotivationPools = {
  start: [{ headline: "Kyo wa atarashii sutato", message: "Saisho no ippo o fumidashita. 10 pun demo imi ga aru." }],
  early: [{ headline: "{days} nichi - ikioi ga tsuku", message: "Chiisana shori ga kasanaru. Kyo mo mou hitotsu anzen na kokyu." }],
  week: [{ headline: "Sutoriiku ga nobiteiru", message: "{days} nichi no jisseki. Karada to kokoro ga kaifuku shiteiru." }],
  month: [{ headline: "Atarashii shukan ga dekiteiku", message: "{days} nichi o koeta. Kaifuku no michi ga tsuyoku naru." }],
  deep: [{ headline: "Fukai kaifuku feizu", message: "{days} nichi - tsukami totta zenshin o mamorou." }],
  veteran: [{ headline: "{days} nichi - hontou no henka", message: "Gyanburu no kangae wa ima wa yowai kyaku, shujin janai." }],
};

const TH_POOLS: MotivationPools = {
  start: [{ headline: "Wan ni khue kan roem ton mai", message: "Khun dai roem ton laeo. Mae tae 10 nathi ko samkhan." }],
  early: [{ headline: "Wan thi {days} - momentum kamlang ma", message: "Chai cha na lek lek kamlang sabsom. Perm lomhai chai yen ik neung khrang." }],
  week: [{ headline: "Streak khong khun kamlang to", message: "{days} wan phan ma laeo. Rangkai lae jai kamlang fuen tua." }],
  month: [{ headline: "Nisai mai kamlang kot tua", message: "Khun phan {days} wan ma laeo. Sen thang fuen fu khaeng raeng khuen." }],
  deep: [{ headline: "Chuangkan fuen fu hlub", message: "{days} wan - raksa khwam kaona thi khun su ma." }],
  veteran: [{ headline: "{days} wan - kan plianplaeng jing", message: "Khwam kid rueang phanan klai pen phiang khaek thi on ae." }],
};

const HI_POOLS: MotivationPools = {
  start: [{ headline: "Aaj ek nayi shuruaat hai", message: "Tumne pehla kadam uthaya. 10 minute bhi maayne rakhte hain." }],
  early: [{ headline: "Din {days} - gati badh rahi hai", message: "Chhoti jeet jud rahi hain. Aaj ek aur shaant saans lo." }],
  week: [{ headline: "Tumhari streak badh rahi hai", message: "{days} din tumhare peeche hain. Sharir aur man sambhal rahe hain." }],
  month: [{ headline: "Nayi aadat ban rahi hai", message: "Tum {days} din paar kar chuke ho. Recovery pathways mazboot ho rahe hain." }],
  deep: [{ headline: "Gehri recovery ka charan", message: "{days} din - jis pragati ke liye lade ho use bachao." }],
  veteran: [{ headline: "{days} din - asli badlav", message: "Jua ka khayal ab ek kamzor mehman hai, malik nahi." }],
};

const KM_POOLS: MotivationPools = {
  start: [{ headline: "Thngai nih chea kar phtoeum thmei", message: "Nek ban phtoeum jomnoat dambong. Sombae tae 10 neati ko mean neakney." }],
  early: [{ headline: "Thngai {days} - kamlang kompong kaen", message: "Chumnos chheh toch toch kompong ruom pel. Banthaem damnaum lomhae sat sat muy tiet." }],
  week: [{ headline: "Streak robos nek kompong thom", message: "{days} thngai ban phan. Kluon ning chet kompong taast." }],
  month: [{ headline: "Tamlap thmei kompong kaet", message: "Nek ban phan {days} thngai. Phlov taast kompong kaen khlang laeung." }],
  deep: [{ headline: "Vea taast jrau", message: "{days} thngai - karpea pheap kaona del nek ban toas." }],
  veteran: [{ headline: "{days} thngai - kar braeproul pit prakat", message: "Kamnit liab laeng leang kompong klai chea khaek khsaoy." }],
};

const EL_POOLS: MotivationPools = {
  start: [{ headline: "Simera einai mia nea arhi", message: "Ekane to proto vima. Akoma kai 10 lepta metran." }],
  early: [{ headline: "Mera {days} - to momentum megalonei", message: "Mikres nikes sistorevontai. Vale ena akoma ithiko anasa simera." }],
  week: [{ headline: "To streak sou megalonei", message: "{days} imeres piso sou. Soma kai myalo anarronoun." }],
  month: [{ headline: "Mia nea synitheia dimiourgeitai", message: "Perases tis {days} imeres. Oi diadromes anarrwsis dynatonoun." }],
  deep: [{ headline: "Vathia fasi anarrwsis", message: "{days} imeres - prostatepse tin proodo pou kerdises." }],
  veteran: [{ headline: "{days} imeres - pragmatiki allagi", message: "I skepsi tou tzogou einai pleon enas adynamos episkeptis." }],
};

const POOLS_BY_LANGUAGE: Record<Language, MotivationPools> = {
  tr: TR_POOLS,
  en: EN_POOLS,
  de: DE_POOLS,
  fr: FR_POOLS,
  es: ES_POOLS,
  it: IT_POOLS,
  pt: PT_POOLS,
  ar: AR_POOLS,
  ru: RU_POOLS,
  fil: FIL_POOLS,
  sv: SV_POOLS,
  fi: FI_POOLS,
  nl: NL_POOLS,
  ja: JA_POOLS,
  id: ID_POOLS,
  th: TH_POOLS,
  hi: HI_POOLS,
  km: KM_POOLS,
  el: EL_POOLS,
};

POOLS_BY_LANGUAGE.ar = {
  start: [{ headline: "اليوم بداية جديدة", message: "لقد اتخذت الخطوة الأولى. حتى 10 دقائق مهمة." }],
  early: [{ headline: "اليوم {days} - الزخم يتصاعد", message: "الانتصارات الصغيرة تتراكم. أضف نفسًا هادئًا آخر اليوم." }],
  week: [{ headline: "سلسلتك تكبر", message: "{days} أيام خلفك. جسدك وعقلك يتعافيان." }],
  month: [{ headline: "عادة جديدة تتشكل", message: "تجاوزت {days} أيام. مسارات التعافي لديك تزداد قوة." }],
  deep: [{ headline: "مرحلة تعافٍ عميقة", message: "{days} أيام - حافظ على التقدم الذي قاتلت من أجله." }],
  veteran: [{ headline: "{days} أيام - تغيير حقيقي", message: "فكرة المقامرة أصبحت الآن زائرًا ضعيفًا، وليست صاحب البيت." }],
};

POOLS_BY_LANGUAGE.ru = {
  start: [{ headline: "Сегодня новый старт", message: "Ты сделал первый шаг. Даже 10 минут имеют значение." }],
  early: [{ headline: "День {days} - импульс растет", message: "Маленькие победы накапливаются. Добавь еще один спокойный вдох." }],
  week: [{ headline: "Твоя серия растет", message: "{days} дней позади. Тело и разум восстанавливаются." }],
  month: [{ headline: "Формируется новая привычка", message: "Ты прошел {days} дней. Пути восстановления становятся сильнее." }],
  deep: [{ headline: "Глубокая фаза восстановления", message: "{days} дней - береги прогресс, за который ты боролся." }],
  veteran: [{ headline: "{days} дней - реальные перемены", message: "Мысль об игре теперь слабый гость, а не хозяин." }],
};

POOLS_BY_LANGUAGE.ja = {
  start: [{ headline: "今日は新しいスタート", message: "最初の一歩を踏み出した。10分でも価値がある。" }],
  early: [{ headline: "{days}日目 - 勢いが育つ", message: "小さな勝利が積み重なる。今日ももう一つ深呼吸を。" }],
  week: [{ headline: "あなたの連続記録は伸びている", message: "{days}日を積み上げた。心と体は回復している。" }],
  month: [{ headline: "新しい習慣が形になる", message: "{days}日を超えた。回復の回路はさらに強くなる。" }],
  deep: [{ headline: "深い回復フェーズ", message: "{days}日 - 勝ち取った前進を守ろう。" }],
  veteran: [{ headline: "{days}日 - 本当の変化", message: "ギャンブルの思考は今や弱い来客で、主人ではない。" }],
};

POOLS_BY_LANGUAGE.th = {
  start: [{ headline: "วันนี้คือการเริ่มต้นใหม่", message: "คุณก้าวก้าวแรกแล้ว แม้แค่ 10 นาทีก็มีความหมาย" }],
  early: [{ headline: "วันที่ {days} - แรงส่งกำลังมา", message: "ชัยชนะเล็กๆ กำลังสะสม เพิ่มลมหายใจสงบอีกหนึ่งครั้ง" }],
  week: [{ headline: "สตรีคของคุณกำลังเติบโต", message: "{days} วันที่ผ่านมา ร่างกายและใจคุณกำลังฟื้นตัว" }],
  month: [{ headline: "นิสัยใหม่กำลังก่อตัว", message: "คุณผ่านมา {days} วันแล้ว เส้นทางการฟื้นตัวแข็งแรงขึ้น" }],
  deep: [{ headline: "ช่วงฟื้นตัวเชิงลึก", message: "{days} วัน - ปกป้องความก้าวหน้าที่คุณต่อสู้มา" }],
  veteran: [{ headline: "{days} วัน - การเปลี่ยนแปลงจริง", message: "ความคิดเรื่องพนันตอนนี้เป็นเพียงแขกที่อ่อนแรง ไม่ใช่เจ้าของบ้าน" }],
};

POOLS_BY_LANGUAGE.hi = {
  start: [{ headline: "आज एक नई शुरुआत है", message: "तुमने पहला कदम उठाया। 10 मिनट भी मायने रखते हैं।" }],
  early: [{ headline: "दिन {days} - रफ्तार बन रही है", message: "छोटी जीतें जुड़ रही हैं। आज एक और शांत सांस लो।" }],
  week: [{ headline: "तुम्हारी स्ट्रीक बढ़ रही है", message: "{days} दिन पीछे हैं। शरीर और मन संभल रहे हैं।" }],
  month: [{ headline: "नई आदत बन रही है", message: "तुम {days} दिन पार कर चुके हो। रिकवरी के रास्ते मजबूत हो रहे हैं।" }],
  deep: [{ headline: "गहरी रिकवरी का चरण", message: "{days} दिन - जिस प्रगति के लिए लड़े हो, उसे बचाओ।" }],
  veteran: [{ headline: "{days} दिन - असली बदलाव", message: "जुए का विचार अब एक कमजोर मेहमान है, मालिक नहीं।" }],
};

POOLS_BY_LANGUAGE.km = {
  start: [{ headline: "ថ្ងៃនេះជាការចាប់ផ្តើមថ្មី", message: "អ្នកបានចាប់ផ្តើមជំហានដំបូង។ សូម្បីតែ 10 នាទីក៏មានន័យ។" }],
  early: [{ headline: "ថ្ងៃទី {days} - កម្លាំងកំពុងកើន", message: "ជ័យជម្នះតូចៗកំពុងបន្ថែម។ បន្ថែមដង្ហើមស្ងប់មួយទៀតថ្ងៃនេះ។" }],
  week: [{ headline: "ស៊េរីរបស់អ្នកកំពុងធំឡើង", message: "{days} ថ្ងៃនៅពីក្រោយអ្នក។ ខ្លួននិងចិត្តកំពុងស្ដារឡើងវិញ។" }],
  month: [{ headline: "ទម្លាប់ថ្មីកំពុងកើតឡើង", message: "អ្នកបានឆ្លង {days} ថ្ងៃ។ ផ្លូវស្ដារឡើងវិញកំពុងរឹងមាំឡើង។" }],
  deep: [{ headline: "ដំណាក់កាលស្ដារយ៉ាងជ្រៅ", message: "{days} ថ្ងៃ - ការពារការរីកចម្រើនដែលអ្នកបានខិតខំរក។" }],
  veteran: [{ headline: "{days} ថ្ងៃ - ការផ្លាស់ប្តូរពិត", message: "គំនិតល្បែងឥឡូវគ្រាន់តែជាភ្ញៀវខ្សោយ មិនមែនជាម្ចាស់ទេ។" }],
};

POOLS_BY_LANGUAGE.el = {
  start: [{ headline: "Σήμερα είναι μια νέα αρχή", message: "Έκανες το πρώτο βήμα. Ακόμα και 10 λεπτά μετρούν." }],
  early: [{ headline: "Ημέρα {days} - η ώθηση μεγαλώνει", message: "Οι μικρές νίκες συσσωρεύονται. Πάρε άλλη μία ήρεμη ανάσα σήμερα." }],
  week: [{ headline: "Το streak σου μεγαλώνει", message: "{days} ημέρες πίσω σου. Σώμα και μυαλό αναρρώνουν." }],
  month: [{ headline: "Μια νέα συνήθεια χτίζεται", message: "Πέρασες τις {days} ημέρες. Τα μονοπάτια ανάρρωσης δυναμώνουν." }],
  deep: [{ headline: "Βαθιά φάση ανάρρωσης", message: "{days} ημέρες - προστάτεψε την πρόοδο που κέρδισες." }],
  veteran: [{ headline: "{days} ημέρες - πραγματική αλλαγή", message: "Η σκέψη του τζόγου είναι πλέον αδύναμος επισκέπτης, όχι ο ιδιοκτήτης." }],
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

const interpolate = (text: string, days: number) => text.replaceAll("{days}", String(days));

export function pickDailyMotivation(
  days: number,
  now: Date = new Date(),
  locale: Language = "tr"
): DailyMotivation {
  const stage = stageFor(days);
  const pools = POOLS_BY_LANGUAGE[locale] ?? EN_POOLS;
  const list = pools[stage];
  const index = dayOfYear(now) % list.length;
  const item = list[index];
  return {
    headline: interpolate(item.headline, days),
    message: interpolate(item.message, days),
  };
}
