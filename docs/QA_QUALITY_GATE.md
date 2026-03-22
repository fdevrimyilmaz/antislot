# Kalite Kapısı (QA) — Test Stratejisi ve Senaryolar

Bu doküman kritik akışlar, e2e testleri, gerçek cihaz matrisi ve regression / memory / cold start / network-loss senaryolarını tanımlar.

---

## 1. Kritik akışlar ve E2E

### 1.1 Kapsanan akışlar

| Akış | Açıklama | Detox | Maestro |
|------|----------|-------|---------|
| **Onboarding** | Karşılama → Devam → Continue ekranı | `e2e/detox/onboarding.e2e.js` | `e2e/maestro/onboarding-flow.yaml` |
| **Auth (init)** | Uygulama açılışı, anonim kullanıcı, ana ekran | `e2e/detox/auth.e2e.js` | `e2e/maestro/auth-flow.yaml` |
| **SOS offline** | SOS ekranı, acil hatlar, nefes/erteleme (ağ gerektirmez) | `e2e/detox/sos-offline.e2e.js` | `e2e/maestro/sos-flow.yaml` |
| **Premium purchase/restore** | Premium ekranı, plan kartları, geri yükle butonu | `e2e/detox/premium.e2e.js` | `e2e/maestro/premium-flow.yaml` |
| **Blocker sync** | Engelleyici ekranı, koruma switch, senkronize et | `e2e/detox/blocker-sync.e2e.js` | `e2e/maestro/blocker-sync-flow.yaml` |

### 1.2 E2E çalıştırma

**Detox (iOS sim / Android emülatör):**
```bash
# iOS
npm run e2e:detox:build:ios
npm run e2e:detox:test:ios

# Android
npm run e2e:detox:build:android
npm run e2e:detox:test:android
```

**Maestro (cihaz veya emülatör):**
```bash
# Tüm Maestro akışları
npm run e2e:maestro

# Tek akış
maestro test e2e/maestro/onboarding-flow.yaml
maestro test e2e/maestro/sos-flow.yaml
maestro test e2e/maestro/premium-flow.yaml
maestro test e2e/maestro/blocker-sync-flow.yaml
```

**Not:** Maestro akışları ana ekran (`home-screen`) bekler; ilk kurulumda önce `onboarding-flow.yaml` çalıştırılıp uygulama ana sayfaya getirilmiş olmalı veya cihazda onboarding tamamlanmış olmalı.

---

## 2. Gerçek cihaz testleri (cihaz matrisi)

Release öncesi aşağıdaki cihaz sınıflarında manuel veya otomatik test yapılması önerilir.

### 2.1 Düşük performans

- **Android:** 2–3 GB RAM, eski Android (örn. 9–10), düşük segment cihazlar.
- **iOS:** Eski iPhone (örn. iPhone 8 / iOS 15).
- **Odak:** Cold start süresi, SOS/premium/blocker ekranlarının açılması, animasyonsuz veya basit senaryolar.

### 2.2 Orta performans

- **Android:** 4–6 GB RAM, Android 12–13 (örn. Pixel 6, orta segment).
- **iOS:** iPhone 12/13 veya eşdeğer, güncel iOS.
- **Odak:** Tüm kritik akışlar, IAP/restore (sandbox), blocker sync, normal kullanım.

### 2.3 Yüksek performans

- **Android:** 8+ GB RAM, Android 13+ (örn. güncel flagship).
- **iOS:** iPhone 14/15+, güncel iOS.
- **Odak:** Regression seti, yük altında tutarlılık, ileri senaryolar.

### 2.4 Cihaz matrisi (örnek)

| Sınıf       | Android örnek     | iOS örnek   | E2E (Detox/Maestro) | Manuel |
|------------|-------------------|-------------|----------------------|--------|
| Düşük      | API 29 emülatör   | iPhone 8    | ✓ (CI’da opsiyonel)  | ✓      |
| Orta       | Pixel 6 API 33    | iPhone 13   | ✓                    | ✓      |
| Yüksek     | Pixel 8 / güncel  | iPhone 15   | ✓                    | ✓      |

---

## 3. Regression, memory, cold start, network-loss

### 3.1 Regression

- **Kapsam:** Onboarding, auth (init), SOS, premium (ekran + restore UI), blocker (sync + koruma switch).
- **Araçlar:** Detox + Maestro (yukarıdaki dosyalar).
- **Sıklık:** Her PR’da (veya nightly) unit + entegrasyon; release öncesi tam e2e seti.
- **Checklist:** Tüm kritik akışlar yeşil; yeni özellik için ilgili akışa yeni senaryo eklenir.

### 3.2 Memory

- **Hedef:** Uzun süre açık kalmada belirgin bellek artışı veya crash olmamalı.
- **Senaryo örnekleri:**
  - Uygulamayı 10–15 dakika açık tutup SOS → Premium → Blocker → Ana sayfa döngüsü (5–10 tur).
  - Arka plana alıp öne getirme (5–10 kez) sonrası aynı akışlar.
- **Araçlar:** Xcode Memory Debugger, Android Profiler (Memory); gerekirse LeakCanary (Android).
- **Kriter:** Crash yok; bellek büyümesi kabul edilen eşiğin altında (takım eşiği tanımlanmalı).

### 3.3 Cold start

- **Hedef:** Soğuk başlangıç süresi kabul edilebilir aralıkta (örn. &lt; 3 saniye orta segment).
- **Senaryo:**
  - Uygulamayı tamamen kapat (son kullanıcılar listesinden de çıkar).
  - Başlat, ana ekran (veya karşılama) görünene kadar süreyi ölç.
- **Ölçüm:** Xcode Instruments (Time Profiler) veya `adb shell am start -W` (Android); manuel kronometre.
- **Kriter:** Düşük/orta cihazlarda hedef süre aşılmamalı.

### 3.4 Network-loss (çevrimdışı / zayıf ağ)

- **Hedef:** Ağ yokken veya çok zayıfken kritik ekranlar çalışır; kullanıcıya anlamlı mesaj verilir.
- **Senaryolar:**
  1. **Uçak modu / WiFi ve mobil kapalı:**
     - Uygulama açılışı (anonim auth gerekirse: offline token veya cached uid).
     - SOS ekranı: acil hatlar, nefes, erteleme, topraklama metinleri görünür; `OFFLINE_CRISIS_FALLBACK` ile tel/SMS açılamazsa kullanıcı bilgilendirilir.
     - Premium: ekran açılır; IAP/restore ağ gerektirir, hata mesajı net olmalı.
     - Blocker: listeler önceden senkronize edildiyse offline çalışır; sync butonu ağ yokken hata vermeli.
  2. **Çok yavaş ağ (throttling):**
     - Premium restore ve blocker sync: timeout ve retry davranışı, kullanıcıya gösterilen mesaj.
- **Kriter:** SOS tamamen offline kullanılabilir; diğer ekranlar crash etmez ve durum net iletilir.

---

## 4. TestID referansı (E2E için)

Aşağıdaki `testID` değerleri Detox ve Maestro tarafından kullanılır:

| Ekran / bileşen | testID |
|-----------------|--------|
| Karşılama       | `welcome-screen` |
| Onboarding devam | `onboarding-continue` |
| Continue ekranı | `continue-screen` |
| Ana sayfa       | `home-screen` |
| Ana sayfa kartı | `home-card-{key}` (örn. urge, therapy) |
| SOS hızlı erişim | `sos-quick-access` |
| SOS ekranı      | `sos-screen`, `sos-back`, `sos-helplines`, `sos-breathing-start`, `sos-intro-card` |
| Premium ekranı  | `premium-screen`, `premium-back`, `premium-restore-btn`, `premium-plan-monthly/yearly/lifetime` |
| Blocker ekranı  | `blocker-screen`, `blocker-back`, `blocker-sync-btn`, `blocker-protection-switch` |

---

## 5. Go-Live Dry Run

Store’a yüklemeden önce staging’de tam rehearsal için: `docs/GO_LIVE_DRY_RUN.md`

Akış: install → login → purchase → renewal sim → restore → cancel/refund sim → support/deletion request

---

## 6. CI entegrasyonu (öneri)

- **Mevcut:** Lint, unit testler, server/backend testleri, IAP ve auth smoke testleri.
- **Opsiyonel eklemeler:**
  - Detox e2e: iOS simülatör veya Android emülatör ile `e2e:detox:test:ios` / `android` (branch veya nightly).
  - Maestro: yerel veya Maestro Cloud ile kritik akışlar.
  - Cold start / memory: manuel veya ayrı bir “performance” job (ölçüm sonuçları artefact olarak saklanabilir).

Bu doküman, kalite kapısı kriterlerinin tek bir yerde toplanması ve regression / cihaz / performans / network senaryolarının takip edilmesi için güncellenebilir.
