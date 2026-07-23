import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Backed by the OS Keychain (iOS) / Keystore-encrypted storage (Android)
 * instead of AsyncStorage's plaintext SQLite/file store — required for the
 * JWT and any other credential/PII persisted across app launches, since
 * AsyncStorage is readable via `adb backup`/root without this. SecureStore
 * rejects values over ~2048 bytes, so anything too large falls back to
 * AsyncStorage rather than silently losing the write; getItem also checks
 * AsyncStorage so sessions written before this migration still load.
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("SecureStore setItem failed, falling back to AsyncStorage:", key, error);
      try {
        await AsyncStorage.setItem(key, value);
      } catch (fallbackError) {
        console.error("Storage error setting key:", key, fallbackError);
      }
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
    } catch (error) {
      console.error("SecureStore getItem failed, checking AsyncStorage fallback:", key, error);
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error("Storage error getting key:", key, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("SecureStore removeItem failed:", key, error);
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Storage error removing key:", key, error);
    }
  },

  async clear(): Promise<void> {
    // SecureStore has no bulk-clear API; callers remove known keys
    // explicitly (see authStore.logout). This covers legacy/fallback values.
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Storage error clearing all storage", error);
    }
  },
};
