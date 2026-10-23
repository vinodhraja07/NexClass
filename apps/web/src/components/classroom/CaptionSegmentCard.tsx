import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  Languages,
  Loader2,
  Sparkles,
  Timer,
} from "lucide-react";
import clsx from "clsx";
import { languageName, languageNativeName, type LanguageCode } from "@nexclass/shared";
import type { CaptionSegmentPayload } from "@/lib/transport";
import type { CaptionMode, CaptionScale } from "@/hooks/useClassroomPreferences";
import { TermText } from "./TermText";

export interface TranslationView {
  status: "pending" | "processing" | "complete" | "failed";
  text: string;
  error?: string;
  provider?: string;
  latencyMs?: number;
}

export function describeTranslation(
  segment: CaptionSegmentPayload,
  language: LanguageCode,
): TranslationView {
  const translation = segment.translations?.[language];
  if (translation) {
    return {
      status: translation.status,
      text: translation.text,
      error: translation.error,
      provider: translation.provider,
      latencyMs: translation.latencyMs,
    };
  }
  if (segment.originalLanguage === language) {
    return { status: "complete", text: segment.originalText, provider: "original", latencyMs: 0 };
  }
  if (segment.status === "processing" || segment.status === "pending") {
    return { status: "pending", text: "" };
  }
  return {
    status: "failed",
    text: "",
    error: segment.error ?? "The server did not return a translation for this language.",
  };
}

const SCALE_CLASSES: Record<CaptionScale, string> = {
  sm: "text-[13px] leading-relaxed",
  md: "text-[14px] leading-relaxed",
  lg: "text-[16px] leading-relaxed",
};

export function formatTimestamp(value: number): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export interface CaptionSegmentCardProps {
  segment: CaptionSegmentPayload;
  captionLanguage: LanguageCode;
  captionMode: CaptionMode;
  scale: CaptionScale;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  /** Highlight the newest segment. */
  latest?: boolean;
}

function statusBadge(view: TranslationView) {
  if (view.status === "complete") {
    return {
      icon: Languages,
      tone: "text-primary",
      label: view.provider === "original" ? "Original" : "Translated",
      detail: view.latencyMs ? `${view.latencyMs} ms` : undefined,
    };
  }
  if (view.status === "failed") {
    return { icon: AlertCircle, tone: "text-signal-live", label: "Failed", detail: undefined };
  }
  return { icon: Loader2, tone: "text-secondary-accent", label: "Translating…", detail: undefined };
}

/**
 * Polished Caption Segment Card for Sidebar History.
 */
export function CaptionSegmentCard({
  segment,
  captionLanguage,
  captionMode,
  scale,
  showOriginal,
  onToggleOriginal,
  latest = false,
}: CaptionSegmentCardProps) {
  const reduced = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);

  const view = useMemo(
    () => describeTranslation(segment, captionLanguage),
    [captionLanguage, segment],
  );
  const badge = statusBadge(view);
  const BadgeIcon = badge.icon;

  const displayText = captionMode === "original" ? segment.originalText : view.text || segment.originalText;

  const copyToClipboard = () => {
    try {
      void navigator.clipboard?.writeText(displayText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.article
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={clsx(
        "group relative rounded-xl border p-3 transition-all duration-200 shadow-xs",
        latest
          ? "border-primary/40 bg-primary/[0.05] shadow-sm ring-1 ring-primary/20"
          : "border-border/60 bg-surface/60 hover:bg-surface/90 hover:border-border",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text-primary">{segment.speakerName}</span>
          <span className="font-mono text-[10px] text-text-secondary">
            {formatTimestamp(segment.startTime)}
          </span>
          <span
            lang={segment.originalLanguage}
            className="rounded bg-muted/70 px-1.5 py-0.2 text-[10px] font-medium text-text-secondary"
            title={`Spoken in ${languageName(segment.originalLanguage)}`}
          >
            {languageName(segment.originalLanguage)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={clsx("inline-flex items-center gap-1 text-[11px] font-medium", badge.tone)}>
            <BadgeIcon
              className={clsx("h-3 w-3", badge.label.includes("Translating") ? "animate-spin" : undefined)}
              aria-hidden="true"
            />
            <span>{badge.label}</span>
            {badge.detail ? (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-text-secondary">
                <Timer className="h-2.5 w-2.5" aria-hidden="true" />
                {badge.detail}
              </span>
            ) : null}
          </span>

          <button
            type="button"
            onClick={copyToClipboard}
            title="Copy caption text"
            aria-label="Copy caption text"
            className="grid h-6 w-6 place-items-center rounded text-text-secondary opacity-60 hover:opacity-100 hover:text-text-primary transition-opacity"
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Original expandable section */}
      {showOriginal && (
        <div className="my-2 rounded-lg border border-border/70 bg-background/70 px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Original Transcript:
          </p>
          <div className={clsx("text-text-secondary", SCALE_CLASSES[scale])}>
            <TermText text={segment.originalText} language={captionLanguage} />
          </div>
        </div>
      )}

      {/* Main text */}
      <div className="pt-2">
        {captionMode === "original" ? (
          <div className={clsx("text-text-primary font-normal", SCALE_CLASSES[scale])}>
            <TermText text={segment.originalText} language={captionLanguage} />
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-text-secondary">
              <span lang={captionLanguage} className="font-medium text-primary">
                {languageNativeName(captionLanguage)} ({languageName(captionLanguage)})
              </span>
            </div>
            {view.status === "complete" && view.text ? (
              <p
                lang={captionLanguage}
                className={clsx("font-display font-medium text-text-primary", SCALE_CLASSES[scale])}
              >
                {view.text}
              </p>
            ) : view.status === "failed" ? (
              <p className="text-2xs leading-relaxed text-signal-live">
                This segment could not be translated{view.error ? `: ${view.error}` : "."}
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-2xs text-secondary-accent">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Waiting for the translation…
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="mt-2 flex items-center justify-between pt-1 border-t border-border/30 text-[11px]">
        <button
          type="button"
          onClick={onToggleOriginal}
          aria-expanded={showOriginal}
          className="nc-focus inline-flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <motion.span
            animate={{ rotate: showOriginal ? 90 : 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            className="inline-flex"
          >
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </motion.span>
          <span>{showOriginal ? "Hide original" : "Show original"}</span>
        </button>

        {latest && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Latest
          </span>
        )}
      </footer>
    </motion.article>
  );
}
