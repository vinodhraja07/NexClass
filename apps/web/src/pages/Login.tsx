import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  AudioLines,
  Captions,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
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
      <div className="nc-panel relative overflow-hidden p-6 sm:p-8 border border-ink-600/80 shadow-lift backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent-400/8 blur-3xl" />

        {/* Meeting Entry Gate Notice */}
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
      </div>
    </AuthShell>
  );
}
