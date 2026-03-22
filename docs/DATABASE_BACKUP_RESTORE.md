# Veritabanı Backup ve Restore Planı – AntiSlot Premium (Postgres)

Bu belge, `antislot` premium verilerini tutan Postgres veritabanı için backup ve restore işlemlerini tanımlar.

## 1. Veritabanı Yapısı

| Tablo | Açıklama |
|-------|----------|
| `premium_entitlements` | Kullanıcı premium kayıtları |
| `premium_processed_events` | İşlenmiş IAP/webhook event anahtarları (TTL ~45 gün) |

## 2. Backup Planı

### 2.1 `pg_dump` ile tam backup

```bash
# Günlük tam backup (örnek)
pg_dump -h localhost -U antislot -d antislot -Fc -f antislot-premium-$(date +%Y%m%d-%H%M%S).dump

# Plain SQL format
pg_dump -h localhost -U antislot -d antislot -f antislot-premium-$(date +%Y%m%d).sql
```

### 2.2 Sadece premium tabloları

```bash
pg_dump -h localhost -U antislot -d antislot \
  -t premium_entitlements -t premium_processed_events \
  -Fc -f antislot-premium-tables-$(date +%Y%m%d).dump
```

### 2.3 Zamanlama (örnek cron)

```cron
# Her gün 03:00'te backup
0 3 * * * pg_dump -h localhost -U antislot -d antislot -Fc -f /backups/antislot-$(date +\%Y\%m\%d).dump
```

### 2.4 Bulut entegrasyonu

- **AWS RDS**: Otomatik günlük snapshot; ek olarak `pg_dump` ile manuel backup.
- **GCP Cloud SQL**: Otomatik günlük backup; ek olarak export.
- **Self-hosted**: Cron + `pg_dump` + S3/GCS/NFS’e kopyalama.

### 2.5 Saklama süresi (log retention)

| Tür | Önerilen süre |
|-----|---------------|
| Günlük backup | 7 gün |
| Haftalık backup | 4 hafta |
| Aylık backup | 12 ay |
| Kritik sürüm öncesi | En az 1 yıl |

---

## 3. Restore Planı

### 3.1 Custom format (.dump) ile restore

```bash
pg_restore -h localhost -U antislot -d antislot --clean --if-exists antislot-premium-20250208.dump
```

### 3.2 SQL dosyası ile restore

```bash
psql -h localhost -U antislot -d antislot -f antislot-premium-20250208.sql
```

### 3.3 Yeni DB’ye restore

```bash
createdb antislot_restored
pg_restore -h localhost -U antislot -d antislot_restored antislot-premium-20250208.dump
```

### 3.4 Disaster recovery adımları

1. Mevcut sunucu/DB’yi durdur.
2. Yeni Postgres instance başlat (veya mevcut standby’ı promote et).
3. Son geçerli backup’tan restore et.
4. Gerekirse WAL replay / point-in-time recovery uygula.
5. `DATABASE_URL`’i güncelle ve uygulamayı yeniden başlat.
6. Healthcheck ile doğrula: `GET /health` → ok.

---

## 4. Migration: JSON Dosyasından Postgres’e

Mevcut `PREMIUM_DATA_FILE` (JSON) verilerini Postgres’e taşımak için:

```bash
cd server
npm install pg  # gerekirse
node scripts/migrate-premium-file-to-postgres.mjs ./data/premium-state.json "postgresql://antislot:PASSWORD@localhost:5432/antislot"
```

**Sıra:**
1. Postgres instance’ı çalıştır.
2. `server/migrations/001_premium_tables.sql` ile şemayı oluştur.
3. Uygulamayı durdur (JSON yazımı durdurulsun).
4. Migration script’i çalıştır.
5. `DATABASE_URL`’i ayarla.
6. Uygulamayı başlat; `PREMIUM_DATA_FILE` artık kullanılmaz.

---

## 5. Özet Checklist

- [ ] Günlük `pg_dump` backup zamanlaması
- [ ] Backup dosyalarının güvenli depolaması (şifreli, ayrı lokasyon)
- [ ] Restore prosedürünün dokümante edilmesi ve test edilmesi
- [ ] Point-in-time recovery (PITR) gerekiyorsa WAL arşivleme
- [ ] Migration script’inin JSON→Postgres geçişinde çalıştırılması
