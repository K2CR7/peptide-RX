import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store has no web implementation at all (its web module is a
// stub `{}`), so calling it on web throws and — since our call sites don't
// wrap every await in try/catch — leaves the app stuck on its loading state
// forever. Fall back to localStorage on web instead.
//
// Note: localStorage is not secure storage (any script on the page can read
// it) — acceptable for local dev/testing, but a real web deployment storing
// a refresh token should use an httpOnly cookie instead.
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
