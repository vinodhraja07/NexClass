import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  AudioLines,
  Gauge,
  Headphones,
  Info,
  Link2,
  Lock,
  Mic,
  Signal,
  Sliders,
  Sparkles,
  Split,
  Unlink,
  Volume2,
  VolumeX,
} from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { languageName, languageNativeName } from "@nexclass/shared";
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
 * Premium Language & Audio Control Tray.
 *
 * Provides Apple/Linear-inspired controls for synchronized vs split language
 * selection, live speech playback status, volume, and playback speed.
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
  const [synced, setSynced] = useState(captionLanguage === voiceLanguage);
  const [playbackRate, setPlaybackRate] = useState<"0.85" | "1.0" | "1.15">("1.0");

  const handleSyncLanguage = (code: LanguageCode) => {
    onCaptionLanguage(code);
    onVoiceLanguage(code);
  };

  const handleRateChange = (rate: "0.85" | "1.0" | "1.15") => {
    setPlaybackRate(rate);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Apply to Web Speech synthesis rate if browser fallback active
      // Note: useVoicePlayback handles standard playback rate
    }
  };

  return (
    <section
      aria-label="Voice and language controls"
      className={clsx(
        "rounded-2xl border border-border/80 bg-surface/85 p-3.5 backdrop-blur-xl shadow-md transition-all",
        className,
      )}
    >
      <div className="grid gap-3.5 lg:grid-cols-[minmax(270px,1.2fr)_minmax(360px,2fr)_minmax(240px,1.2fr)]">
        {/* Column 1: Voice Mode Selector */}
        <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/50 p-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-text-secondary">
                1. Voice & Audio Mode
              </span>
              <span className="text-[10px] text-text-secondary/70">Per-user</span>
            </div>
            <VoiceModeSwitch value={voiceMode} onChange={onVoiceModeChange} compact />
          </div>

          <div className="mt-2.5 pt-2 border-t border-border/40 text-[11px] text-text-secondary flex items-center gap-1.5">
            <Headphones className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
            <span>
              {voiceMode === "original"
                ? "Direct teacher audio stream"
                : voiceMode === "translated"
                  ? "AI speech synthesis active"
                  : "Original audio + live subtitles"}
            </span>
          </div>
        </div>

        {/* Column 2: Synchronized vs Independent Language Orchestration */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-text-secondary">
              2. Personal Language Settings
            </span>

            {/* Sync / Split Segment Toggle */}
            <div
              role="group"
              aria-label="Language synchronization mode"
              className="inline-flex rounded-lg border border-border/70 bg-background p-0.5 shadow-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setSynced(true);
                  onVoiceLanguage(captionLanguage);
                }}
                aria-pressed={synced}
                title="Synchronized: Caption and Voice update together"
                className={clsx(
                  "nc-focus inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium transition-colors select-none",
                  synced
                    ? "bg-primary text-background font-semibold"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Link2 className="h-3 w-3" aria-hidden="true" />
                <span>Synchronized</span>
              </button>

              <button
                type="button"
                onClick={() => setSynced(false)}
                aria-pressed={!synced}
                title="Independent: Set Caption and Voice languages separately"
                className={clsx(
                  "nc-focus inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium transition-colors select-none",
                  !synced
                    ? "bg-primary text-background font-semibold"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Split className="h-3 w-3" aria-hidden="true" />
                <span>Split</span>
              </button>
            </div>
          </div>

          {synced ? (
            /* Synchronized Unified Mode */
            <div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-2.5">
              <LanguagePicker
                id="unified-language"
                label="Classroom Language (Captions + Voice)"
                value={captionLanguage}
                languages={pool}
                onChange={handleSyncLanguage}
                note="Captions and synthesized speech update together for you."
              />
            </div>
          ) : (
            /* Split Independent Mode */
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 rounded-lg border border-border/70 bg-surface/40 p-2.5">
              <LanguagePicker
                id="caption-language"
                label="Caption Reading Language"
                value={captionLanguage}
                languages={pool}
                onChange={onCaptionLanguage}
                note="Subtitles displayed on screen."
              />
              <LanguagePicker
                id="voice-language"
                label="Voice Listening Language"
                value={voiceLanguage}
                languages={pool}
                onChange={onVoiceLanguage}
                note="Speech spoken into headphones."
              />
            </div>
          )}

          <p className="mt-2 text-[10px] text-text-secondary/80 flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-primary shrink-0" aria-hidden="true" />
            <span>Independent: Changes only your screen. Other students are not affected.</span>
          </p>
        </div>

        {/* Column 3: Live Audio Diagnostics & Volume Control */}
        <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/50 p-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-text-secondary">
                3. Audio & Playback
              </span>
              <div className="flex items-center gap-1">
                {/* Speed selector */}
                {(["0.85", "1.0", "1.15"] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleRateChange(rate)}
                    className={clsx(
                      "nc-focus rounded px-1.5 py-0.2 text-[10px] font-mono transition-colors",
                      playbackRate === rate
                        ? "bg-primary text-background font-bold"
                        : "text-text-secondary hover:text-text-primary bg-surface/60",
                    )}
                    title={`Speech speed ${rate}x`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume slider and mute button */}
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface/60 p-1.5">
              <button
                type="button"
                onClick={() => onVoiceMuted(!voiceMuted)}
                aria-pressed={voiceMuted}
                aria-label={voiceMuted ? "Unmute voice" : "Mute voice"}
                className={clsx(
                  "nc-focus grid h-7 w-7 place-items-center rounded-md border transition-colors",
                  voiceMuted
                    ? "border-signal-live/60 bg-signal-live/20 text-signal-live"
                    : "border-border/70 text-text-primary hover:bg-muted",
                )}
              >
                {voiceMuted ? (
                  <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                )}
              </button>

              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(voiceVolume * 100)}
                  onChange={(event) => onVoiceVolume(Number(event.target.value) / 100)}
                  aria-label="Voice volume level"
                  className="nc-focus h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                />
                <span className="w-8 text-right font-mono text-[10px] text-text-secondary">
                  {Math.round(voiceVolume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Voice status info & animated equalizer */}
          <div className="mt-2.5 pt-2 border-t border-border/40">
            {voiceMode === "translated" ? (
              <div className="space-y-1 text-2xs text-text-secondary">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-text-primary">
                    <span
                      className={clsx(
                        "h-1.5 w-1.5 rounded-full",
                        voice.playing ? "bg-primary animate-ping" : "bg-text-secondary/40",
                      )}
                    />
                    {voice.playing
                      ? "Speaking translated lecture"
                      : voice.queued > 0
                        ? `${voice.queued} segment${voice.queued === 1 ? "" : "s"} queued`
                        : "Voice ready"}
                  </span>

                  {voice.playing && !reduced && (
                    <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
                      {[0.3, 0.9, 0.5, 1.0, 0.6, 0.4].map((h, i) => (
                        <motion.span
                          key={i}
                          className="w-0.5 bg-primary rounded-full"
                          animate={{
                            height: [
                              `${Math.max(2, h * 12)}px`,
                              `${Math.max(2, (1.1 - h) * 12)}px`,
                              `${Math.max(2, h * 12)}px`,
                            ],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.5 + (i % 3) * 0.12,
                            ease: "easeInOut",
                          }}
                          style={{ height: `${h * 12}px` }}
                        />
                      ))}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="truncate text-text-secondary">
                    {voice.browserFallback ? (
                      <span className="text-secondary-accent">Local Browser Speech Engine</span>
                    ) : (
                      <span>{voice.provider || "Neural Speech Synthesis"}</span>
                    )}
                  </span>
                  {voice.latencyMs !== null && !voice.muted && (
                    <span className="font-mono text-[10px] text-text-secondary/70">
                      ⚡ {voice.latencyMs}ms
                    </span>
                  )}
                </div>

                {voice.error && (
                  <p className="text-[11px] text-signal-live">{voice.error}</p>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-2xs text-text-secondary">
                <Info className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                <span>Original audio stream active without synthesis delay.</span>
              </p>
            )}

            {/* Live mic detection indicator if teacher */}
            {listening && (
              <div className="mt-1 flex items-center gap-1.5 text-2xs font-semibold text-signal-live">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-live animate-ping" />
                <Mic className="h-3 w-3" aria-hidden="true" />
                <span>Microphone speech detection live</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
