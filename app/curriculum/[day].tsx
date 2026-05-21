import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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
import {
  getDay,
  PHASE_LABELS,
  TOTAL_DAYS,
} from "@/app/data/recoveryCurriculum";
import { useCurriculumStore } from "@/store/curriculumStore";

export default function CurriculumDayDetail() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { colors } = useTheme();
  const toast = useToast();
  const { state, hydrated, hydrate, complete, saveReflection } =
    useCurriculumStore();

  const dayNum = useMemo(() => {
    const raw = Array.isArray(params.day) ? params.day[0] : params.day;
    const n = Number.parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1 || n > TOTAL_DAYS) return 1;
    return n;
  }, [params.day]);

  const day = useMemo(() => getDay(dayNum), [dayNum]);
  const phase = day ? PHASE_LABELS[day.phase] : null;
  const isCompleted = state.completed.includes(dayNum);
  const existingReflection = state.reflections[dayNum]?.text ?? "";

  const [reflection, setReflection] = useState(existingReflection);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Sync reflection when day or hydration changes.
  useEffect(() => {
    setReflection(state.reflections[dayNum]?.text ?? "");
  }, [dayNum, state.reflections]);

  if (!day || !phase) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.errorWrap}>
            <Text style={[styles.errorText, { color: colors.text }]}>
              Gün bulunamadı.
            </Text>
            <Button
              title="Geri"
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const handleComplete = async () => {
    setBusy(true);
    haptics.tapMedium();
    try {
      if (reflection.trim().length > 0) {
        await saveReflection(dayNum, reflection);
      }
      await complete(dayNum);
      haptics.success();
      toast.success(`Gün ${dayNum} tamamlandı.`, "Aferin");
      // Auto-advance: open the next day if there is one, otherwise return to hub.
      if (dayNum < TOTAL_DAYS) {
        router.replace(`/curriculum/${dayNum + 1}` as never);
      } else {
        router.replace("/curriculum" as never);
      }
    } catch (error) {
      reportError(error, { scope: "curriculum.complete", extra: { dayNum } });
      haptics.error();
      toast.error("Kaydedilemedi.", "Hata");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveOnly = async () => {
    if (reflection.trim().length === 0) {
      haptics.warning();
      toast.warning("Önce bir not yaz.", "Boş");
      return;
    }
    setBusy(true);
    haptics.tapLight();
    try {
      await saveReflection(dayNum, reflection);
      haptics.success();
      toast.success("Yansıman kaydedildi.", "Kaydedildi");
    } catch (error) {
      reportError(error, { scope: "curriculum.saveReflection" });
      haptics.error();
      toast.error("Kaydedilemedi.", "Hata");
    } finally {
      setBusy(false);
    }
  };

  const goPrev = () => {
    if (dayNum > 1) router.replace(`/curriculum/${dayNum - 1}` as never);
  };
  const goNext = () => {
    if (dayNum < TOTAL_DAYS) router.replace(`/curriculum/${dayNum + 1}` as never);
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.titleRow}>
            <View
              style={[
                styles.dayBadge,
                { backgroundColor: phase.color },
              ]}
            >
              <Text style={styles.dayBadgeText}>{day.day}</Text>
            </View>
            <View style={styles.titleText}>
              <Text style={[styles.phaseLabel, { color: phase.color }]}>
                {phase.label.toUpperCase()}
              </Text>
              <Text
                style={[styles.title, { color: colors.text }]}
                accessibilityRole="header"
              >
                {day.title}
              </Text>
              <Text style={[styles.summary, { color: colors.textMuted }]}>
                {day.summary}
              </Text>
            </View>
          </View>

          {isCompleted ? (
            <View
              style={[
                styles.completedBadge,
                {
                  backgroundColor: `${colors.success}14`,
                  borderColor: colors.success,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.completedText, { color: colors.text }]}>
                Bu gün tamamlandı
              </Text>
            </View>
          ) : null}

          {/* Lesson body */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Ders"
              icon="book"
              meta={`${day.durationMin} dk`}
            />
            <Text style={[styles.lessonBody, { color: colors.text }]}>
              {day.lesson}
            </Text>
          </Card>

          {/* Reflection */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Yansıma"
              icon="create"
              subtitle={day.reflection}
            />
            <TextInput
              value={reflection}
              onChangeText={setReflection}
              placeholder="Birkaç cümle yaz — sadece sen göreceksin."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
              accessibilityLabel="Yansıma notu"
              maxLength={600}
            />
            <View style={styles.row}>
              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {reflection.trim().length}/600
              </Text>
              <Button
                title="Yansımayı kaydet"
                onPress={handleSaveOnly}
                disabled={busy}
                variant="ghost"
                leftIcon="save"
              />
            </View>
          </Card>

          {/* Action */}
          <Card style={[styles.cardSpacing, { backgroundColor: `${colors.primary}10` }]}>
            <SectionHeader title="Bugünkü adım" icon="footsteps" />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {day.action}
            </Text>
          </Card>

          {/* Complete button */}
          <Button
            title={
              isCompleted
                ? "Yeniden tamamla (kaydedilir)"
                : busy
                ? "Kaydediliyor"
                : `Gün ${day.day} tamamlandı`
            }
            onPress={handleComplete}
            disabled={busy}
            loading={busy}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="checkmark-circle"
            style={styles.completeBtn}
          />

          {/* Day navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={goPrev}
              disabled={dayNum <= 1}
              style={[
                styles.navBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  opacity: dayNum <= 1 ? 0.4 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Önceki gün"
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
              <Text style={[styles.navText, { color: colors.text }]}>Önceki</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              disabled={dayNum >= TOTAL_DAYS}
              style={[
                styles.navBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  opacity: dayNum >= TOTAL_DAYS ? 0.4 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sonraki gün"
            >
              <Text style={[styles.navText, { color: colors.text }]}>Sonraki</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 17, fontWeight: "600" },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },
  dayBadge: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 22,
  },
  titleText: { flex: 1, minWidth: 0 },
  phaseLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 26, fontWeight: "900", marginTop: 4 },
  summary: { fontSize: 13, lineHeight: 18, marginTop: 6 },

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  completedText: { fontSize: 12, fontWeight: "800" },

  cardSpacing: { marginBottom: 14 },
  lessonBody: { fontSize: 15, lineHeight: 24 },

  input: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  charCount: { fontSize: 11 },

  actionText: { fontSize: 15, fontWeight: "700", lineHeight: 22 },

  completeBtn: { marginTop: 6 },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  navText: { fontSize: 14, fontWeight: "700" },

  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 22,
  },
  errorText: { fontSize: 18, fontWeight: "700" },
});
