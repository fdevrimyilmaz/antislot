import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { formatCurrency } from "@/store/savingsStore";
import {
  addLossEntry,
  getLossLedger,
  removeLossEntry,
  totalLoss,
  type LossEntry,
} from "@/store/lossLedgerStore";

const PERIOD_SUGGESTIONS = [
  "Bu yıl",
  "Son 6 ay",
  "Son 3 ay",
  "Geçen yıl",
  "2 yıl önce",
];

function LossLedgerModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [entries, setEntries] = useState<LossEntry[]>([]);
  const [period, setPeriod] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setEntries(await getLossLedger());
      } catch (error) {
        reportError(error, { scope: "lossLedger.load", level: "warning" });
      }
    })();
  }, []);

  const total = totalLoss(entries);

  const handleAdd = async () => {
    const trimmedPeriod = period.trim();
    const amount = parseInt(amountInput.replace(/[^\d]/g, ""), 10);

    if (!trimmedPeriod) {
      haptics.warning();
      toast.warning("Dönem yaz (ör. '2023', 'Son 6 ay').", "Dönem eksik");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      haptics.warning();
      toast.warning("Geçerli bir tutar gir.", "Tutar eksik");
      return;
    }

    setSaving(true);
    haptics.tapMedium();
    try {
      const updated = await addLossEntry({
        period: trimmedPeriod,
        amount,
        note: note.trim() || undefined,
      });
      setEntries(updated);
      setPeriod("");
      setAmountInput("");
      setNote("");
      haptics.success();
      toast.success("Defter güncellendi.", "Eklendi");
    } catch (error) {
      reportError(error, { scope: "lossLedger.add" });
      haptics.error();
      toast.error("Kayıt yapılamadı.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (id: string) => {
    haptics.warning();
    Alert.alert("Kaydı Sil", "Bu kaybı listeden çıkar?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await removeLossEntry(id);
            setEntries(updated);
            haptics.success();
          } catch (error) {
            reportError(error, { scope: "lossLedger.remove" });
            haptics.error();
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={["#8B6614", "#7A580F", "#5A4108"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="receipt" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="receipt" size={11} color="#FFD074" />
              <Text style={styles.heroBadgeText}>KAYIP DEFTERİ</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Gerçek toplam
            </Text>
            <Text style={styles.heroSubtitle}>
              Bahse harcadığın paranın gerçek toplamını yazmak büyük ve
              caydırıcı bir aynadır. Tek bir bahis değil — toplam tablo.
            </Text>
            <View style={styles.heroTotalRow}>
              <Text style={styles.heroTotalLabel}>TOPLAM KAYIP</Text>
              <Text style={styles.heroTotalValue}>
                {formatCurrency(total, "₺")}
              </Text>
            </View>
          </LinearGradient>

          {/* Add */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Yeni Dönem Ekle"
              icon="add-circle"
              subtitle="Tahmini bir rakam — kesin olmasına gerek yok, yön gösterir."
            />

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Dönem</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="ör. 2023"
              placeholderTextColor={colors.textMuted}
              value={period}
              onChangeText={setPeriod}
              maxLength={40}
              accessibilityLabel="Dönem"
            />
            <View style={styles.suggestionRow}>
              {PERIOD_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    haptics.selection();
                    setPeriod(s);
                  }}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>
              Tahmini Kayıp (TL)
            </Text>
            <View
              style={[
                styles.amountWrap,
                { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.amountSign, { color: colors.primary }]}>₺</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Tutar"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>
              Not (isteğe bağlı)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Ne oldu, ne hatırlıyorsun?"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
              accessibilityLabel="Not"
            />

            <Button
              title={saving ? "Kaydediliyor" : "Deftere Ekle"}
              onPress={handleAdd}
              loading={saving}
              disabled={saving}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="add"
              style={styles.addBtn}
            />
          </Card>

          {/* List */}
          {entries.length > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Kayıtlı Dönemler"
                icon="list"
                meta={`${entries.length}`}
              />
              <View style={styles.list}>
                {entries.map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.entryRow,
                      { borderBottomColor: colors.cardBorder },
                    ]}
                  >
                    <View style={styles.entryMain}>
                      <Text style={[styles.entryPeriod, { color: colors.text }]}>
                        {entry.period}
                      </Text>
                      <Text style={[styles.entryAmount, { color: colors.danger }]}>
                        {formatCurrency(-entry.amount, "₺")}
                      </Text>
                      {entry.note ? (
                        <Text style={[styles.entryNote, { color: colors.textMuted }]}>
                          {entry.note}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemove(entry.id)}
                      style={styles.entryDelete}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Sil"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </Card>
          ) : (
            <Card style={styles.cardSpacing}>
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Defter henüz boş
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  Bir dönem ekleyerek başla. Bir kez gördüğünde aklın geri
                  dönmeyecek.
                </Text>
              </View>
            </Card>
          )}

          {/* Reflection */}
          {total > 0 ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.reflectRow}>
                <Ionicons name="bulb" size={20} color={colors.warning} />
                <Text style={[styles.reflectTitle, { color: colors.text }]}>
                  Bu rakam ile…
                </Text>
              </View>
              <Text style={[styles.reflectBody, { color: colors.text }]}>
                Aynı parayı Para Alternatifi modülüne girersen, başka neler
                yapabileceğini somut olarak görürsün.
              </Text>
              <Button
                title="Para Alternatifi'ne Aktar"
                onPress={() => {
                  haptics.tapLight();
                  router.push("/modules/money-alternative" as never);
                }}
                variant="secondary"
                leftIcon="cash"
                style={styles.transferBtn}
              />
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: { position: "absolute", right: -20, bottom: -20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,208,116,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,208,116,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FFD074",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroTotalRow: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  heroTotalLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroTotalValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  cardSpacing: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8 },

  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  suggestionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 11, fontWeight: "700" },

  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  amountSign: { fontSize: 22, fontWeight: "900" },
  amountInput: { flex: 1, fontSize: 24, fontWeight: "900", paddingVertical: 12 },

  noteInput: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    minHeight: 70,
    borderWidth: 1,
    textAlignVertical: "top",
  },

  addBtn: { marginTop: 16 },

  list: { width: "100%" },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryMain: { flex: 1 },
  entryPeriod: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  entryAmount: { fontSize: 18, fontWeight: "900", marginBottom: 4 },
  entryNote: { fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  entryDelete: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptyHint: { fontSize: 13, lineHeight: 18, textAlign: "center", maxWidth: 280 },

  reflectRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reflectTitle: { fontSize: 15, fontWeight: "800" },
  reflectBody: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  transferBtn: { marginTop: 4 },
});

export default withPremiumGate(LossLedgerModule, {
  title: "Kayıp Defteri",
  subtitle: "Gerçek toplam — caydırıcı ayna",
});
