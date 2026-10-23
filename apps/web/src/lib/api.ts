import type {
  ChatMessagePublic,
  LanguageCode,
  MeetingPublic,
  ParticipantPublic,
  UserPublic,
} from "@nexclass/shared";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("nexclass.token", token);
  else localStorage.removeItem("nexclass.token");
}

export function getAuthToken(): string | null {
  if (!authToken) authToken = localStorage.getItem("nexclass.token");
  return authToken;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token && options.auth !== false) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: string }).error)
        : `Request failed with status ${response.status}.`;
    const code =
      typeof body === "object" && body && "code" in body
        ? String((body as { code: string }).code)
        : undefined;
    throw new ApiError(response.status, message, code);
  }
  return body as T;
}

export const api = {
  register(input: {
    name: string;
    email: string;
    password: string;
    role: "teacher" | "student";
    preferredLanguage: LanguageCode;
  }) {
    return request<{ token: string; user: UserPublic }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false,
    });
  },

  login(input: { email: string; password: string }) {
    return request<{ token: string; user: UserPublic }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false,
    });
  },

  me() {
    return request<{ user: UserPublic }>("/api/auth/me");
  },

  logout() {
    return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  },

  listMeetings() {
    return request<{ hosted: MeetingPublic[]; joined: MeetingPublic[] }>("/api/meetings");
  },

  createMeeting(input: {
    title: string;
    speakerLanguage: LanguageCode;
    availableLanguages?: LanguageCode[];
    password?: string;
    participantPermissions?: {
      canUnmute: boolean;
      canShareScreen: boolean;
      canChat: boolean;
    };
    captionsEnabledByDefault?: boolean;
    voiceEnabledByDefault?: boolean;
  }) {
    return request<{ meeting: MeetingPublic }>("/api/meetings", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getMeeting(code: string) {
    return request<{ meeting: MeetingPublic }>(`/api/meetings/${code}`, { auth: false });
  },

  joinMeeting(
    code: string,
    input: {
      name: string;
      password?: string;
      language?: LanguageCode;
      captionLanguage?: LanguageCode;
      voiceLanguage?: LanguageCode;
    },
  ) {
    return request<{ meeting: MeetingPublic; participant: ParticipantPublic; token: string }>(
      `/api/meetings/${code}/join`,
      { method: "POST", body: JSON.stringify(input), auth: false },
    );
  },

  leaveMeeting(code: string) {
    return request<{ ok: boolean }>(`/api/meetings/${code}/leave`, { method: "POST" });
  },

  endMeeting(code: string) {
    return request<{ meeting: MeetingPublic }>(`/api/meetings/${code}/end`, { method: "POST" });
  },

  participants(code: string) {
    return request<{ participants: ParticipantPublic[] }>(`/api/meetings/${code}/participants`);
  },

  chatHistory(code: string) {
    return request<{ messages: ChatMessagePublic[] }>(`/api/meetings/${code}/chat`);
  },

  transcripts(code: string) {
    return request<{ segments: unknown[] }>(`/api/meetings/${code}/transcripts`);
  },

  setPreferences(
    code: string,
    input: {
      captionLanguage?: LanguageCode;
      voiceLanguage?: LanguageCode;
      interfaceLanguage?: LanguageCode;
    },
  ) {
    return request<{ participant: ParticipantPublic }>(`/api/meetings/${code}/preferences`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  providerStatus() {
    return request<{
      providers: {
        category: string;
        configured: boolean;
        provider: string;
        detail: string;
        envVars: string[];
      }[];
      languages: LanguageCode[];
      terminology: { total: number; approved: number; needsReview: number; draft: number };
      infrastructure: { mongodb: { connected: boolean; fallback: boolean }; redis: { connected: boolean } };
      demoMode: boolean;
    }>("/api/providers/status", { auth: false });
  },

  demoSegments() {
    return request<{
      simulated: boolean;
      notice: string;
      segments: {
        id: string;
        originalText: string;
        originalLanguage: LanguageCode;
        translations: Partial<Record<LanguageCode, string>>;
        speakerName: string;
        durationMs: number;
        terms: string[];
      }[];
      students: {
        id: string;
        name: string;
        language: LanguageCode;
        captionLanguage: LanguageCode;
        voiceLanguage: LanguageCode;
        cameraEnabled: boolean;
        microphoneEnabled: boolean;
      }[];
    }>("/api/demo/segments", { auth: false });
  },
};
