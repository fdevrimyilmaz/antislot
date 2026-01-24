# Hızlı Hata Ayıklama Kontrol Listesi

## 🎯 Hedef: `fs.existsSync` kullanımdan kaldırma uyarısına neden olan eklentiyi bulmak

---

### Adım 1: Eklenti Etkisini Doğrula (2 dakika)

```powershell
# Cursor'u tamamen kapatın
# Sonra eklentiler kapalıyken başlatın:
cd "C:\Users\dferh\OneDrive\Masaüstü\antislot"
cursor --disable-extensions .

# Projenizi test edin (uyarıyı gösteren komutu çalıştırın)
npm start  # veya kendi komutunuz
```

**✅ Uyarı KAYBOLURSA → Neden eklentidir (Adım 2'ye geçin)**  
**❌ Uyarı DEVAM EDERSE → Sorun kodunuzdadır (`scripts/reset-project.js` dosyasını kontrol edin)**

---

### Adım 2: İkili Arama (5-10 dakika)

1. **Cursor'u normal şekilde yeniden açın** (eklentiler açıkken)
2. **Eklentilerin ~%50'sini devre dışı bırakın:**
   - `Ctrl + Shift + X` (Eklentiler görünümü)
   - Eklentilerin yarısını devre dışı bırakın (dişli simgesi → "Disable")
3. **Tekrar test edin** (gerekirse Cursor'u yeniden başlatın)
   - ✅ **Uyarı gitti mi?** → Suçlu devre dışı bırakılan gruptadır
   - ❌ **Uyarı hâlâ var mı?** → Suçlu etkin gruptadır
4. **Bulana kadar** daha küçük gruplarla tekrar edin

---

### Adım 3: Trace ile Doğrula (İsteğe Bağlı)

```powershell
# Trace çıktısını yakala
$env:NODE_OPTIONS="--trace-deprecation"
npm start 2>&1 | Tee-Object -FilePath "trace.txt"

# trace.txt dosyasında eklenti yollarını kontrol edin
Get-Content trace.txt | Select-String "extension"
```

---

### Adım 4: Eklentiyi Düzelt

**Seçenek A: Eklentiyi Güncelle**
- `Ctrl + Shift + X` → Eklentiyi bulun → "Güncelle" tıklayın

**Seçenek B: Eklentiyi Devre Dışı Bırak**
- Kritik değilse: Devre dışı bırakın
- Kritikse: Alternatif eklenti arayın

**Seçenek C: Eklentiyi Geri Al**
- Eklenti sayfası → "Başka Bir Sürüm Yükle" → Daha eski sürümü seçin

---

## 🔧 Hızlı Komutlar

```powershell
# Eklentisiz başlat
cursor --disable-extensions .

# Node süreçlerini kontrol et
Get-Process node | Select-Object Id, Path

# Trace ile çalıştır
$env:NODE_OPTIONS="--trace-deprecation"; npm start

# Debug betiğini kullan
.\debug-extension-warning.ps1
```

---

## 📋 İlerleme Takibi

- [ ] Adım 1: Eklentisiz test edildi
- [ ] Adım 2: İkili arama başlatıldı
- [ ] Adım 3: Eklenti tespit edildi
- [ ] Adım 4: Eklenti düzeltildi/devre dışı bırakıldı
- [ ] Adım 5: Uyarı çözüldü ✅

---

**Süre tahmini:** toplam 10-15 dakika
