# Expo Sorun Giderme ve Temizleme Scripti
# Bu script cache'leri temizler ve Expo'yu düzgün çalıştırır

$ErrorActionPreference = "Continue"
$projectPath = "C:\Users\dferh\OneDrive\Masaüstü\antislot"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Sorun Giderme ve Temizleme" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Set-Location -LiteralPath $projectPath
    
    # 1. .expo klasörünü temizle
    Write-Host "[1/6] .expo klasörünü temizleniyor..." -ForegroundColor Yellow
    if (Test-Path ".expo") {
        Remove-Item -Recurse -Force ".expo"
        Write-Host ".expo klasörü silindi" -ForegroundColor Green
    } else {
        Write-Host ".expo klasörü bulunamadı" -ForegroundColor Gray
    }
    Write-Host ""
    
    # 2. node_modules/.cache temizle
    Write-Host "[2/6] node_modules/.cache temizleniyor..." -ForegroundColor Yellow
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache"
        Write-Host "node_modules/.cache silindi" -ForegroundColor Green
    }
    Write-Host ""
    
    # 3. Metro bundler cache temizle
    Write-Host "[3/6] Metro bundler cache temizleniyor..." -ForegroundColor Yellow
    $tempPath = $env:TEMP
    Get-ChildItem -Path $tempPath -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $tempPath -Filter "haste-map-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Metro cache temizlendi" -ForegroundColor Green
    Write-Host ""
    
    # 4. Watchman cache temizle (varsa)
    Write-Host "[4/6] Watchman cache temizleniyor (varsa)..." -ForegroundColor Yellow
    $watchmanPath = "$env:LOCALAPPDATA\Temp\watchman-*"
    if (Test-Path $watchmanPath) {
        Remove-Item -Recurse -Force $watchmanPath -ErrorAction SilentlyContinue
    }
    Write-Host ""
    
    # 5. .env dosyası kontrol et
    Write-Host "[5/6] .env dosyası kontrol ediliyor..." -ForegroundColor Yellow
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host ".env dosyası oluşturuldu" -ForegroundColor Green
        } else {
            Write-Host "UYARI: .env.example dosyası bulunamadı" -ForegroundColor Red
        }
    } else {
        Write-Host ".env dosyası mevcut" -ForegroundColor Green
    }
    Write-Host ""
    
    # 6. Bağımlılıkları kontrol et
    Write-Host "[6/6] Bağımlılıklar kontrol ediliyor..." -ForegroundColor Yellow
    if (-not (Test-Path "node_modules")) {
        Write-Host "node_modules bulunamadı, npm install çalıştırılıyor..." -ForegroundColor Yellow
        npm install
    } else {
        Write-Host "node_modules mevcut" -ForegroundColor Green
    }
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Temizleme tamamlandı!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Şimdi Expo'yu başlatmak için:" -ForegroundColor Yellow
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "veya" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  npx expo start --clear" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Hata: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manuel olarak çalıştırmak için:" -ForegroundColor Yellow
    Write-Host "  cd `"$projectPath`"" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
    exit 1
}
