import React, { Component, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { reportError } from "@/services/monitoring";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Optional scope tag passed to Sentry. Default: "ui.boundary". */
  scope?: string;
  /** Optional override for the recovery UI. */
  fallback?: (info: { error: Error; reset: () => void }) => ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError(error, {
      scope: this.props.scope ?? "ui.boundary",
      extra: {
        componentStack: (info.componentStack ?? "").slice(0, 2000),
      },
    });
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.handleReset });
    }

    return <DefaultFallback onReset={this.handleReset} />;
  }
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconBubble}>
        <Ionicons name="warning" size={32} color="#B54708" />
      </View>
      <Text style={styles.title}>Bir şeyler ters gitti</Text>
      <Text style={styles.message}>
        Beklenmedik bir hata oluştu. Hata raporu gönderildi; sorunu çözmek için çalışıyoruz.
      </Text>
      <Text style={styles.retry} accessibilityRole="button" onPress={onReset}>
        Tekrar dene
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF0C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#101828",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475467",
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 24,
  },
  retry: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4C72",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9E5F2",
    overflow: "hidden",
  },
});
