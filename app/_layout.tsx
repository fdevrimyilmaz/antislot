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

// Root layout.
export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { uid, loading: userLoading } = useUser();
  const hydrateProgress = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    if (!userLoading && uid) {
      hydrateProgress(uid);
    }
  }, [userLoading, uid, hydrateProgress]);

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#F4F9FF', opacity: 1 },
              // iOS'ta modal açıldığında arka planın kararmasını engelle
              animationEnabled: true,
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
            {/* Geçici olarak devre dışı: iOS overlay etkisini önlemek için */}
            {/* <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> */}
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutContent />
    </UserProvider>
  );
}
