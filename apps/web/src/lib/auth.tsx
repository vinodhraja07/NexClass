import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LanguageCode, UserPublic } from "@nexclass/shared";
import { api, getAuthToken, setAuthToken } from "./api";

interface AuthContextValue {
  user: UserPublic | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserPublic>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: "teacher" | "student";
    preferredLanguage: LanguageCode;
  }) => Promise<UserPublic>;
  logout: () => Promise<void>;
  updateLanguage: (language: LanguageCode) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const current = getAuthToken();
    if (!current) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user: loaded }) => {
        if (!cancelled) setUser(loaded);
      })
      .catch(() => {
        setAuthToken(null);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    setAuthToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role: "teacher" | "student";
      preferredLanguage: LanguageCode;
    }) => {
      const result = await api.register(input);
      setAuthToken(result.token);
      setToken(result.token);
      setUser(result.user);
      return result.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* token is discarded regardless */
    }
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateLanguage = useCallback(async (language: LanguageCode) => {
    setUser((current) => (current ? { ...current, preferredLanguage: language } : current));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, updateLanguage }),
    [user, token, loading, login, register, logout, updateLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
