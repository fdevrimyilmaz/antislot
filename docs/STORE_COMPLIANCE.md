# Store Compliance (Apple App Store + Google Play)

Bu dokümanda Antislot uygulaması için App Store ve Google Play mağaza uyumluluk gereksinimleri, form doldurma rehberi ve eksik URL'ler yer almaktadır.

---

## 1. Privacy Nutrition Labels (Apple) / Data Safety (Google)

### 1.1 Apple App Store – Privacy Nutrition Label

App Store Connect > Uygulama > App Privacy bölümünde aşağıdaki veri türlerini bildirin:

| Veri Türü | Alt Kategori | Amaç | Kullanıcıya Bağlı | Toplama |
|-----------|--------------|------|-------------------|---------|
| **Identifiers** | User ID | App Functionality | Evet | İsteğe bağlı (Firebase anonymous auth) |
| **User Content** | Customer Support | App Functionality | Evet | İsteğe bağlı (AI sohbet → OpenAI) |
| **Diagnostics** | Crash Data | App Functionality | Hayır | İsteğe bağlı (Sentry, kullanıcı açarsa) |
| **Diagnostics** | Performance Data | App Functionality | Hayır | İsteğe bağlı (Sentry) |
| **Usage Data** | Product Interaction | Analytics | Hayır | İsteğe bağlı (telemetri açıksa) |
| **Purchases** | Purchase History | App Functionality | Evet | İsteğe bağlı (Premium IAP kullanımında) |

**Tracking:** Hayır. Hedefli reklam, data broker paylaşımı veya cross-app takip yok.

**Önemli notlar:**
- Telemetri ve crash raporları varsayılan kapalı; kullanıcı ayarlardan açmalı.
- AI sohbet sadece kullanıcı mesaj gönderdiğinde OpenAI’ye iletilir.
- Ödeme bilgisi (kart numarası vb.) toplanmaz; IAP Apple/Google üzerinden işlenir.
- Cihazda saklanan veriler (urge logs, emergency contacts vb.) sunucuya gönderilmez → bildirime gerek yok.

### 1.2 Google Play – Data Safety Form

Play Console > Uygulama içeriği > Veri güvenliği bölümünde:

| Veri türü | Toplanıyor mu | Paylaşılıyor mu | İsteğe bağlı | Amaç |
|-----------|---------------|-----------------|--------------|------|
| Cihaz veya diğer tanımlayıcılar | Evet (Firebase UID) | Hayır | Evet | Uygulama işlevi |
| Uygulama etkileşimleri | Evet (telemetri) | Hayır | Evet | Analitik |
| Çökme ve tanılama verileri | Evet (Sentry) | Evet (Sentry) | Evet | Uygulama işlevi |
| Mesajlar veya diğer kullanıcı içeriği | Evet (AI sohbet) | Evet (OpenAI) | Evet | Uygulama işlevi |
| Satın alma geçmişi | Evet (IAP durumu) | Hayır | Evet | Uygulama işlevi |

**Veri güvenliği uygulamaları:**
- Veriler şifreli iletilir (HTTPS/TLS)
- Kullanıcılar veri silme talep edebilir (support@antislot.app)

---

## 2. Yaş Derecelendirmesi ve İçerik Beyanları

### 2.1 Yaş Sınırı

- **Önerilen derecelendirme:** 17+ (Apple) / Olgun (Mature) veya eşdeğer (Google)
- **Sebep:** Kumar bağımlılığı destek aracı; 18 yaş altı ebeveyn/yasal temsilci yönlendirmesi ile kullanılmalı.
- Onboarding’de 18+ onayı alınır; yaş politikası Kullanım Şartları’nda belirtilir.

### 2.2 İçerik Kategorileri (Gambling / Addiction)

- **Antislot kumar uygulaması DEĞİLDİR.** Kumar sitelerini engelleyen ve bağımlılık desteği sunan bir araçtır.
- Apple: Uygun kategori: **Health & Fitness** veya **Lifestyle**. Gambling/Simulated Gambling kategorisine girmeyin.
- Google: Uygun kategori: **Health & Fitness** veya **Lifestyle**. İçerik anketinde “gambling” seçmeyin; “Addiction support / self-help” benzeri ifadeler kullanın.
- İçerik beyanı örneği: *“Uygulama kumar oynamayı teşvik etmez; kumar bağımlılığı için destek araçları sunar.”*

---

## 3. Gerekli URL’ler (Hostlanmalı)

App Store Connect ve Play Console’da aşağıdaki URL’ler **public** olarak erişilebilir olmalıdır. Uygulama içi ekranlar yeterli değildir; web sayfası gereklidir.

| URL Türü | Önerilen URL | Durum |
|----------|--------------|-------|
| **Privacy Policy** | `https://antislot.app/privacy` | ⚠️ Henüz yok – hostlanmalı |
| **Terms of Service** | `https://antislot.app/terms` | ⚠️ Henüz yok – hostlanmalı |
| **Support** | `https://antislot.app/support` veya `mailto:support@antislot.app` | ⚠️ Support sayfası opsiyonel; e-posta kabul edilir |

**Yapılacaklar:**
1. `antislot.app` domain’inde static sayfalar hostlayın (örn. GitHub Pages, Vercel, Netlify).
2. `app/privacy.tsx` ve `app/terms.tsx` içeriğini HTML/Markdown olarak bu sayfalara taşıyın veya aynı metni kullanın.
3. App Store Connect’te Privacy Policy URL olarak `https://antislot.app/privacy` girin.
4. Play Console’da Privacy Policy URL olarak `https://antislot.app/privacy` girin.
5. Support için `mailto:support@antislot.app` veya `https://antislot.app/support` kullanın.

**Geçici çözüm:** Domain henüz hazır değilse GitHub Pages veya benzeri üzerinde `https://512ferhat512.github.io/antislot-privacy` gibi bir URL kullanılabilir.

---

## 4. App Review Notları (Apple)

App Store Connect > App Information > Review Notes bölümüne eklenecek metin örneği:

```
REVIEWER NOTES – Antislot

1. APP PURPOSE
   Antislot is a gambling addiction support tool. It helps users block gambling websites and manage urges. It is NOT a gambling app and does not facilitate gambling.

2. LOGIN / DEMO
   - The app uses optional Firebase anonymous auth for cloud features (blocklist sync, premium status).
   - No login is required to access core features: crisis support, urge logging, blocker UI.
   - To test without account: Open app → Complete onboarding → Use any screen.
   - To test with account: App will create an anonymous Firebase user automatically when needed.

3. PREMIUM / IAP
   - IAP is optional. Free tier includes core functionality.
   - If IAP is disabled (EXPO_PUBLIC_ENABLE_IAP=false): Premium screen shows "Coming soon" or similar.
   - Sandbox test account: Apple Sandbox tester account must be configured in App Store Connect before submission.

4. NETWORK / VPN
   - Blocker uses VPN/Network Extension with user consent.
   - On simulators: Blocker may return "unsupported" – expected.

5. SUPPORT
   - support@antislot.app
   - Privacy: https://antislot.app/privacy
   - Terms: https://antislot.app/terms
```

---

## 5. Demo Hesap / Test Akışı (Google Play)

Google Play Console > Uygulama içeriği > Uygulama erişimi bölümünde:

```
APP ACCESS

- All functionality is available without login. Users can use crisis support, urge logging, and blocker UI immediately after onboarding.

- Optional account: Firebase anonymous auth is used for blocklist sync and premium. No password or email required. An anonymous user is created automatically when the user accesses features that require it.

- Demo instructions:
  1. Install and open the app
  2. Complete onboarding (accept VPN consent, age 18+, privacy, disclaimer)
  3. Navigate: Crisis (SOS) → Urge log → Blocker → Settings
  4. No credentials needed

- Test account (if IAP enabled): Use Google Play sandbox tester account.
```

---

## 6. Özet Kontrol Listesi

| Madde | Apple | Google |
|-------|-------|--------|
| Privacy Policy URL (public) | ☐ | ☐ |
| Terms URL (public) | ☐ | ☐ |
| Support e-posta/URL | ☐ | ☐ |
| Privacy Nutrition Label / Data Safety | ☐ | ☐ |
| Yaş derecelendirmesi (17+/Mature) | ☐ | ☐ |
| Gambling/addiction kategori uyumu | ☐ | ☐ |
| App Review / Demo notları | ☐ | ☐ |

---

## 7. URL Sabitleri ve Web Sayfaları

- **Sabitler:** `constants/urls.ts` – `PRIVACY_POLICY_URL`, `TERMS_URL`, `SUPPORT_EMAIL`
- **Statik HTML:** `website/privacy.html`, `website/terms.html` – host edip `antislot.app` altında yayınlayın
- **Hostlama rehberi:** `website/README.md`

---

## 8. Referans Dosyalar

- Gizlilik metni (uygulama içi): `app/privacy.tsx`
- Kullanım şartları (uygulama içi): `app/terms.tsx`
- Disclaimer: `components/disclaimer.tsx`
- Yaş politikası: `app/terms.tsx` (AGE_POLICY_POINTS)
- Destek e-postası: `support@antislot.app`
