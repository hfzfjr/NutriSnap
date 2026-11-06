export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_STORAGE_KEY = "nutrisnap_auth_token";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown[];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // Hanya ambil dari query param ?token= jika ada (misal callback OAuth), lalu segera bersihkan
  const urlParams = new URLSearchParams(window.location.search);
  const queryToken = urlParams.get("token");
  if (queryToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, queryToken);
    urlParams.delete("token");
    const newSearch = urlParams.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : "");
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

export function clearStoredAuthToken(): void {
  setStoredAuthToken(null);
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (netErr) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Tidak bisa terhubung ke server. Periksa koneksi internetmu."
    );
  }

  // Tangani 401 Unauthorized secara terpusat
  if (response.status === 401) {
    setStoredAuthToken(null);
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      window.location.pathname !== "/"
    ) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/login?next=${next}`;
    }
  }

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON response
    if (!response.ok) {
      throw new ApiError(
        response.status,
        "HTTP_ERROR",
        `Terjadi kesalahan pada server (${response.status}).`
      );
    }
  }

  if (!response.ok || !json?.success) {
    let errorMessage =
      json?.error?.message ??
      (response.status === 401
        ? "Sesi telah berakhir. Silakan masuk kembali."
        : `Permintaan gagal (${response.status}).`);

    // Bersihkan jika pesan error berupa JSON string mentah dari pihak ketiga
    if (
      typeof errorMessage === "string" &&
      (errorMessage.startsWith("{") || errorMessage.includes('"error":'))
    ) {
      try {
        const jsonStart = errorMessage.indexOf("{");
        const jsonEnd = errorMessage.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const parsed = JSON.parse(
            errorMessage.substring(jsonStart, jsonEnd + 1)
          ) as { error?: { message?: string }; message?: string };
          errorMessage =
            parsed?.error?.message || parsed?.message || errorMessage;
        }
      } catch {
        // Abaikan
      }
    }

    throw new ApiError(
      response.status,
      json?.error?.code ?? "UNKNOWN_ERROR",
      errorMessage,
      json?.error?.details
    );
  }

  return json.data as T;
}
