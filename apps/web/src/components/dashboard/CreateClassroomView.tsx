import { useState, useRef, type FormEvent, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  Languages,
  Plus,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import clsx from "clsx";
import {
  languageName,
  type LanguageCode,
  type MeetingPublic,
  type UserPublic,
} from "@nexclass/shared";
import { api, ApiError } from "@/lib/api";
import { Badge, Button, Input } from "@/components/ui";
import { ErrorNotice } from "@/components/dashboard/ErrorNotice";
import { FormField } from "@/components/dashboard/FormField";
import { LanguageChips, ALL_LANGUAGE_CODES } from "@/components/dashboard/LanguageChips";
import { Toggle } from "@/components/dashboard/Toggle";
import { MeetingCardPreview } from "@/components/dashboard/MeetingCardPreview";
import { CelebratoryModal } from "@/components/dashboard/CelebratoryModal";
import { storeRecentMeeting } from "@/components/dashboard/guestSession";
import { SPRINGS } from "@/lib/motion";

export interface CreateClassroomViewProps {
  user: UserPublic;
  onSuccess?: (meeting: MeetingPublic) => void;
  onCancel?: () => void;
  className?: string;
}

export function CreateClassroomView({
  user,
  onSuccess,
  onCancel,
  className,
}: CreateClassroomViewProps) {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [speakerLanguage, setSpeakerLanguage] = useState<LanguageCode>(
    user.preferredLanguage || "en",
  );
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>([
    "en",
    "ta",
    "hi",
    "bn",
    "mr",
    "or",
  ]);
  const [languageError, setLanguageError] = useState<string | undefined>();
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [canUnmute, setCanUnmute] = useState(true);
  const [canShareScreen, setCanShareScreen] = useState(true);
  const [canChat, setCanChat] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<MeetingPublic | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  const handleSpeakerLanguageChange = useCallback(
    (next: LanguageCode[]) => {
      const selected = next[0] || "en";
      setSpeakerLanguage(selected);
      // Ensure the speaker language is always included in available languages
      setAvailableLanguages((prev) =>
        prev.includes(selected) ? prev : [...prev, selected],
      );
      if (languageError) setLanguageError(undefined);
    },
    [languageError],
  );

  const handleAvailableLanguagesChange = useCallback(
    (next: LanguageCode[]) => {
      // Keep speaker language locked in
      const withSpeaker = next.includes(speakerLanguage)
        ? next
        : [...next, speakerLanguage];
      setAvailableLanguages(withSpeaker);
      if (withSpeaker.length > 0 && languageError) {
        setLanguageError(undefined);
      }
    },
    [speakerLanguage, languageError],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    // Form Validation 1: Title
    if (!trimmedTitle) {
      setTitleError("Give the classroom a title so learners recognise it.");
      titleRef.current?.focus();
      return;
    }

    // Form Validation 2: Available Caption Languages
    if (availableLanguages.length === 0) {
      setLanguageError("Select at least one caption language for learners.");
      return;
    }

    // Form Validation 3: Room Password
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

      setCreatedMeeting(result.meeting);
      storeRecentMeeting({
        code: result.meeting.code,
        title: result.meeting.title,
        joinedAt: new Date().toISOString(),
      });

      if (onSuccess) {
        onSuccess(result.meeting);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateError(
          error.status === 403
            ? "Only teacher accounts can create classrooms. Please sign in with an instructor profile."
            : error.message,
        );
      } else {
        setCreateError(
          "Meeting server is unreachable. Please verify that the backend API is online.",
        );
      }
    } finally {
      setCreating(false);
    }
  }

  const handleResetForm = useCallback(() => {
    setCreatedMeeting(null);
    setTitle("");
    setPassword("");
    setPasswordEnabled(false);
    setShowAdvanced(false);
    window.setTimeout(() => titleRef.current?.focus(), 80);
  }, []);

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className={clsx("w-full space-y-6", className)}
    >
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-ink-700/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="nc-eyebrow text-accent-300">Classroom Setup</span>
            <Badge tone="accent">Host</Badge>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ivory-50">
            Create a Multilingual Classroom
          </h2>
          <p className="mt-1 text-xs text-ivory-300">
            Configure your lecture language, enabled student subtitles, room access, and in-class permissions.
          </p>
        </div>

        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Back to Classrooms
          </Button>
        )}
      </div>

      {createError && (
        <ErrorNotice
          className="my-3"
          title="Could not create classroom"
          message={createError}
        />
      )}

      {/* 2-Column Split Configuration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols on lg): Interactive Configuration Form */}
        <div className="lg:col-span-7">
          <div className="nc-panel relative overflow-hidden p-6 sm:p-7 border border-ink-650 bg-ink-900/60 backdrop-blur-xl shadow-panel rounded-2xl">
            <form className="space-y-6" onSubmit={handleCreate} noValidate>
              {/* 1. Classroom Title Input */}
              <FormField
                id="create-classroom-title"
                label="Classroom Title"
                error={titleError}
                required
                hint="e.g. Physics - Mechanics of Rotating Bodies"
              >
                <Input
                  id="create-classroom-title"
                  ref={titleRef}
                  name="title"
                  type="text"
                  placeholder="e.g. Physics - Mechanics of Rotating Bodies"
                  value={title}
                  invalid={Boolean(titleError)}
                  aria-describedby={titleError ? "create-classroom-title-error" : undefined}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (titleError) setTitleError(undefined);
                  }}
                />
              </FormField>

              {/* 2. Teacher Spoken Lecture Language */}
              <fieldset className="space-y-2">
                <div className="flex items-center justify-between">
                  <legend className="text-xs font-semibold text-ivory-200">
                    Teacher Spoken Lecture Language
                    <span className="text-accent-400 ml-1">*</span>
                  </legend>
                  <span className="text-3xs text-ivory-400">
                    6 Indic languages + English supported
                  </span>
                </div>
                <LanguageChips
                  mode="single"
                  value={[speakerLanguage]}
                  onChange={handleSpeakerLanguageChange}
                  codes={ALL_LANGUAGE_CODES}
                  label="Teacher lecture language"
                  description="The primary language you will speak. Speech recognition directly transcribes from this language."
                />
              </fieldset>

              {/* 3. Student Caption Language Matrix */}
              <fieldset className="space-y-2">
                <div className="flex items-center justify-between">
                  <legend className="text-xs font-semibold text-ivory-200">
                    Available Student Caption Languages
                    <span className="text-accent-400 ml-1">*</span>
                  </legend>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvailableLanguages(ALL_LANGUAGE_CODES)}
                      className="text-3xs text-accent-300 hover:text-accent-200 transition-colors underline cursor-pointer"
                    >
                      Select All (6)
                    </button>
                  </div>
                </div>

                <LanguageChips
                  mode="multiple"
                  value={availableLanguages}
                  onChange={handleAvailableLanguagesChange}
                  codes={ALL_LANGUAGE_CODES}
                  label="Available student subtitles"
                  requiredCodes={[speakerLanguage]}
                  description="Learners can switch between any of these languages for real-time live captions and voice translation."
                />
                {languageError && (
                  <p className="text-2xs text-signal-danger font-medium">{languageError}</p>
                )}
              </fieldset>

              {/* 4. Advanced Settings Accordion (Security & Permissions) */}
              <div className="border-t border-ink-700/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl border border-ink-700/80 bg-ink-900/50 text-xs font-semibold text-ivory-300 hover:text-ivory-100 hover:border-ink-500 transition-colors cursor-pointer select-none"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                    <span>Security &amp; Participant Permissions</span>
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
                    {/* Password Protection */}
                    <div className="space-y-2">
                      <Toggle
                        id="create-password-toggle"
                        label="Require room password"
                        description="Only students with the password can enter this classroom."
                        checked={passwordEnabled}
                        onChange={(next) => {
                          setPasswordEnabled(next);
                          if (!next) setPasswordError(undefined);
                        }}
                      />
                      {passwordEnabled && (
                        <FormField
                          id="create-room-password"
                          label="Meeting Password"
                          error={passwordError}
                          hint="At least 4 characters"
                        >
                          <Input
                            id="create-room-password"
                            name="password"
                            type="text"
                            autoComplete="off"
                            placeholder="e.g. physics2026"
                            value={password}
                            invalid={Boolean(passwordError)}
                            aria-describedby={passwordError ? "create-room-password-error" : undefined}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              if (passwordError) setPasswordError(undefined);
                            }}
                          />
                        </FormField>
                      )}
                    </div>

                    {/* Participant In-Room Permissions */}
                    <fieldset className="space-y-2">
                      <legend className="text-xs font-semibold text-ivory-200">
                        Participant In-Classroom Permissions
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Toggle
                          id="perm-toggle-unmute"
                          label="Can unmute"
                          description="Microphone"
                          checked={canUnmute}
                          onChange={setCanUnmute}
                        />
                        <Toggle
                          id="perm-toggle-screen"
                          label="Share screen"
                          description="Presentation"
                          checked={canShareScreen}
                          onChange={setCanShareScreen}
                        />
                        <Toggle
                          id="perm-toggle-chat"
                          label="In-room chat"
                          description="Messaging"
                          checked={canChat}
                          onChange={setCanChat}
                        />
                      </div>
                    </fieldset>

                    {/* Captions and Voice Defaults */}
                    <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-ink-800/80">
                      <Toggle
                        id="default-toggle-captions"
                        label="Captions on by default"
                        description="Live subtitles start enabled for learners."
                        checked={captionsOn}
                        onChange={setCaptionsOn}
                      />
                      <Toggle
                        id="default-toggle-voice"
                        label="Voice translation on by default"
                        description="Plays synthesized translated audio."
                        checked={voiceOn}
                        onChange={setVoiceOn}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-ink-700/60">
                <Button
                  type="submit"
                  size="lg"
                  loading={creating}
                  className="flex-1 text-xs font-semibold shadow-md shadow-accent-400/20"
                  icon={<Plus className="h-4 w-4" />}
                >
                  {creating ? "Creating Classroom…" : "Create Classroom & Generate Code"}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols on lg): Sticky Real-Time Live Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-ivory-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-300" />
              <span>Real-Time Live Card Preview</span>
            </span>
            <span className="text-3xs text-ivory-400 font-mono">WYSIWYG</span>
          </div>

          <MeetingCardPreview
            title={title}
            speakerLanguage={speakerLanguage}
            availableLanguages={availableLanguages}
            passwordEnabled={passwordEnabled}
            participantPermissions={{
              canUnmute,
              canShareScreen,
              canChat,
            }}
            captionsByDefault={captionsOn}
            voiceByDefault={voiceOn}
            hostName={user.name}
          />
        </div>
      </div>

      {/* Celebratory Post-Creation Modal */}
      <CelebratoryModal
        meeting={createdMeeting}
        isOpen={Boolean(createdMeeting)}
        onClose={() => setCreatedMeeting(null)}
        onEnter={(code) => navigate(`/meet/${code}`)}
        onCreateAnother={handleResetForm}
      />
    </motion.div>
  );
}
