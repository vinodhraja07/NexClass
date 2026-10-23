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
  Send,
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
 * The captions tab: controls plus the full caption history.
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [segments.length]);

  const scaleIndex = SCALE_ORDER.indexOf(scale);

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const text = manualText.trim();
    if (!text) return;
    onManualCaption(text);
    setManualText("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-ink-700/70 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onCaptionsVisibleChange(!captionsVisible)}
            aria-pressed={captionsVisible}
            className={clsx(
              "nc-focus inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-2xs font-medium transition-colors",
              captionsVisible
                ? "border-accent-400/45 bg-accent-400/12 text-accent-200"
                : "border-ink-600 text-ivory-300 hover:text-ivory-50",
            )}
          >
            {captionsVisible ? (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {captionsVisible ? "Captions on" : "Captions off"}
          </button>

          <div
            role="group"
            aria-label="Caption text size"
            className="inline-flex items-center gap-1 rounded-lg border border-ink-600 p-0.5"
          >
            <button
              type="button"
              aria-label="Smaller caption text"
              disabled={scaleIndex === 0}
              onClick={() => onScaleChange(SCALE_ORDER[Math.max(0, scaleIndex - 1)])}
              className="nc-focus grid h-7 w-7 place-items-center rounded-md text-ivory-300 transition-colors hover:bg-ink-750 hover:text-ivory-50 disabled:opacity-35"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-[52px] text-center text-2xs text-ivory-300">
              {scale === "sm" ? "Small" : scale === "md" ? "Medium" : "Large"}
            </span>
            <button
              type="button"
              aria-label="Larger caption text"
              disabled={scaleIndex === SCALE_ORDER.length - 1}
              onClick={() => onScaleChange(SCALE_ORDER[Math.min(SCALE_ORDER.length - 1, scaleIndex + 1)])}
              className="nc-focus grid h-7 w-7 place-items-center rounded-md text-ivory-300 transition-colors hover:bg-ink-750 hover:text-ivory-50 disabled:opacity-35"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Caption content"
            className="inline-flex items-center gap-1 rounded-lg border border-ink-600 p-0.5"
          >
            {(
              [
                { id: "translated" as CaptionMode, label: "Original + translated" },
                { id: "original" as CaptionMode, label: "Original only" },
              ]
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={captionMode === option.id}
                onClick={() => onCaptionModeChange(option.id)}
                className={clsx(
                  "nc-focus rounded-md px-2.5 py-1.5 text-2xs font-medium transition-colors",
                  captionMode === option.id
                    ? "bg-accent-400 text-ink-900"
                    : "text-ivory-300 hover:text-ivory-50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2.5">
          <p className="nc-eyebrow mb-1.5">Your caption language</p>
          <p className="text-[13px] text-ivory-100">
            <span lang={captionLanguage} className="font-medium">
              {languageNativeName(captionLanguage)}
            </span>
            <span className="ml-2 text-2xs text-ivory-400">{languageName(captionLanguage)}</span>
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
            The teacher's original transcript is always kept. Only this participant sees the
            translation in {languageName(captionLanguage)}.
          </p>
        </div>

        {canPushCaptions ? (
          <div className="rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2.5">
            <p className="nc-eyebrow mb-1.5">Live transcript</p>
            {recognition.supported ? (
              <>
                <button
                  type="button"
                  onClick={recognition.toggle}
                  aria-pressed={recognition.listening}
                  className={clsx(
                    "nc-focus inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-2xs font-medium transition-colors",
                    recognition.listening
                      ? "border-signal-live/45 bg-signal-live/12 text-signal-live"
                      : "border-ink-600 text-ivory-200 hover:text-ivory-50",
                  )}
                >
                  {recognition.listening ? (
                    <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {recognition.listening ? "Stop live captions" : "Caption from my microphone"}
                </button>
                <p className="mt-1.5 text-2xs leading-relaxed text-ivory-400">
                  The browser recognises speech in{" "}
                  <span className="text-ivory-200">{languageName(speakerLanguage)}</span> and sends
                  the transcript to the room. Recognition runs on your device.
                </p>
              </>
            ) : (
              <p className="flex items-start gap-2 text-2xs leading-relaxed text-signal-warn">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  This browser does not expose in-browser speech recognition, so live captions
                  cannot be produced automatically. Type the transcript below and it will be sent to
                  the room as the original caption.
                </span>
              </p>
            )}
            {recognition.error ? (
              <p className="mt-1.5 text-2xs text-signal-live">{recognition.error}</p>
            ) : null}

            <form onSubmit={submitManual} className="mt-2.5 flex items-center gap-2">
              <label htmlFor="manual-caption" className="sr-only">
                Type a caption to send to the room
              </label>
              <input
                id="manual-caption"
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                placeholder="Type the transcript and press send"
                className="nc-focus h-9 flex-1 rounded-lg border border-ink-600 bg-ink-900/80 px-3 text-2xs text-ivory-50 placeholder:text-ivory-400/60"
              />
              <button
                type="submit"
                disabled={!manualText.trim()}
                className="nc-focus inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent-400 px-3 text-2xs font-semibold text-ink-900 transition-colors hover:bg-accent-300 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Send
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5">
        <AnimatePresence initial={false}>
          {interim ? (
            <motion.div
              key="interim"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              className="rounded-xl border border-dashed border-ink-600 bg-ink-900/30 px-3.5 py-3"
            >
              <p className="nc-eyebrow mb-1">Live - not final yet</p>
              <p className="text-[13px] italic leading-relaxed text-ivory-300">{interim.text}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {segments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-600 px-4 py-8 text-center">
            <Captions className="mx-auto h-6 w-6 text-ink-500" aria-hidden="true" />
            <p className="mt-2 text-[13px] text-ivory-300">No captions yet.</p>
            <p className="mx-auto mt-1 max-w-[34ch] text-2xs leading-relaxed text-ivory-400">
              {canPushCaptions
                ? "Start the live transcript above, or type a caption, and it will appear here."
                : "Captions appear as soon as the teacher starts speaking."}
            </p>
          </div>
        ) : (
          segments
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
                showOriginal={expanded[segment.id] ?? true}
                onToggleOriginal={() =>
                  setExpanded((current) => ({
                    ...current,
                    [segment.id]: !(current[segment.id] ?? true),
                  }))
                }
              />
            ))
        )}

        <p className="flex items-center gap-1.5 pt-1 text-2xs text-ivory-400">
          <Keyboard className="h-3 w-3" aria-hidden="true" />
          Press C to toggle the caption overlay, M for the microphone and V for the camera.
        </p>
      </div>
    </div>
  );
}
