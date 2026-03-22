# settings.tsx – UTF-8 ve ok ikonu düzeltmesi

## Yapılanlar
- Türkçe metinler UTF-8 ile düzeltildi (Güvenlik, Politikası, Şartları, özelliği, vb.).
- Ok metni (`→`) link satırlarında **Ionicons** ile değiştirildi (`chevron-forward`, `arrow-back`).
- `styles.linkArrow` artık kullanılmıyor (silinebilir).

## Sizin yapmanız gereken (encoding nedeniyle otomatik eşleşmedi)
Dosyada **Ionicons** satırından hemen sonra gelen ve **sadece ok karakteri + `</Text>`** içeren 10 satır kaldı. Bunları elle silin:

1. `app/settings.tsx` dosyasını açın.
2. **UTF-8** olarak kaydedin (VS Code: "Save with Encoding" → UTF-8).
3. **Ara** (Ctrl+F): `</Text>`  
4. Ionicons satırının hemen altında, sadece ok işareti (veya `â†'`) + `</Text>` olan satırı bulun; bu satırı **tamamen silin**.
5. Aynı işlemi toplam **10 kez** yapın (her link satırı için bir tane).

Alternatif: Bu satırların tamamını silmek için proje kökünde şu komutu çalıştırabilirsiniz (Node path’in doğru olduğundan emin olun):

```bash
node -e "const fs=require('fs'); const p='app/settings.tsx'; let s=fs.readFileSync(p,'utf8'); s=s.replace(/(Ionicons name=\"chevron-forward\"[^\n]+\n)[^\n]*<\\/Text>\n/g,'$1'); fs.writeFileSync(p,s);"
```
