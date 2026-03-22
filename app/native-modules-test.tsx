import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import GamblingBlocker, { VpnResult } from "@/react-native-bridge/GamblingBlockerModule";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

const NATIVE_MODULE_COPY = {
  tr: {
    title: "Native Moduller Test",
    notTested: "test edilmedi",
    unknownError: "bilinmeyen hata",
    blockerTitle: "GamblingBlockerModule",
    sharedTitle: "SharedConfigModule",
    check: "Kontrol Et",
    status: "Durum",
    start: "Baslat",
    stop: "Durdur",
    test: "Test Et",
    permissionDeniedTitle: "VPN izni reddedildi",
    permissionDeniedBody: "Koruma icin VPN izni vermeniz gerekiyor.",
    resultStart: "Baslat",
    resultStop: "Durdur",
  },
  en: {
    title: "Native Modules Test",
    notTested: "not tested",
    unknownError: "unknown error",
    blockerTitle: "GamblingBlockerModule",
    sharedTitle: "SharedConfigModule",
    check: "Check",
    status: "Status",
    start: "Start",
    stop: "Stop",
    test: "Run Test",
    permissionDeniedTitle: "VPN permission denied",
    permissionDeniedBody: "You need to grant VPN permission for protection.",
    resultStart: "Start",
    resultStop: "Stop",
  },
} as const;

export default function NativeModulesTestScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(NATIVE_MODULE_COPY);

  const [blockerStatus, setBlockerStatus] = useState<string>(copy.notTested);
  const [sharedStatus, setSharedStatus] = useState<string>(copy.notTested);

  const formatResult = (label: string, result: VpnResult) => {
    const reason = result.reason ? ` (${result.reason})` : "";
    const message = result.message ? ` - ${result.message}` : "";
    return `${label}: ${result.status}${reason}${message}`;
  };

  const getErrorMessage = useCallback(
    (error: unknown) => (error instanceof Error ? error.message : copy.unknownError),
    [copy.unknownError]
  );

  const runBlockerTest = useCallback(async () => {
    try {
      const enabled = await GamblingBlocker.isProtectionEnabled();
      setBlockerStatus(`isProtectionEnabled: ${enabled}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setBlockerStatus(`error: ${message}`);
      Alert.alert(copy.blockerTitle, message);
    }
  }, [copy.blockerTitle, getErrorMessage]);

  const runBlockerStatus = useCallback(async () => {
    try {
      const status = await GamblingBlocker.status();
      setBlockerStatus(`status: ${status}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setBlockerStatus(`error: ${message}`);
      Alert.alert(copy.blockerTitle, message);
    }
  }, [copy.blockerTitle, getErrorMessage]);

  const runBlockerStart = useCallback(async () => {
    try {
      const result = await GamblingBlocker.startProtection();
      setBlockerStatus(formatResult(copy.resultStart, result));
      if (result.reason === "permission_denied") {
        Alert.alert(copy.permissionDeniedTitle, copy.permissionDeniedBody);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setBlockerStatus(`error: ${message}`);
      Alert.alert(copy.blockerTitle, message);
    }
  }, [
    copy.blockerTitle,
    copy.permissionDeniedBody,
    copy.permissionDeniedTitle,
    copy.resultStart,
    getErrorMessage,
  ]);

  const runBlockerStop = useCallback(async () => {
    try {
      const result = await GamblingBlocker.stopProtection();
      setBlockerStatus(formatResult(copy.resultStop, result));
    } catch (error) {
      const message = getErrorMessage(error);
      setBlockerStatus(`error: ${message}`);
      Alert.alert(copy.blockerTitle, message);
    }
  }, [copy.blockerTitle, copy.resultStop, getErrorMessage]);

  const runSharedConfigTest = useCallback(async () => {
    try {
      const ok = await SharedConfig.saveBlocklist(["example.com"]);
      setSharedStatus(`saveBlocklist: ${ok}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setSharedStatus(`error: ${message}`);
      Alert.alert(copy.sharedTitle, message);
    }
  }, [copy.sharedTitle, getErrorMessage]);

  useEffect(() => {
    void runBlockerTest();
    void runSharedConfigTest();
  }, [runBlockerTest, runSharedConfigTest]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.generalBack}`}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{copy.blockerTitle}</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>{blockerStatus}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => void runBlockerTest()}
            >
              <Text style={styles.primaryButtonText}>{copy.check}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => void runBlockerStatus()}
            >
              <Text style={styles.primaryButtonText}>{copy.status}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => void runBlockerStart()}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.start}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => void runBlockerStop()}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.stop}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{copy.sharedTitle}</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>{sharedStatus}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => void runSharedConfigTest()}
          >
            <Text style={styles.primaryButtonText}>{copy.test}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.base,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.display,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  value: {
    fontSize: 13,
    fontFamily: Fonts.body,
    marginBottom: 12,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
    flex: 1,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  secondaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
});
