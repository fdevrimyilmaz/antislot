import { Link } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingIntro() {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.titleIcon}
          resizeMode="contain"
          accessibilityLabel="Antislot icon"
        />
        <Text style={styles.title}>ANTISLOT</Text>
      </View>

      <Text style={styles.subtitle}>
        Deneyiminizi kişiselleştirmemize yardımcı olmak için
        lütfen birkaç kısa soruyu yanıtlayın.
      </Text>

      <Link href="/onboarding/q1" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Başla</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F9FF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
