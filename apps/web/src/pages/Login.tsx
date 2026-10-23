import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AudioLines, Captions, Eye, EyeOff, Mail, ShieldCheck, Sparkles } from "lucide-react";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const state = location.state as { from?: string } | null;
      const target = state?.from && state.from !== "/login" ? state.from : "/dashboard";
      navigate(target, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError(
          "Meeting server is unreachable - start the API with npm run dev:api and try again.",
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
      description="Live captions, translated voice and a shared transcript for Tamil, Hindi, Bengali, Marathi and Odia learners - in the same room, at the same time."
      points={[
        {
          icon: <Captions className="h-4 w-4" aria-hidden="true" />,
          title: "Live captions",
          body: "Original speech plus an instant translation in the language each learner chose.",
        },
        {
          icon: <AudioLines className="h-4 w-4" aria-hidden="true" />,
          title: "Translated voice",
          body: "Hear the lecture in your own language without losing the pace of the room.",
        },
        {
          icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
          title: "Host controls",
          body: "Meeting passwords, mute permissions and per-session language defaults.",
        },
      ]}
      stage={<CaptionStage />}
    >
      <div className="nc-panel p-6 sm:p-8">
        <p className="nc-eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ivory-50">
          Sign in to NexClass
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ivory-400">
          Pick up your sessions, transcripts and language settings.
        </p>

        {formError ? (
          <ErrorNotice
            className="mt-5"
            title="We could not sign you in"
            message={formError}
          />
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="login-email"
            label="Email"
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
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}                onChange={(event) => {
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
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className="pr-11"
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
              aria-disabled="true"
              onClick={() => setResetNotice(true)}
              title="Password reset is not enabled in this build"
              className="nc-focus rounded text-xs text-ivory-400 underline decoration-ink-500 underline-offset-4 transition-colors hover:text-ivory-100"
            >
              Forgot password?
            </button>
            <Link
              to="/register"
              className="nc-focus rounded text-xs text-accent-300 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-200"
            >
              Create an account
            </Link>
          </div>

          <p
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 rounded-lg border border-signal-warn/25 bg-signal-warn/8 px-3 py-2 text-2xs leading-relaxed text-ivory-300"
          >
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-warn" aria-hidden="true" />
            <span>
              {resetNotice
                ? "Password reset is not enabled in this build. Ask your workspace administrator to reset it."
                : "Password reset is not enabled in this build - ask your workspace administrator to reset it."}
            </span>
          </p>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full"
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            {submitting ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-6 border-t border-ink-700 pt-5"
        >
          <p className="text-2xs text-ivory-400">
            Just looking around?{" "}
            <Link
              to="/demo"
              className="nc-focus rounded text-accent-300 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-200"
            >
              Explore the demo classroom instead
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </AuthShell>
  );
}
