import { type Href, router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { haptics } from "@/services/haptics";
import { getTodayCheckin } from "@/store/checkinStore";
import { getTodayPledge } from "@/store/pledgeStore";
import { useCurriculumStore, getNextDay } from "@/store/curriculumStore";
import { getDay } from "@/app/data/recoveryCurriculum";
import {
  CATEGORY_META,
  pickDailyAffirmation,
} from "@/app/data/affirmations";

type TaskRow = {
  key: "pledge" | "curriculum" | "checkin";
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  done: boolean;
  route: Href;
};

/**
 * "Today" checklist — surfaces the 3 daily essentials in one place:
 *   • Bugünün Sözü   (today's pledge)
 *   • Bugünün Dersi  (today's curriculum step)
 *   • Check-in        (mood + urge intensity)
 *
 * Mounted on the home screen between the streak hero and the module
 * grid. Hydration runs once on mount; each row is independently tap-
 * able and routes to the appropriate flow.
 */
export function TodayCard() {
  const { colors } = useTheme();
  const curriculumState = useCurriculumStore((s) => s.state);
  const curriculumHydrated = useCurriculumStore((s) => s.hydrated);
  const hydrateCurriculum = useCurriculumStore((s) => s.hydrate);

  const [pledgeDone, setPledgeDone] = useState<boolean | null>(null);
  const [checkinDone, setCheckinDone] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const [pledge, checkin] = await Promise.all([
      getTodayPledge().catch(() => null),
      getTodayCheckin().catch(() => null),
    ]);
    setPledgeDone(Boolean(pledge));
    setCheckinDone(Boolean(checkin));
  }, []);

  useEffect(() => {
    if (!curriculumHydrated) hydrateCurriculum();
    refresh();
  }, [curriculumHydrated, hydrateCurriculum, refresh]);

  // Re-pull pledge/check-in state every time the home regains focus so
  // an entry made on a sub-screen is reflected immediately when the
  // user comes back.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const nextDayNum = getNextDay(curriculumState);
  const nextDay = getDay(nextDayNum);
  const curriculumStarted = curriculumState.completed.length > 0 || curriculumState.startedAt !== null;
  const curriculumDone =
    curriculumStarted && curriculumState.completed.includes(nextDayNum);

  const tasks: TaskRow[] = [
    {
      key: "pledge",
      title: "Bugünün sözü",
      subtitle: pledgeDone
        ? "Sözünü verdin — krizde bu cümleyi oku."
        : "Bugün için tek cümlelik niyet.",
      icon: "hand-right",
      done: pledgeDone === true,
      route: "/modules/pledge" as Href,
    },
    {
      key: "curriculum",
      title: nextDay ? `Gün ${nextDay.day} — ${nextDay.title}` : "30 Günlük Yol",
      subtitle: !curriculumStarted
        ? "Yapılandırılmış yolculuğa başla."
        : curriculumDone
        ? "Bugün tamamlandı. Yarın yeni bir gün."
        : nextDay
        ? `${nextDay.durationMin} dk · ${nextDay.summary}`
        : "Bu noktada içerik yok.",
      icon: "leaf",
      done: curriculumDone,
      route: nextDay
        ? (`/curriculum/${nextDay.day}` as Href)
        : ("/curriculum" as Href),
    },
    {
      key: "checkin",
      title: "Günlük check-in",
      subtitle: checkinDone
        ? "Bugün için kaydettin. Yarın yine görüşürüz."
        : "Dürtü ve ruh halini 30 saniyede yaz.",
      icon: "heart",
      done: checkinDone === true,
      route: "/modules/urge-log" as Href,
    },
  ];

  const doneCount = tasks.filter((t) => t.done).length;
  const allDone = doneCount === tasks.length;
  const dailyAffirmation = allDone ? pickDailyAffirmation() : null;
  const affirmationMeta = dailyAffirmation
    ? CATEGORY_META[dailyAffirmation.category]
    : null;

  const handlePress = (task: TaskRow) => {
    haptics.tapLight();
    router.push(task.route);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: allDone ? `${colors.success}14` : `${colors.primary}14`,
              },
            ]}
          >
            <Ionicons
              name={allDone ? "checkmark-done" : "today"}
              size={16}
              color={allDone ? colors.success : colors.primary}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {allDone ? "Bugün hazır" : "Bugün"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {allDone ? "Üç adımı da tamamladın." : `${doneCount}/${tasks.length} tamamlandı`}
            </Text>
          </View>
        </View>
        {/* Tiny progress dots */}
        <View style={styles.dotsRow}>
          {tasks.map((t) => (
            <View
              key={t.key}
              style={[
                styles.progressDot,
                {
                  backgroundColor: t.done ? colors.success : colors.cardBorder,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {allDone && dailyAffirmation && affirmationMeta ? (
        <View
          style={[
            styles.affirmationBlock,
            {
              backgroundColor: `${colors.success}10`,
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.affirmationHeader}>
            <Text style={styles.affirmationEmoji}>{affirmationMeta.emoji}</Text>
            <Text style={[styles.affirmationLabel, { color: colors.success }]}>
              Bugünün olumlaması · {affirmationMeta.label}
            </Text>
          </View>
          <Text style={[styles.affirmationText, { color: colors.text }]}>
            “{dailyAffirmation.text}”
          </Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {tasks.map((task, idx) => (
          <TouchableOpacity
            key={task.key}
            activeOpacity={0.85}
            onPress={() => handlePress(task)}
            accessibilityRole="button"
            accessibilityLabel={`${task.title}${task.done ? " — tamamlandı" : ""}`}
            style={[
              styles.taskRow,
              idx < tasks.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.taskCheck,
                {
                  backgroundColor: task.done ? colors.success : "transparent",
                  borderColor: task.done ? colors.success : colors.cardBorder,
                },
              ]}
            >
              {task.done ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Ionicons name={task.icon} size={14} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.taskBody}>
              <Text
                style={[
                  styles.taskTitle,
                  {
                    color: colors.text,
                    textDecorationLine: task.done ? "line-through" : "none",
                    opacity: task.done ? 0.7 : 1,
                  },
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <Text
                style={[styles.taskSub, { color: colors.textMuted }]}
                numberOfLines={2}
              >
                {task.subtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  headerSub: { fontSize: 11, marginTop: 2 },
  dotsRow: {
    flexDirection: "row",
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  list: {},
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  taskCheck: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  taskBody: { flex: 1, minWidth: 0 },
  taskTitle: { fontSize: 14, fontWeight: "700" },
  taskSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  affirmationBlock: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  affirmationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  affirmationEmoji: { fontSize: 14 },
  affirmationLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  affirmationText: {
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "600",
    lineHeight: 20,
  },
});
