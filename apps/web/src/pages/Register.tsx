import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  AudioLines,
  Captions,
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { LanguageCode, ParticipantRole } from "@nexclass/shared";
import { AuthShell } from "@/components/dashboard/AuthShell";
import { CaptionStage } from "@/components/dashboard/CaptionStage";
import { ErrorNotice } from "@/components/dashboard/ErrorNotice";
import { FormField } from "@/components/dashboard/FormField";
import { LanguageChips, ALL_LANGUAGE_CODES } from "@/components/dashboard/LanguageChips";
import { Button, Input } from "@/components/ui";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ROLES: {
  value: ParticipantRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}[] = [
  {
    value: "teacher",
    label: "Teacher",
    description: "Host sessions and control the room",
    icon: GraduationCap,
  },
  {
    value: "student",
    label: "Student",
    description: "Join sessions and follow along",
    icon: UserRound,
  },
];

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim().length < 2) {
    errors.name = "Enter your full name (at least 2 characters).";
  }
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Choose a password.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
const STRENGTH_COLORS = [
  "bg-ink-500",
  "bg-signal-live",
  "bg-signal-warn",
  "bg-lime-400",
  "bg-accent-400",
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, user } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const codeParam = searchParams.get("code");
  const state = location.state as { from?: string; code?: string } | null;
  const meetingCode = codeParam || state?.code || state?.from?.match(/code=([A-Z0-9]{6})/i)?.[1];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<ParticipantRole>("student");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (meetingCode) {
        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate, meetingCode]);

  const strength = useMemo(() => scorePassword(password), [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(name, email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.name || errors.email || errors.password) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        preferredLanguage: language,
      });
      if (meetingCode) {
        navigate(`/join?code=${meetingCode.toUpperCase()}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
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
      eyebrow="Create your classroom"
      headline="Start teaching in your language, on day one."
      description="Pick the language you think in. NexClass captions every session, translates the lecture and keeps the transcript for everyone in the room."
      points={[
        {
          icon: <Captions className="h-4 w-4" aria-hidden="true" />,
          title: "Six languages",
          body: "English, Tamil, Hindi, Bengali, Marathi and Odia from the first session.",
        },
        {
          icon: <AudioLines className="h-4 w-4" aria-hidden="true" />,
          title: "Translated voice",
          body: "Learners can hear the lecture spoken in their own language.",
        },
        {
          icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
          title: "You are in control",
          body: "Passwords, permissions and caption defaults are set per meeting.",
        },
      ]}
      stage={<CaptionStage focus={language} showSwitcher={false} />}
    >
      <div className="nc-panel relative overflow-hidden p-6 sm:p-8 border border-ink-600/80 shadow-lift backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent-400/8 blur-3xl" />

        {meetingCode && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent-400/40 bg-accent-400/10 p-3 text-xs text-accent-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-400/20 text-accent-300 font-bold">
              #{meetingCode.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ivory-50">Create Account to Enter Session</p>
              <p className="text-2xs text-ivory-300">
                Registering grants you entry into classroom #{meetingCode.toUpperCase()}.
              </p>
            </div>
          </div>
        )}

        <p className="nc-eyebrow">Get started</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ivory-50">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ivory-400">
          Free while the classroom is in preview. No card required.
        </p>

        {formError ? (
          <ErrorNotice className="mt-5" title="We could not create your account" message={formError} />
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField id="register-name" label="Full name" error={fieldErrors.name} required>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400"
                aria-hidden="true"
              />
              <Input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Meera Raghavan"
                value={name}
                invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField id="register-email" label="Email" error={fieldErrors.email} required>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400"
                aria-hidden="true"
              />
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@school.edu"
                value={email}
                invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField
            id="register-password"
            label="Password"
            hint="At least 8 characters"
            error={fieldErrors.password}
            required
          >
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Choose a password"
                value={password}
                invalid={Boolean(fieldErrors.password)}
                aria-describedby="register-password-strength"
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
            <div id="register-password-strength" className="flex items-center gap-2 pt-1">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 rounded-full ${index < strength ? STRENGTH_COLORS[strength] : "bg-ink-600"}`}
                  />
                ))}
              </div>
              <span
                className={`text-2xs font-medium ${
                  strength >= 3 ? "text-accent-300" : strength >= 1 ? "text-signal-warn" : "text-ivory-400"
                }`}
              >
                {STRENGTH_LABELS[strength]}
              </span>
            </div>
          </FormField>

          <fieldset className="space-y-2">
            <legend className="text-[13px] font-medium text-ivory-200">
              Role
              <span className="ml-1 text-accent-400">*</span>
            </legend>
            <div role="radiogroup" aria-label="Account role" className="grid gap-2 sm:grid-cols-2">
              {ROLES.map((option) => {
                const active = role === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRole(option.value)}
                    className={`nc-focus relative flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 ${
                      active
                        ? "border-accent-400/50 bg-accent-400/8"
                        : "border-ink-600 bg-ink-900/50 hover:border-ink-500"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="registerRoleSelectionPill"
                        className="absolute inset-0 rounded-xl bg-accent-400/10 border border-accent-400/40 -z-10 shadow-sm shadow-accent-400/20"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <Icon
                      className={`relative z-10 mt-0.5 h-4 w-4 shrink-0 ${active ? "text-accent-300" : "text-ivory-400"}`}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 min-w-0">
                      <span
                        className={`block text-[13px] font-medium ${active ? "text-ivory-50" : "text-ivory-200"}`}
                      >
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-2xs text-ivory-400">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[13px] font-medium text-ivory-200">
              Preferred language
              <span className="ml-1 text-accent-400">*</span>
            </legend>
            <LanguageChips
              mode="single"
              value={[language]}
              onChange={(next) => setLanguage(next[0] ?? "en")}
              codes={ALL_LANGUAGE_CODES}
              label="Preferred language"
              description="This becomes your default caption and voice language. You can change it per meeting."
            />
          </fieldset>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full"
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            {submitting ? "Creating account" : "Create account"}
          </Button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-6 border-t border-ink-700 pt-5"
        >
          <p className="text-2xs text-ivory-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="nc-focus rounded text-accent-300 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-200"
            >
              Sign in
            </Link>
            . Or{" "}
            <Link
              to="/demo"
              className="nc-focus rounded text-accent-300 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-200"
            >
              explore the demo classroom
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </AuthShell>
  );
}
