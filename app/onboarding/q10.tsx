import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setOnboardingDone } from "@/store/onboardingFlag";

export default function OnboardingQ10() {
  const router = useRouter();
  const [vpnConsent, setVpnConsent] = useState(false);
  const [limitationsConsent, setLimitationsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const canFinish = useMemo(
    () => vpnConsent && limitationsConsent && privacyConsent,
    [vpnConsent, limitationsConsent, privacyConsent]
  );

  async function finish() {
    if (!canFinish) return;
    await setOnboardingDone();
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Her şey hazır! 🎉</Text>
      <Text style={styles.subtitle}>
        Soruları yanıtladığınız için teşekkürler.
        ANTISLOT&apos;u size göre uyarlayacağız.
      </Text>

      <View style={styles.consentCard}>
        <Text style={styles.consentTitle}>Devam etmek için onaylayın:</Text>

        <TouchableOpacity style={styles.consentRow} onPress={() => setVpnConsent(!vpnConsent)}>
          <View style={[styles.checkbox, vpnConsent && styles.checkboxSelected]}>
            {vpnConsent ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            Uygulamanın kumar sitelerini engellemek için VPN/Network Extension kullandığını biliyorum.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setLimitationsConsent(!limitationsConsent)}
        >
          <View style={[styles.checkbox, limitationsConsent && styles.checkboxSelected]}>
            {limitationsConsent ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            DoH, uygulama içi tarayıcılar ve captive portal sınırlamalarını okudum.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setPrivacyConsent(!privacyConsent)}
        >
          <View style={[styles.checkbox, privacyConsent && styles.checkboxSelected]}>
            {privacyConsent ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            Gizlilik Politikası ve Kullanım Şartlarını kabul ediyorum.
          </Text>
        </TouchableOpacity>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push("/limitations")}>
            <Text style={styles.linkText}>Sınırlamaları Gör</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/privacy")}>
            <Text style={styles.linkText}>Gizlilik</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/terms")}>
            <Text style={styles.linkText}>Şartlar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, !canFinish && styles.buttonDisabled]}
        onPress={finish}
        disabled={!canFinish}
      >
        <Text style={styles.buttonText}>Bitir</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  consentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    width: "100%",
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1D4C72",
    marginBottom: 12,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1D4C72",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: "#1D4C72",
  },
  checkboxText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    color: "#1D4C72",
    fontWeight: "700",
  },
});
