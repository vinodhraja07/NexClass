import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Captions,
  CircleAlert,
  Eye,
  EyeOff,
  Keyboard,
  Mic,
  MicOff,
  Minus,
  Plus,
  Radio,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { languageName, languageNativeName } from "@nexclass/shared";
import type { CaptionSegmentPayload } from "@/lib/transport";
import type { CaptionMode, CaptionScale } from "@/hooks/useClassroomPreferences";
import type { SpeechRecognitionController } from "@/hooks/useSpeechRecognition";
import type { InterimCaption } from "@/hooks/useClassroom";
import { CaptionSegmentCard } from "./CaptionSegmentCard";

export interface CaptionsPanelProps {
  segments: CaptionSegmentPayload[];
  interim: InterimCaption | null;
  captionLanguage: LanguageCode;
  captionMode: CaptionMode;
  onCaptionModeChange: (mode: CaptionMode) => void;
  scale: CaptionScale;
  onScaleChange: (scale: CaptionScale) => void;
  captionsVisible: boolean;
  onCaptionsVisibleChange: (visible: boolean) => void;
  recognition: SpeechRecognitionController;
  speakerLanguage: LanguageCode;
  onManualCaption: (text: string) => void;
  /** Only the host pushes the live transcript for the room. */
  canPushCaptions: boolean;
}

const SCALE_ORDER: CaptionScale[] = ["sm", "md", "lg"];

/**
 * Premium Multilingual Captions Sidebar.
 */
export function CaptionsPanel({
  segments,
  interim,
  captionLanguage,
  captionMode,
  onCaptionModeChange,
  scale,
  onScaleChange,
  captionsVisible,
  onCaptionsVisibleChange,
  recognition,
  speakerLanguage,
  onManualCaption,
  canPushCaptions,
}: CaptionsPanelProps) {
  const reduced = useReducedMotion() ?? false;
  const [manualText, setManualText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = 0; // newest segment is at top
  }, [segments.length]);

  const scaleIndex = SCALE_ORDER.indexOf(scale);

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const text = manualText.trim();
    if (!text) return;
    onManualCaption(text);
    setManualText("");
  }

  const filteredSegments = searchQuery.trim()
    ? segments.filter((seg) => {
        const query = searchQuery.toLowerCase();
        const originalMatch = seg.originalText.toLowerCase().includes(query);
        const transMatch = seg.translations?.[captionLanguage]?.text
          ?.toLowerCase()
          .includes(query);
        const speakerMatch = seg.speakerName.toLowerCase().includes(query);
        return originalMatch || transMatch || speakerMatch;
      })
    : segments;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface/50">
      {/* Control Toolbar */}
      <div className="space-y-2.5 border-b border-border/60 bg-surface/80 p-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Visibility toggle button */}
          <button
            type="button"
            onClick={() => onCaptionsVisibleChange(!captionsVisible)}
            aria-pressed={captionsVisible}
            className={clsx(
              "nc-focus inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-2xs font-semibold transition-all",
              captionsVisible
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border/60 bg-background/50 text-text-secondary hover:text-text-primary",
            )}
          >
            {captionsVisible ? (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{captionsVisible ? "Captions Visible" : "Captions Hidden"}</span>
          </button>

          {/* Scale controls */}
          <div
            role="group"
            aria-label="Caption text size"
            className="inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/60 p-0.5"
          >
            <button
              type="button"
              aria-label="Smaller caption text"
              disabled={scaleIndex === 0}
              onClick={() => onScaleChange(SCALE_ORDER[Math.max(0, scaleIndex - 1)])}
              className="nc-focus grid h-7 w-7 place-items-center rounded-md text-text-secondary transition-colors hover:bg-muted hover:text-text-primary disabled:opacity-30"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </button>
            <span className="min-w-[44px] text-center text-2xs font-medium text-text-secondary">
              {scale === "sm" ? "A-" : scale === "md" ? "A" : "A+"}
            </span>
            <button
              type="button"
              aria-label="Larger caption text"
              disabled={scaleIndex === SCALE_ORDER.length - 1}
              onClick={() => onScaleChange(SCALE_ORDER[Math.min(SCALE_ORDER.length - 1, scaleIndex + 1)])}
              className="nc-focus grid h-7 w-7 place-items-center rounded-md text-text-secondary transition-colors hover:bg-muted hover:text-text-primary disabled:opacity-30"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Caption mode segment switch */}
        <div
          role="radiogroup"
          aria-label="Caption mode"
          className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-background/60 p-1"
        >
          {(
            [
              { id: "translated" as CaptionMode, label: "Translated + Original" },
              { id: "original" as CaptionMode, label: "Original Only" },
            ]
          ).map((option) => {
            const selected = captionMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onCaptionModeChange(option.id)}
                className={clsx(
                  "nc-focus relative rounded-md py-1 text-center text-2xs font-medium transition-colors select-none",
                  selected
                    ? "bg-primary text-background font-semibold shadow-xs"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Search transcript */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript history…"
            className="nc-focus h-8 w-full rounded-lg border border-border/60 bg-background/60 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-secondary/60"
          />
        </div>

        {/* Live speech recognition trigger for host */}
        {canPushCaptions && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-text-primary">
                Host Speech Engine
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary">
                {languageName(speakerLanguage)}
              </span>
            </div>

            {recognition.supported ? (
              <button
                type="button"
                onClick={recognition.toggle}
                aria-pressed={recognition.listening}
                className={clsx(
                  "nc-focus mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-2xs font-semibold transition-all",
                  recognition.listening
                    ? "border-signal-live/60 bg-signal-live/15 text-signal-live shadow-sm"
                    : "border-border/80 bg-surface text-text-primary hover:border-primary/50",
                )}
              >
                {recognition.listening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5 text-signal-live animate-pulse" />
                    <span>Stop Live Speech Captions</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-primary" />
                    <span>Transcribe My Microphone</span>
                  </>
                )}
              </button>
            ) : (
              <p className="mt-1 text-[11px] text-signal-warn">
                In-browser speech recognition is not supported in this browser. Use manual transcription below.
              </p>
            )}

            <form onSubmit={submitManual} className="mt-2 flex items-center gap-1.5">
              <input
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type manual transcript sentence…"
                className="nc-focus h-8 flex-1 rounded-lg border border-border/60 bg-background px-2.5 text-2xs text-text-primary placeholder:text-text-secondary/60"
              />
              <button
                type="submit"
                disabled={!manualText.trim()}
                className="nc-focus inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-2xs font-semibold text-background transition-opacity disabled:opacity-40"
              >
                <Send className="h-3 w-3" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Segment History List */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3.5">
        <AnimatePresence initial={false}>
          {interim && (
            <motion.div
              key="interim"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0 }}
              className="rounded-xl border border-dashed border-primary/50 bg-primary/[0.04] p-3"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Interim Speech
              </p>
              <p className="italic text-xs text-text-secondary leading-relaxed">{interim.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredSegments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
            <Captions className="mx-auto h-7 w-7 text-text-secondary/60" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold text-text-primary">No captions found</p>
            <p className="mx-auto mt-1 max-w-[32ch] text-[11px] text-text-secondary leading-relaxed">
              {searchQuery
                ? `No captions matched "${searchQuery}".`
                : "Captions will appear here as soon as the teacher speaks."}
            </p>
          </div>
        ) : (
          filteredSegments
            .slice()
            .reverse()
            .map((segment, index) => (
              <CaptionSegmentCard
                key={segment.id}
                segment={segment}
                captionLanguage={captionLanguage}
                captionMode={captionMode}
                scale={scale}
                latest={index === 0}
                showOriginal={expanded[segment.id] ?? false}
                onToggleOriginal={() =>
                  setExpanded((current) => ({
                    ...current,
                    [segment.id]: !(current[segment.id] ?? false),
                  }))
                }
              />
            ))
        )}

        <div className="flex items-center gap-1.5 pt-2 text-[11px] text-text-secondary/70 border-t border-border/40">
          <Keyboard className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Press C to toggle caption strip on video, M for microphone.</span>
        </div>
      </div>
    </div>
  );
}
