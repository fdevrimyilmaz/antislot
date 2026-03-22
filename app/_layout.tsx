import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StorageNotice } from '@/components/storage-notice';
import { Colors, Fonts } from '@/constants/theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { syncMoneyProtectionCloud } from '@/services/moneyProtectionApi';
import { initMonitoring, registerNavigationContainer } from '@/services/monitoring';
import { startProactiveInterventionEngine } from '@/services/proactiveInterventionEngine';
import { syncUrgeCloud } from '@/services/urgeApi';
import { setMoneyProtectionSyncClient, useMoneyProtectionStore } from '@/store/moneyProtectionStore';
import { usePremiumStore } from '@/store/premiumStore';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { usePrivacyStore } from '@/store/privacyStore';
import { useProgressStore } from '@/store/progressStore';
import { setUrgeSyncClient, useUrgeStore } from '@/store/urgeStore';

// Keep splash visible until we hide it explicitly
SplashScreen.preventAutoHideAsync?.();

// Root layout.
export const unstable_settings = {
  anchor: '(tabs)',
};

const APP_BG = Colors.light.background;
setMoneyProtectionSyncClient(syncMoneyProtectionCloud);
setUrgeSyncClient(syncUrgeCloud);

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { uid, loading: userLoading } = useUser();
  const [appReady, setAppReady] = useState(false);
  const hydrateProgress = useProgressStore((state) => state.hydrate);
  const hydratePremium = usePremiumStore((state) => state.hydrate);
  const hydrateMoneyProtection = useMoneyProtectionStore((state) => state.hydrate);
  const moneyProtectionHydrated = useMoneyProtectionStore((state) => state.hydrated);
  const syncMoneyProtectionWithServer = useMoneyProtectionStore((state) => state.syncWithServer);
  const hydrateUrge = useUrgeStore((state) => state.hydrate);
  const urgeHydrated = useUrgeStore((state) => state.hydrated);
  const syncUrgeWithServer = useUrgeStore((state) => state.syncWithServer);
  const hydratePrivacy = usePrivacyStore((state) => state.hydrate);
  const privacyHydrated = usePrivacyStore((state) => state.hydrated);
  const telemetryEnabled = usePrivacyStore((state) => state.preferences.telemetryEnabled);
  const crashReportingEnabled = usePrivacyStore((state) => state.preferences.crashReporting);
  const hydrateAccessibility = useAccessibilityStore((state) => state.hydrate);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const TextBase = Text as typeof Text & { defaultProps?: { style?: unknown } };
    const TextInputBase = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

    if (!TextBase.defaultProps) TextBase.defaultProps = {};
    const baseTextStyle = [{ fontFamily: Fonts.body }];
    const existingText = TextBase.defaultProps.style;
    TextBase.defaultProps.style = Array.isArray(existingText)
      ? [...baseTextStyle, ...existingText]
      : existingText
        ? [...baseTextStyle, existingText]
        : baseTextStyle;

    if (!TextInputBase.defaultProps) TextInputBase.defaultProps = {};
    const existingInput = TextInputBase.defaultProps.style;
    TextInputBase.defaultProps.style = Array.isArray(existingInput)
      ? [...baseTextStyle, ...existingInput]
      : existingInput
        ? [...baseTextStyle, existingInput]
        : baseTextStyle;
  }, []);

  useEffect(() => {
    hydratePremium();
    hydrateMoneyProtection();
    hydrateUrge();
    hydratePrivacy();
    hydrateAccessibility();
  }, [hydratePremium, hydrateMoneyProtection, hydrateUrge, hydratePrivacy, hydrateAccessibility]);

  useEffect(() => {
    const stopEngine = startProactiveInterventionEngine();
    return () => stopEngine();
  }, []);

  useEffect(() => {
    if (!urgeHydrated) return;
    void syncUrgeWithServer().catch((error) => {
      console.warn("[Urge] Cloud sync error:", error);
    });
  }, [urgeHydrated, syncUrgeWithServer]);

  useEffect(() => {
    if (!moneyProtectionHydrated) return;
    void syncMoneyProtectionWithServer().catch((error) => {
      console.warn("[MoneyProtection] Cloud sync error:", error);
    });
  }, [moneyProtectionHydrated, syncMoneyProtectionWithServer]);

  useEffect(() => {
    if (!userLoading) {
      hydrateProgress(uid ?? undefined);
    }
  }, [userLoading, uid, hydrateProgress]);

  useEffect(() => {
    if (navigationRef) {
      registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  useEffect(() => {
    if (!privacyHydrated) return;
    if (!telemetryEnabled || !crashReportingEnabled) return;
    initMonitoring();
  }, [privacyHydrated, telemetryEnabled, crashReportingEnabled]);

  useEffect(() => {
    if (userLoading) return;
    const t = setTimeout(() => setAppReady(true), 300);
    return () => clearTimeout(t);
  }, [userLoading]);

  useEffect(() => {
    if (!appReady) return;
    SplashScreen.hideAsync?.().catch(() => {});
  }, [appReady]);

  const onLayoutRootView = useCallback(() => {
    // Layout ready; splash hide is driven by appReady effect
  }, []);

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <StorageNotice />
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
            screenOptions={{
              contentStyle: { backgroundColor: APP_BG, opacity: 1 },
              // Prevent iOS background dimming when opening screens
              gestureEnabled: true,
              // Keep card-style presentation to avoid default modal dim overlay
              ...(Platform.OS === 'ios' && {
                presentation: 'card',
              }),
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                contentStyle: { backgroundColor: APP_BG, opacity: 1 },
              }} 
            />
            <Stack.Screen 
              name="premium" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="ai" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="continue" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="diagnostics" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="settings" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            <Stack.Screen
              name="privacy"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="terms"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="limitations"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="disclaimer"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="privacy-data"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="money-protection"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="support-topic/[id]"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="community"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="explore"
              options={{
                headerShown: false,
                presentation: "card",
              }}
            />
            <Stack.Screen 
              name="onboarding/index" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            {/* Urge Intervention Flow. Crisis override: safety assessment in urge/detect routes to urge/crisis immediately when level === 'crisis'. */}
            <Stack.Screen
              name="urge/index"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/detect"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/intervene"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/crisis"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/crisis-choice"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/breathing"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/grounding"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/reframing"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/redirection"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/delay"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/support"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="urge/complete"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            {/* Temporarily disabled to avoid iOS overlay effect */}
            {/* <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> */}
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </View>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <RootLayoutContent />
      </UserProvider>
    </ErrorBoundary>
  );
}

const WrappedRoot = __DEV__ ? RootLayout : (Sentry?.wrap ? Sentry.wrap(RootLayout) : RootLayout);
export default WrappedRoot;
