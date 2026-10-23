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
    label: "Original Audio",
    description: "Listen directly to the teacher's original microphone. Untranslated.",
    icon: Headphones,
  },
  {
    id: "translated",
    label: "Translated Voice",
    description: "Teacher's original audio is replaced with live AI speech in your language.",
    icon: Volume2,
  },
  {
    id: "original-captions",
    label: "Original + Captions",
    description: "Hear natural audio while reading real-time translated subtitles.",
    icon: Captions,
  },
];

export interface VoiceModeSwitchProps {
  value: VoiceMode;
  onChange: (mode: VoiceMode) => void;
  hint?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Apple-inspired Segmented Voice Mode Switch.
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
        aria-label="Voice playback mode"
        className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-background/80 p-1 shadow-inner"
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
                "nc-focus relative flex flex-auto items-center justify-center gap-1.5 rounded-lg px-2.5 text-2xs font-semibold transition-colors select-none",
                compact ? "h-8" : "h-9",
                selected ? "text-background" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="voice-mode-indicator"
                  className="absolute inset-0 rounded-lg bg-primary shadow-xs"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 36 }
                  }
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10 whitespace-nowrap">{mode.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={active.id}
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0, y: 3 }}
          transition={{ duration: reduced ? 0 : 0.16 }}
          className="mt-1.5 text-2xs leading-relaxed text-text-secondary"
        >
          {hint ?? active.description}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
