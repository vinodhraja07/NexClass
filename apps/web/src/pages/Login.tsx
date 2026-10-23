import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
  const reduced = useReducedMotion() ?? false;

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

  useEffect(() => {
    if (user) {
      if (meetingCode) {
        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate, meetingCode]);

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
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-ink-900 text-ivory-100">
      {/* Background decorations */}
      <div
        className="pointer-events-none absolute inset-0 bg-mesh-dark opacity-80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 nc-grain opacity-60"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          to="/"
          className="nc-focus inline-flex items-center gap-2.5 rounded-lg text-ivory-50 transition-opacity hover:opacity-90"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-400/15 border border-accent-400/25 text-accent-300 shadow-sm shadow-accent-400/20">
            <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">NexClass</span>
        </Link>
        <Link
          to="/"
          className="nc-focus inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-ivory-400 transition-colors hover:text-ivory-100 border border-ink-700/60 bg-ink-850/50 hover:bg-ink-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to home
        </Link>
      </header>

      {/* Main Centered Sign-In Form Container */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="nc-panel relative overflow-hidden p-6 sm:p-8 border border-ink-600/80 shadow-lift backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent-400/8 blur-3xl" />

            {/* Meeting Gate Banner (if redirected from joining a room) */}
            {meetingCode && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent-400/40 bg-accent-400/10 p-3 text-xs text-accent-200">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-400/20 text-accent-300 font-bold">
                  #{meetingCode.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ivory-50">Classroom Access Gate</p>
                  <p className="text-2xs text-ivory-300">
                    Sign in to your account to enter session #{meetingCode.toUpperCase()}.
                  </p>
                </div>
              </div>
            )}

            <p className="nc-eyebrow">Welcome back</p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ivory-50">
              Sign in to NexClass
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ivory-400">
              Enter your email and password to access your account.
            </p>

            {formError ? (
              <ErrorNotice
                className="mt-5"
                title="Unable to sign in"
                message={formError}
              />
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
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
                    className="pl-10"
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
                    className="pl-10 pr-11"
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
                        Contact your classroom teacher or workspace administrator to reset your password.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                size="lg"
                loading={submitting}
                className="w-full"
                icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              >
                {submitting ? "Signing in…" : meetingCode ? `Sign in & Enter Classroom` : "Sign in"}
              </Button>
            </form>

            {/* Quick 1-Click Demo Login Bar */}
            <div className="mt-5 pt-4 border-t border-ink-700/60">
              <p className="text-3xs font-semibold uppercase tracking-wider text-ivory-400 text-center mb-2.5">
                ⚡ 1-Click Demo Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={submitting}
                  onClick={async () => {
                    setEmail("teacher@nexclass.com");
                    setPassword("password123");
                    setSubmitting(true);
                    setFormError(null);
                    try {
                      await login("teacher@nexclass.com", "password123");
                      if (meetingCode) {
                        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
                      } else {
                        navigate("/dashboard", { replace: true });
                      }
                    } catch (err) {
                      setFormError(err instanceof ApiError ? err.message : "Could not sign in as demo teacher");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  👩‍🏫 Teacher
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={submitting}
                  onClick={async () => {
                    setEmail("student@nexclass.com");
                    setPassword("password123");
                    setSubmitting(true);
                    setFormError(null);
                    try {
                      await login("student@nexclass.com", "password123");
                      if (meetingCode) {
                        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
                      } else {
                        navigate("/dashboard", { replace: true });
                      }
                    } catch (err) {
                      setFormError(err instanceof ApiError ? err.message : "Could not sign in as demo student");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  🎓 Student
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-ivory-400">
            Don&apos;t have an account?{" "}
            <Link
              to={meetingCode ? `/register?code=${meetingCode}` : "/register"}
              className="nc-focus font-medium text-accent-300 hover:text-accent-200 underline decoration-accent-400/40 underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative py-4 text-center text-3xs text-ivory-500">
        NexClass &copy; {new Date().getFullYear()} · Multilingual Real-Time Classrooms
      </footer>
    </div>
  );
}
