import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Captions } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import type { CaptionSegmentPayload } from "@/lib/transport";
import type { InterimCaption } from "@/hooks/useClassroom";
import type { CaptionMode, CaptionScale } from "@/hooks/useClassroomPreferences";
import { describeTranslation, formatTimestamp } from "./CaptionSegmentCard";

const SCALE_CLASSES: Record<CaptionScale, string> = {
  sm: "text-[15px]",
  md: "text-[18px]",
  lg: "text-[22px]",
};

export interface CaptionStripProps {
  segments: CaptionSegmentPayload[];
  interim: InterimCaption | null;
  captionLanguage: LanguageCode;
  captionMode: CaptionMode;
  scale: CaptionScale;
  visible: boolean;
}

/**
 * The caption bar that sits directly under the stage.
 *
 * It is the live region: new captions are announced to screen readers as they
 * arrive.
 */
export function CaptionStrip({
  segments,
  interim,
  captionLanguage,
  captionMode,
  scale,
  visible,
}: CaptionStripProps) {
  const reduced = useReducedMotion() ?? false;
  const latest = segments.length > 0 ? segments[segments.length - 1] : null;
  const view = latest ? describeTranslation(latest, captionLanguage) : null;

  if (!visible) return null;

  return (
    <section
      aria-label="Live captions"
      className="rounded-2xl border border-ink-700 bg-ink-900/75 px-4 py-3 backdrop-blur"
    >
      <div aria-live="polite" aria-atomic="true" className="min-h-[64px]">
        <AnimatePresence mode="wait" initial={false}>
          {interim ? (
            <motion.div
              key="interim"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <p className="nc-eyebrow mb-1 flex items-center gap-1.5">
                <Captions className="h-3 w-3" aria-hidden="true" />
                {interim.speakerName} - live
              </p>
              <p className="text-balance text-ivory-200 italic">{interim.text}</p>
            </motion.div>
          ) : latest && view ? (
            <motion.div
              key={latest.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -10 }}
              transition={{ duration: reduced ? 0 : 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <p className="nc-eyebrow mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <Captions className="h-3 w-3" aria-hidden="true" />
                <span className="text-ivory-200">{latest.speakerName}</span>
                <span className="font-mono text-ivory-400">{formatTimestamp(latest.startTime)}</span>
                <span className="rounded bg-ink-700/80 px-1.5 py-0.5 text-ivory-300">
                  {latest.originalLanguage.toUpperCase()}
                </span>
              </p>
              {captionMode === "original" ? (
                <p className={clsx("text-balance text-ivory-50", SCALE_CLASSES[scale])}>
                  {latest.originalText}
                </p>
              ) : (
                <>
                  <p
                    lang={captionLanguage}
                    className={clsx("text-balance font-display text-ivory-50", SCALE_CLASSES[scale])}
                  >
                    {view.status === "complete" && view.text
                      ? view.text
                      : view.status === "failed"
                        ? "This caption could not be translated."
                        : "Translating…"}
                  </p>
                  <p className="mt-1 text-2xs text-ivory-400">
                    {languageNativeName(captionLanguage)} - original kept in the captions panel
                  </p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              className="flex items-center gap-2 text-ivory-400"
            >
              <Captions className="h-4 w-4" aria-hidden="true" />
              <p className="text-[13px]">Captions will appear here when the teacher speaks.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
