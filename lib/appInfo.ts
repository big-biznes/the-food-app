import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** What a crash report or a feedback message says about the app and the phone: nothing about the person. */
export function appInfo() {
  const model = Platform.OS === 'android' ? (Platform.constants as { Model?: string }).Model : undefined;
  return {
    app_version: Constants.expoConfig?.version ?? 'unknown',
    platform: Platform.OS,
    os_version: String(Platform.Version),
    device: model ?? null,
  };
}
