/**
 * Global error boundary for production.
 * Shows a friendly screen instead of a white/crash screen.
 */

import { router } from "expo-router";
import * as Sentry from "@sentry/react-native";
import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { canSendCrashReports } from "@/services/privacy";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }
    if (!canSendCrashReports()) return;
    if (Sentry?.captureException) {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    router.replace("/(tabs)");
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Bir şeyler ters gitti</Text>
            <Text style={styles.message}>
              Uygulama beklenmedik bir hata ile karşılaştı. Lütfen tekrar deneyin
              veya ana sayfaya dönün.
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleRetry}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Tekrar dene</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.handleGoHome}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Ana sayfaya dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryButtonText: {
    color: "#1D4C72",
    fontSize: 16,
    fontWeight: "700",
  },
});

/** Inline fallback that shows a spinner while recovering (e.g. for Suspense). */
export function ErrorFallbackWithRetry({
  onRetry,
}: {
  onRetry: () => void;
}): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Yüklenemedi</Text>
        <Text style={styles.message}>
          Bu sayfa şu an yüklenemiyor. Tekrar denemek ister misiniz?
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onRetry}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Tekrar dene</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Simple loading fallback for Suspense. */
export function LoadingFallback(): React.ReactElement {
  return (
    <View style={[styles.container, { justifyContent: "center" }]}>
      <ActivityIndicator size="large" color="#1D4C72" />
      <Text style={[styles.message, { marginTop: 16 }]}>Yükleniyor...</Text>
    </View>
  );
}
