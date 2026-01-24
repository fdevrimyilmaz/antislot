import { NativeModules, Platform } from "react-native";

const { SmsRoleModule } = NativeModules;

export async function isDefaultSmsApp(): Promise<boolean> {
  if (Platform.OS !== "android" || !SmsRoleModule?.isDefaultSmsApp) {
    return false;
  }
  return SmsRoleModule.isDefaultSmsApp();
}

export async function requestDefaultSmsRole(): Promise<boolean> {
  if (Platform.OS !== "android" || !SmsRoleModule?.requestDefaultSmsRole) {
    return false;
  }
  return SmsRoleModule.requestDefaultSmsRole();
}
