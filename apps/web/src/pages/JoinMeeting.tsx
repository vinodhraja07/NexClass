import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Globe2,
  GraduationCap,
  KeyRound,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { languageName, type LanguageCode, type MeetingPublic } from "@nexclass/shared";
import { Badge, Button, Input } from "@/components/ui";
import { CodeInput, sanitiseCode } from "@/components/dashboard/CodeInput";
import { ErrorNotice } from "@/components/dashboard/ErrorNotice";
import { FormField } from "@/components/dashboard/FormField";
import { LanguageChips, ALL_LANGUAGE_CODES } from "@/components/dashboard/LanguageChips";
import { storeGuestSession, storeRecentMeeting } from "@/components/dashboard/guestSession";

interface JoinProblem {
  title: string;
  message: string;
}

const OFFLINE_PROBLEM: JoinProblem = {
  title: "Meeting server is unreachable",
  message:
    "NexClass could not reach the meeting API. Make sure the API server is running on port 4000.",
};

function describeProblem(error: unknown): JoinProblem {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "meeting_not_found":
        return {
          title: "Classroom not found",
          message:
            "No active classroom matches that code. Double-check the six characters shared by your teacher.",
        };
      case "invalid_password":
        return {
          title: "Meeting password required",
          message:
            "This classroom is password protected. Enter the password your teacher or host provided.",
        };
      case "meeting_ended":
        return {
          title: "Classroom has ended",
          message:
            "The teacher has concluded this session. Ask your host for a new session code or recording.",
        };
      case "login_required":
        return {
          title: "Sign in required to join",
          message:
            "This classroom requires an authenticated account. Please sign in or create an account to enter.",
        };
      case "teacher_only":
        return {
          title: "Teachers only",
          message: "Only teacher accounts can initiate classrooms.",
        };
      default:
        return { title: "Could not join classroom", message: error.message };
    }
  }
  return OFFLINE_PROBLEM;
}

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, login } = useAuth();
  const reduced = useReducedMotion() ?? false;

  const initialCode = sanitiseCode(searchParams.get("code") ?? "");
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState<LanguageCode>(user?.preferredLanguage ?? "en");
  const [password, setPassword] = useState("");

  const [meeting, setMeeting] = useState<MeetingPublic | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveProblem, setResolveProblem] = useState<JoinProblem | null>(null);
  const [joinProblem, setJoinProblem] = useState<JoinProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync preferred language if user loads
  useEffect(() => {
    if (user?.preferredLanguage) {
      setLanguage(user.preferredLanguage);
    }
  }, [user]);

  /* --------------------------- resolve the meeting ------------------------ */

  useEffect(() => {
    const value = code.trim().toUpperCase();
    if (value.length !== 6) {
      setMeeting(null);
      setResolveProblem(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setResolving(true);
      api
        .getMeeting(value)
        .then((result) => {
          if (cancelled) return;
          setMeeting(result.meeting);
          setResolveProblem(null);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setMeeting(null);
          setResolveProblem(describeProblem(error));
        })
        .finally(() => {
          if (!cancelled) setResolving(false);
        });
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [code]);

  function handleCodeChange(next: string) {
    setCode(next);
    setJoinProblem(null);
    if (next.length === 6) {
      setSearchParams({ code: next }, { replace: true });
    } else if (searchParams.get("code")) {
      setSearchParams({}, { replace: true });
    }
  }

  /* --------------------------------- join -------------------------------- */

  const availableLanguages = useMemo<LanguageCode[]>(() => {
    if (!meeting) return ALL_LANGUAGE_CODES;
    return meeting.availableLanguages?.length ? meeting.availableLanguages : ALL_LANGUAGE_CODES;
  }, [meeting]);

  const needsPassword = Boolean(meeting?.settings.passwordEnabled);

  // If the resolved classroom does not offer the chosen caption language,
  // fall back to one it actually supports.
  useEffect(() => {
    if (!meeting) return;
    const offered = meeting.availableLanguages ?? [];
    if (offered.length && !offered.includes(language)) {
      setLanguage(offered[0]);
    }
  }, [meeting, language]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      navigate(`/login?code=${code}`, { state: { from: `/join?code=${code}`, code } });
      return;
    }

    const normalised = code.trim().toUpperCase();
    setJoinProblem(null);

    if (normalised.length !== 6) {
      setJoinProblem({
        title: "Enter a meeting code",
        message: "Meeting codes are six characters, for example 7KQ2MD.",
      });
      return;
    }

    if (needsPassword && !password.trim()) {
      setJoinProblem({
        title: "Meeting password required",
        message: "This classroom is protected. Enter the password your host shared.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const displayName = user.name;
      const result = await api.joinMeeting(normalised, {
        name: displayName,
        language,
        captionLanguage: language,
        voiceLanguage: language,
        password: password.trim() || undefined,
      });

      storeGuestSession(normalised, { token: result.token, name: displayName, language });
      storeRecentMeeting({
        code: result.meeting.code,
        title: result.meeting.title,
        joinedAt: new Date().toISOString(),
      });

      navigate(`/meet/${result.meeting.code}`);
    } catch (error) {
      setJoinProblem(describeProblem(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-900">
      <div
        className="pointer-events-none absolute inset-0 bg-mesh-dark opacity-70"
        aria-hidden="true"
      />

      <header className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="nc-focus inline-flex items-center gap-2.5 rounded-lg text-ivory-50">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">NexClass</span>
        </Link>
        <Link
          to="/"
          className="nc-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ivory-400 transition-colors hover:text-ivory-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to home
        </Link>
      </header>

      <main className="relative mx-auto grid w-full max-w-[1200px] gap-6 px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[minmax(0,490px)_minmax(0,1fr)] lg:gap-10 lg:pt-8">
        <motion.section
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          aria-labelledby="join-heading"
          className="nc-panel relative overflow-hidden order-1 h-fit p-6 sm:p-8 border border-ink-600/80 shadow-lift"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent-400/8 blur-3xl" />
          
          <div className="flex items-center justify-between">
            <p className="nc-eyebrow flex items-center gap-1.5 text-accent-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Classroom Entry
            </p>
            <span className="rounded-full border border-ink-600 bg-ink-850 px-2 py-0.5 text-3xs font-mono uppercase tracking-wider text-ivory-400">
              Account Required
            </span>
          </div>

          <h1
            id="join-heading"
            className="mt-2.5 font-display text-2xl font-bold tracking-tight text-ivory-50 sm:text-[26px]"
          >
            Join a Classroom
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-ivory-300">
            Enter the 6-character code provided by your teacher. All participants must have an account to join.
          </p>

          {joinProblem ? (
            <ErrorNotice
              className="mt-4"
              tone="error"
              title={joinProblem.title}
              message={joinProblem.message}
            />
          ) : null}

          {resolveProblem ? (
            <ErrorNotice
              className="mt-4"
              tone="warn"
              title={resolveProblem.title}
              message={resolveProblem.message}
            />
          ) : null}

          <div className="mt-5 space-y-5">
            {/* Meeting Code Input */}
            <FormField id="join-meeting-code" label="Classroom Code" required>
              <CodeInput
                id="join-meeting-code"
                value={code}
                onChange={handleCodeChange}
                invalid={Boolean(resolveProblem)}
              />
              <p className="pt-1 text-2xs text-ivory-400">
                6-character code (e.g. 7KQ2MD). Case-insensitive.
              </p>
            </FormField>

            {/* Resolved Meeting Preview */}
            {meeting ? (
              <motion.div
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="rounded-xl border border-accent-400/35 bg-accent-400/8 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone={meeting.status === "live" ? "live" : "info"}>
                    {meeting.status === "live" ? "Live Classroom" : meeting.status === "ended" ? "Ended" : "Ready to Start"}
                  </Badge>
                  <span className="font-mono text-xs font-bold tracking-[0.2em] text-accent-300">
                    #{meeting.code}
                  </span>
                </div>
                <p className="mt-2 font-display text-[15.5px] font-semibold text-ivory-50">
                  {meeting.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-2xs text-ivory-300">
                  <Users className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                  Hosted by Dr. {meeting.hostName}
                </p>
              </motion.div>
            ) : resolving ? (
              <p role="status" className="text-2xs text-accent-300 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Resolving classroom details…
              </p>
            ) : null}

            {/* If NOT logged in: Show the Account Required Gate */}
            {!user ? (
              <div className="rounded-2xl border border-accent-400/35 bg-gradient-to-b from-accent-400/10 to-ink-950 p-5 text-center shadow-lg">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent-400/20 text-accent-300 shadow-inner">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="mt-2.5 font-display text-[16px] font-bold text-ivory-50">
                  Account Required to Join
                </h2>
                <p className="mt-1 text-2xs text-ivory-300 leading-relaxed max-w-sm mx-auto">
                  To protect classroom security and save your personal multilingual transcripts, an account is required to participate in live sessions.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    size="md"
                    onClick={() => navigate(`/login?code=${code}`, { state: { from: `/join?code=${code}`, code } })}
                    className="w-full text-xs font-semibold shadow-md shadow-accent-400/25"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Sign in to Enter Classroom
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/register?code=${code}`, { state: { from: `/join?code=${code}`, code } })}
                    className="w-full text-xs font-medium"
                  >
                    Create Free Account
                  </Button>
                </div>
              </div>
            ) : (
              /* If LOGGED IN: Show the verified student entry form */
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {/* Verified user card */}
                <div className="rounded-xl border border-accent-400/35 bg-accent-400/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/20 text-accent-300 font-bold text-xs uppercase">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ivory-50 flex items-center gap-1.5">
                        <span>{user.name}</span>
                        <span className="rounded bg-accent-400/25 px-1.5 py-0.2 text-3xs font-semibold uppercase text-accent-300">
                          {user.role}
                        </span>
                      </p>
                      <p className="text-3xs text-ivory-300">{user.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-3xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-[12.5px] font-semibold text-ivory-200">
                    Listening &amp; Caption Language
                  </legend>
                  <LanguageChips
                    mode="single"
                    value={[language]}
                    onChange={(next) => setLanguage(next[0] ?? "en")}
                    codes={availableLanguages}
                    label="Caption language"
                    description={
                      meeting
                        ? "Available languages for this classroom."
                        : "Available languages appear once the meeting code resolves."
                    }
                  />
                </fieldset>

                {needsPassword && (
                  <FormField
                    id="join-password"
                    label="Meeting Password"
                    hint="Required"
                  >
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="join-password"
                        name="password"
                        type="password"
                        autoComplete="off"
                        placeholder="Password shared by the host"
                        value={password}
                        aria-describedby="join-password-hint"
                        onChange={(event) => setPassword(event.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </FormField>
                )}

                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  className="w-full text-sm font-semibold shadow-md shadow-accent-400/25"
                  icon={<Radio className="h-4 w-4" aria-hidden="true" />}
                >
                  {submitting ? "Joining Classroom…" : "Enter Live Classroom"}
                </Button>
              </form>
            )}
          </div>

          <div className="mt-5 border-t border-ink-700/70 pt-3.5 flex items-center justify-between text-3xs text-ivory-400">
            <span>TLS 1.3 Verified Session</span>
            <Link
              to="/demo"
              className="text-accent-300 font-semibold hover:text-accent-200 underline decoration-accent-400/40"
            >
              Explore Demo Classroom &rarr;
            </Link>
          </div>
        </motion.section>

        {/* Right Explainer Column */}
        <motion.section
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.45, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }
          }
          aria-label="What happens in the classroom"
          className="order-2 hidden h-fit lg:block"
        >
          <div className="nc-panel p-6 border border-ink-600/70 bg-ink-850/80 shadow-lift">
            <p className="nc-eyebrow text-accent-300">Live Multilingual Learning</p>
            <p className="mt-2.5 text-balance font-display text-[22px] font-bold leading-snug text-ivory-50">
              One teacher speaks once. Every student follows in their native language.
            </p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                  <Globe2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ivory-100">
                    6 Indian Languages Synchronized
                  </p>
                  <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                    Real-time neural translation supports English, Tamil, Hindi, Bengali, Marathi, and Odia simultaneously.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ivory-100">
                    Terminology Locking
                  </p>
                  <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                    Scientific and technical terms like torque and eigenvalue never change meaning across translations.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ivory-100">
                    Authenticated Safe Classrooms
                  </p>
                  <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                    Sessions require verified accounts, preventing uninvited intruders and ensuring persistent student notes and transcripts.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
