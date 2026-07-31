import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { API_BASE_URL } from "../lib/api";

const REFRESH_TOKEN_KEY = "peptiderx.refreshToken";

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

async function authFetch(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ? JSON.stringify(err.error) : res.statusText);
  }
  return res.json();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  hydrated: false,

  hydrate: async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const tokens: AuthTokens = await authFetch("/auth/refresh", { refreshToken });
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
        const user: AuthUser = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }).then((r) => r.json());
        set({ accessToken: tokens.accessToken, user });
      } catch {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }
    set({ hydrated: true });
  },

  signUp: async (email, password, name) => {
    const data = await authFetch("/auth/signup", { email, password, name });
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken });
  },

  signIn: async (email, password) => {
    const data = await authFetch("/auth/login", { email, password });
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken });
  },

  signOut: async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ user: null, accessToken: null });
    if (refreshToken) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
  },

  refresh: async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;
    try {
      const tokens: AuthTokens = await authFetch("/auth/refresh", { refreshToken });
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      set({ accessToken: tokens.accessToken });
      return true;
    } catch {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ user: null, accessToken: null });
      return false;
    }
  },
}));
