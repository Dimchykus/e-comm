import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Persistent storage for the auth token.
 *
 * On native we use `expo-secure-store` (iOS Keychain / Android Keystore) so the
 * token is encrypted at rest. SecureStore has no web implementation, so on web
 * we fall back to `localStorage` (acceptable for dev; a production web build
 * should prefer an httpOnly cookie set by the gateway).
 */
const TOKEN_KEY = 'auth.accessToken';

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
