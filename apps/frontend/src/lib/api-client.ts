export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_STORAGE_KEY = "nutrisnap_auth_token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  const queryToken = urlParams.get("token");
  if (queryToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, queryToken);
    // Bersihkan query ?token= dari URL browser
    urlParams.delete("token");
    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? `?${urlParams.toString()}` : "");
    window.history.replaceState({}, "", newUrl);
    return queryToken;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !json.success) {
    throw new Error(
      json.error?.message ?? `Request gagal (${response.status})`
    );
  }

  return json.data as T;
}

