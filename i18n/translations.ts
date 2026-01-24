export type Language = "tr";

export interface Translations {
  // Onboarding Ekranı
  tagline: string;
  taglineToolbox: string;
  continue: string;
  
  // Ana Sayfa Ekranı
  welcomeBack: string;
  gambleFree: string;
  days: string;
  
  // Kartlar
  therapy: string;
  therapySubtitle: string;
  mindfulness: string;
  mindfulnessSubtitle: string;
  sos: string;
  sosSubtitle: string;
  progress: string;
  progressSubtitle: string;
  support: string;
  supportSubtitle: string;
  diary: string;
  diarySubtitle: string;
  smsFilter: string;
  smsFilterSubtitle: string;
  
  // Hoş Geldiniz Modali
  welcomeToAntislot: string;
  welcomeDescription: string;
  next: string;
  
  // Devam Ekranı
  back: string;
  createAccount: string;
  username: string;
  age: string;
  gender: string;
  ethnicity: string;
  countryState: string;
  howDidYouFindUs: string;
  confirmInfo: string;
  
  // Sekmeler
  home: string;
  explore: string;
  premium: string;
  ai: string;
  
}

export const translations: Record<Language, Translations> = {
  tr: {
    // Onboarding Ekranı
    tagline: "KONTROLÜ GERİ ALMANIZ İÇİN",
    taglineToolbox: "ARAÇ KUTUNUZ",
    continue: "Devam Et",
    
    // Ana Sayfa Ekranı
    welcomeBack: "TEKRAR HOŞ GELDİNİZ",
    gambleFree: "Kumardan Uzak",
    days: "GÜN",
    
    // Kartlar
    therapy: "Terapi",
    therapySubtitle: "Seanslar",
    mindfulness: "Farkındalık",
    mindfulnessSubtitle: "Seanslar",
    sos: "SOS",
    sosSubtitle: "Acil yardım",
    progress: "İlerleme",
    progressSubtitle: "Şimdi incele",
    support: "Destek",
    supportSubtitle: "Yardım bir dokunuş uzakta",
    diary: "Günlük",
    diarySubtitle: "Özel Günlüğünüz",
    smsFilter: "SMS Filtresi",
    smsFilterSubtitle: "Spam Mesajları Engelle",
    
    // Hoş Geldiniz Modali
    welcomeToAntislot: "ANTISLOT'A HOŞ GELDİNİZ",
    welcomeDescription: "Lütfen ilerleme takibi için hesabınızı tamamlayın.",
    next: "İleri",
    
    // Devam Ekranı
    back: "Geri",
    createAccount: "HESABINIZI TAMAMLAYIN",
    username: "Kullanıcı Adı",
    age: "Yaşınız",
    gender: "Cinsiyet",
    ethnicity: "Etnik Köken",
    countryState: "Ülke/Şehir",
    howDidYouFindUs: "Bizi nasıl buldunuz?",
    confirmInfo: "Bilgileri Onayla",
    
    // Sekmeler
    home: "Ana Sayfa",
    explore: "Keşfet",
    premium: "Premium",
    ai: "AI",
  }
};
