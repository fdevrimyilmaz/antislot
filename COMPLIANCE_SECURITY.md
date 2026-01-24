# AntiSlot Blocker - Uyumluluk ve Güvenlik Rehberi

## Google Play Store Politikaları

### VPN Hizmeti Gereksinimleri

**Politika**: VPN hizmetleri, Google Play’in VPN uygulamaları politikalarıyla uyumlu olmalıdır.

**Gereksinimler**:
- ✅ **Açık Bilgilendirme**: Uygulamanın VPN servisi kullandığı açıkça belirtilmeli
- ✅ **Kullanıcı Onayı**: Kullanıcı VPN'i açıkça etkinleştirmeli (otomatik etkinleştirme yok)
- ✅ **Amaç**: VPN, beyan edilen amaca hizmet etmeli (kumarı engelleme)
- ✅ **Gizlilik**: Kullanıcı verisi toplanmaz, kayıt tutulmaz
- ✅ **Güvenlik**: VPN bağlantısı güvenli olmalı (yerel VPN kabul edilir)

**Uygulama İçi Açıklama Gerekli**:
```
Bu uygulama, DNS sorgularını yakalamak ve
kumar sitelerini engellemek için Android'in VpnService özelliğini kullanır.
Gezinme verileri toplanmaz veya iletilmez.
Korumanın etkinleşmesi için Ayarlar'dan VPN'i açmanız gerekir.
```

**İzin Gerekçesi**:
- `BIND_VPN_SERVICE`: Yerel VPN işlevi için gereklidir (kumar engelleme)

**Gizlilik Beyanı**:
- Kullanıcı verisi toplanmaz
- DNS sorguları kaydedilmez
- Ağ etkinliği izlenmez
- Tüm engelleme cihazda yerel olarak yapılır

---

## Apple App Store Politikaları

### Network Extension Gereksinimleri

**Politika**: Network Extensions, App Store İnceleme Yönergeleri ile uyumlu olmalıdır.

**Gereksinimler**:
- ✅ **Gerekçe**: Network Extension kullanımının açık bir açıklaması
- ✅ **Kullanıcı Onayı**: Kullanıcı eklentiyi açıkça etkinleştirmeli (Ayarlar > VPN)
- ✅ **Gizlilik**: Kullanıcı verisi toplanmaz, kayıt tutulmaz
- ✅ **Açıklama**: Sınırlamalar (DoH, uygulama içi tarayıcılar) net şekilde anlatılmalı
- ✅ **Amaç**: Eklenti beyan edilen amaca hizmet etmeli (kumarı engelleme)

**App Review Notları Gerekli**:
```
Bu uygulama, DNS düzeyinde kumar sitelerini engellemek için
NEDNSProxyProvider (DNS Proxy Provider) kullanır. Eklenti DNS
sorgularını yakalar ve bilinen kumar alan adlarının çözülmesini engeller.

Önemli noktalar:
- Kullanıcı Ayarlar > VPN bölümünden VPN'i açıkça etkinleştirmelidir
- Tüm filtreleme cihaz üzerinde yerel olarak yapılır
- Kullanıcı verisi toplanmaz veya iletilmez
- Sınırlamalar uygulama içinde belgelenmiştir (DoH, uygulama içi tarayıcılar)
```

**Network Extension Gerekçesi**:
- Amaç: Kumar sitelerini DNS düzeyinde engelleme
- Teknoloji: NEDNSProxyProvider (Apple tarafından onaylı)
- Kullanıcı Kontrolü: VPN'in açıkça etkinleştirilmesi gerekir
- Gizlilik: Veri toplanmaz, yalnızca yerel filtreleme

---

## Uygulama İçi Açıklama Metinleri

### Android - VPN Hizmeti Açıklaması

**Kısa Sürüm** (ana ekran için):
```
VPN Gerekli: Bu uygulama, DNS düzeyinde kumar sitelerini engellemek için
yerel bir VPN kullanır. Gezinme verileri toplanmaz veya iletilmez.
Korumanın etkinleşmesi için Ayarlar'dan VPN'i açmanız gerekir.
```

**Tam Sürüm** (onboarding/yardım için):
```
Bu uygulama, DNS sorgularını yakalayıp bilinen kumar
alan adlarını engelleyen yerel bir VPN bağlantısı oluşturmak için
Android'in VpnService özelliğini kullanır. VPN tamamen cihazınızda
çalışır; hiçbir veri toplanmaz, kaydedilmez veya iletilmez.
Korumanın etkinleşmesi için Ayarlar > Ağ > VPN bölümünden
VPN'i manuel olarak açmanız gerekir.

Sınırlamalar:
- DNS over HTTPS (DoH) filtrelemeyi aşabilir
- Uygulama içi tarayıcılar filtrelemeyi aşabilir
- Tüm engelleme cihazınızda yerel olarak yapılır
```

### iOS - Network Extension Açıklaması

**Kısa Sürüm** (ana ekran için):
```
VPN Gerekli: Bu uygulama, DNS düzeyinde kumar sitelerini engellemek için
Network Extension kullanır. Gezinme verileri toplanmaz.
Korumanın etkinleşmesi için Ayarlar > VPN bölümünden VPN'i açın.
```

**Tam Sürüm** (onboarding/yardım için):
```
Bu uygulama, DNS sorgularını yakalayıp bilinen kumar
alan adlarını engellemek için Apple'ın Network Extension
(NEDNSProxyProvider) özelliğini kullanır. Tüm filtreleme
cihazınızda yerel olarak yapılır; hiçbir veri toplanmaz,
kaydedilmez veya iletilmez. Korumanın etkinleşmesi için
Ayarlar > VPN bölümünden VPN'i manuel olarak açmanız gerekir.

Sınırlamalar:
- DNS over HTTPS (DoH) filtrelemeyi aşabilir (Safari ayarlarından kapatın)
- Uygulama içi tarayıcılar filtrelemeyi aşabilir (en iyi koruma için Safari kullanın)
- Esir portal (captive portal) doğrulaması sırasında filtreleme aşılabilir
```

### Platformlar Arası - Gizlilik Açıklaması

**Kısa Sürüm**:
```
Gizlilik: Gezinme verisi, DNS sorguları veya kişisel bilgiler
toplanmaz ya da iletilmez. Tüm engelleme cihazınızda yerel
olarak yapılır.
```

**Uzun Sürüm** (gizlilik politikası için):
```
Gizlilik ve Veri Toplama:

Bu uygulama hiçbir kullanıcı verisini toplamaz, saklamaz veya iletmez.

- Gezinme geçmişi toplanmaz
- DNS sorguları kaydedilmez veya iletilmez
- Kişisel bilgi toplanmaz
- Cihaz tanımlayıcıları toplanmaz
- Analitik veya izleme yoktur

İstatistikler (engellenen/izin verilen sayıları) yalnızca cihazınızda
yerel olarak saklanır ve istediğiniz zaman sıfırlanabilir. İstatistikler
asla ağ üzerinden iletilmez.

Uygulama yalnızca engel listesi güncellemelerini sunucularımızdan indirir.
Bu isteklerde kullanıcı etkinliği veya kişisel bilgi bulunmaz.
```

---

## Gizlilik Politikası - Ana Maddeler

### Veri Toplama Beyanı

```
VERİ TOPLAMA: Varsayılan olarak yok (Yapay ANTİ özelliği istisna)

Bu uygulama, yapay zeka sohbeti kullanılmadığı sürece hiçbir kullanıcı
verisini toplamaz, saklamaz veya iletmez:
• Gezinme geçmişi yok
• DNS sorguları kaydı yok
• Kişisel bilgi yok
• Cihaz tanımlayıcıları yok
• Analitik veya izleme yok
• Üçüncü taraf veri paylaşımı yok
• Veri satışı yok (satacak veri toplanmaz)

YAPAY ANTİ SOHBETİ (Opsiyonel):
Kullanıcı YAPAY ANTİ sohbetini kullanırsa, mesaj içerikleri yanıt
üretmek amacıyla ChatGPT altyapısına iletilir. AntiSlot bu mesajları
saklamaz; kullanıcıdan kişisel bilgi paylaşmaması istenir.
```

### Yerel Depolama Beyanı

```
YEREL DEPOLAMA:

Uygulama aşağıdaki verileri yalnızca cihazınızda yerel olarak saklar:
• Engel listesi (engellenen alan adlarının listesi)
• Kalıplar (engelleme kuralları)
• Beyaz liste (izin verilen alan adları)
• İstatistikler (engellenen/izin verilen sayıları - istenildiğinde sıfırlanabilir)

Tüm veriler uygulamanın özel depolamasında saklanır ve asla ağ üzerinden
iletilmez.
```

### Network Extension Beyanı

```
NETWORK EXTENSION:

Uygulama, DNS sorgularını yakalayıp kumar sitelerini engellemek için
Network Extension (Android: VpnService, iOS: NEDNSProxyProvider)
kullanır. DNS sorguları cihazınızda yerel olarak işlenir ve asla
kaydedilmez, saklanmaz veya iletilmez.

Eklenti:
• Tamamen cihazınızda çalışır
• Trafiği harici sunuculardan geçirmez
• Hiçbir DNS sorgusunu toplamaz veya kaydetmez
• Yalnızca yerel engel listesine uyan alan adlarını engeller
```

### Engel Listesi Güncellemeleri Beyanı

```
ENGEL LİSTESİ GÜNCELLEMELERİ:

Uygulama, güncel engelleme kuralları için engel listesi güncellemelerini
düzenli olarak sunucularımızdan indirir. Bu istekler:
• Kullanıcı bilgisi içermez
• Cihaz tanımlayıcıları içermez
• Gezinme geçmişi içermez
• Yalnızca güncel alan adı listelerini indirir
• Bütünlük için HMAC imzalarıyla doğrulanır
```

---

## Güvenlik Kontrol Listesi

### API Güvenliği

- [x] **HMAC Doğrulaması**: Tüm API yanıtları HMAC-SHA256 ile doğrulanır
  - Uygulama: İmza, engel listesi/kalıplar kabul edilmeden önce doğrulanır
  - Gizli Anahtar: Güvenli şekilde saklanır (prod ortamında hardcoded değildir)
  - Hata: İmza geçersizse engel listesi güncellemesi reddedilir

- [ ] **TLS Pinning** (Opsiyonel): API uç noktaları için sertifika pinleme
  - Öneri: Ek güvenlik için üretimde uygulanmalıdır
  - Uygulama: Backend API sertifikasını sabitle
  - Geri dönüş: Pinning hatalarını kontrollü şekilde ele al

- [x] **TLS/HTTPS**: Tüm API iletişimi HTTPS üzerinden
  - Uygulama: API uç noktaları yalnızca HTTPS kullanır
  - Doğrulama: Sertifika doğrulaması etkin
  - Yapılandırma: Yalnızca TLS 1.2+ kullanılır

### Güncelleme Güvenliği

- [x] **Güvenli Güncellemeler**: Engel listesi güncellemeleri uygulanmadan önce doğrulanır
  - Uygulama: Engel listesi güncellemeden önce HMAC doğrulaması
  - Geri alma: Güncelleme başarısızsa mevcut engel listesi korunur
  - Doğrulama: Kaydetmeden önce engel listesi yapısı doğrulanır

- [x] **Sürüm Kontrolü**: Yalnızca daha yeni sürüm varsa güncelle
  - Uygulama: Sürüm numaralarını karşılaştır
  - Önleme: Engel listesi sürümünü düşürme
  - Güvenlik: Güncelleme başarısızsa çalışan engel listesini koru

- [x] **Atomik Güncellemeler**: Güncellemeler atomiktir (ya hep ya hiç)
  - Uygulama: Geçici dosyaya yaz, sonra yeniden adlandır
  - Güvenlik: Güncelleme başarısızsa mevcut veri korunur
  - Tutarlılık: Kısmi güncelleme olmaz

### Veri Güvenliği

- [x] **Yerel Depolama**: Hassas veriler güvenli depolamada saklanır
  - Android: EncryptedSharedPreferences veya Keystore
  - iOS: Keychain veya App Groups (hassas olmayanlar için UserDefaults kabul edilebilir)
  - HMAC Gizli Anahtarı: Güvenli depolamada saklanır (Keychain/Keystore)

- [x] **Kayıt Tutmama**: DNS sorguları veya kullanıcı etkinliği kaydedilmez
  - Uygulama: DNS sorguları değil, yalnızca hatalar loglanır
  - Gizlilik: Kullanıcı etkinliği izlenmez
  - Uyumluluk: Gizlilik öncelikli tasarım

- [x] **Girdi Doğrulama**: Tüm girdiler doğrulanır ve temizlenir
  - Uygulama: Alan adları eklenmeden önce doğrulanır
  - Temizleme: Geçersiz karakterleri kaldır
  - Güvenlik: Hatalı girdileri reddet

### Ağ Güvenliği

- [x] **DNS Yönlendirme**: Güvenli DNS yönlendirme
  - Uygulama: Güvenilir DNS sunucularına yönlendirme (1.1.1.1, 8.8.8.8)
  - Doğrulama: DNS yanıtlarının geçerli olduğundan emin ol
  - Zaman aşımı: Takılmaları önlemek için 3 saniye zaman aşımı

- [x] **Veri İletimi Yok**: Kullanıcı verisi iletilmez
  - Uygulama: Yalnızca engel listesi güncellemeleri indirilir
  - Gizlilik: DNS sorguları, gezinme geçmişi veya kişisel veri gönderilmez
  - Uyumluluk: Gizlilik öncelikli mimari

### Eklenti Güvenliği

- [x] **Sandboxing**: Eklenti izole süreçte çalışır
  - Uygulama: Network Extension OS tarafından sandbox’lanır
  - Güvenlik: Uygulama verilerine doğrudan erişemez (App Groups kullanır)
  - Yalıtım: Eklenti hataları ana uygulamayı çökertmez

- [x] **Hata Yönetimi**: Hatalar kontrollü şekilde ele alınır
  - Uygulama: Hatalarda güvenli çalışma modu
  - Güvenlik: Engel listesi bozulsa bile internet çalışmaya devam eder
  - Kurtarma: Hatalarda engel listesi otomatik yeniden yüklenir

---

## Güvenlik için İyi Uygulamalar

### HMAC Gizli Anahtar Yönetimi

**Geliştirme**:
```
Geliştirme/test için varsayılan gizli anahtarı kullanın
Gizli anahtar: "antislot-secret-key-change-in-production"
```

**Üretim**:
```
✅ Gizli anahtarı şurada saklayın:
- Android: EncryptedSharedPreferences veya Keystore
- iOS: Keychain

✅ Gizli anahtarı düzenli aralıklarla döndürün (6-12 ayda bir)
✅ Güçlü rastgele gizli anahtar kullanın (32+ bayt)
✅ Gizli anahtarı asla kaynak kontrolüne eklemeyin

✅ Mobil istemci için anahtar, SecureStore/Keychain'de tutulmalı.
   İlk kurulumda EXPO_PUBLIC_HMAC_SECRET üzerinden alınıp SecureStore'a yazılabilir
   (prod ortamında gerçek anahtar güvenli dağıtımla sağlanmalıdır).
```

### Güncelleme Stratejisi

**Güvenli Güncellemeler**:
1. HMAC imzasını doğrula
2. Engel listesi yapısını doğrula
3. Sürümü kontrol et (geri düşürme yapma)
4. Geçici dosyaya yaz
5. Atomik yeniden adlandır (başarılıysa)
6. Eklentiye yeniden yükleme bildirimi gönder

**Geri Alma Stratejisi**:
- Güncelleme başarısızsa mevcut engel listesini koru
- Hata ayıklama için hata kaydı tut
- Güncellemeyi daha sonra tekrar dene (üstel geri çekilme)
- Kullanıcı manuel olarak yenileyebilir

### Gizlilik Koruması

**Kayıt Tutmama**:
- ✅ DNS sorguları kaydedilmez
- ✅ Gezinme geçmişi saklanmaz
- ✅ Kullanıcı etkinliği izlenmez
- ✅ Yalnızca hata kayıtları (hata ayıklama için)

**İletim Yok**:
- ✅ İstatistikler iletilmez
- ✅ DNS sorguları sunuculara gönderilmez
- ✅ Cihaz tanımlayıcıları gönderilmez
- ✅ Yalnızca engel listesi güncellemeleri indirilir

**Kullanıcı Kontrolü**:
- ✅ Kullanıcı istatistikleri sıfırlayabilir
- ✅ Kullanıcı beyaz listeyi temizleyebilir
- ✅ Kullanıcı korumayı devre dışı bırakabilir
- ✅ Kullanıcı tüm özellikleri kontrol eder

---

## Uyumluluk Kontrol Listesi

### Google Play

- [x] VPN hizmeti açıklaması uygulamada yer alıyor
- [ ] Gizlilik politikası URL'si Play Console'da sağlandı
- [ ] VPN izin gerekçesi sağlandı
- [x] Kullanıcı verisi toplanmıyor (doğrulandı)
- [x] Kullanıcı VPN'i açıkça etkinleştiriyor (doğrulandı)

### Apple App Store

- [ ] Network Extension gerekçesi Review Notes'ta sağlandı
- [ ] Gizlilik politikası URL'si App Store Connect'te sağlandı
- [x] Onboarding akışında onay alındı
- [x] Sınırlamalar uygulama içinde açıklandı (DoH, uygulama içi tarayıcılar)
- [x] Kullanıcı VPN'i açıkça etkinleştiriyor (doğrulandı)
- [x] Kullanıcı verisi toplanmıyor (doğrulandı)

### Platformlar Arası

- [x] Gizlilik politikası erişilebilir (giriş gerektirmez)
- [x] Uygulama içi açıklamalar gerekli tüm bilgileri içerir
- [x] VPN etkinleştirme öncesi kullanıcı onayı alındı
- [x] İstatistikler yalnızca yerelde (iletilmez)
- [x] HMAC doğrulaması uygulanmış
- [x] Tüm API çağrıları için TLS/HTTPS
- [x] Güvenli güncelleme mekanizması uygulanmış
- [x] Hata yönetimi hassas veriyi ifşa etmez

---

## Hızlı Referans

### Açıklama Metni (Kopyala-Yapıştır)

**Android - Ana Ekran**:
```
VPN Gerekli: Bu uygulama, DNS düzeyinde kumar sitelerini engellemek için
yerel bir VPN kullanır. Gezinme verileri toplanmaz.
Korumanın etkinleşmesi için Ayarlar > Ağ > VPN bölümünden VPN'i açın.
```

**iOS - Ana Ekran**:
```
VPN Gerekli: Bu uygulama, DNS düzeyinde kumar sitelerini engellemek için
Network Extension kullanır. Gezinme verileri toplanmaz.
Korumanın etkinleşmesi için Ayarlar > VPN bölümünden VPN'i açın.
```

### Gizlilik Politikası Parçası (Kopyala-Yapıştır)

```
Gizlilik Politikası - Veri Toplama

Bu uygulama hiçbir kullanıcı verisini toplamaz, saklamaz veya iletmez:

• Gezinme geçmişi yok
• DNS sorguları kaydı yok
• Kişisel bilgi yok
• Cihaz tanımlayıcıları yok
• Analitik veya izleme yok
• Üçüncü taraf veri paylaşımı yok
• Veri satışı yok (satacak veri toplanmaz)

İstatistikler (engellenen/izin verilen sayıları) yalnızca cihazınızda
yerel olarak saklanır ve istediğiniz zaman sıfırlanabilir. İstatistikler
asla ağ üzerinden iletilmez.

Engel listesi güncellemeleri sunucularımızdan indirilir. Bu istekler
kullanıcı bilgisi içermez ve HMAC imzalarıyla doğrulanır.
```

---

**Son Güncelleme**: 2024  
**Sürüm**: 1.0
