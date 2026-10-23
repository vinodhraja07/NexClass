import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  KeyRound,
  Languages,
  LogOut,
  Mic,
  MonitorUp,
  Play,
  Plus,
  Radio,
  RefreshCw,
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
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const [hosted, setHosted] = useState<MeetingPublic[]>([]);
  const [joined, setJoined] = useState<MeetingPublic[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const [provider, setProvider] = useState<ProviderStatusData | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);

  const createSectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const joinCodeRef = useRef<HTMLDivElement | null>(null);

  const isTeacher = user?.role === "teacher";

  /* ----------------------------- data loading ----------------------------- */

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
        setOffline(false);
      } else {
        setOffline(true);
        setMeetingsError(
          "The meeting server did not respond. Start it with npm run dev:api, then retry.",
        );
      }
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  const loadProviders = useCallback(async () => {
    setProviderLoading(true);
    setProviderError(null);
    try {
      const status = await api.providerStatus();
      setProvider(status);
      setOffline(false);
    } catch (error) {
      setProviderError(
        error instanceof ApiError
          ? error.message
          : "the API did not respond. Start it with npm run dev:api.",
      );
    } finally {
      setProviderLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
    void loadProviders();
  }, [loadMeetings, loadProviders]);

  /* --------------------------- teacher: create ---------------------------- */

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>(undefined);
  const [speakerLanguage, setSpeakerLanguage] = useState<LanguageCode>(
    user?.preferredLanguage ?? "en",
  );
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>(
    ALL_LANGUAGE_CODES,
  );
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [canUnmute, setCanUnmute] = useState(true);
  const [canShareScreen, setCanShareScreen] = useState(true);
  const [canChat, setCanChat] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingInstant, setCreatingInstant] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<MeetingPublic | null>(null);

  async function handleInstantCreate() {
    setCreatingInstant(true);
    setCreateError(null);
    try {
      const today = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const result = await api.createMeeting({
        title: `${firstName(user?.name ?? "Teacher")}'s Live Class (${today})`,
        speakerLanguage: user?.preferredLanguage ?? "en",
        availableLanguages: ALL_LANGUAGE_CODES,
        participantPermissions: {
          canUnmute: true,
          canShareScreen: true,
          canChat: true,
        },
        captionsEnabledByDefault: true,
        voiceEnabledByDefault: false,
      });
      setCreated(result.meeting);
      void loadMeetings();
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateError(
          error.status === 403
            ? "Only teacher accounts can create meetings."
            : error.message,
        );
      } else {
        setCreateError("Meeting server is unreachable - start the API with npm run dev:api.");
      }
    } finally {
      setCreatingInstant(false);
    }
  }

  useEffect(() => {
    setAvailableLanguages((previous) =>
      previous.includes(speakerLanguage) ? previous : [...previous, speakerLanguage],
    );
  }, [speakerLanguage]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setTitleError("Give the meeting a title of at least 3 characters.");
      return;
    }
    setTitleError(undefined);

    if (passwordEnabled && password.trim().length < 4) {
      setPasswordError("Meeting passwords need at least 4 characters.");
      return;
    }
    setPasswordError(undefined);

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
        setCreateError("Meeting server is unreachable - start the API with npm run dev:api.");
      }
    } finally {
      setCreating(false);
    }
  }

  function focusCreatePanel() {
    createSectionRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    window.setTimeout(() => titleRef.current?.focus(), reduced ? 0 : 320);
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
        setJoinError("Meeting server is unreachable - start the API with npm run dev:api.");
      }
    } finally {
      setJoining(false);
    }
  }

  function focusJoinPanel() {
    joinCodeRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
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
    // Meetings joined as a guest are tracked locally because the API records
    // them without a user id.
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
    <div className="relative min-h-screen bg-ink-900 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-mesh-dark opacity-60" aria-hidden="true" />
      {/* Ambient breathing background glow orbs */}
      <motion.div
        animate={
          reduced
            ? undefined
            : {
                scale: [1, 1.18, 0.96, 1],
                x: ["-45%", "-40%", "-48%", "-45%"],
                opacity: [0.15, 0.28, 0.18, 0.15],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed -top-32 left-1/2 h-[520px] w-[750px] rounded-full bg-gradient-to-tr from-accent-400/20 via-lime-400/12 to-teal-500/10 blur-[140px]"
        aria-hidden="true"
      />
      <motion.div
        animate={
          reduced
            ? undefined
            : {
                scale: [0.95, 1.15, 0.95],
                opacity: [0.10, 0.22, 0.10],
              }
        }
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none fixed top-1/2 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-bl from-accent-500/15 via-teal-400/10 to-transparent blur-[130px]"
        aria-hidden="true"
      />

      <header className="relative sticky top-0 z-20 border-b border-ink-700/70 bg-ink-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 sm:px-8">
          <Link to="/" className="nc-focus inline-flex items-center gap-2.5 rounded-lg text-ivory-50">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight">NexClass</span>
          </Link>

          <div className="order-3 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <h1 className="truncate font-display text-lg font-semibold tracking-tight text-ivory-50">
              {greeting}
            </h1>
            <p className="truncate text-2xs text-ivory-400">
              {isTeacher
                ? "Host a session, share the code, and everyone follows in their own language."
                : "Join a session with a code and follow the lecture in your own language."}
            </p>
          </div>

          <div className="order-4 flex w-full flex-wrap items-center gap-2 sm:order-none sm:w-auto">
            <Badge tone={isTeacher ? "accent" : "info"}>
              {isTeacher ? "Teacher" : "Student"}
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => navigate("/demo")}>
              Open demo
            </Button>
            {isTeacher ? (
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />} onClick={focusCreatePanel}>
                Create meeting
              </Button>
            ) : (
              <Button
                size="sm"
                icon={<Radio className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={focusJoinPanel}
              >
                Join a meeting
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              icon={<LogOut className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1400px] px-5 py-6 sm:px-8 sm:py-8">
        {offline ? (
          <ErrorNotice
            className="mb-5"
            title="Meeting server is unreachable"
            message={
              <>
                NexClass could not reach the meeting API. Start it with{" "}
                <code className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-2xs text-accent-300">
                  npm run dev:api
                </code>{" "}
                and then retry.
              </>
            }
            action={
              <Button variant="secondary" size="sm" onClick={() => void loadMeetings()}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </Button>
            }
          />
        ) : null}

        <ProviderStatusBar status={provider} loading={providerLoading} error={providerError} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)]">
          {/* ------------------------------ primary ----------------------------- */}
          <section
            ref={createSectionRef}
            aria-labelledby={isTeacher ? "create-meeting-heading" : "join-meeting-heading"}
            className="scroll-mt-28"
          >
            {isTeacher ? (
              <div className="nc-panel relative overflow-hidden p-5 sm:p-6 border border-ink-600/80 shadow-panel hover:border-accent-400/30 transition-all duration-300">
                <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent-400/6 blur-3xl" />
                {created ? (
                  <motion.div
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <Badge tone="accent">Meeting ready</Badge>
                    <h2
                      id="create-meeting-heading"
                      className="mt-3 font-display text-xl font-semibold text-ivory-50"
                    >
                      {created.title}
                    </h2>
                    <p className="mt-1 text-2xs text-ivory-400">
                      Share this code with your learners. It works for anyone, account or not.
                    </p>

                    <div className="mt-5 rounded-2xl border border-accent-400/30 bg-accent-400/8 px-5 py-5 text-center shadow-lg shadow-accent-400/10">
                      <p className="nc-eyebrow">Meeting code</p>
                      <motion.p
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="mt-2 font-mono text-[42px] font-bold leading-none tracking-[0.28em] text-accent-300 select-all"
                      >
                        {created.code}
                      </motion.p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <CopyButton value={created.code} label="Copy code" size="md" />
                      <CopyButton
                        value={`${window.location.origin}/meet/${created.code}`}
                        label="Copy link"
                        size="md"
                      />
                      <Button
                        size="md"
                        className="sm:ml-auto"
                        icon={<Play className="h-3.5 w-3.5" aria-hidden="true" />}
                        onClick={() => navigate(`/meet/${created.code}`)}
                      >
                        Start classroom
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-700 pt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCreated(null);
                          window.setTimeout(() => titleRef.current?.focus(), 60);
                        }}
                        icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                      >
                        Create another meeting
                      </Button>
                      <Link
                        to={`/meet/${created.code}`}
                        className="nc-focus inline-flex h-9 items-center rounded-lg px-3 text-[13px] text-ivory-300 transition-colors hover:text-ivory-50"
                      >
                        Open as host
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Instant 1-Click Meeting for maximum ease of use */}
                    <div className="mb-6 rounded-2xl border border-accent-400/35 bg-gradient-to-r from-accent-400/12 via-ink-850 to-ink-850 p-4 sm:p-5 shadow-panel">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/20 px-2.5 py-0.5 text-2xs font-bold text-accent-300">
                              ⚡ 1-Click Quick Class
                            </span>
                            <span className="text-2xs text-ivory-400">Zero setup needed</span>
                          </div>
                          <h3 className="mt-2 text-sm sm:text-base font-semibold text-ivory-50">
                            Start teaching immediately
                          </h3>
                          <p className="mt-0.5 text-2xs sm:text-xs text-ivory-300">
                            Generates an instant classroom with all 6 languages enabled. Get your code and start in 1 second.
                          </p>
                        </div>
                        <Button
                          size="md"
                          loading={creatingInstant}
                          onClick={handleInstantCreate}
                          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                        >
                          Start Instant Class
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 border-t border-ink-700/60 pt-5">
                      <div>
                        <h2
                          id="create-meeting-heading"
                          className="font-display text-lg font-semibold text-ivory-50"
                        >
                          Custom meeting
                        </h2>
                        <p className="mt-1 text-2xs text-ivory-400">
                          Customize your title and language defaults.
                        </p>
                      </div>
                      <Badge tone="neutral">Hosting</Badge>
                    </div>

                    {createError ? (
                      <ErrorNotice className="mt-4" title="Could not create the meeting" message={createError} />
                    ) : null}

                    <form className="mt-5 space-y-5" onSubmit={handleCreate} noValidate>
                      <FormField
                        id="meeting-title"
                        label="Meeting title"
                        error={titleError}
                        required
                        hint="Shown to learners"
                      >
                        <Input
                          id="meeting-title"
                          ref={titleRef}
                          name="title"
                          type="text"
                          placeholder="Rotational Motion - Week 4"
                          value={title}
                          invalid={Boolean(titleError)}
                          aria-describedby={titleError ? "meeting-title-error" : undefined}
                          onChange={(event) => {
                            setTitle(event.target.value);
                            if (titleError) setTitleError(undefined);
                          }}
                        />
                      </FormField>

                      <fieldset className="space-y-2">
                        <legend className="text-[13px] font-medium text-ivory-200">
                          Speaker language
                        </legend>
                        <LanguageChips
                          mode="single"
                          value={[speakerLanguage]}
                          onChange={(next) => setSpeakerLanguage(next[0] ?? "en")}
                          codes={ALL_LANGUAGE_CODES}
                          label="Speaker language"
                          description="The language you will teach in. Captions start from this language."
                        />
                      </fieldset>

                      {/* Advanced Settings Accordion */}
                      <div className="border-t border-ink-700/70 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced((prev) => !prev)}
                          className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl border border-ink-700/80 bg-ink-900/50 text-xs font-semibold text-ivory-300 hover:text-ivory-100 hover:border-ink-500 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Settings className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                            <span>Advanced Settings (Languages, Passwords &amp; Permissions)</span>
                          </span>
                          <ChevronDown
                            className={clsx(
                              "h-4 w-4 transition-transform duration-200 text-ivory-400",
                              showAdvanced && "rotate-180 text-accent-300",
                            )}
                            aria-hidden="true"
                          />
                        </button>

                        {showAdvanced ? (
                          <div className="mt-4 space-y-5 rounded-xl border border-ink-700/60 bg-ink-900/30 p-4">
                            <fieldset className="space-y-2">
                              <legend className="text-[13px] font-medium text-ivory-200">
                                Available caption languages
                              </legend>
                              <LanguageChips
                                mode="multiple"
                                value={availableLanguages}
                                onChange={setAvailableLanguages}
                                codes={ALL_LANGUAGE_CODES}
                                label="Available caption languages"
                                requiredCodes={[speakerLanguage]}
                                description="Learners can switch between these. The speaker language is always included."
                              />
                            </fieldset>

                            <div className="space-y-2">
                              <Toggle
                                id="meeting-password-toggle"
                                label="Require a meeting password"
                                description="Only people with the password can join."
                                checked={passwordEnabled}
                                onChange={(next) => {
                                  setPasswordEnabled(next);
                                  if (!next) setPasswordError(undefined);
                                }}
                              />
                              {passwordEnabled ? (
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
                                    placeholder="shared-secret"
                                    value={password}
                                    invalid={Boolean(passwordError)}
                                    aria-describedby={passwordError ? "meeting-password-error" : undefined}
                                    onChange={(event) => {
                                      setPassword(event.target.value);
                                      if (passwordError) setPasswordError(undefined);
                                    }}
                                  />
                                </FormField>
                              ) : null}
                            </div>

                            <fieldset className="space-y-2">
                              <legend className="text-[13px] font-medium text-ivory-200">
                                Participant permissions
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
                                  label="Can share screen"
                                  checked={canShareScreen}
                                  onChange={setCanShareScreen}
                                />
                                <Toggle id="perm-chat" label="Can chat" checked={canChat} onChange={setCanChat} />
                              </div>
                            </fieldset>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <Toggle
                                id="default-captions"
                                label="Captions on by default"
                                description="Every learner starts with captions visible."
                                checked={captionsOn}
                                onChange={setCaptionsOn}
                              />
                              <Toggle
                                id="default-voice"
                                label="Translated voice by default"
                                description="Needs a configured text-to-speech provider."
                                checked={voiceOn}
                                onChange={setVoiceOn}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        loading={creating}
                        className="w-full"
                        icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                      >
                        {creating ? "Creating meeting" : "Create meeting"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <div className="nc-panel relative overflow-hidden p-5 sm:p-6 border border-ink-600/80 shadow-panel hover:border-accent-400/30 transition-all duration-300">
                <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent-400/6 blur-3xl" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="join-meeting-heading"
                      className="font-display text-lg font-semibold text-ivory-50"
                    >
                      Join with a code
                    </h2>
                    <p className="mt-1 text-2xs text-ivory-400">
                      Six characters from your teacher. Instant session entry.
                    </p>
                  </div>
                  <Badge tone="info">Student</Badge>
                </div>

                {joinError ? (
                  <ErrorNotice className="mt-4" title="Could not join" message={joinError} />
                ) : null}

                <form className="mt-5 space-y-5" onSubmit={handleJoin} noValidate>
                  <div ref={joinCodeRef}>
                    <FormField id="join-code" label="Meeting code" required>
                      <CodeInput
                        id="join-code"
                        value={joinCode}
                        onChange={setJoinCode}
                        invalid={Boolean(joinError)}
                      />
                    </FormField>
                  </div>

                  <FormField id="join-name" label="Display name" required>
                    <Input
                      id="join-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="How your teacher sees you"
                      value={joinName}
                      onChange={(event) => setJoinName(event.target.value)}
                    />
                  </FormField>

                  <fieldset className="space-y-2">
                    <legend className="text-[13px] font-medium text-ivory-200">
                      Caption and voice language
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
                      description="Used for your captions and translated voice in this meeting."
                    />
                  </fieldset>

                  <Button
                    type="submit"
                    size="lg"
                    loading={joining}
                    className="w-full"
                    icon={<Radio className="h-4 w-4" aria-hidden="true" />}
                  >
                    {joining ? "Joining classroom" : "Join classroom"}
                  </Button>
                </form>

                <div className="mt-5 rounded-xl border border-ink-700 bg-ink-900/40 p-4">
                  <p className="nc-eyebrow">Preferred language</p>
                  <p className="mt-1.5 text-2xs leading-relaxed text-ivory-400">
                    Your account default is{" "}
                    <span className="text-ivory-100">
                      {ALL_LANGUAGE_CODES.includes(joinLanguage) ? joinLanguage.toUpperCase() : "EN"}
                    </span>
                    . It is sent with every join and saved to your profile.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ------------------------------ meetings ---------------------------- */}
          <section aria-labelledby="meetings-heading" className="space-y-5">
            <div className="nc-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="meetings-heading"
                    className="font-display text-lg font-semibold text-ivory-50"
                  >
                    {isTeacher ? "Your meetings" : "Your classroom history"}
                  </h2>
                  <p className="mt-1 text-2xs text-ivory-400">
                    {isTeacher
                      ? "Everything you host, ready to reopen or share."
                      : "Every session you joined on this device."}
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

              {meetingsError && !offline ? (
                <ErrorNotice className="mt-4" title="Could not load your meetings" message={meetingsError} />
              ) : null}

              <div className="mt-5 space-y-5">
                <div>
                  <h3 className="nc-eyebrow mb-2.5">Upcoming</h3>
                  <MeetingList
                    meetings={upcoming}
                    emptyMessage={
                      isTeacher
                        ? "No scheduled or live meetings yet. Create one to get a shareable code."
                        : "Nothing scheduled yet. Join with a code to see it here."
                    }
                  />
                </div>

                <div>
                  <h3 className="nc-eyebrow mb-2.5">Recent</h3>
                  <MeetingList
                    meetings={allRecent}
                    emptyMessage={
                      isTeacher
                        ? "Your finished meetings will appear here with their codes and transcripts."
                        : "Sessions you have joined will be listed here."
                    }
                    notes={
                      Object.fromEntries(
                        localRecents.map((meeting) => [meeting.code, "Joined on this device"]),
                      )
                    }
                    statusOverrides={
                      Object.fromEntries(
                        localRecents.map((meeting) => [
                          meeting.code,
                          { label: "Joined", tone: "info" as const },
                        ]),
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="nc-panel p-5">
              <h2 className="font-display text-[15px] font-semibold text-ivory-50">
                Quick reference
              </h2>
              <ul className="mt-3 space-y-2.5 text-2xs leading-relaxed text-ivory-400">
                <li className="flex items-start gap-2.5">
                  <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" aria-hidden="true" />
                  A meeting code is all a guest needs. Passwords are optional per meeting.
                </li>
                <li className="flex items-start gap-2.5">
                  <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" aria-hidden="true" />
                  Caption languages are set by the host. Learners can switch at any time in the room.
                </li>
                <li className="flex items-start gap-2.5">
                  <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" aria-hidden="true" />
                  Mute, screen share and chat permissions are decided when you create the meeting.
                </li>
                <li className="flex items-start gap-2.5">
                  <MonitorUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" aria-hidden="true" />
                  Translated voice needs a configured text-to-speech provider - check the status above.
                </li>
                <li className="flex items-start gap-2.5">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" aria-hidden="true" />
                  Open the demo classroom to see the full participant and translation flow.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-700 pt-4">
                <Button variant="secondary" size="sm" onClick={() => navigate("/demo")}>
                  Open demo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/join")}>
                  Join by code
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
