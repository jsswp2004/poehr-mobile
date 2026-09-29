// utils/tokenStore.ts
// Encrypted storage for the JWT access/refresh tokens.
//
// iOS Keychain / Android Keystore via expo-secure-store. On web (where
// SecureStore is unavailable) it falls back to AsyncStorage. Tokens left in
// plain AsyncStorage by older app versions are moved over on first use.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEYS = ["access_token", "refresh_token"];
const useSecure = Platform.OS !== "web";

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let migration: Promise<void> | null = null;

function migrateLegacyTokens(): Promise<void> {
  if (!useSecure) return Promise.resolve();
  if (!migration) {
    migration = (async () => {
      try {
        for (const key of TOKEN_KEYS) {
          const legacy = await AsyncStorage.getItem(key);
          if (legacy) {
            const existing = await SecureStore.getItemAsync(key, OPTIONS);
            if (!existing) await SecureStore.setItemAsync(key, legacy, OPTIONS);
            await AsyncStorage.removeItem(key);
          }
        }
      } catch {
        // Migration is best-effort; worst case the user logs in again.
      }
    })();
  }
  return migration;
}

async function getItem(key: string): Promise<string | null> {
  await migrateLegacyTokens();
  return useSecure
    ? SecureStore.getItemAsync(key, OPTIONS)
    : AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  await migrateLegacyTokens();
  if (useSecure) await SecureStore.setItemAsync(key, value, OPTIONS);
  else await AsyncStorage.setItem(key, value);
}

async function removeItem(key: string): Promise<void> {
  await migrateLegacyTokens();
  if (useSecure) await SecureStore.deleteItemAsync(key, OPTIONS);
  else await AsyncStorage.removeItem(key);
}

async function multiRemove(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => removeItem(k)));
}

export const tokenStore = { getItem, setItem, removeItem, multiRemove };
