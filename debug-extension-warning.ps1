# Eklenti Kullanımdan Kaldırma Uyarısı Hata Ayıklama Betiği
# Eklentiyle ilgili Node süreçlerini tespit etmek için PowerShell'de çalıştırın

Write-Host "=== Eklenti Kullanımdan Kaldırma Uyarısı Hata Ayıklama Aracı ===" -ForegroundColor Cyan
Write-Host ""

# Adım 1: Cursor çalışıyor mu kontrol et
$cursorProcesses = Get-Process "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    Write-Host "[INFO] Cursor çalışıyor. $($cursorProcesses.Count) süreç bulundu." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[INFO] Cursor çalışmıyor. Eklenti süreçlerini görmek için Cursor'u başlatın." -ForegroundColor Yellow
    Write-Host ""
}

# Adım 2: Tüm Node süreçlerini listele
Write-Host "=== Node Süreçleri (eklenti süreçleri dahil) ===" -ForegroundColor Cyan
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        $path = $_.Path
        $isExtension = $false
        $extensionName = ""
        
        # Eklenti süreci mi kontrol et
        if ($path -like "*\.cursor\extensions\*" -or $path -like "*\AppData\Local\Cursor\*") {
            $isExtension = $true
            # Yoldan eklenti adını çıkarmayı dene
            if ($path -match "extensions[\\/]([^\\/]+)") {
                $extensionName = $matches[1]
            }
        }
        
        $color = if ($isExtension) { "Yellow" } else { "White" }
        $label = if ($isExtension) { "[EKLENTI]" } else { "[UYGULAMA]" }
        
        Write-Host "$label PID: $($_.Id)" -ForegroundColor $color -NoNewline
        Write-Host " | BaslangicSaati: $($_.StartTime.ToString('HH:mm:ss'))"
        Write-Host "   Yol: $path" -ForegroundColor Gray
        if ($extensionName) {
            Write-Host "   Eklenti: $extensionName" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    Write-Host "Toplam Node süreci: $($nodeProcesses.Count)" -ForegroundColor Cyan
} else {
    Write-Host "[INFO] Node süreci bulunamadı." -ForegroundColor Yellow
}
Write-Host ""

# Adım 3: Yüklü eklentileri listele
Write-Host "=== Yüklü Eklentiler (ilk 20) ===" -ForegroundColor Cyan
$extensionsPath = "$env:USERPROFILE\.cursor\extensions"
if (Test-Path $extensionsPath) {
    $extensions = Get-ChildItem $extensionsPath -Directory | Select-Object -First 20
    if ($extensions) {
        $extensions | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Toplam eklenti sayısı: $((Get-ChildItem $extensionsPath -Directory).Count)" -ForegroundColor Cyan
    } else {
        Write-Host "[INFO] $extensionsPath içinde eklenti bulunamadı" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Eklenti dizini bulunamadı: $extensionsPath" -ForegroundColor Yellow
}
Write-Host ""

# Adım 4: Talimatlar
Write-Host "=== Sonraki Adımlar ===" -ForegroundColor Cyan
Write-Host "1. Cursor'u tamamen kapatın" -ForegroundColor White
Write-Host "2. Şu komutla başlatın: cursor --disable-extensions ." -ForegroundColor Green
Write-Host "3. Projenizi test edin - uyarı kaybolursa nedeni bir eklentidir" -ForegroundColor White
Write-Host "4. Cursor eklentilerle çalışırken bu betiği yeniden çalıştırarak eklenti Node süreçlerini görün" -ForegroundColor White
Write-Host ""

# Adım 5: Trace toplamayı öner
Write-Host "=== Trace Toplama ===" -ForegroundColor Cyan
Write-Host "trace-deprecation çıktısını yakalamak için şunu çalıştırın:" -ForegroundColor White
Write-Host '  $env:NODE_OPTIONS="--trace-deprecation"' -ForegroundColor Green
Write-Host "  npm start" -ForegroundColor Green
Write-Host ""
Write-Host "Veya dosyaya yönlendirin:" -ForegroundColor White
Write-Host '  $env:NODE_OPTIONS="--trace-deprecation"' -ForegroundColor Green
Write-Host "  npm start 2>&1 | Tee-Object -FilePath deprecation-trace.txt" -ForegroundColor Green
Write-Host ""

pause
