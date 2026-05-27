/**
 * Keyword lexicons used by the SMS classifier.
 *
 * Two roles:
 *   1. SIGNAL — gambling / scam / political / promotion lists push a message
 *      toward Junk or Promotion.
 *   2. SHIELD — the TRANSACTION list (bank, cargo, OTP, e-government, health)
 *      pulls a message *back* to inbox even if other signals trigger. This is
 *      the safety net that prevents us from junking a real OTP just because
 *      it happens to contain a URL or a money amount.
 *
 * Add to the Turkish lists liberally — most user-facing SMS in this market is
 * Turkish, and the English entries mostly catch international spam runs.
 */

export const GAMBLING_KEYWORDS = {
  turkish: [
    'bahis', 'casino', 'slot', 'kupon', 'oran', 'kazan', 'bedava', 'bonus',
    'poker', 'blackjack', 'rulet', 'canlı bahis', 'spor bahis', 'iddaa',
    'toto', 'bets10', 'betboo', 'nesine', 'misli', 'süperbahis',
    'yatırım fırsatı', 'garanti kazanç', 'linke tıkla', 'hemen üye ol',
    'kampanya', 'promosyon', 'ücretsiz dönüş', 'hoşgeldin bonusu',
    'ilk üyelik bonusu', 'kayıp bonusu', 'canlı casino', 'casino oyunları',
    'slot makineleri', 'jackpot', 'büyük ödül', 'çekiliş', 'kazandır',
    'çevrimsiz bonus', 'anında para yatır', 'hızlı çekim', 'sanal bahis',
    'yasa dışı bahis', 'bahis sitesi', 'deneme bonusu', 'freeroll',
    'turnuva', 'kampanya kodu', 'vip', 'cashback', 'risksiz bahis',
    'freebet', 'mariobet', 'tipobet', 'matbet', 'sahabet', 'kralbet',
    'tarafbet', 'youwin', 'bahsegel', 'jojobet',
  ],
  english: [
    'bet', 'betting', 'casino', 'slot', 'poker', 'gambling', 'jackpot',
    'bonus', 'free spin', 'deposit', 'withdraw', 'odds', 'wager', 'stake',
    'betting site', 'online casino', 'live betting', 'sportsbook',
    'sports betting', 'bookmaker', 'bonus code', 'cashback', 'freebet',
    'odds boost', 'bet slip', 'parlay', 'accumulator', 'wagering site',
  ],
};

export const SCAM_KEYWORDS = {
  turkish: [
    'hesabınız donduruldu', 'hesabınız askıya alındı', 'güvenlik uyarısı',
    'hesabınıza erişim denemesi', 'şifrenizi güncelleyin',
    'kimlik doğrulama gerekli', 'kartınız kapatılacak', 'borcunuz var',
    'hızlı para kazan', 'kolay para', 'garanti gelir', 'yatırım fırsatı',
    'dolandırıcılık uyarısı', 'hesabınız hacklendi', 'acil işlem yapın',
    'acil doğrulama', 'kimlik onayı', 'hesap güvenliği',
    'kargonuz teslim edilemedi', 'gümrük ücreti', 'kargo bedeli',
    'paranızı kaybedeceksiniz', 'son ihtar', 'icra takibi başlatılacak',
    'sgk ödemeniz', 'vergi borcu',
  ],
  english: [
    'account suspended', 'account frozen', 'security alert',
    'verify your account', 'update password', 'identity verification',
    'card blocked', 'debt collection', 'easy money', 'guaranteed income',
    'investment opportunity', 'click here', 'urgent action required',
    'verify identity', 'account security', 'limited verification',
    'customs fee', 'parcel held',
  ],
};

/**
 * Political / election propaganda. The mention in the user request was
 * specifically "siyasi reklamlar" — these are unsolicited campaign SMS.
 * Kept narrow to party-/election-specific terminology; everyday political
 * vocabulary ("ekonomi", "vatandaş") does NOT belong here.
 */
export const POLITICAL_KEYWORDS = {
  turkish: [
    'oy verin', 'oyunuzu kullanın', 'sandığa gidin', 'aday',
    'milletvekili adayı', 'belediye başkan adayı', 'parti listesi',
    'seçim mitingi', 'kampanya mitingi', 'oy birliği', 'destekleyin',
    'liderimiz', 'siyasi parti', 'meclis adayı', 'yerel seçim',
    'genel seçim', 'cumhurbaşkanı adayı', 'parti programı',
  ],
  english: [
    'vote for', 'cast your vote', 'election rally', 'campaign rally',
    'support our candidate', 'political party',
  ],
};

export const PROMOTION_KEYWORDS = {
  turkish: [
    'indirim', 'fırsat', 'özel teklif', 'son gün', 'stokta sınırlı',
    'hemen al', 'ücretsiz kargo', 'sadece bugün', 'süper fiyat',
    'vade farksız', 'kupon kodu', 'sepet indirimi', 'kara cuma',
    'black friday', 'sezon sonu', 'flash indirim', 'kampanyamızdan',
  ],
  english: [
    'sale', 'discount', 'offer', 'special deal', 'limited time',
    'stock limited', 'buy now', 'free shipping', 'today only',
    'super price', 'coupon', 'promo code', 'flash sale',
    'black friday', 'cyber monday',
  ],
};

/**
 * Transaction shield list. If a strong match here is found we never junk the
 * message — at worst we let it land in inbox. These are signals of legitimate
 * service SMS the user almost certainly wanted.
 */
export const TRANSACTION_KEYWORDS = {
  turkish: [
    'doğrulama kodu', 'onay kodu', 'işlem kodu', 'tek kullanımlık şifre',
    'otp', 'şifreniz:', 'tek kullanımlık kod', 'güvenlik kodu',
    'kargonuz', 'kargonuz yolda', 'teslimat', 'kurye',
    'siparişiniz', 'sipariş numarası', 'sipariş onayı', 'fatura',
    'kart işlemi', 'pos işlemi', 'havale', 'eft', 'fast', 'iban',
    'maaş yatırılmıştır', 'ödeme alındı', 'borç ödemesi', 'kredi kartı ekstresi',
    'e-devlet', 'edevlet', 'sgk', 'mhrs', 'randevu',
    'reçete', 'aşı randevusu', 'sınav sonucu', 'okul kayıt',
    'banka', 'akbank', 'garanti', 'işbank', 'ziraat', 'yapı kredi',
    'denizbank', 'qnb', 'finansbank', 'halkbank', 'vakıfbank',
    'enpara', 'papara', 'ininal', 'param', 'getir', 'trendyol go',
  ],
  english: [
    'verification code', 'one-time code', 'one time password', 'otp code',
    'security code', 'confirmation code', 'tracking number',
    'package out for delivery', 'order confirmation', 'payment received',
    'salary credited', 'bank statement',
  ],
};

/** Flat list used by the UI counter and for "total keyword" reporting. */
export function getAllKeywords(): string[] {
  return [
    ...GAMBLING_KEYWORDS.turkish, ...GAMBLING_KEYWORDS.english,
    ...SCAM_KEYWORDS.turkish, ...SCAM_KEYWORDS.english,
    ...POLITICAL_KEYWORDS.turkish, ...POLITICAL_KEYWORDS.english,
    ...PROMOTION_KEYWORDS.turkish, ...PROMOTION_KEYWORDS.english,
    ...TRANSACTION_KEYWORDS.turkish, ...TRANSACTION_KEYWORDS.english,
  ];
}

/** Just the categories whose hits move a message AWAY from inbox. */
export function getJunkSignalKeywords(): string[] {
  return [
    ...GAMBLING_KEYWORDS.turkish, ...GAMBLING_KEYWORDS.english,
    ...SCAM_KEYWORDS.turkish, ...SCAM_KEYWORDS.english,
    ...POLITICAL_KEYWORDS.turkish, ...POLITICAL_KEYWORDS.english,
  ];
}
