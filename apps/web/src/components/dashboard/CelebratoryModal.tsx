import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Copy,
  ExternalLink,
  Languages,
  Link as LinkIcon,
  Play,
  Plus,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import clsx from "clsx";
import { languageName, type MeetingPublic } from "@nexclass/shared";
import { Badge, Button } from "@/components/ui";
import { SPRINGS } from "@/lib/motion";

export interface CelebratoryModalProps {
  meeting: MeetingPublic | null;
  isOpen: boolean;
  onClose: () => void;
  onEnter?: (code: string) => void;
  onCreateAnother?: () => void;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function CelebratoryModal({
  meeting,
  isOpen,
  onClose,
  onEnter,
  onCreateAnother,
}: CelebratoryModalProps) {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const [origin, setOrigin] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Handle keyboard Escape dismissal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const meetingUrl = meeting ? `${origin}/meet/${meeting.code}` : "";

  const handleEnterClassroom = useCallback(() => {
    if (!meeting) return;
    if (onEnter) {
      onEnter(meeting.code);
    } else {
      navigate(`/meet/${meeting.code}`);
    }
  }, [meeting, onEnter, navigate]);

  const handleCopyCode = useCallback(async () => {
    if (!meeting) return;
    const ok = await copyToClipboard(meeting.code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [meeting]);

  const handleCopyLink = useCallback(async () => {
    if (!meetingUrl) return;
    const ok = await copyToClipboard(meetingUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [meetingUrl]);

  if (!meeting || !isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink-950/85 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
          transition={SPRINGS.smooth}
          className={clsx(
            "relative w-full max-w-xl overflow-hidden rounded-3xl p-6 sm:p-8",
            "bg-ink-950/95 backdrop-blur-2xl border border-accent-400/40 shadow-2xl",
            "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8),0_0_36px_rgba(120,169,139,0.25)]",
          )}
        >
          {/* Celebratory Ambient Radiant Orb */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl animate-pulse"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-accent-300/15 blur-3xl"
            aria-hidden="true"
          />

          {/* Close trigger button */}
          <button
            type="button"
            onClick={onClose}
            className="nc-focus absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-ink-700/60 bg-ink-900/60 text-ivory-400 hover:text-ivory-100 hover:border-ink-500 transition-colors cursor-pointer"
            aria-label="Close celebration modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header & Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300/40 bg-accent-300/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-300 shadow-[0_0_16px_rgba(50,185,138,0.3)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Classroom Live Ready</span>
            </span>
            <Badge tone="accent">Host</Badge>
          </div>

          <h2
            id="celebration-title"
            className="mt-3.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50"
          >
            {meeting.title}
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-ivory-300">
            Your interactive multilingual classroom is primed. Share the code or direct link with learners to begin lecture.
          </p>

          {/* Large 48px Monospace Shareable Code Banner */}
          <div className="mt-6 rounded-2xl border border-accent-400/50 bg-gradient-to-b from-accent-400/15 to-accent-400/5 px-6 py-6 text-center shadow-lg shadow-accent-400/10 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-mesh-dark opacity-30" />
            <p className="nc-eyebrow text-accent-300 text-2xs tracking-widest uppercase">
              Shareable Meeting Code
            </p>
            <motion.p
              initial={reduced ? undefined : { scale: 0.88 }}
              animate={reduced ? undefined : { scale: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="mt-2 font-mono text-[48px] font-bold leading-none tracking-[0.25em] text-accent-400 select-all drop-shadow-[0_0_16px_rgba(120,169,139,0.35)]"
            >
              {meeting.code}
            </motion.p>
            <p className="mt-2 text-3xs text-ivory-400">
              6-character code • Works on desktop, mobile, and web
            </p>
          </div>

          {/* Capabilities Preview Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-2xs text-ivory-300 bg-ink-900/60 border border-ink-700/60 rounded-xl p-3">
            <span className="inline-flex items-center gap-1 font-semibold text-accent-200">
              <Languages className="h-3.5 w-3.5 text-accent-300" />
              <span>Lecture: {languageName(meeting.speakerLanguage)}</span>
            </span>
            <span className="text-ivory-500">•</span>
            <span>
              Captions: {meeting.availableLanguages?.length ?? 6} Indic Languages
            </span>
            {meeting.settings.passwordEnabled && (
              <>
                <span className="text-ivory-500">•</span>
                <span className="text-signal-warn font-medium">Password Protected</span>
              </>
            )}
          </div>

          {/* Primary Action Deck: 1-Click Enter Classroom & Copy Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              onClick={handleEnterClassroom}
              className="w-full text-sm font-semibold shadow-lg shadow-accent-400/25"
              icon={<Play className="h-4 w-4" aria-hidden="true" />}
            >
              Enter Classroom Now
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className={clsx(
                  "nc-focus flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all duration-150 cursor-pointer",
                  copiedLink
                    ? "border-accent-300 bg-accent-300/20 text-accent-200 shadow-[0_0_12px_rgba(50,185,138,0.25)]"
                    : "border-ink-650 bg-ink-900/70 text-ivory-200 hover:border-accent-400/50 hover:bg-ink-850 hover:text-white",
                )}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-accent-300" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 text-accent-300" />
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className={clsx(
                  "nc-focus flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all duration-150 cursor-pointer",
                  copiedCode
                    ? "border-accent-300 bg-accent-300/20 text-accent-200 shadow-[0_0_12px_rgba(50,185,138,0.25)]"
                    : "border-ink-650 bg-ink-900/70 text-ivory-200 hover:border-accent-400/50 hover:bg-ink-850 hover:text-white",
                )}
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 text-accent-300" />
                    <span>Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-accent-300" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink-700/60 pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (onCreateAnother) onCreateAnother();
                else onClose();
              }}
              icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Create Another Classroom
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Back to Classrooms
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
