import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertCircle, ChevronRight, Languages, Loader2, Timer } from "lucide-react";
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
  md: "text-[15px] leading-relaxed",
  lg: "text-[18px] leading-relaxed",
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
      tone: "text-accent-300",
      label: view.provider === "original" ? "Original" : "Translated",
      detail: view.latencyMs ? `${view.latencyMs} ms` : undefined,
    };
  }
  if (view.status === "failed") {
    return { icon: AlertCircle, tone: "text-signal-live", label: "Failed", detail: undefined };
  }
  return { icon: Loader2, tone: "text-signal-warn", label: "Pending", detail: undefined };
}

/**
 * A single caption segment.
 *
 * The original transcript is always present in the data and is never
 * overwritten by a translation; the reader can expand it at any time.
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
  const view = useMemo(
    () => describeTranslation(segment, captionLanguage),
    [captionLanguage, segment],
  );
  const badge = statusBadge(view);
  const BadgeIcon = badge.icon;

  return (
    <motion.article
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={clsx(
        "rounded-xl border px-3.5 py-3 transition-colors duration-300",
        latest ? "border-accent-400/35 bg-accent-400/5" : "border-ink-700 bg-ink-900/40",
      )}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[13px] font-medium text-ivory-100">{segment.speakerName}</span>
        <span className="font-mono text-2xs text-ivory-400">
          {formatTimestamp(segment.startTime)}
        </span>
        <span
          lang={segment.originalLanguage}
          className="rounded bg-ink-700/80 px-1.5 py-0.5 text-2xs text-ivory-300"
          title={`Spoken in ${languageName(segment.originalLanguage)}`}
        >
          {languageName(segment.originalLanguage)}
        </span>
        <span className={clsx("ml-auto inline-flex items-center gap-1 text-2xs", badge.tone)}>
          <BadgeIcon
            className={clsx("h-3 w-3", badge.label.toLowerCase().startsWith("pending") ? "animate-spin" : undefined)}
            aria-hidden="true"
          />
          {badge.label}
          {badge.detail ? (
            <span className="inline-flex items-center gap-1 text-ivory-400">
              <Timer className="h-2.5 w-2.5" aria-hidden="true" />
              {badge.detail}
            </span>
          ) : null}
        </span>
      </header>

      {showOriginal ? (
        <div className="mt-2.5 rounded-lg border border-ink-700 bg-ink-950/50 px-3 py-2.5">
          <p className="nc-eyebrow mb-1">Original</p>
          <p className={clsx("text-balance text-ivory-200", SCALE_CLASSES[scale])}>
            <TermText text={segment.originalText} language={captionLanguage} />
          </p>
        </div>
      ) : null}

      <div className="mt-2">
        {captionMode === "original" ? null : (
          <>
            <p className="nc-eyebrow mb-1 flex items-center gap-1.5">
              <span lang={captionLanguage}>{languageNativeName(captionLanguage)}</span>
              <span className="text-ivory-500">/</span>
              {languageName(captionLanguage)}
            </p>
            {view.status === "complete" && view.text ? (
              <p
                lang={captionLanguage}
                className={clsx("text-balance font-display text-ivory-50", SCALE_CLASSES[scale])}
              >
                {view.text}
              </p>
            ) : view.status === "failed" ? (
              <p className="text-2xs leading-relaxed text-signal-live">
                This segment could not be translated{view.error ? `: ${view.error}` : "."}
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-2xs text-signal-warn">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Waiting for the translation…
              </p>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleOriginal}
        aria-expanded={showOriginal}
        className="nc-focus mt-2.5 inline-flex items-center gap-1 rounded text-2xs text-ivory-400 transition-colors hover:text-ivory-100"
      >
        <motion.span
          animate={{ rotate: showOriginal ? 90 : 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          className="inline-flex"
        >
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </motion.span>
        {showOriginal ? "Hide original" : "Show original"}
      </button>
    </motion.article>
  );
}
