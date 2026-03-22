import { Alert, Linking } from "react-native";

export async function openExternalUrlWithFallback(params: {
  url: string;
  fallbackTitle: string;
  fallbackMessage: string;
}): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(params.url);
    if (!supported) {
      Alert.alert(params.fallbackTitle, params.fallbackMessage);
      return false;
    }
    await Linking.openURL(params.url);
    return true;
  } catch {
    Alert.alert(params.fallbackTitle, params.fallbackMessage);
    return false;
  }
}

