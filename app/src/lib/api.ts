import { useAuthStore } from "../store/authStore";

// Expo dev client on a physical device/simulator can't reach "localhost" on
// your dev machine — swap this for your machine's LAN IP (e.g. via `ipconfig`)
// or an EAS/production URL once deployed to Railway.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { auth = true, retry = true }: { auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && auth && retry) {
    const outcome = await useAuthStore.getState().refresh();
    if (outcome === "ok") return request<T>(path, options, { auth, retry: false });
    // Only sign out when the server actually refused the refresh token.
    // "unreachable" means we never got an answer — the session may well be
    // fine, and throwing a logout at a dropped connection is what made this
    // app log people out on every backend restart.
    if (outcome === "rejected") useAuthStore.getState().signOut();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ? JSON.stringify(body.error) : res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, opts),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
