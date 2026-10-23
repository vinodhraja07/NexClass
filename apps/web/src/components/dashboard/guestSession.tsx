import type { LanguageCode } from "@nexclass/shared";

/**
 * Guest (unauthenticated) join sessions.
 *
 * The join endpoint issues a scoped participant token even for people who do
 * not have an account. The token is stored per meeting so the classroom can
 * resume the session after a reload, and the display name is remembered so a
 * guest never has to retype it.
 */

export const GUEST_NAME_KEY = "nexclass.guest.name";
export const RECENT_MEETINGS_KEY = "nexclass.recent.meetings";

export interface GuestSession {
  token: string;
  name: string;
  language: LanguageCode;
}

export interface RecentMeeting {
  code: string;
  title: string;
  joinedAt: string;
}

export function guestSessionKey(code: string): string {
  return `nexclass.guest.${code.toUpperCase()}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function storeGuestSession(code: string, session: GuestSession): void {
  try {
    localStorage.setItem(guestSessionKey(code), JSON.stringify(session));
  } catch {
    /* storage is optional */
  }
}

export function readGuestSession(code: string): GuestSession | null {
  try {
    return safeParse<GuestSession>(localStorage.getItem(guestSessionKey(code)));
  } catch {
    return null;
  }
}

export function storeGuestName(name: string): void {
  try {
    localStorage.setItem(GUEST_NAME_KEY, name);
  } catch {
    /* storage is optional */
  }
}

export function readGuestName(): string | null {
  try {
    return localStorage.getItem(GUEST_NAME_KEY);
  } catch {
    return null;
  }
}

/**
 * The API records guest participants without a user id, so a signed-in student
 * would not see their own joins in the account listing. We keep a small local
 * trail so "recently joined" stays useful.
 */
export function storeRecentMeeting(meeting: RecentMeeting): void {
  try {
    const existing = readRecentMeetings().filter((entry) => entry.code !== meeting.code);
    const next = [meeting, ...existing].slice(0, 12);
    localStorage.setItem(RECENT_MEETINGS_KEY, JSON.stringify(next));
  } catch {
    /* storage is optional */
  }
}

export function readRecentMeetings(): RecentMeeting[] {
  try {
    const parsed = safeParse<RecentMeeting[]>(localStorage.getItem(RECENT_MEETINGS_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.code === "string");
  } catch {
    return [];
  }
}
