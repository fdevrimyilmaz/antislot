# AntiSlot Kumar Engelleyici - Üretim Mimarisi

## 1. Üretim Mimarisi Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                       MOBİL UYGULAMALAR                           │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   Android (Kotlin)   │         │    iOS (Swift)       │     │
│  │                      │         │                      │     │
│  │  React Native JS     │         │  React Native JS     │     │
│  │       ↓              │         │       ↓              │     │
│  │  GamblingBlocker     │         │  GamblingBlocker     │     │
│  │        Modül         │         │        Modül         │     │
│  │       ↓              │         │       ↓              │     │
│  │  VpnService          │         │  NetworkExtension    │     │
│  │  - DNS Yakalayıcı    │         │  - DNS Proxy         │     │
│  │  - Soket Filtresi    │         │  - İçerik Filtresi   │     │
│  │  - Yerel VPN         │         │  - Uygulama Proxy    │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                               │                     │
│           │ HTTPS (TLS)                   │ HTTPS (TLS)         │
│           │ JSON                          │ JSON                │
└───────────┼───────────────────────────────┼─────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │      BACKEND API (Node.js)        │
          │  ┌─────────────────────────────┐  │
          │  │   Express Sunucusu          │  │
          │  │   Port: 3000 (env)          │  │
          │  └──────────────┬──────────────┘  │
          │                 │                  │
          │  ┌──────────────▼──────────────┐  │
          │  │   BlocklistManager          │  │
          │  │   - Engel Listesi Önb.      │  │
          │  │   - Kalıp Önbelleği         │  │
          │  │   - Dosya Depolama          │  │
          │  └──────────────┬──────────────┘  │
          │                 │                  │
          │  ┌──────────────▼──────────────┐  │
          │  │   DomainMatcher             │  │
          │  │   - Kalıp Eşleştirme        │  │
          │  │   - Benzerlik Tespiti       │  │
          │  └─────────────────────────────┘  │
          └───────────────────────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │      VERİ KATMANI                 │
          │  ┌─────────────────────────────┐  │
          │  │   Dosya Sistemi             │  │
          │  │   /backend/data/            │  │
          │  │   - blocklist.json          │  │
          │  │   - patterns.json           │  │
          │  └─────────────────────────────┘  │
          └───────────────────────────────────┘

VERİ AKIŞI:
1. Mobil uygulama engel listesini ister → Backend API
2. Backend sıkıştırılmış engel listesi + kalıpları döner
3. Mobil uygulama yerelde saklar (SecureStorage)
4. VPN/NetworkExtension DNS/bağlantıları yakalar
5. Alan adı eşleştirme yerelde gerçekleşir (offline-first)
6. Engellenen alan adları → NXDOMAIN veya bağlantı sıfırlama
7. Güncellemeler için periyodik senkronizasyon (6 saatte bir)
```

## 2. Modül Ayrımı

### 2.1 Android (Kotlin)

```
android/app/src/main/java/com/antislot/
├── GamblingBlockerModule.kt         # React Native köprüsü
├── vpn/
│   ├── GamblingVpnService.kt        # VpnService uygulaması
│   ├── DnsInterceptor.kt            # DNS paket ayrıştırma/filtreleme
│   ├── SocketInterceptor.kt         # TCP/UDP bağlantı filtreleme
│   └── VpnConfig.kt                 # VPN yapılandırması
├── blocklist/
│   ├── BlocklistManager.kt          # Yerel engel listesi depolama
│   ├── DomainMatcher.kt             # Kalıp eşleştirme motoru
│   └── BlocklistCache.kt            # Bellek içi önbellek (Trie/Set)
└── storage/
    └── SecureStorage.kt             # Şifreli yerel depolama
```

**Temel Bileşenler:**
- `GamblingVpnService`: `VpnService`'i genişletir, TUN arayüzü oluşturur
- `DnsInterceptor`: DNS paketlerini ayrıştırır (UDP port 53), kumar alan adlarını engeller
- `SocketInterceptor`: TCP/UDP bağlantılarını soket düzeyinde filtreler
- `BlocklistManager`: SecureStorage'dan engel listesini yükler, O(log n) arama için Trie tutar

### 2.2 iOS (Swift)

```
ios/AntiSlot/
├── GamblingBlockerModule.swift      # React Native köprüsü
├── NetworkExtension/
│   ├── PacketTunnelProvider.swift   # NEPacketTunnelProvider alt sınıfı
│   ├── FilterProvider.swift         # İçerik filtresi uygulaması
│   ├── DnsProxy.swift               # NEAppProxyProvider ile DNS proxy
│   └── NetworkRule.swift            # Ağ kuralları yapılandırması
├── blocklist/
│   ├── BlocklistManager.swift       # Yerel engel listesi depolama
│   ├── DomainMatcher.swift          # Kalıp eşleştirme motoru
│   └── BlocklistCache.swift         # Bellek içi önbellek (Set/Dictionary)
└── storage/
    └── KeychainManager.swift        # Keychain depolama
```

**Temel Bileşenler:**
- `PacketTunnelProvider`: Network Extension giriş noktası, paketleri işler
- `DnsProxy`: DNS sorgularını yakalar, engellenen alan adları için NXDOMAIN döner
- `FilterProvider`: Uygulama düzeyi engelleme için içerik filtresi
- `BlocklistManager`: Keychain'den yükler, O(1) arama için Set tutar

### 2.3 Backend (Node.js + TypeScript)

```
backend/
├── src/
│   ├── server.ts                    # Express sunucu + rotalar
│   ├── blocklist-manager.ts         # Engel listesi CRUD işlemleri
│   ├── pattern-generator.ts         # Yeni alan adları için kalıp üretimi
│   ├── update-strategy.ts           # Delta güncellemeler, sürümleme
│   └── middleware/
│       ├── rate-limit.ts            # Oran sınırlama (IP kaydı yok)
│       ├── compression.ts           # Yanıt sıkıştırma
│       └── auth.ts                  # Yönetici kimlik doğrulama (gelecek)
├── data/
│   ├── blocklist.json               # Alan adı girdileri
│   └── patterns.json                # Regex/anahtar kelime kalıpları
└── scripts/
    └── sync-external-sources.ts     # Harici engel listesi senkronizasyonu
```

**Temel Bileşenler:**
- `blocklist-manager.ts`: Engel listesi kalıcılığını ve sürümlemeyi yönetir
- `pattern-generator.ts`: Yeni alan adlarından kalıp üretir
- `update-strategy.ts`: Delta güncellemelerini uygular (yalnızca değişen alan adları)

## 3. API Sözleşmesi

### Temel URL
```
Üretim: https://api.antislot.app
Geliştirme: http://localhost:3000
```

### Uç Noktalar

#### 3.1 GET /api/v1/blocklist
Opsiyonel delta güncellemelerle engel listesini getirir.

**İstek:**
```http
GET /api/v1/blocklist?version=1234567890&format=compressed
Headers:
  User-Agent: AntiSlot/1.0.0 (Android/iOS)
  Accept: application/json
  Accept-Encoding: gzip, deflate
```

**Sorgu Parametreleri:**
- `version` (opsiyonel): İstemcinin bildiği son sürüm zaman damgası
- `format` (opsiyonel): `compressed` | `full` (varsayılan: `compressed`)
- `platform` (opsiyonel): `android` | `ios` (platforma özel optimizasyon)

**Yanıt (200 OK):**
```json
{
  "success": true,
  "version": 1234567890,
  "lastUpdated": 1234567890,
  "delta": true,
  "entries": [
    {
      "domain": "example-bet.com",
      "patterns": [
        {"pattern": "example-bet.com", "type": "exact", "weight": 1.0},
        {"pattern": "*.example-bet.com", "type": "subdomain", "weight": 0.9}
      ],
      "addedAt": 1234567890,
      "reason": "Bilinen kumar alan adı"
    }
  ],
  "patterns": [
    {"pattern": "bet", "type": "contains", "weight": 0.7},
    {"pattern": "^bet\\d+\\.", "type": "regex", "weight": 0.8}
  ],
  "removed": ["old-domain.com"],
  "checksum": "sha256:abc123..."
}
```

**Yanıt (304 Not Modified):**
```http
HTTP/1.1 304 Not Modified
ETag: "v1234567890"
```

**Hata Yanıtı (500):**
```json
{
  "success": false,
  "error": "Sunucu iç hatası",
  "retryAfter": 60
}
```

#### 3.2 GET /api/v1/patterns
Sadece kalıp kurallarını getirir (daha hafif payload).

**İstek:**
```http
GET /api/v1/patterns?version=1234567890
```

**Yanıt:**
```json
{
  "success": true,
  "version": 1234567890,
  "patterns": [
    {"pattern": "bet", "type": "contains", "weight": 0.7},
    {"pattern": "^casino\\d+\\.", "type": "regex", "weight": 0.8}
  ],
  "checksum": "sha256:def456..."
}
```

#### 3.3 POST /api/v1/verify-domain (Yönetici/Test)
Bir alan adının engel listesiyle eşleşip eşleşmediğini doğrular (loglama yok).

**İstek:**
```json
{
  "domain": "example.com"
}
```

**Yanıt:**
```json
{
  "success": true,
  "domain": "example.com",
  "blocked": true,
  "matchedPatterns": [
    {"pattern": "example.com", "type": "exact"},
    {"pattern": "bet", "type": "contains"}
  ],
  "confidence": 0.95
}
```

#### 3.4 GET /health
Sağlık kontrolü uç noktası.

**Yanıt:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "blocklistCount": 15420
}
```

### Veri Yapıları

**BlocklistEntry:**
```typescript
interface BlocklistEntry {
  domain: string;              // Normalleştirilmiş alan adı (küçük harf)
  patterns: BlocklistPattern[];
  addedAt: number;             // Unix zaman damgası
  reason: string;              // İnsan tarafından okunabilir neden
}
```

**BlocklistPattern:**
```typescript
interface BlocklistPattern {
  pattern: string;             // Kalıp dizesi
  type: 'exact' | 'subdomain' | 'contains' | 'regex';
  weight: number;              // 0.0 - 1.0 güven
}
```

## 4. Güncelleme Stratejisi

### 4.1 İstemci Güncelleme Akışı

```
┌─────────────────┐
│  Mobil Uygulama │
│  (6 saatte bir) │
└────────┬────────┘
         │
         │ GET /api/v1/blocklist?version={lastVersion}
         │
         ▼
┌─────────────────┐
│  Backend        │
│  - Karşılaştır  │
│  - Delta hesap  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
304 Not    200 OK
Modified   (Delta)
    │         │
    │         ▼
    │    ┌──────────────┐
    │    │ Delta Uygula │
    │    │ Yereli Günc. │
    │    └──────────────┘
    │
    ▼
Güncellemeyi Atla
```

### 4.2 Delta Güncelleme Stratejisi

**Sürümleme:**
- Her engel listesi güncellemesi sürümü artırır (zaman damgası)
- İstemci `version` sorgu parametresini gönderir
- Backend delta hesaplar: `added`, `removed`, `modified`

**Uygulama:**
```typescript
// backend/src/update-strategy.ts
class UpdateStrategy {
  calculateDelta(
    clientVersion: number,
    currentEntries: BlocklistEntry[]
  ): {
    entries: BlocklistEntry[];
    removed: string[];
    version: number;
  } {
    const lastClientUpdate = this.getSnapshot(clientVersion);
    const added = currentEntries.filter(
      e => !lastClientUpdate.has(e.domain)
    );
    const removed = lastClientUpdate.domains.filter(
      d => !currentEntries.find(e => e.domain === d)
    );
    
    return {
      entries: added,
      removed,
      version: Date.now()
    };
  }
}
```

### 4.3 Arka Plan Senkronizasyonu

**Android:**
- `WorkManager` işi: 6 saatte bir
- Batarya optimizasyonlu, Doze moduna saygılı
- Hata durumunda üstel geri çekilme

**iOS:**
- `BGTaskScheduler`: Arka plan fetch
- Uygulama yaşam döngüsü kancaları: `applicationDidEnterBackground`

**Yedek:**
- Uygulama arayüzünde manuel senkron tetiklemesi
- Uygulama açılışında senkron (son senkron >6 saatse)

### 4.4 Engel Listesi Kaynak Güncellemeleri

**Harici Kaynaklar:**
- Manuel kürasyon (yönetici paneli)
- Kamu blok listeleri (kumar için filtrelenmiş)
- Topluluk raporları (gelecek)

**Güncelleme Sıklığı:**
- Otomatik: Günlük cron işi
- Manuel: Yönetici tarafından tetiklenir

## 5. Tehdit Modeli ve Gizlilik

### 5.1 Tehdit Modeli

**Tehditler:**

| Tehdit | Etki | Azaltım |
|--------|------|---------|
| **Alan adı rotasyonu ile kaçınma** | Yüksek | Kalıp eşleştirme, regex kuralları, benzerlik tespiti |
| **VPN/Eklenti atlatma** | Yüksek | Root tespiti, çoklu uygulama katmanları |
| **MITM saldırıları** | Orta | TLS pinning, sertifika doğrulama |
| **Backend ele geçirilmesi** | Yüksek | Kullanıcı verisi tutulmaz, salt-okunur API |
| **Engel listesi zehirleme** | Orta | Checksum doğrulama, yalnızca yönetici yazımı |
| **Performans DoS** | Düşük | Oran sınırlama, sıkıştırma, önbellekleme |

**Saldırı Vektörleri:**

1. **Alan Adı Rotasyonu:**
   - Saldırgan: Alan adlarını sık sık değiştirir
   - Savunma: Kalıp eşleştirme (`bet*`, `casino*`), benzerlik tespiti, regex kuralları

2. **VPN Atlatma:**
   - Saldırgan: VPN'i kapatır, sistem DNS kullanır
   - Savunma: Sürekli VPN bağlantısı, periyodik kontroller, root tespiti

3. **Şifreli Trafik:**
   - Saldırgan: DNS filtrelemesini aşmak için DoH/DoT kullanır
   - Savunma: SNI (Server Name Indication) incelemesi, DoH uç noktalarını engelleme

### 5.2 Gizlilik Taahhütleri

**KAYIT TUTMAMA POLİTİKASI:**

1. **Backend:**
   - ✅ IP adresi loglanmaz
   - ✅ İstek loglaması yoktur (sağlık kontrolleri hariç)
   - ✅ Kullanıcı kimliği tutulmaz
   - ✅ Alan adı sorguları loglanmaz
   - ✅ Oran sınırlama bellek içi sayaçlarla yapılır (kalıcı değil)

2. **Mobil Uygulamalar:**
   - ✅ Telemetri yok
   - ✅ Analitik yok
   - ✅ Engel listesi yerelde saklanır (şifreli)
   - ✅ Engel listesi senkronu dışında ağ etkinliği gönderilmez

**Veri Minimizasyonu:**
- Yalnızca engel listesi verisi senkronlanır (kullanıcı bağlamı yok)
- Kullanıcı hesabı gerekmez
- Cihaz parmak izi çıkarımı yok

**Uygulama:**

```typescript
// backend/src/middleware/no-logging.ts
export const noLoggingMiddleware = (req, res, next) => {
  // Engel listesi uç noktaları için loglamayı açıkça atla
  if (req.path.startsWith('/api/v1/blocklist')) {
    // Loglama yok
    return next();
  }
  // Yalnızca sağlık kontrolü
  next();
};

// IP saklamadan oran sınırlama
const rateLimiter = rateLimit({
  store: new MemoryStore(), // In-memory only
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 5.3 Güvenlik Önlemleri

**TLS/HTTPS:**
- Tüm API iletişimi TLS 1.3 üzerinden
- Mobil tarafta sertifika pinning (opsiyonel, önerilir)

**Girdi Doğrulama:**
- Tüm alan adı girdilerini temizle
- Hatalı alan adlarını reddet
- Kötüye kullanımı önlemek için oran sınırlama

**Engel Listesi Bütünlüğü:**
- Engel listesi için SHA-256 checksum'ları
- Sürüm doğrulama
- İmza doğrulama (gelecek: imzalı engel listeleri)

**Kod Koruması:**
- Mobil yerel kod için obfuscation (opsiyonel)
- Kurcalama karşıtı kontroller

---

## Uygulama Önceliği

1. **Aşama 1:** Backend API + temel engel listesi senkronu
2. **Aşama 2:** Android VpnService uygulaması
3. **Aşama 3:** iOS NetworkExtension uygulaması
4. **Aşama 4:** Kalıp eşleştirme motoru optimizasyonu
5. **Aşama 5:** Delta güncellemeler + sürümleme
6. **Aşama 6:** Kaçınma karşıtı iyileştirmeler

---

**Doküman Sürümü:** 1.0  
**Son Güncelleme:** 2024
