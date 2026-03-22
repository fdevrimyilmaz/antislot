# EAS Build Düzeltme Adımları

Bu doküman iOS credential kurulumu ve Android "Prepare project build phase" hatasını gidermek için adım adım rehberdir.

---

## 1. iOS Production Credential Kurulumu

iOS build’in çalışması için **bir kez** gerçek bir terminalde (PowerShell, CMD veya macOS Terminal) interaktif credential kurulumu yapılmalı.

### Adımlar

1. **Proje klasörüne geçin**
   ```bash
   cd "c:\Users\dferh\OneDrive\Masaüstü\HOLLAP VE ANTİ SLOT\antislot"
   ```

2. **EAS credential sihirbazını çalıştırın**
   ```bash
   npx eas-cli credentials:configure-build -p ios -e production
   ```

3. **Sihirbazda yapılacaklar**
   - Expo hesabınızla giriş (zaten giriş yaptıysanız atlanır)
   - **Apple ID** ile giriş (App Store Connect / Developer hesabı)
   - **Team** seçimi (Apple Developer Program üyeliğinize ait takım)
   - **Distribution Certificate:** Yeni oluştur veya mevcut bir tane yükle
   - **Provisioning Profile:** App Store dağıtımı için uygun profile (otomatik oluşturulabilir)

4. **Kurulum sonrası build**
   ```bash
   npx eas-cli build -p ios --profile production --non-interactive --freeze-credentials
   ```

### Notlar
- Apple Developer Program üyeliği ($99/yıl) gereklidir.
- Sertifika ve profile EAS sunucularında saklanır; bir sonraki build’lerde `--non-interactive` kullanılabilir.
- `eas.json` içinde `credentialsSource: "remote"` olduğu için EAS bu bilgileri kullanır.

---

## 2. Android "Prepare project build phase" / Unknown Error

Android credential’lar tamam; build EAS’a gidiyor ama **Prepare project build phase** aşamasında "Unknown error" ile düşüyor. Aşağıdakileri sırayla deneyin.

### 2.1 Build log’u inceleyin

1. [Expo Dashboard](https://expo.dev) → hesabınız → **antislot** projesi → **Builds**
2. Başarısız Android build’e tıklayın (örn. `f049887d-ea64-4ace-90c4-2d42286a5028`)
3. **Build log** sekmesinde "Prepare project build phase" bölümünü açın; tam hata mesajı veya stack trace orada olacaktır.

Yaygın nedenler:
- **Node/npm sürüm uyumsuzluğu** → `eas.json` içinde `node` sürümü sabitleyebilirsiniz
- **Native modül (GamblingBlocker, SharedConfig, SmsRole)** derleme hatası → log’da `gradle` veya `ndk` hataları aranmalı
- **Bellek / zaman aşımı** → build’i tekrar çalıştırmak veya EAS’ta daha güçlü bir makine kullanmak

### 2.2 Build’i yeniden çalıştırın

Bazen geçici ağ veya EAS tarafı kaynaklı olabiliyor:

```bash
npx eas-cli build -p android --profile production --non-interactive --freeze-credentials
```

### 2.3 Build image’ı sabitleme (isteğe bağlı)

`eas.json` içinde production Android için özel image kullanıyorsunuz (`"image": "latest"`). Bazen `latest` yeni bir image’a geçince uyumsuzluk çıkabilir. [Expo dokümantasyonundaki](https://docs.expo.dev/build-reference/infrastructure/) güncel image listesinden bir sürüm (örn. `ubuntu-24.04-jammy`) deneyebilirsiniz:

```json
"android": {
  "image": "ubuntu-24.04-jammy",
  "buildType": "app-bundle",
  "credentialsSource": "remote"
}
```

### 2.4 Yerel prebuild kontrolü (native modüller için)

Projede native modüller (GamblingBlockerModule, SharedConfigModule) var. EAS sunucusu `expo prebuild` çalıştırıyor. Yerelde prebuild’in sorunsuz çalıştığından emin olun:

```bash
npx expo prebuild --platform android --no-install
```

Hata alırsanız (örn. MainApplication bulunamadı), bunu çözmek EAS build’e de yansır. `PREBUILD_NOTES.md` içinde geçmiş workaround’lar var.

---

## 3. Sentry DSN (İsteğe bağlı)

Production’da crash / release izleme için EAS ortam değişkenine `EXPO_PUBLIC_SENTRY_DSN` ekleyin:

```bash
npx eas-cli env:create production --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@sentry.io/..." --visibility plaintext --non-interactive --force
```

Değeri [Sentry](https://sentry.io) projenizden alın (Client Keys / DSN).

---

## Özet komutlar

| Amaç | Komut |
|------|--------|
| iOS credential kur (bir kez, interaktif) | `npx eas-cli credentials:configure-build -p ios -e production` |
| iOS production build | `npx eas-cli build -p ios --profile production --non-interactive --freeze-credentials` |
| Android production build | `npx eas-cli build -p android --profile production --non-interactive --freeze-credentials` |
| EAS env listesi | `npx eas-cli env:list --environment production` |

Build log linki (giriş gerekir):  
https://expo.dev/accounts/512ferhat512/projects/antislot/builds
