import { getProgressDerived, useProgressStore } from "@/store/progressStore";
import React from "react";
import { View } from "react-native";
import { AchievementsCard } from "./AchievementsCard";
import { AllTimeCard } from "./AllTimeCard";
import { BadgeRow } from "./BadgeRow";
import { CheckInButton } from "./CheckInButton";
import { GamificationCard } from "./GamificationCard";
import { GoalCards } from "./GoalCards";
import { MiniCalendar } from "./MiniCalendar";
import { MiniStatsRow } from "./MiniStatsRow";
import { NextBadgeCard } from "./NextBadgeCard";
import { Timeline } from "./Timeline";
import { WeeklySummaryCard } from "./WeeklySummaryCard";

export function ProgressDashboard() {
  const gamblingFreeDays = useProgressStore((s) => s.gamblingFreeDays);
  const progressExtras = useProgressStore((s) => s.progressExtras);
  const checkInToday = useProgressStore((s) => s.checkInToday);
  const derived = getProgressDerived({ gamblingFreeDays, progressExtras });

  return (
    <View style={{ gap: 16 }}>
      <CheckInButton
        cleanToday={derived.cleanToday}
        onCheckIn={checkInToday}
      />
      <NextBadgeCard
        currentCleanDays={derived.currentCleanDays}
        nextBadgeTarget={derived.nextBadgeTarget}
      />
      <MiniStatsRow
        cleanToday={derived.cleanToday}
        currentStreak={derived.currentStreak}
        bestStreak={derived.bestStreak}
      />
      <WeeklySummaryCard weekCleanCount={derived.weekCleanCount} />
      <AllTimeCard totalCleanDaysAllTime={derived.totalCleanDaysAllTime} />
      <GoalCards currentCleanDays={derived.currentCleanDays} />
      <BadgeRow bestStreak={derived.bestStreak} />
      <Timeline currentCleanDays={derived.currentCleanDays} />
      <MiniCalendar last7Days={derived.last7Days} />
      <GamificationCard
        xp={derived.xp}
        level={derived.level}
        nextLevelXP={derived.nextLevelXP}
        xpInLevel={derived.xpInLevel}
      />
      <AchievementsCard
        bestStreak={derived.bestStreak}
        currentCleanDays={derived.currentCleanDays}
      />
    </View>
  );
}
