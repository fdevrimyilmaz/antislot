import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ScreenHero } from "@/components/ui/screen-hero";
import { router } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GAMBLING_FACTS } from "@/data/gamblingFacts";

const EN_GAMBLING_FACTS = [
  "A bonus is designed to keep you betting, not to make you profitable.",
  "RTP is a long-term average, not a promise for your session.",
  "Chasing losses usually increases both debt and emotional stress.",
  "Small wins are often used to keep you in the loop.",
  "If a game is built for the house edge, the math is not on your side.",
  "Near-miss design can make losses feel like progress.",
  "Playing alone often removes the social brakes that would stop you.",
  "VIP rewards usually mean higher exposure, not safer play.",
  "A recovery bet after a loss is still a risk bet.",
  "Long sessions can distort your sense of time and spending.",
  "Promotions are marketing tools, not recovery tools.",
  "Fast repeats increase impulsive decisions.",
  "When emotion leads the session, risk decisions get worse.",
  "A short break can reduce urge intensity more than one more spin.",
  "You cannot control random outcomes with rituals or patterns.",
  "Losses can be hidden by reward language and bright UI cues.",
  "Higher stakes do not fix previous losses; they magnify risk.",
  "Probability does not owe you a win after a losing streak.",
  "Compulsion feels urgent, but urgency is not evidence.",
  "Any product that depends on repeated bets depends on repeated losses.",
  "Stopping early protects both money and cognitive control.",
  "A gambling app can be optimized for retention, not wellbeing.",
  "If your plan is to recover losses, the plan is already fragile.",
  "Debt-funded gambling turns short-term urge into long-term damage.",
  "The house edge compounds over time.",
  "Feeling close to winning is not the same as being likely to win.",
  "Escalation after losses is a known risk pattern, not a strategy.",
  "Gambling can trade short dopamine spikes for long stress cycles.",
  "The safest money in gambling is the money not placed.",
  "Support and pause tools outperform impulse in high-risk moments.",
] as const;

const FACTS_LIST_COPY = {
  tr: GAMBLING_FACTS,
  en: EN_GAMBLING_FACTS,
} as const;

export default function FactsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const facts = useLocalizedCopy(FACTS_LIST_COPY);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.factsScreenTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.factsScreenSubtitle}</Text>
      </View>

      <ScreenHero
        icon="eye-outline"
        title={t.factsScreenTitle}
        subtitle={t.factsScreenSubtitle}
        description={t.factsScreenDescription}
        badge={`${facts.length}`}
        gradient={["#6E4918", "#A8711F"]}
        style={styles.hero}
      />

      <FlatList
        data={facts}
        keyExtractor={(_, index) => `fact-full-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.page, { width: screenWidth }]}> 
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.factHeader}>
                <Text style={[styles.factIndex, { color: colors.primary }]}>{`#${index + 1}`}</Text>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.cardText, { color: colors.text }]}>{item}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: 8, paddingBottom: 12 },
  hero: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 28, fontFamily: Fonts.display, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: Fonts.body },
  list: { paddingBottom: Spacing.xl },
  page: { alignItems: "center", justifyContent: "center" },
  card: {
    width: "100%",
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    minHeight: 170,
    justifyContent: "center",
    borderWidth: 1,
  },
  factHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  factIndex: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
  },
});
