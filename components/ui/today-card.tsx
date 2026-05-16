import { type Href, router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { formatLocaleTemplate, getTodayLocale } from "@/i18n/home";

type TaskRow = {
  key: "pledge" | "curriculum" | "checkin";
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  done: boolean;
  route: Href;
};

/**
 * "Today" checklist surfaces the 3 daily essentials:
 * - today's pledge
 * - today's curriculum step
 * - daily check-in
 */
export function TodayCard() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const copy = useMemo(() => getTodayLocale(language), [language]);
  const isTurkish = language === "tr";

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

  // Re-pull pledge/check-in state every time home regains focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const nextDayNum = getNextDay(curriculumState);
  const nextDay = getDay(nextDayNum);
  const curriculumStarted =
    curriculumState.completed.length > 0 || curriculumState.startedAt !== null;
  const curriculumDone =
    curriculumStarted && curriculumState.completed.includes(nextDayNum);

  const curriculumTitle = nextDay
    ? (() => {
        const base = formatLocaleTemplate(copy.curriculumDayTemplate, {
          day: nextDay.day,
        });
        if (isTurkish && nextDay.title) {
          return `${base} - ${nextDay.title}`;
        }
        return base;
      })()
    : copy.curriculumFallbackTitle;

  const curriculumProgressSubtitle = nextDay
    ? (() => {
        const base = formatLocaleTemplate(copy.curriculumProgressTemplate, {
          minutes: nextDay.durationMin,
        });
        if (isTurkish && nextDay.summary) {
          return `${base} · ${nextDay.summary}`;
        }
        return base;
      })()
    : copy.curriculumEmptySubtitle;

  const tasks: TaskRow[] = [
    {
      key: "pledge",
      title: copy.pledgeTitle,
      subtitle: pledgeDone ? copy.pledgeDoneSubtitle : copy.pledgePendingSubtitle,
      icon: "hand-right",
      done: pledgeDone === true,
      route: "/modules/pledge" as Href,
    },
    {
      key: "curriculum",
      title: curriculumTitle,
      subtitle: !curriculumStarted
        ? copy.curriculumStartSubtitle
        : curriculumDone
        ? copy.curriculumDoneSubtitle
        : curriculumProgressSubtitle,
      icon: "leaf",
      done: curriculumDone,
      route: nextDay
        ? (`/curriculum/${nextDay.day}` as Href)
        : ("/curriculum" as Href),
    },
    {
      key: "checkin",
      title: copy.checkinTitle,
      subtitle: checkinDone ? copy.checkinDoneSubtitle : copy.checkinPendingSubtitle,
      icon: "heart",
      done: checkinDone === true,
      route: "/modules/urge-log" as Href,
    },
  ];

  const doneCount = tasks.filter((task) => task.done).length;
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
              {allDone ? copy.headerReady : copy.headerToday}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}> 
              {allDone
                ? copy.headerDoneSubtitle
                : formatLocaleTemplate(copy.headerProgressTemplate, {
                    done: doneCount,
                    total: tasks.length,
                  })}
            </Text>
          </View>
        </View>

        <View style={styles.dotsRow}>
          {tasks.map((task) => (
            <View
              key={task.key}
              style={[
                styles.progressDot,
                {
                  backgroundColor: task.done ? colors.success : colors.cardBorder,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {isTurkish && allDone && dailyAffirmation && affirmationMeta ? (
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
              {copy.affirmationLabelPrefix} · {affirmationMeta.label}
            </Text>
          </View>
          <Text style={[styles.affirmationText, { color: colors.text }]}>
            &quot;{dailyAffirmation.text}&quot;
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
            accessibilityLabel={`${task.title}${task.done ? copy.taskDoneA11ySuffix : ""}`}
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

