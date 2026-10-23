import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  AudioLines,
  Captions,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  Lock,
  Mail,
  Radio,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/components/dashboard/AuthShell";
import { CaptionStage } from "@/components/dashboard/CaptionStage";
import { ErrorNotice } from "@/components/dashboard/ErrorNotice";
import { FormField } from "@/components/dashboard/FormField";
import { Button, Input } from "@/components/ui";

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(trimmed)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const codeParam = searchParams.get("code");
  const state = location.state as { from?: string; code?: string } | null;
  const meetingCode = codeParam || state?.code || state?.from?.match(/code=([A-Z0-9]{6})/i)?.[1];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);
  const [quickFilledRole, setQuickFilledRole] = useState<"teacher" | "student" | null>(null);

  useEffect(() => {
    if (user) {
      if (meetingCode) {
        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate, meetingCode]);

  function fillDemoAccount(role: "teacher" | "student") {
    setQuickFilledRole(role);
    setFieldErrors({});
    setFormError(null);
    if (role === "teacher") {
      setEmail("teacher@nexclass.com");
      setPassword("password123");
    } else {
      setEmail("student@nexclass.com");
      setPassword("password123");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      if (meetingCode) {
        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
      } else {
        const target = state?.from && state.from !== "/login" ? state.from : "/dashboard";
        navigate(target, { replace: true });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError(
          "Meeting server is unreachable - make sure the API server is running on port 4000.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Multilingual live classroom"
      headline="One classroom. Six languages. Every student hears the same lecture."
      description="Real-time speech-to-text captions, neural translated voice, and terminology preservation for English, Tamil, Hindi, Bengali, Marathi and Odia learners."
      points={[
        {
          icon: <Captions className="h-4 w-4" aria-hidden="true" />,
          title: "Sub-second captions",
          body: "Original speech with synchronized translation in each participant's preferred script.",
        },
        {
          icon: <AudioLines className="h-4 w-4" aria-hidden="true" />,
          title: "Keyless translated voice",
          body: "Listen to the lecture spoken live in your native tongue without missing a beat.",
        },
        {
          icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
          title: "Verified safe rooms",
          body: "Authenticated sessions ensure classroom privacy and permanent transcript storage.",
        },
      ]}
      stage={<CaptionStage />}
    >
      <div className="relative overflow-hidden rounded-2xl border border-ink-600/70 bg-gradient-to-b from-ink-800/95 to-ink-900/95 p-6 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-lime-400/8 blur-3xl" />

        {/* Meeting Entry Gate Notice */}
        {meetingCode && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent-400/40 bg-accent-400/10 p-3 text-xs text-accent-200">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-400/20 text-accent-300">
              <Radio className="h-4 w-4 animate-pulse" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ivory-50 flex items-center gap-1.5">
                <span>Classroom Access Gate</span>
                <span className="rounded bg-accent-400/20 px-1.5 py-0.2 font-mono text-3xs font-bold uppercase text-accent-300">
                  #{meetingCode.toUpperCase()}
                </span>
              </p>
              <p className="text-2xs text-ivory-300">
                Sign in to your account to enter this live multilingual session.
              </p>
            </div>
          </div>
        )}

        {/* Header section */}
        <div className="flex items-center justify-between">
          <span className="nc-eyebrow flex items-center gap-1.5 text-accent-300 text-xs font-semibold">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Secure Authentication
          </span>
          <span className="rounded-full border border-ink-600 bg-ink-850 px-2 py-0.5 text-3xs font-mono uppercase tracking-wider text-ivory-400">
            NexClass Auth
          </span>
        </div>

        <h1 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-ivory-50 sm:text-[26px]">
          Sign in to NexClass
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-ivory-300">
          Enter your credentials to manage classrooms, save transcripts, and join live sessions.
        </p>

        {/* Quick 1-Click Demo Logins */}
        <div className="mt-4 rounded-xl border border-ink-700/80 bg-ink-950/60 p-3">
          <p className="text-3xs font-bold uppercase tracking-wider text-ivory-400 mb-2 flex items-center justify-between">
            <span>Instant Demo Sign-in</span>
            <span className="text-accent-400 font-mono text-[10px]">1-click fill</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount("teacher")}
              className={`nc-focus flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                quickFilledRole === "teacher"
                  ? "border-accent-400/60 bg-accent-400/15 text-accent-200 ring-1 ring-accent-400/30"
                  : "border-ink-600/70 bg-ink-900/80 text-ivory-200 hover:border-ink-500 hover:bg-ink-850"
              }`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-accent-400/20 text-accent-300">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-ivory-100">Teacher</p>
                <p className="text-3xs text-ivory-400 truncate">Dr. Meera</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount("student")}
              className={`nc-focus flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                quickFilledRole === "student"
                  ? "border-accent-400/60 bg-accent-400/15 text-accent-200 ring-1 ring-accent-400/30"
                  : "border-ink-600/70 bg-ink-900/80 text-ivory-200 hover:border-ink-500 hover:bg-ink-850"
              }`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-lime-400/20 text-lime-300">
                <UserRound className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-ivory-100">Student</p>
                <p className="text-3xs text-ivory-400 truncate">Arjun</p>
              </div>
            </button>
          </div>
        </div>

        {formError ? (
          <ErrorNotice
            className="mt-4"
            title="Unable to sign in"
            message={formError}
          />
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="login-email"
            label="Email Address"
            error={fieldErrors.email}
            required
          >
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400"
                aria-hidden="true"
              />
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@school.edu"
                value={email}
                invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className="pl-10 h-10 bg-ink-900/90 border-ink-600/80 focus:border-accent-400 text-sm"
              />
            </div>
          </FormField>

          <FormField
            id="login-password"
            label="Password"
            error={fieldErrors.password}
            required
          >
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400"
                aria-hidden="true"
              />
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className="pl-10 pr-11 h-10 bg-ink-900/90 border-ink-600/80 focus:border-accent-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="nc-focus absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ivory-400 transition-colors hover:text-ivory-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </FormField>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <button
              type="button"
              onClick={() => setResetNotice((prev) => !prev)}
              className="nc-focus rounded text-xs text-ivory-400 hover:text-ivory-100 transition-colors"
            >
              Forgot password?
            </button>
            <Link
              to={meetingCode ? `/register?code=${meetingCode}` : "/register"}
              className="nc-focus rounded text-xs text-accent-300 font-medium hover:text-accent-200 transition-colors"
            >
              Create account &rarr;
            </Link>
          </div>

          <AnimatePresence>
            {resetNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-2xs leading-relaxed text-sky-200 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-sky-300 shrink-0 mt-0.5" />
                  <span>
                    Password resets are administered by your school administrator. Alternatively, you can use the 1-click demo accounts above or register a new account.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full h-11 text-sm font-semibold shadow-lg shadow-accent-400/20 active:scale-[0.99] transition-all"
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            {submitting ? "Signing in…" : meetingCode ? `Sign in & Join Room #${meetingCode.toUpperCase()}` : "Sign in to NexClass"}
          </Button>
        </form>

        <div className="mt-6 border-t border-ink-700/70 pt-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-3xs text-ivory-400 font-medium">
            <span className="flex items-center gap-1 text-accent-300/90">
              <ShieldCheck className="h-3 w-3" />
              Verified TLS 1.3
            </span>
            <span>6 Indic Languages</span>
            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-accent-300/90" />
              Account Required
            </span>
          </div>

          <p className="text-center text-3xs text-ivory-400">
            Just testing or exploring?{" "}
            <Link
              to="/demo"
              className="nc-focus font-semibold text-accent-300 hover:text-accent-200 underline decoration-accent-400/40 underline-offset-4"
            >
              Try the Interactive Demo Classroom &rarr;
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
