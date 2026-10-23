import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Globe2,
  KeyRound,
  Lock,
  Radio,
  Sparkles,
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
import {
  readGuestName,
  storeGuestName,
  storeGuestSession,
  storeRecentMeeting,
} from "@/components/dashboard/guestSession";

interface JoinProblem {
  title: string;
  message: string;
}

const OFFLINE_PROBLEM: JoinProblem = {
  title: "Meeting server is unreachable",
  message:
    "NexClass could not reach the meeting API. Start it with npm run dev:api, then try again.",
};

function describeProblem(error: unknown): JoinProblem {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "meeting_not_found":
        return {
          title: "Meeting not found",
          message:
            "No classroom matches that code. Check the six characters your host shared and try again.",
        };
      case "invalid_password":
        return {
          title: "Meeting password required",
          message:
            "This classroom is protected. Enter the password your host shared to continue.",
        };
      case "meeting_ended":
        return {
          title: "Meeting already ended",
          message:
            "The host has closed this session. Ask your teacher for a new code or a recording.",
        };
      case "login_required":
        return {
          title: "Sign in to join",
          message:
            "This server does not allow guest joins yet. Sign in with your NexClass account and try again.",
        };
      case "teacher_only":
        return {
          title: "Teachers only",
          message: "Only teacher accounts can create meetings.",
        };
      default:
        return { title: "Could not join the meeting", message: error.message };
    }
  }
  return OFFLINE_PROBLEM;
}

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const reduced = useReducedMotion() ?? false;

  const initialCode = sanitiseCode(searchParams.get("code") ?? "");
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(() => readGuestName() ?? user?.name ?? "");
  const [language, setLanguage] = useState<LanguageCode>(user?.preferredLanguage ?? "en");
  const [password, setPassword] = useState("");

  const [meeting, setMeeting] = useState<MeetingPublic | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveProblem, setResolveProblem] = useState<JoinProblem | null>(null);
  const [joinProblem, setJoinProblem] = useState<JoinProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    const normalised = code.trim().toUpperCase();
    setJoinProblem(null);

    if (normalised.length !== 6) {
      setJoinProblem({
        title: "Enter a meeting code",
        message: "Meeting codes are six characters, for example 7KQ2MD.",
      });
      return;
    }
    const displayName = name.trim();
    if (displayName.length < 2) {
      setJoinProblem({
        title: "Enter your name",
        message: "Other participants in the room see this name.",
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
      const result = await api.joinMeeting(normalised, {
        name: displayName,
        language,
        captionLanguage: language,
        voiceLanguage: language,
        password: password.trim() || undefined,
      });

      storeGuestSession(normalised, { token: result.token, name: displayName, language });
      storeGuestName(displayName);
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

      <main className="relative mx-auto grid w-full max-w-[1200px] gap-6 px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-10 lg:pt-10">
        <motion.section
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          aria-labelledby="join-heading"
          className="nc-panel relative overflow-hidden order-1 h-fit p-6 sm:p-8 border border-ink-600/80 shadow-lift"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent-400/8 blur-3xl" />
          <p className="nc-eyebrow">Guest access</p>
          <h1
            id="join-heading"
            className="mt-2 font-display text-2xl font-semibold tracking-tight text-ivory-50"
          >
            Join a classroom
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ivory-400">
            Enter the six character code your teacher shared. You do not need an account.
          </p>

          {joinProblem ? (
            <ErrorNotice
              className="mt-5"
              tone="error"
              title={joinProblem.title}
              message={joinProblem.message}
            />
          ) : null}

          {resolveProblem ? (
            <ErrorNotice
              className="mt-5"
              tone="warn"
              title={resolveProblem.title}
              message={resolveProblem.message}
            />
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <FormField id="join-meeting-code" label="Meeting code" required>
              <CodeInput
                id="join-meeting-code"
                value={code}
                onChange={handleCodeChange}
                invalid={Boolean(resolveProblem)}
              />
              <p className="pt-1 text-2xs text-ivory-400">
                Six characters, letters and numbers only. Pasting a code works too.
              </p>
            </FormField>

            {meeting ? (
              <motion.div
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="rounded-xl border border-accent-400/25 bg-accent-400/6 px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meeting.status === "live" ? "live" : "info"}>
                    {meeting.status === "live" ? "Live now" : meeting.status === "ended" ? "Ended" : "Ready"}
                  </Badge>
                  <span className="font-mono text-2xs tracking-[0.2em] text-ivory-300">
                    {meeting.code}
                  </span>
                </div>
                <p className="mt-2 font-display text-[15px] font-semibold text-ivory-50">
                  {meeting.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-2xs text-ivory-400">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Hosted by {meeting.hostName}
                </p>
              </motion.div>
            ) : resolving ? (
              <p role="status" className="text-2xs text-ivory-400">
                Looking for that classroom…
              </p>
            ) : null}

            <FormField id="join-display-name" label="Display name" required>
              <Input
                id="join-display-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="How your teacher sees you"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FormField>

            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium text-ivory-200">
                Caption language
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

            <FormField
              id="join-password"
              label="Meeting password"
              hint={needsPassword ? "Required" : "Optional"}
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
              <p id="join-password-hint" className="pt-1 text-2xs text-ivory-400">
                {needsPassword
                  ? "This classroom is password protected."
                  : "Leave empty unless the host shared a password."}
              </p>
            </FormField>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full"
              icon={<Radio className="h-4 w-4" aria-hidden="true" />}
            >
              {submitting ? "Joining classroom" : "Join classroom"}
            </Button>
          </form>

          <p className="mt-5 border-t border-ink-700 pt-4 text-2xs leading-relaxed text-ivory-400">
            Your name is remembered on this device so you never retype it.{" "}
            {user ? (
              <>
                You are signed in as{" "}
                <span className="text-ivory-100">{user.email}</span> - joining as a guest keeps
                your teacher account untouched.
              </>
            ) : (
              <>
                Have an account?{" "}
                <Link
                  to="/login"
                  className="nc-focus rounded text-accent-300 underline decoration-accent-400/40 underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to manage your meetings.
              </>
            )}
          </p>
        </motion.section>

        <motion.section
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.45, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }
          }
          aria-label="What happens in the classroom"
          className="order-2 hidden h-fit lg:block"
        >
          <div className="nc-panel p-6">
            <p className="nc-eyebrow">Inside the room</p>
            <p className="mt-3 text-balance font-display text-[22px] font-semibold leading-snug text-ivory-50">
              Everyone hears the same lecture, in the language that actually reaches them.
            </p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400/12 text-accent-300">
                  <Globe2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ivory-100">Captions follow you</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-ivory-400">
                    The original language stays on top. Your translation sits underneath, updated as
                    the teacher speaks.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400/12 text-accent-300">
                  <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ivory-100">Guests join instantly</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-ivory-400">
                    No sign-up form, no email confirmation. A code and a name are enough.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400/12 text-accent-300">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ivory-100">Your teacher controls</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-ivory-400">
                    Password, mute rules, screen sharing and caption defaults are all set on their
                    side.
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900/50 p-4">
              <p className="nc-eyebrow">Languages in this build</p>
              <p className="mt-2 text-2xs leading-relaxed text-ivory-400">
                English, Tamil, Hindi, Bengali, Marathi and Odia. The host chooses which caption
                languages are offered in a given meeting.
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {ALL_LANGUAGE_CODES.map((entry) => (
                  <li
                    key={entry}
                    className={clsx(
                      "rounded-full border px-2.5 py-1 text-2xs",
                      meeting && !availableLanguages.includes(entry)
                        ? "border-ink-700 text-ivory-400/60 line-through"
                        : "border-ink-600 text-ivory-200",
                    )}
                  >
                    {languageName(entry)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
