import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { useProgressStore } from '@/store/progressStore';
import { useLockoutStore } from '@/store/lockoutStore';
import { useRiskWindowsStore } from '@/store/riskWindowsStore';
import { useNotifPrefsStore } from '@/store/notificationsPrefsStore';
import {
  rescheduleDailyCheckin,
  rescheduleRiskWindowReminders,
} from '@/services/localNotifications';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { initMonitoring } from '@/services/monitoring';

// Initialize Sentry once at module-load time. The helper is a no-op when
// EXPO_PUBLIC_SENTRY_DSN is missing (dev/test) or when the user has not opted
// into crash reporting via the privacy store, so this is safe to call eagerly.
initMonitoring();

// Root layout.
export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { uid, loading: userLoading } = useUser();
  const hydrateProgress = useProgressStore((state) => state.hydrate);
  const hydrateLockout = useLockoutStore((s) => s.hydrate);
  const hydrateRiskWindows = useRiskWindowsStore((s) => s.hydrate);
  const hydrateNotifPrefs = useNotifPrefsStore((s) => s.hydrate);
  const riskWindowsHydrated = useRiskWindowsStore((s) => s.hydrated);
  const riskWindows = useRiskWindowsStore((s) => s.windows);
  const notifPrefsHydrated = useNotifPrefsStore((s) => s.hydrated);
  const notifPrefs = useNotifPrefsStore((s) => s.prefs);

  useEffect(() => {
    if (!userLoading && uid) {
      hydrateProgress(uid);
    }
  }, [userLoading, uid, hydrateProgress]);

  useEffect(() => {
    hydrateLockout();
  }, [hydrateLockout]);

  useEffect(() => {
    hydrateRiskWindows();
  }, [hydrateRiskWindows]);

  useEffect(() => {
    hydrateNotifPrefs();
  }, [hydrateNotifPrefs]);

  // Re-apply scheduled local notifications whenever the underlying prefs
  // or windows change. Without this, adding a risk window wouldn't fire a
  // reminder until the user toggles the switch again.
  useEffect(() => {
    if (!riskWindowsHydrated || !notifPrefsHydrated) return;
    if (notifPrefs.riskRemindersEnabled) {
      rescheduleRiskWindowReminders(riskWindows).catch(() => undefined);
    }
  }, [riskWindowsHydrated, notifPrefsHydrated, riskWindows, notifPrefs.riskRemindersEnabled]);

  useEffect(() => {
    if (!notifPrefsHydrated) return;
    if (notifPrefs.checkinEnabled) {
      rescheduleDailyCheckin({
        hour: notifPrefs.checkinHour,
        minute: notifPrefs.checkinMinute,
      }).catch(() => undefined);
    }
  }, [
    notifPrefsHydrated,
    notifPrefs.checkinEnabled,
    notifPrefs.checkinHour,
    notifPrefs.checkinMinute,
  ]);

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <ToastProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#F4F9FF', opacity: 1 },
              // iOS'ta modal açıldığında arka planın kararmasını engelle
              gestureEnabled: true,
              // React Navigation'ın varsayılan arka plan karartmasını kapat
              ...(Platform.OS === 'ios' && {
                presentation: 'card', // modal yerine card kullan
              }),
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                contentStyle: { backgroundColor: '#F4F9FF', opacity: 1 },
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
              name="themes"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="self-exclusion"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="risk-windows"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="curriculum/index"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="curriculum/[day]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="insights"
              options={{ headerShown: false, presentation: 'card' }}
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
              name="support-topic/[id]"
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
            <Stack.Screen
              name="modules/index"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/money-alternative"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/future-simulation"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/hidden-costs"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/brain-hygiene"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/identity-check"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/trigger-map"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/pledge"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/reasons"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/milestones"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/recovery-timeline"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/urge-log"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/loss-ledger"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/goals"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/crisis-plan"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="modules/affirmations"
              options={{ headerShown: false, presentation: 'card' }}
            />
            {/* Geçici olarak devre dışı: iOS overlay etkisini önlemek için */}
            {/* <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> */}
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        </ToastProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary scope="ui.root">
      <UserProvider>
        <RootLayoutContent />
      </UserProvider>
    </ErrorBoundary>
  );
}
