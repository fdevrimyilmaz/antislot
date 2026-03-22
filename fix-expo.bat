@echo off
chcp 65001 >nul
echo ========================================
echo Expo Sorun Giderme ve Temizleme
echo ========================================
echo.

cd /d "C:\Users\dferh\OneDrive\Masaüstü\antislot"

echo [1/6] .expo klasörünü temizleniyor...
if exist ".expo" (
    rmdir /s /q ".expo"
    echo .expo klasörü silindi
) else (
    echo .expo klasörü bulunamadı
)
echo.

echo [2/6] node_modules/.cache temizleniyor...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo node_modules/.cache silindi
)
echo.

echo [3/6] Metro bundler cache temizleniyor...
if exist "%TEMP%\metro-*" (
    del /q /s "%TEMP%\metro-*" 2>nul
)
if exist "%TEMP%\haste-map-*" (
    del /q /s "%TEMP%\haste-map-*" 2>nul
)
echo Metro cache temizlendi
echo.

echo [4/6] Watchman cache temizleniyor (varsa)...
if exist "%LOCALAPPDATA%\Temp\watchman-*" (
    rmdir /s /q "%LOCALAPPDATA%\Temp\watchman-*" 2>nul
)
echo.

echo [5/6] .env dosyası kontrol ediliyor...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo .env dosyası oluşturuldu
    ) else (
        echo UYARI: .env.example dosyası bulunamadı
    )
) else (
    echo .env dosyası mevcut
)
echo.

echo [6/6] Bağımlılıklar kontrol ediliyor...
if not exist "node_modules" (
    echo node_modules bulunamadı, npm install çalıştırılıyor...
    call npm install
) else (
    echo node_modules mevcut
)
echo.

echo ========================================
echo Temizleme tamamlandı!
echo ========================================
echo.
echo Şimdi Expo'yu başlatmak için:
echo   npm start
echo.
echo veya
echo.
echo   npx expo start --clear
echo.
pause
