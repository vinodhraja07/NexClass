import { motion, useReducedMotion } from "motion/react";
import { Activity, AudioLines, Info, Mic, Signal, Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import type { VoiceMode, VoicePlaybackState } from "@/hooks/useVoicePlayback";
import { VoiceModeSwitch } from "./VoiceModeSwitch";
import { LanguagePicker } from "./LanguagePicker";
import { meetingLanguagePool } from "./languagePool";

export interface ControlTrayProps {
  voiceMode: VoiceMode;
  onVoiceModeChange: (mode: VoiceMode) => void;
  captionLanguage: LanguageCode;
  voiceLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  onCaptionLanguage: (language: LanguageCode) => void;
  onVoiceLanguage: (language: LanguageCode) => void;
  voice: VoicePlaybackState;
  voiceMuted: boolean;
  onVoiceMuted: (muted: boolean) => void;
  voiceVolume: number;
  onVoiceVolume: (volume: number) => void;
  listening: boolean;
  className?: string;
}

/**
 * The band between the stage and the toolbar: voice mode, both language
 * selectors and the state of the translated voice. Shared by the live
 * classroom and the demo.
 */
export function ControlTray({
  voiceMode,
  onVoiceModeChange,
  captionLanguage,
  voiceLanguage,
  availableLanguages,
  onCaptionLanguage,
  onVoiceLanguage,
  voice,
  voiceMuted,
  onVoiceMuted,
  voiceVolume,
  onVoiceVolume,
  listening,
  className,
}: ControlTrayProps) {
  const reduced = useReducedMotion() ?? false;
  const pool = meetingLanguagePool(availableLanguages);

  return (
    <section
      aria-label="Voice and language controls"
      className={clsx(
        "rounded-2xl border border-ink-700 bg-ink-850/80 px-3 py-3 backdrop-blur",
        className,
      )}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1.3fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.2fr)]">
        <div className="min-w-0">
          <VoiceModeSwitch value={voiceMode} onChange={onVoiceModeChange} compact />
        </div>

        <LanguagePicker
          id="caption-language"
          label="Caption language"
          value={captionLanguage}
          languages={pool}
          onChange={onCaptionLanguage}
          note="Only your captions change."
        />

        <LanguagePicker
          id="voice-language"
          label="Voice language"
          value={voiceLanguage}
          languages={pool}
          onChange={onVoiceLanguage}
          note={
            voiceMode === "translated"
              ? voice.browserFallback
                ? "Local browser voice (fallback)."
                : undefined
              : "Used when voice mode is translated."
          }
        />

        <div className="min-w-0 rounded-xl border border-ink-700 bg-ink-900/50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="nc-eyebrow">Voice status</p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onVoiceMuted(!voiceMuted)}
                aria-pressed={voiceMuted}
                aria-label={voiceMuted ? "Unmute translated voice" : "Mute translated voice"}
                className={clsx(
                  "nc-focus grid h-7 w-7 place-items-center rounded-lg border transition-colors",
                  voiceMuted
                    ? "border-signal-live/50 bg-signal-live/15 text-signal-live"
                    : "border-ink-600 text-ivory-300 hover:text-ivory-50",
                )}
              >
                {voiceMuted ? (
                  <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(voiceVolume * 100)}
                onChange={(event) => onVoiceVolume(Number(event.target.value) / 100)}
                aria-label="Translated voice volume"
                className="nc-focus h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-ink-600 accent-accent-400 lg:w-20"
              />
            </div>
          </div>
          {voiceMode === "translated" ? (
            <ul className="space-y-1 text-2xs leading-relaxed text-ivory-300">
              <li className="flex items-center gap-1.5">
                <motion.span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    voice.playing ? "bg-accent-400" : "bg-ink-500",
                  )}
                  animate={voice.playing && !reduced ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                  transition={
                    voice.playing && !reduced
                      ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" }
                      : undefined
                  }
                />
                {voice.playing
                  ? "Speaking the lecture now"
                  : voice.queued > 0
                    ? `${voice.queued} segment${voice.queued === 1 ? "" : "s"} queued`
                    : "Waiting for segments"}
              </li>
              {voice.provider ? (
                <li className="flex items-center gap-1.5">
                  <AudioLines className="h-3 w-3 text-accent-300" aria-hidden="true" />
                  {voice.browserFallback ? (
                    <span className="text-signal-info">Local browser voice (fallback)</span>
                  ) : (
                    <span>{voice.provider}</span>
                  )}
                </li>
              ) : null}
              {voice.latencyMs !== null && !voice.muted ? (
                <li className="flex items-center gap-1.5 font-mono">
                  <Signal className="h-3 w-3 text-ivory-400" aria-hidden="true" />
                  lag {voice.latencyMs} ms
                </li>
              ) : null}
              {voice.muted ? (
                <li className="text-signal-warn">Voice is muted in this browser.</li>
              ) : null}
              {voice.error ? <li className="text-signal-live">{voice.error}</li> : null}
            </ul>
          ) : (
            <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-ivory-400">
              <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              {voiceMode === "original"
                ? "You are hearing the original room audio."
                : "Original audio stays; translated captions appear below."}
            </p>
          )}
          {listening ? (
            <p className="mt-1 flex items-center gap-1.5 text-2xs text-signal-live">
              <motion.span
                animate={reduced ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
                transition={reduced ? undefined : { repeat: Infinity, duration: 1.2 }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-signal-live"
              />
              <Mic className="h-3 w-3" aria-hidden="true" />
              Live transcription is running (m to stop)
            </p>
          ) : null}
          <p className="mt-1 flex items-center gap-1.5 text-2xs text-ivory-500">
            <Activity className="h-3 w-3" aria-hidden="true" />
            Interface language stays in Settings.
          </p>
        </div>
      </div>
    </section>
  );
}
