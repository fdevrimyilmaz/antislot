import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GAMBLING_FACTS } from "./data/gamblingFacts";

export default function FactsScreen() {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>GERÇEKLER</Text>
        <Text style={styles.subtitle}>Online kumarın gerçek yüzü.</Text>
      </View>

      <FlatList
        data={GAMBLING_FACTS}
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
        renderItem={({ item }) => (
          <View style={[styles.page, { width: screenWidth }]}>
            <View style={styles.card}>
              <Text style={styles.cardText}>{item}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 28, fontWeight: "900", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#6B7280" },
  list: { paddingBottom: 24 },
  page: { alignItems: "center", justifyContent: "center" },
  card: {
    width: "100%",
    marginHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    minHeight: 170,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#0F172A",
    fontWeight: "700",
  },
});
