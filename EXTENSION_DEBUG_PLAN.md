# Eklenti Kullanımdan Kaldırma Uyarısı Hata Ayıklama Planı

## Sorun
`fs.existsSync` kullanımdan kaldırma uyarısı görünüyor; bunun nedeni VS Code/Cursor eklentilerinin birden fazla Node süreci çalıştırması olabilir.

## İzolasyon Stratejisi

### Aşama 1: Eklenti Etkisini Doğrula

#### Adım 1: Cursor'u Eklentiler Kapalıyken Başlat

**Yöntem 1: Komut Satırı (Önerilen)**
```powershell
# PowerShell'i Yönetici olarak açın (gerekiyorsa)
# Çalışma dizinine gidin
cd "C:\Users\dferh\OneDrive\Masaüstü\antislot"

# Cursor'u eklentiler kapalıyken başlatın
& "C:\Users\$env:USERNAME\AppData\Local\Programs\cursor\Cursor.exe" --disable-extensions .

# YA DA Cursor PATH içindeyse:
cursor --disable-extensions .
```

**Yöntem 2: Windows Görev Yöneticisi**
- `Ctrl + Shift + Esc` ile Görev Yöneticisi'ni açın
- Tüm `Cursor.exe` süreçlerini sonlandırın
- Yöntem 1 ile eklentiler kapalıyken Cursor'u başlatın

#### Adım 2: Eklentisiz Test Et
1. Uyarıyı gösteren proje/betiğinizi çalıştırın
2. Uyarı kaybolursa → **Eklentinin neden olduğu doğrulanır**
3. Uyarı devam ederse → Sorun kodunuzdadır (`scripts/reset-project.js` düzeltmesini kontrol edin)

---

### Aşama 2: Sorunlu Eklentiyi Belirle

#### Adım 2.1: Mevcut Node Süreçlerini Kontrol Et
```powershell
# Tüm Node süreçlerini ayrıntılarıyla listele
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path, StartTime | Format-Table -AutoSize

# Daha ayrıntılı görünüm
Get-Process node -ErrorAction SilentlyContinue | Format-List *
```

#### Adım 2.2: İkili Arama Yöntemi (En Hızlı)

1. **Etkin eklentilerin listesini alın:**
   ```powershell
   # Cursor eklentileri genelde burada olur:
   cd "$env:USERPROFILE\.cursor\extensions"
   Get-ChildItem -Directory | Select-Object Name | Format-Table
   ```

2. **Eklentilerin yarısını devre dışı bırakın:**
   - Cursor Ayarlarını açın: `Ctrl + ,`
   - Arama: "extensions"
   - "Extensions" → Dişli simgesi → Eklentilerin yaklaşık %50'si için "Disable (Workspace)"

3. **Test edip daraltın:**
   - Uyarı **kaybolursa** → Sorun devre dışı bırakılan gruptadır
   - Uyarı **devam ederse** → Sorun etkin gruptadır
   - Eklentiyi bulana kadar daha küçük gruplarla tekrar edin

#### Adım 2.3: Tek Tek Etkinleştir (En Güvenilir)

1. **Sıfırdan başla:** Cursor'u tamamen kapatın
2. **Eklentisiz başlatın:** `cursor --disable-extensions .`
3. **Eklentileri tek tek etkinleştirin:**
   - Komut Paleti'ni açın: `Ctrl + Shift + P`
   - Şunu yazın: "Extensions: Show Installed Extensions"
   - Bir eklentiyi etkinleştir → Test et → Devre dışı bırak → Sonrakine geç

**Yaygın şüpheliler (önce bunları kontrol edin):**
- ESLint eklentileri
- Prettier eklentileri
- TypeScript/JavaScript language server'ları
- Git eklentileri
- Dosya izleyici eklentileri
- Terminal eklentileri

---

### Aşama 3: Trace Çıktısını Yakala

#### Adım 3.1: Trace Deprecation ile Çalıştır

```powershell
# Çalışma dizinine gidin
cd "C:\Users\dferh\OneDrive\Masaüstü\antislot"

# Trace ile çalıştır (uyarıyı tetikleyen komuta göre ayarlayın)
# npm komutları için:
$env:NODE_OPTIONS="--trace-deprecation"
npm start

# Doğrudan node çalıştırma için:
node --trace-deprecation .\scripts\reset-project.js

# Expo için:
$env:NODE_OPTIONS="--trace-deprecation"
npx expo start
```

#### Adım 3.2: Eklenti Node Süreçlerini Bul

```powershell
# Cursor çalışırken Node süreçlerini kontrol edin
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "PID: $($_.Id) | Path: $($_.Path) | StartTime: $($_.StartTime)"
}

# Eklenti yollarına göre filtrele
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*\.cursor\extensions\*" -or
    $_.Path -like "*\AppData\Local\Cursor\*"
} | Format-List *
```

#### Adım 3.3: Çıktıyı Dosyaya Yönlendir

```powershell
# Kullanımdan kaldırma uyarıları dahil tüm çıktıyı yakala
node --trace-deprecation .\scripts\reset-project.js 2>&1 | Tee-Object -FilePath "deprecation-trace.txt"

# Trace dosyasını görüntüle
Get-Content deprecation-trace.txt
```

---

### Aşama 4: Eklenti Belirlendikten Sonra

#### Çözüm 1: Eklentiyi Güncelle
```powershell
# Cursor içinde: Ctrl + Shift + X
# Eklentiyi arayın → Varsa "Güncelle" tıklayın
```

#### Çözüm 2: Kararlı Sürüme Geri Dön
1. Cursor marketplace'te eklentiyi açın
2. "Başka Bir Sürüm Yükle..." seçeneğine tıklayın
3. Daha eski, kararlı bir sürüm seçin (2-3 sürüm geri deneyin)

#### Çözüm 3: Sorunlu Eklenti Ayarlarını Devre Dışı Bırak

Kontrol edilecek yaygın ayarlar (Ayarlar → Extensions → [Eklenti Adı]):
- **ESLint:** `eslint.enable: false` (geçici olarak)
- **Prettier:** `prettier.enable: false`
- **TypeScript:** `typescript.tsdk` (farklı TypeScript sürümü deneyin)
- **Dosya İzleyiciler:** "watch" özelliklerini kapatın

#### Çözüm 4: Alternatif Eklenti Kullan

Eklenti kritikse ve bozuksa:
- Marketplace'te alternatif arayın
- Eklenti deposunun GitHub issues bölümünü kontrol edin
- Sorunu eklenti geliştiricisine bildirin

---

## Hızlı Kontrol Listesi

```
☐ Adım 1: --disable-extensions bayrağıyla başlat
☐ Adım 2: Uyarı kayboluyor mu test et
☐ Adım 3: Evetse ikili aramaya geç
☐ Adım 4: Cursor çalışırken Node süreçlerini kontrol et
☐ Adım 5: trace-deprecation çıktısını yakala
☐ Adım 6: Uyarıya neden olan eklentiyi belirle
☐ Adım 7: Sorunlu eklentiyi güncelle/geri al/devre dışı bırak
☐ Adım 8: Uyarının kaybolduğunu doğrula
```

---

## Hızlı Komut Referansı

```powershell
# Cursor'u eklentisiz başlat
cursor --disable-extensions .

# Node süreçlerini kontrol et
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, Path

# Trace ile çalıştır
$env:NODE_OPTIONS="--trace-deprecation"; npm start

# Eklenti klasörünü listele
Get-ChildItem "$env:USERPROFILE\.cursor\extensions" -Directory
```

---

## Bu Neden Olur

**Kök Neden:**
- Node.js v20+ sürümleri, `fs.existsSync()` fonksiyonunu string dışı argümanlarla çağırmayı kullanımdan kaldırdı
- Eski eklentiler `undefined`, `null` veya nesneleri `fs.existsSync()`'e iletebilir
- Eklentiler ayrı Node süreçlerinde çalıştığı için birden fazla uyarı oluşur

**Yaygın Nedenler:**
1. **Dil Sunucuları** (TypeScript, JavaScript, Python) - Güncelleme kontrolü yapın
2. **Linter'lar** (ESLint, JSHint) - Genellikle dosya sistemi kontrolleri vardır
3. **Dosya İzleyiciler** - Dizinleri `fs.existsSync` ile izler
4. **Git Eklentileri** - Depo durumunu dosya sistemi API'leriyle kontrol eder

**Önleme:**
- Eklentileri güncel tutun
- Kullanmadığınız eklentileri devre dışı bırakın
- Güvenilir eklenti kaynaklarını tercih edin
- Eklenti depolarını (GitHub) kullanımdan kaldırma düzeltmeleri için takip edin

---

## Alternatif: Uyarıyı Bastırmak (Önerilmez)

Eklentiyi düzeltemiyorsanız:
```javascript
// package.json veya betikte
process.removeAllListeners('warning');
```

**Daha iyi:** Bastırmak yerine sorunu kaynağında (eklentide) düzeltin.
