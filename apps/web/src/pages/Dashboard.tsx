import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  Boxes,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  KeyRound,
  Languages,
  LayoutGrid,
  LogOut,
  Mic,
  MonitorUp,
  Palette,
  Play,
  Plus,
  PlusCircle,
  Radio,
  RefreshCw,
  Rocket,
  RotateCcw,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { LanguageCode, MeetingPublic } from "@nexclass/shared";
import { Badge, Button, Input } from "@/components/ui";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { ErrorNotice } from "@/components/dashboard/ErrorNotice";
import { FormField } from "@/components/dashboard/FormField";
import { LanguageChips, ALL_LANGUAGE_CODES } from "@/components/dashboard/LanguageChips";
import { MeetingList } from "@/components/dashboard/MeetingListItem";
import { ProviderStatusBar, type ProviderStatusData } from "@/components/dashboard/ProviderStatusBar";
import { Toggle } from "@/components/dashboard/Toggle";
import { CodeInput } from "@/components/dashboard/CodeInput";
import {
  readRecentMeetings,
  storeGuestSession,
  storeRecentMeeting,
} from "@/components/dashboard/guestSession";
import { DashboardSidebar, type DashboardView } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import { ClassroomsView } from "@/components/dashboard/ClassroomsView";
import { CreateClassroomView } from "@/components/dashboard/CreateClassroomView";
import { TranscriptsView } from "@/components/dashboard/TranscriptsView";
import { useTheme } from "@/themes/ThemeProvider";

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export default function Dashboard() {
  const { user, logout, updateLanguage } = useAuth();
  const { theme, setTheme, allThemes } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduced = useReducedMotion() ?? false;

  // Sidebar responsive rail state backed by localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("nexclass_sidebar_collapsed") === "true";
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Preference presets state
  const [prefAutoCaptions, setPrefAutoCaptions] = useState(true);
  const [prefAutoTTS, setPrefAutoTTS] = useState(true);
  const [updatingLang, setUpdatingLang] = useState(false);

  // Migrate URL query parameter from ?tab= to ?view= with backward compatibility
  const rawViewParam = (searchParams.get("view") || searchParams.get("tab")) as DashboardView | null;
  const initialView: DashboardView = useMemo(() => {
    if (rawViewParam && ["classrooms", "create", "transcripts", "preferences"].includes(rawViewParam)) {
      return rawViewParam;
    }
    return "classrooms";
  }, [rawViewParam]);

  const [activeView, setActiveViewState] = useState<DashboardView>(initialView);

  const handleSelectView = useCallback(
    (view: DashboardView) => {
      setActiveViewState(view);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (view === "classrooms") {
            next.delete("view");
          } else {
            next.set("view", view);
          }
          next.delete("tab"); // Clean up legacy tab param
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Synchronize view if URL search parameters change externally
  useEffect(() => {
    const current = (searchParams.get("view") || searchParams.get("tab")) as DashboardView | null;
    if (current && ["classrooms", "create", "transcripts", "preferences"].includes(current)) {
      setActiveViewState(current);
    } else if (!current) {
      setActiveViewState("classrooms");
    }
  }, [searchParams]);

  const setActiveTab = handleSelectView;
  const activeTab = activeView;
  const currentView = activeView;

  const isTeacher = user?.role === "teacher";

  /* ----------------------------- meetings state --------------------------- */

  const [hosted, setHosted] = useState<MeetingPublic[]>([]);
  const [joined, setJoined] = useState<MeetingPublic[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    try {
      const data = await api.listMeetings();
      setHosted(data.hosted ?? []);
      setJoined(data.joined ?? []);
      setOffline(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setMeetingsError(error.message);
      } else {
        setOffline(true);
        setMeetingsError(
          "Could not reach the meeting API. Make sure the API server is running on port 4000.",
        );
      }
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  /* --------------------------- provider status ---------------------------- */

  const [provider, setProvider] = useState<ProviderStatusData | null>(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  const loadProvider = useCallback(async () => {
    setProviderLoading(true);
    setProviderError(null);
    try {
      const data = await api.providerStatus();
      setProvider(data);
    } catch (error) {
      setProviderError(
        error instanceof ApiError ? error.message : "Provider status unavailable",
      );
    } finally {
      setProviderLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProvider();
  }, [loadProvider]);

  /* -------------------------- teacher: create ----------------------------- */

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [speakerLanguage, setSpeakerLanguage] = useState<LanguageCode>(
    user?.preferredLanguage ?? "en",
  );
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>([
    "en",
    "ta",
    "hi",
    "bn",
    "mr",
    "or",
  ]);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [canUnmute, setCanUnmute] = useState(true);
  const [canShareScreen, setCanShareScreen] = useState(true);
  const [canChat, setCanChat] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);

  const [creating, setCreating] = useState(false);
  const [creatingInstant, setCreatingInstant] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<MeetingPublic | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // 1-Click Instant Classroom Handler
  const handleInstantCreate = useCallback(async () => {
    setCreatingInstant(true);
    setCreateError(null);
    try {
      const randomSubjects = [
        "Interactive Multilingual Lecture",
        "Physics - Mechanics & Motion",
        "Mathematics - Applied Calculus",
        "Computer Science - System Design",
        "Global History & Culture",
      ];
      const randomTitle = randomSubjects[Math.floor(Math.random() * randomSubjects.length)];
      const result = await api.createMeeting({
        title: randomTitle,
        speakerLanguage: user?.preferredLanguage ?? "en",
        availableLanguages: ALL_LANGUAGE_CODES,
        participantPermissions: {
          canUnmute: true,
          canShareScreen: true,
          canChat: true,
        },
        captionsEnabledByDefault: true,
        voiceEnabledByDefault: true,
      });
      setCreated(result.meeting);
      storeRecentMeeting({
        code: result.meeting.code,
        title: result.meeting.title,
        joinedAt: new Date().toISOString(),
      });
      void loadMeetings();
      navigate(`/meet/${result.meeting.code}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateError(error.message);
      } else {
        setCreateError("Meeting server is unreachable - make sure the API is running.");
      }
    } finally {
      setCreatingInstant(false);
    }
  }, [user?.preferredLanguage, loadMeetings, navigate]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Give the meeting a title so learners recognise it.");
      titleRef.current?.focus();
      return;
    }
    if (passwordEnabled && password.trim().length < 4) {
      setPasswordError("Meeting password must be at least 4 characters.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const result = await api.createMeeting({
        title: trimmedTitle,
        speakerLanguage,
        availableLanguages,
        password: passwordEnabled ? password.trim() : undefined,
        participantPermissions: {
          canUnmute,
          canShareScreen,
          canChat,
        },
        captionsEnabledByDefault: captionsOn,
        voiceEnabledByDefault: voiceOn,
      });
      setCreated(result.meeting);
      setTitle("");
      setPassword("");
      setPasswordEnabled(false);
      void loadMeetings();
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateError(
          error.status === 403
            ? "Only teacher accounts can create meetings. Sign in with a teacher account to host a session."
            : error.message,
        );
      } else {
        setCreateError("Meeting server is unreachable - make sure the API is running on port 4000.");
      }
    } finally {
      setCreating(false);
    }
  }

  /* --------------------------- student: join ------------------------------ */

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState(user?.name ?? "");
  const [joinLanguage, setJoinLanguage] = useState<LanguageCode>(
    user?.preferredLanguage ?? "en",
  );
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalised = joinCode.trim().toUpperCase();
    if (normalised.length !== 6) {
      setJoinError("Meeting codes are six characters, for example 7KQ2MD.");
      return;
    }
    const displayName = joinName.trim();
    if (displayName.length < 2) {
      setJoinError("Enter the name other participants will see.");
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      const result = await api.joinMeeting(normalised, {
        name: displayName,
        language: joinLanguage,
      });
      storeGuestSession(normalised, {
        token: result.token,
        name: displayName,
        language: joinLanguage,
      });
      storeRecentMeeting({
        code: result.meeting.code,
        title: result.meeting.title,
        joinedAt: new Date().toISOString(),
      });
      navigate(`/meet/${result.meeting.code}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          setJoinError("No classroom matches that code. Check the six characters and try again.");
        } else if (error.status === 401) {
          setJoinError("This classroom is password protected or requires a signed-in account.");
        } else if (error.status === 410) {
          setJoinError("That meeting has already ended. Ask the host for a new code.");
        } else {
          setJoinError(error.message);
        }
      } else {
        setJoinError("Meeting server is unreachable - make sure the API is running on port 4000.");
      }
    } finally {
      setJoining(false);
    }
  }

  /* ------------------------------- derived -------------------------------- */

  const relevant = isTeacher ? hosted : joined;
  const upcoming = useMemo(
    () => relevant.filter((meeting) => meeting.status === "scheduled" || meeting.status === "live"),
    [relevant],
  );
  const recent = useMemo(
    () => relevant.filter((meeting) => meeting.status === "ended"),
    [relevant],
  );

  const [localRecents, setLocalRecents] = useState<MeetingPublic[]>([]);
  useEffect(() => {
    if (isTeacher) {
      setLocalRecents([]);
      return;
    }
    const entries = readRecentMeetings();
    setLocalRecents(
      entries
        .filter((entry) => !joined.some((meeting) => meeting.code === entry.code))
        .map((entry) => ({
          id: `local-${entry.code}`,
          code: entry.code,
          title: entry.title,
          hostId: "",
          hostName: "Guest session",
          status: "ended" as const,
          speakerLanguage: "en" as LanguageCode,
          availableLanguages: ALL_LANGUAGE_CODES,
          settings: {
            passwordEnabled: false,
            participantPermissions: { canUnmute: true, canShareScreen: true, canChat: true },
            defaultSpeakerLanguage: "en" as LanguageCode,
            availableLanguages: ALL_LANGUAGE_CODES,
            captionsEnabledByDefault: true,
            voiceEnabledByDefault: false,
          },
          createdAt: entry.joinedAt,
          startedAt: null,
          endedAt: null,
        })),
    );
  }, [isTeacher, joined]);

  const allRecent = [...recent, ...localRecents];
  const greeting = `${greetingFor(new Date())}, ${firstName(user?.name ?? "")}`.trim();

  async function handleSignOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-ink-950 overflow-hidden text-ivory-100 flex">
        <div className="pointer-events-none fixed inset-0 bg-mesh-dark opacity-60" aria-hidden="true" />

        {/* Ambient Breathing Background Glow Orbs */}
        {!reduced && (
          <motion.div
            animate={{
              scale: [1, 1.18, 0.96, 1],
              x: ["-45%", "-40%", "-48%", "-45%"],
              opacity: [0.15, 0.28, 0.18, 0.15],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none fixed -top-32 left-1/2 h-[520px] w-[750px] rounded-full bg-gradient-to-tr from-accent-400/20 via-accent-300/10 to-transparent blur-[140px]"
            aria-hidden="true"
          />
        )}

        {/* Sleek Left Sidebar Navigation (Desktop Rail & Mobile Slide-Over Drawer) */}
        <DashboardSidebar
          currentView={activeView}
          onSelectView={handleSelectView}
          user={user}
          activeClassroomsCount={upcoming.length}
          completedClassroomsCount={allRecent.length}
          serverStatus={provider}
          serverLoading={providerLoading}
          serverError={providerError}
          onRefreshServerStatus={loadProvider}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => {
            setSidebarCollapsed((prev) => {
              const next = !prev;
              localStorage.setItem("nexclass_sidebar_collapsed", String(next));
              return next;
            });
          }}
          isMobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
          onLogout={handleSignOut}
        />

        {/* Main Content Area with Responsive Rail Offset */}
        <div
          className={clsx(
            "flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-[0.2,0.8,0.2,1]",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
          )}
        >
          {/* Mobile Sticky Top Header (<1024px) */}
          <DashboardMobileHeader
            onOpenMobile={() => setMobileDrawerOpen(true)}
            user={user}
            isTeacher={isTeacher}
            activeView={activeView}
            onSelectView={handleSelectView}
          />

          {/* Focused View Main Container */}
          <main className="relative flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-8 py-6 sm:py-8">
        {offline && (
          <ErrorNotice
            className="mb-5"
            title="Meeting server is unreachable"
            message={
              <>
                NexClass could not reach the meeting API. Ensure the API server is running on port 4000 and retry.
              </>
            }
            action={
              <Button variant="secondary" size="sm" onClick={() => void loadMeetings()}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </Button>
            }
          />
        )}

        {/* ==================================================================== */}
        {/* TAB 1: CLASSROOMS COMMAND CENTER VIEW                                */}
        {/* ==================================================================== */}
        {(activeTab === "classrooms" || currentView === "classrooms") && (
          <div key="classrooms-tab" className="space-y-6">
            <ClassroomsView
              isTeacher={isTeacher}
              meetings={upcoming.length > 0 ? upcoming : relevant.filter((m) => m.status !== "ended")}
              recentMeetings={allRecent}
              loading={meetingsLoading}
              onRefresh={() => void loadMeetings()}
              onCreateClick={() => setActiveTab("create")}
              onNavigateTranscripts={() => setActiveTab("transcripts")}
              onInstantCreateComplete={() => void loadMeetings()}
            />

            {/* Provider Status Pill */}
            <ProviderStatusBar status={provider} loading={providerLoading} error={providerError} />
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: CREATE CLASSROOM (Dedicated Clean Setup & Live Preview)       */}
        {/* ==================================================================== */}
        {(activeTab === "create" || currentView === "create") && (
          <CreateClassroomView
            key="create-view"
            user={user}
            onSuccess={() => void loadMeetings()}
            onCancel={() => setActiveTab("classrooms")}
          />
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TRANSCRIPTS & ARCHIVE VIEW WITH REAL TXT EXPORT               */}
        {/* ==================================================================== */}
        {(activeTab === "transcripts" || currentView === "transcripts") && (
          <TranscriptsView
            key="transcripts-view"
            meetings={allRecent}
            loading={meetingsLoading}
            onRefresh={() => void loadMeetings()}
            onNavigateClassrooms={() => setActiveTab("classrooms")}
          />
        )}

        {/* ==================================================================== */}
        {/* TAB 4: PREFERENCES & LANGUAGES                                       */}
        {/* ==================================================================== */}
        {activeView === "preferences" && (
          <motion.div
            key="preferences-tab"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            <div className="nc-glass-panel p-6 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-ink-700/60">
                <div>
                  <p className="nc-eyebrow text-accent-300">User Configuration</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-ivory-50">
                    Preferences &amp; Language Presets
                  </h2>
                  <p className="text-xs text-ivory-300 mt-1">
                    Manage your multilingual defaults, speech recognition language, and visual theme.
                  </p>
                </div>
              </div>

              {/* Grid of Preference Sections */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Preferred Spoken & UI Language */}
                <div className="nc-glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                      <Languages className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-ivory-100">
                        Spoken &amp; Preferred Language
                      </h3>
                      <p className="text-3xs text-ivory-400">
                        Default speech recognition and native caption language
                      </p>
                    </div>
                  </div>

                  <LanguageChips
                    mode="single"
                    value={[user.preferredLanguage || "en"]}
                    onChange={async (next) => {
                      if (next[0]) {
                        setUpdatingLang(true);
                        try {
                          await updateLanguage(next[0]);
                        } finally {
                          setUpdatingLang(false);
                        }
                      }
                    }}
                    label="Preferred language"
                    description="Select which Indic language or English should be prioritized for your captions and speech translation:"
                  />
                  {updatingLang && (
                    <p className="text-2xs text-accent-300 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Saving language preference...
                    </p>
                  )}
                </div>

                {/* 2. Visual Theme Engine (Signature Monsoon Aurora Default) */}
                <div className="nc-glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                      <Palette className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-ivory-100">
                        Appearance &amp; Dark Theme
                      </h3>
                      <p className="text-3xs text-ivory-400">
                        Official Emerald Glass (#101A16) &amp; Sage (#C4B887) palette
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {allThemes.map((t) => {
                      const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTheme(t.id)}
                            className={clsx(
                              "nc-focus flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                              isSelected
                                ? "border-accent-400 bg-accent-400/15 shadow-[0_0_16px_rgba(66,220,197,0.2)]"
                                : "border-ink-700/60 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-850/60",
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-xs font-semibold text-ivory-100">{t.name}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-accent-300" />}
                            </div>
                            <span className="text-3xs text-ivory-400 line-clamp-1">{t.description}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* 3. In-Classroom Automation Presets */}
                <div className="nc-glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                      <Settings className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-ivory-100">
                        Classroom Defaults
                      </h3>
                      <p className="text-3xs text-ivory-400">
                        Default behavior when entering live meetings
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <Toggle
                      id="pref-auto-captions"
                      checked={prefAutoCaptions}
                      onChange={setPrefAutoCaptions}
                      label="Auto-enable live captions"
                      description="Display live synchronized subtitles immediately upon entering any classroom"
                    />
                    <Toggle
                      id="pref-auto-tts"
                      checked={prefAutoTTS}
                      onChange={setPrefAutoTTS}
                      label="Auto-play translated voice"
                      description="Synthesize foreign teacher speech into your preferred language using neural TTS"
                    />
                  </div>
                </div>

                {/* 4. Profile & Identity Summary */}
                <div className="nc-glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-ivory-100">
                        Account &amp; Role Identity
                      </h3>
                      <p className="text-3xs text-ivory-400">
                        Your verified educational credentials
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-ink-700/50">
                      <span className="text-ivory-400">Full Name</span>
                      <span className="font-semibold text-ivory-100">{user.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-ink-700/50">
                      <span className="text-ivory-400">Email Address</span>
                      <span className="font-mono text-2xs text-ivory-200">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-ivory-400">Classroom Role</span>
                      <Badge tone={isTeacher ? "accent" : "info"}>
                        {isTeacher ? "Teacher (Host)" : "Student (Participant)"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Clean Global Footer */}
      <footer className="relative py-4 border-t border-ink-700/40 text-center text-3xs text-ivory-500 bg-ink-950/80">
        NexClass &copy; {new Date().getFullYear()} · Real-Time Multilingual Classrooms
      </footer>
    </div>
  </div>
</MotionConfig>
  );
}
