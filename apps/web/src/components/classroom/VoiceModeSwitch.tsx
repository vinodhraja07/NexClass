import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Captions, Headphones, Volume2 } from "lucide-react";
import clsx from "clsx";
import type { VoiceMode } from "@/hooks/useVoicePlayback";

export interface VoiceModeOption {
  id: VoiceMode;
  label: string;
  description: string;
  icon: typeof Headphones;
}

export const VOICE_MODES: VoiceModeOption[] = [
  {
    id: "original",
    label: "Original audio",
    description: "You hear the teacher's own microphone. Nothing is translated.",
    icon: Headphones,
  },
  {
    id: "translated",
    label: "Translated voice",
    description: "The teacher is muted and the translated speech is read to you instead.",
    icon: Volume2,
  },
  {
    id: "original-captions",
    label: "Original + captions",
    description: "The teacher's original audio stays, with translated captions underneath.",
    icon: Captions,
  },
];

export interface VoiceModeSwitchProps {
  value: VoiceMode;
  onChange: (mode: VoiceMode) => void;
  /** Shown under the control - explains what the current mode does. */
  hint?: string;
  compact?: boolean;
  className?: string;
}

/**
 * The three voice modes every participant can choose between.
 *
 * Switching back to the original audio is always one click away, whatever
 * happens with the translation provider.
 */
export function VoiceModeSwitch({
  value,
  onChange,
  hint,
  compact = false,
  className,
}: VoiceModeSwitchProps) {
  const reduced = useReducedMotion() ?? false;
  const active = VOICE_MODES.find((mode) => mode.id === value) ?? VOICE_MODES[0];

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="Voice mode"
        className="flex flex-wrap gap-1 rounded-xl border border-ink-600 bg-ink-900/60 p-1"
      >
        {VOICE_MODES.map((mode) => {
          const selected = mode.id === value;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(mode.id)}
              className={clsx(
                "nc-focus relative flex flex-auto items-center justify-center gap-1.5 rounded-lg px-2.5 text-2xs font-medium transition-colors",
                compact ? "h-8" : "h-9",
                selected ? "text-ink-900" : "text-ivory-300 hover:text-ivory-50",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId="voice-mode-indicator"
                  className="absolute inset-0 rounded-lg bg-accent-400"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              ) : null}
              <Icon className="relative h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative whitespace-nowrap">{mode.label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={active.id}
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          className="mt-1.5 text-2xs leading-relaxed text-ivory-400"
        >
          {hint ?? active.description}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
