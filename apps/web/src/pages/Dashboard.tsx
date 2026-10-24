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
      void loadMeetings();
      setActiveTab("create");
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateError(error.message);
      } else {
        setCreateError("Meeting server is unreachable - make sure the API is running.");
      }
    } finally {
      setCreatingInstant(false);
    }
  }, [user?.preferredLanguage, loadMeetings, setActiveTab]);

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
            className="pointer-events-none fixed -top-32 left-1/2 h-[520px] w-[750px] rounded-full bg-gradient-to-tr from-accent-400/20 via-lime-400/12 to-teal-500/10 blur-[140px]"
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
        {/* TAB 1: MY CLASSROOMS                                                 */}
        {/* ==================================================================== */}
        {activeTab === "classrooms" && (
          <motion.div
            key="classrooms-tab"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Quick Action Bar for Teachers */}
            {isTeacher ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Action 1: Instant Class */}
                <div className="relative overflow-hidden rounded-2xl border border-accent-400/35 bg-gradient-to-br from-accent-400/15 via-ink-850 to-ink-900 p-5 shadow-panel flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/20 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-300">
                      ⚡ Instant Class
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-ivory-50">
                      Start teaching immediately
                    </h3>
                    <p className="mt-1 text-2xs text-ivory-300 leading-relaxed">
                      Launches an instant classroom with all 6 Indic languages enabled. Zero setup needed.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-700/60">
                    <Button
                      size="sm"
                      loading={creatingInstant}
                      onClick={handleInstantCreate}
                      className="w-full text-xs font-semibold shadow-md shadow-accent-400/25"
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                    >
                      Start Instant Class
                    </Button>
                  </div>
                </div>

                {/* Action 2: Custom Classroom */}
                <div className="relative overflow-hidden rounded-2xl border border-ink-600/80 bg-ink-850/80 p-5 shadow-panel flex flex-col justify-between hover:border-ink-500 transition-colors">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-700 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-ivory-300">
                      📝 Custom Setup
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-ivory-50">
                      Configure custom classroom
                    </h3>
                    <p className="mt-1 text-2xs text-ivory-400 leading-relaxed">
                      Set specific titles, teacher speaker language, restricted languages, or passwords.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-700/60">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setActiveTab("create")}
                      className="w-full text-xs font-semibold"
                      icon={<PlusCircle className="h-3.5 w-3.5 text-accent-300" />}
                    >
                      Open Custom Setup &rarr;
                    </Button>
                  </div>
                </div>

                {/* Action 3: Quick Join with Code */}
                <div className="relative overflow-hidden rounded-2xl border border-ink-600/80 bg-ink-850/80 p-5 shadow-panel flex flex-col justify-between hover:border-ink-500 transition-colors sm:col-span-2 lg:col-span-1">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-700 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-ivory-300">
                      🔑 Enter Another Room
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-ivory-50">
                      Join by 6-char code
                    </h3>
                    <p className="mt-1 text-2xs text-ivory-400 leading-relaxed">
                      Enter a peer&apos;s code to follow as a co-teacher or guest participant.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-700/60 flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 7KQ2MD"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="nc-focus h-9 w-full rounded-xl border border-ink-600 bg-ink-900/90 px-3 font-mono text-xs font-semibold uppercase tracking-wider text-ivory-50 placeholder:text-ivory-500"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={joinCode.trim().length !== 6}
                      onClick={() => navigate(`/meet/${joinCode.trim()}`)}
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Student Join Card */
              <div className="rounded-2xl border border-accent-400/30 bg-ink-850/80 p-6 shadow-panel max-w-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/15 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent-300">
                      Classroom Access
                    </span>
                    <h2 className="mt-2 font-display text-xl font-bold text-ivory-50">
                      Join a Classroom
                    </h2>
                    <p className="mt-1 text-xs text-ivory-300">
                      Enter the 6-character code provided by your teacher to follow in your language.
                    </p>
                  </div>
                  <Badge tone="info">Student</Badge>
                </div>

                {joinError && (
                  <ErrorNotice className="mt-4" title="Could not join" message={joinError} />
                )}

                <form className="mt-5 space-y-4" onSubmit={handleJoin} noValidate>
                  <FormField id="join-code" label="Meeting code" required>
                    <CodeInput
                      id="join-code"
                      value={joinCode}
                      onChange={setJoinCode}
                      invalid={Boolean(joinError)}
                    />
                  </FormField>

                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-semibold text-ivory-200">
                      Listening &amp; Caption Language
                    </legend>
                    <LanguageChips
                      mode="single"
                      value={[joinLanguage]}
                      onChange={(next) => {
                        const code = next[0] ?? "en";
                        setJoinLanguage(code);
                        void updateLanguage(code);
                      }}
                      codes={ALL_LANGUAGE_CODES}
                      label="Preferred language"
                      description="Captions and voice translation will play in this language."
                    />
                  </fieldset>

                  <Button
                    type="submit"
                    size="lg"
                    loading={joining}
                    className="w-full text-xs font-semibold"
                    icon={<Radio className="h-4 w-4" />}
                  >
                    {joining ? "Joining classroom…" : "Enter Live Classroom"}
                  </Button>
                </form>
              </div>
            )}

            {/* Meetings List Container */}
            <div className="rounded-2xl border border-ink-600/80 bg-ink-850/60 p-5 sm:p-6 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-ink-700/60">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ivory-50">
                    {isTeacher ? "Your Active & Scheduled Classrooms" : "Your Classrooms"}
                  </h2>
                  <p className="text-2xs text-ivory-400 mt-0.5">
                    {isTeacher
                      ? "Real-time multilingual rooms ready to launch or share."
                      : "Rooms you are enrolled in or scheduled to join."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadMeetings()}
                  aria-label="Refresh meetings"
                >
                  <RefreshCw
                    className={clsx("h-3.5 w-3.5", meetingsLoading && "animate-spin")}
                    aria-hidden="true"
                  />
                  Refresh
                </Button>
              </div>

              {meetingsError && !offline && (
                <ErrorNotice className="mt-4" title="Could not load your meetings" message={meetingsError} />
              )}

              <div className="mt-5 space-y-6">
                <div>
                  <h3 className="nc-eyebrow mb-3 flex items-center gap-1.5 text-accent-300">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Live &amp; Upcoming</span>
                  </h3>
                  <MeetingList
                    meetings={upcoming}
                    emptyMessage={
                      isTeacher
                        ? "No live or scheduled classrooms right now. Use 'Start Instant Class' above or create one."
                        : "Nothing scheduled right now. Join with a code to follow along."
                    }
                  />
                </div>

                {allRecent.length > 0 && (
                  <div className="pt-4 border-t border-ink-700/60 flex items-center justify-between">
                    <p className="text-xs text-ivory-400">
                      You have {allRecent.length} completed session{allRecent.length > 1 ? "s" : ""} in your history.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab("transcripts")}
                      icon={<FileText className="h-3.5 w-3.5" />}
                    >
                      View Transcripts &amp; History &rarr;
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Provider Status Pill */}
            <ProviderStatusBar status={provider} loading={providerLoading} error={providerError} />
          </motion.div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: CREATE CLASSROOM (Dedicated Clean Setup)                     */}
        {/* ==================================================================== */}
        {activeTab === "create" && (
          <motion.div
            key="create-tab"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl mx-auto"
          >
            <div className="nc-panel relative overflow-hidden p-6 sm:p-8 border border-ink-600/80 shadow-panel backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent-400/8 blur-3xl" />

              {created ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <Badge tone="accent">Classroom Created Successfully</Badge>
                    <span className="font-mono text-3xs text-ivory-400 uppercase">Live Ready</span>
                  </div>

                  <h2 className="mt-3 font-display text-2xl font-bold text-ivory-50">
                    {created.title}
                  </h2>
                  <p className="mt-1.5 text-xs text-ivory-300">
                    Share this code with your students. Anyone with a verified account can join.
                  </p>

                  <div className="mt-6 rounded-2xl border border-accent-400/35 bg-accent-400/10 px-6 py-6 text-center shadow-lg shadow-accent-400/10">
                    <p className="nc-eyebrow text-accent-300">Shareable Room Code</p>
                    <motion.p
                      initial={{ scale: 0.85 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className="mt-2 font-mono text-[46px] font-bold leading-none tracking-[0.25em] text-accent-300 select-all"
                    >
                      {created.code}
                    </motion.p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <CopyButton value={created.code} label="Copy code" size="md" />
                    <CopyButton
                      value={`${window.location.origin}/meet/${created.code}`}
                      label="Copy link"
                      size="md"
                    />
                    <Button
                      size="md"
                      className="sm:ml-auto shadow-md shadow-accent-400/25"
                      icon={<Play className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => navigate(`/meet/${created.code}`)}
                    >
                      Enter Classroom Now
                    </Button>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-ink-700/60 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCreated(null);
                        window.setTimeout(() => titleRef.current?.focus(), 60);
                      }}
                      icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                    >
                      Create Another Classroom
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("classrooms")}
                    >
                      Back to My Classrooms
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="nc-eyebrow text-accent-300">Classroom Setup</p>
                      <h2 className="mt-1.5 font-display text-2xl font-bold text-ivory-50">
                        Create a Custom Classroom
                      </h2>
                      <p className="mt-1 text-xs text-ivory-300">
                        Specify the lesson title, your spoken language, and participant permissions.
                      </p>
                    </div>
                    <Badge tone="accent">Host</Badge>
                  </div>

                  {createError && (
                    <ErrorNotice className="mt-4" title="Could not create meeting" message={createError} />
                  )}

                  <form className="mt-6 space-y-5" onSubmit={handleCreate} noValidate>
                    <FormField
                      id="meeting-title"
                      label="Classroom Title"
                      error={titleError}
                      required
                      hint="e.g. Physics - Mechanics of Rotating Bodies"
                    >
                      <Input
                        id="meeting-title"
                        ref={titleRef}
                        name="title"
                        type="text"
                        placeholder="Physics - Mechanics of Rotating Bodies"
                        value={title}
                        invalid={Boolean(titleError)}
                        aria-describedby={titleError ? "meeting-title-error" : undefined}
                        onChange={(event) => {
                          setTitle(event.target.value);
                          if (titleError) setTitleError(undefined);
                        }}
                      />
                    </FormField>

                    <fieldset className="space-y-1.5">
                      <legend className="text-xs font-semibold text-ivory-200">
                        Teacher Spoken Language
                        <span className="text-accent-400 ml-1">*</span>
                      </legend>
                      <LanguageChips
                        mode="single"
                        value={[speakerLanguage]}
                        onChange={(next) => setSpeakerLanguage(next[0] ?? "en")}
                        codes={ALL_LANGUAGE_CODES}
                        label="Speaker language"
                        description="The language you will teach in. Live captions are transcribed from this language."
                      />
                    </fieldset>

                    {/* Advanced Settings Accordion */}
                    <div className="border-t border-ink-700/60 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                        className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl border border-ink-700/80 bg-ink-900/50 text-xs font-semibold text-ivory-300 hover:text-ivory-100 hover:border-ink-500 transition-colors cursor-pointer select-none"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                          <span>Advanced Settings (Languages, Security &amp; Permissions)</span>
                        </span>
                        <ChevronDown
                          className={clsx(
                            "h-4 w-4 transition-transform duration-200 text-ivory-400",
                            showAdvanced && "rotate-180 text-accent-300",
                          )}
                          aria-hidden="true"
                        />
                      </button>

                      {showAdvanced && (
                        <div className="mt-4 space-y-5 rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
                          <fieldset className="space-y-1.5">
                            <legend className="text-xs font-semibold text-ivory-200">
                              Available Student Languages
                            </legend>
                            <LanguageChips
                              mode="multiple"
                              value={availableLanguages}
                              onChange={setAvailableLanguages}
                              codes={ALL_LANGUAGE_CODES}
                              label="Available caption languages"
                              requiredCodes={[speakerLanguage]}
                              description="Students can pick any of these for real-time captions and translated voice."
                            />
                          </fieldset>

                          <div className="space-y-2">
                            <Toggle
                              id="meeting-password-toggle"
                              label="Require a room password"
                              description="Only students with the password can enter."
                              checked={passwordEnabled}
                              onChange={(next) => {
                                setPasswordEnabled(next);
                                if (!next) setPasswordError(undefined);
                              }}
                            />
                            {passwordEnabled && (
                              <FormField
                                id="meeting-password"
                                label="Meeting password"
                                error={passwordError}
                                hint="At least 4 characters"
                              >
                                <Input
                                  id="meeting-password"
                                  name="password"
                                  type="text"
                                  autoComplete="off"
                                  placeholder="secret123"
                                  value={password}
                                  invalid={Boolean(passwordError)}
                                  aria-describedby={passwordError ? "meeting-password-error" : undefined}
                                  onChange={(event) => {
                                    setPassword(event.target.value);
                                    if (passwordError) setPasswordError(undefined);
                                  }}
                                />
                              </FormField>
                            )}
                          </div>

                          <fieldset className="space-y-2">
                            <legend className="text-xs font-semibold text-ivory-200">
                              Participant Permissions
                            </legend>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <Toggle
                                id="perm-unmute"
                                label="Can unmute"
                                checked={canUnmute}
                                onChange={setCanUnmute}
                              />
                              <Toggle
                                id="perm-screen"
                                label="Share screen"
                                checked={canShareScreen}
                                onChange={setCanShareScreen}
                              />
                              <Toggle
                                id="perm-chat"
                                label="Chat"
                                checked={canChat}
                                onChange={setCanChat}
                              />
                            </div>
                          </fieldset>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <Toggle
                              id="default-captions"
                              label="Captions on by default"
                              description="Learners start with captions visible."
                              checked={captionsOn}
                              onChange={setCaptionsOn}
                            />
                            <Toggle
                              id="default-voice"
                              label="Voice translated by default"
                              description="Plays localized speech automatically."
                              checked={voiceOn}
                              onChange={setVoiceOn}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="submit"
                        size="lg"
                        loading={creating}
                        className="flex-1 text-xs font-semibold"
                        icon={<Plus className="h-4 w-4" />}
                      >
                        {creating ? "Creating Classroom…" : "Create Classroom & Generate Code"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={() => setActiveTab("classrooms")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TRANSCRIPTS & HISTORY                                         */}
        {/* ==================================================================== */}
        {activeTab === "transcripts" && (
          <motion.div
            key="transcripts-tab"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-ink-600/80 bg-ink-850/80 p-6 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-ink-700/60">
                <div>
                  <p className="nc-eyebrow text-accent-300">Session Archives</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-ivory-50">
                    Classroom History &amp; Multi-Language Transcripts
                  </h2>
                  <p className="text-xs text-ivory-300 mt-1">
                    Every session automatically records and synchronizes spoken lectures into all 6 languages.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadMeetings()}
                  aria-label="Refresh history"
                >
                  <RefreshCw
                    className={clsx("h-3.5 w-3.5", meetingsLoading && "animate-spin")}
                    aria-hidden="true"
                  />
                  Refresh
                </Button>
              </div>

              {allRecent.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-750 text-accent-300">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-ivory-100">
                    No completed sessions yet
                  </h3>
                  <p className="mt-1 text-xs text-ivory-400 max-w-sm mx-auto">
                    Once you finish a live classroom session, your full speech transcripts across English, Tamil, Hindi, Bengali, Marathi, and Odia will be archived here.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    {isTeacher ? (
                      <Button size="sm" onClick={() => setActiveTab("classrooms")}>
                        Start a Classroom Now
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setActiveTab("classrooms")}>
                        Join a Classroom
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => navigate("/demo")}>
                      Explore Sample Demo Transcripts
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {allRecent.map((meeting) => (
                    <div
                      key={meeting.id || meeting.code}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-ink-700/80 bg-ink-900/60 p-4 hover:border-ink-500 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-accent-400/20 px-2 py-0.5 font-mono text-3xs font-bold uppercase text-accent-300">
                            #{meeting.code}
                          </span>
                          <span className="text-3xs text-ivory-400">
                            {meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString() : "Recent"}
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm font-semibold text-ivory-100 truncate">
                          {meeting.title}
                        </h4>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-3xs text-ivory-400">Languages captured:</span>
                          {ALL_LANGUAGE_CODES.map((code) => (
                            <span
                              key={code}
                              className="rounded bg-ink-800 px-1.5 py-0.2 font-mono text-3xs uppercase text-ivory-300 border border-ink-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Download className="h-3.5 w-3.5" />}
                          onClick={() => {
                            const blob = new Blob(
                              [
                                `NEXCLASS SESSION TRANSCRIPT ARCHIVE\nRoom: ${meeting.code}\nTitle: ${meeting.title}\nDate: ${meeting.createdAt}\nLanguages: English, Tamil, Hindi, Bengali, Marathi, Odia\n\n[Full synchronized transcripts saved in NexClass cloud storage]`,
                              ],
                              { type: "text/plain" },
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `nexclass-transcript-${meeting.code}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Export TXT
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/meet/${meeting.code}`)}
                        >
                          Reopen Session
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Architecture Reference */}
            <div className="rounded-2xl border border-ink-700/60 bg-ink-850/40 p-5">
              <h3 className="font-display text-sm font-semibold text-ivory-50 mb-3">
                How NexClass Transcripts Work
              </h3>
              <div className="grid gap-4 sm:grid-cols-3 text-2xs text-ivory-400">
                <div className="rounded-xl border border-ink-700/40 bg-ink-900/30 p-3">
                  <p className="font-semibold text-ivory-200 mb-1">1. Exact Teacher Speech</p>
                  <p>Audio is captured with WebRTC and transcribed in real-time, preserving technical terminology like &quot;torque&quot; and &quot;angular momentum&quot;.</p>
                </div>
                <div className="rounded-xl border border-ink-700/40 bg-ink-900/30 p-3">
                  <p className="font-semibold text-ivory-200 mb-1">2. 6-Way Neural Translation</p>
                  <p>Every sentence is synchronized and localized simultaneously for Tamil, Hindi, Bengali, Marathi, and Odia learners.</p>
                </div>
                <div className="rounded-xl border border-ink-700/40 bg-ink-900/30 p-3">
                  <p className="font-semibold text-ivory-200 mb-1">3. Permanent Storage</p>
                  <p>Transcripts are preserved per room so students can review lessons in their native tongue anytime after class.</p>
                </div>
              </div>
            </div>
          </motion.div>
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
                        Signature Monsoon Aurora oceanic palette
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
