import { create } from "zustand";
import { API_BASE_URL } from "../lib/api";
import { secureStorage } from "../lib/secureStorage";

const REFRESH_TOKEN_KEY = "peptiderx.refreshToken";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  sex?: "Male" | "Female" | null;
  experience?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  weightKg?: number | null;
  heightCm?: number | null;
  /** Source of truth where set; `age` below is derived from it by the server. */
  dateOfBirth?: string | null;
  age?: number | null;
  activityLevel?: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE" | null;
  nutritionGoal?: "CUT" | "MAINTAIN" | "BULK" | null;

  // First-run state and the answers given during onboarding. onboardedAt is
  // what routes a new account into the survey; tourCompletedAt is separate so
  // skipping the tour doesn't send you back through the survey.
  onboardedAt?: string | null;
  tourCompletedAt?: string | null;
  goals?: string[];
  medications?: string[];
  usedPeptidesBefore?: boolean | null;
  priorExperienceNote?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Why a refresh attempt ended.
 *
 * The distinction between `rejected` and `unreachable` is the whole point:
 * only the server saying no means the session is actually over. A dead
 * network, a backend that isn't running, or a Wi-Fi blip says nothing about
 * whether the token is still good, and must never cost the user their
 * session.
 */
export type RefreshOutcome = "ok" | "rejected" | "unreachable";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
  /** True when we hold a token but couldn't reach the server to use it. */
  serverUnreachable: boolean;
  hydrate: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<RefreshOutcome>;
  setUser: (user: AuthUser) => void;
}

/** Carries the HTTP status so callers can tell "no" apart from "couldn't ask". */
class AuthRequestError extends Error {
  constructor(
    message: string,
    /** null when the request never got a response at all. */
    readonly status: number | null,
  ) {
    super(message);
  }
}

async function authFetch(path: string, body: unknown) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // No response: offline, server down, DNS, CORS. Not an auth failure.
    throw new AuthRequestError(e instanceof Error ? e.message : "Network request failed", null);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new AuthRequestError(
      err.error ? JSON.stringify(err.error) : res.statusText,
      res.status,
    );
  }
  return res.json();
}

/** Only these mean the credential itself is no longer good. */
function isCredentialRejection(e: unknown): boolean {
  return e instanceof AuthRequestError && (e.status === 401 || e.status === 403);
}

/**
 * The in-flight refresh, shared by every caller.
 *
 * Refresh tokens rotate: the server deletes the one it was given and issues a
 * new pair. So two requests that 401 at the same moment — which happens on
 * every cold load, where several queries fire together — would both refresh
 * with the same token. The first wins and invalidates it; the second then
 * presents a token the server has already deleted, is told "revoked", and
 * logs the user out. Collapsing concurrent callers onto one promise is what
 * stops that race.
 */
let inFlightRefresh: Promise<RefreshOutcome> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  hydrated: false,
  serverUnreachable: false,

  // Wrapped in try/finally so any unexpected failure here (storage, network)
  // still clears the loading state instead of leaving the app stuck on its
  // splash screen forever — this is exactly the class of bug that made the
  // web build hang before secureStorage existed.
  hydrate: async () => {
    try {
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return;
      try {
        const tokens: AuthTokens = await authFetch("/auth/refresh", { refreshToken });
        await secureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (!meRes.ok) throw new AuthRequestError("Could not load profile", meRes.status);
        const user: AuthUser = await meRes.json();

        set({ accessToken: tokens.accessToken, user, serverUnreachable: false });
      } catch (e) {
        if (isCredentialRejection(e)) {
          // The server actively refused the token. Session really is over.
          await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
          set({ user: null, accessToken: null, serverUnreachable: false });
        } else {
          // Couldn't reach the backend. Keep the token: starting the API and
          // retrying should restore the session rather than demand a password.
          set({ serverUnreachable: true });
        }
      }
    } finally {
      set({ hydrated: true });
    }
  },

  signUp: async (email, password, name) => {
    const data = await authFetch("/auth/signup", { email, password, name });
    await secureStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, serverUnreachable: false });
  },

  signIn: async (email, password) => {
    const data = await authFetch("/auth/login", { email, password });
    await secureStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, serverUnreachable: false });
  },

  signOut: async () => {
    const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
    inFlightRefresh = null;
    set({ user: null, accessToken: null, serverUnreachable: false });
    if (refreshToken) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
  },

  refresh: async () => {
    if (inFlightRefresh) return inFlightRefresh;

    inFlightRefresh = (async (): Promise<RefreshOutcome> => {
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return "rejected";
      try {
        const tokens: AuthTokens = await authFetch("/auth/refresh", { refreshToken });
        await secureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        set({ accessToken: tokens.accessToken, serverUnreachable: false });
        return "ok";
      } catch (e) {
        if (isCredentialRejection(e)) {
          await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
          set({ user: null, accessToken: null, serverUnreachable: false });
          return "rejected";
        }
        // Keep the token and the signed-in user: this was the network, not
        // the credential. The next request can try again.
        set({ serverUnreachable: true });
        return "unreachable";
      }
    })();

    try {
      return await inFlightRefresh;
    } finally {
      inFlightRefresh = null;
    }
  },

  setUser: (user) => set({ user }),
}));
