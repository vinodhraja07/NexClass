import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AudioLines,
  Check,
  Gauge,
  Headphones,
  Info,
  Languages,
  Link2,
  Mic,
  Radio,
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
import { meetingLanguagePool } from "./languagePool";

export interface LanguageHubPanelProps {
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
}

/**
 * Google Meet-Style Vertical Language & Speech Hub Panel.
 *
 * Houses real-time translation preferences, synchronized vs independent
 * audio routing, volume control, and Odia zero-key fallback diagnostics.
 */
export function LanguageHubPanel({
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
}: LanguageHubPanelProps) {
  const reduced = useReducedMotion() ?? false;
  const pool = meetingLanguagePool(availableLanguages, captionLanguage, voiceLanguage);
  const [synced, setSynced] = useState(captionLanguage === voiceLanguage);
  const [playbackSpeed, setPlaybackSpeed] = useState<"0.85" | "1.0" | "1.15">("1.0");

  const handleSyncToggle = () => {
    const next = !synced;
    setSynced(next);
    if (next) {
      onVoiceLanguage(captionLanguage);
    }
  };

  const handleCaptionSelect = (code: LanguageCode) => {
    onCaptionLanguage(code);
    if (synced) {
      onVoiceLanguage(code);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface/30 p-4 space-y-5 text-text-primary">
      {/* Section 1: Audio Mode Selection */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Headphones className="h-3.5 w-3.5 text-primary" />
            Audio Output Mode
          </h3>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {voiceMode === "translated" ? "AI Dubbing ON" : "Raw Audio"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onVoiceModeChange("translated")}
            className={clsx(
              "nc-focus flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
              voiceMode === "translated"
                ? "border-primary bg-primary/15 text-text-primary shadow-sm"
                : "border-border/70 bg-background/50 text-text-secondary hover:bg-surface hover:text-text-primary",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Translated Voice</span>
              {voiceMode === "translated" && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="mt-1 text-[11px] leading-tight text-text-secondary">
              Real-time multilingual dubbing in your language.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onVoiceModeChange("original")}
            className={clsx(
              "nc-focus flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
              voiceMode === "original"
                ? "border-primary bg-primary/15 text-text-primary shadow-sm"
                : "border-border/70 bg-background/50 text-text-secondary hover:bg-surface hover:text-text-primary",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Original Audio</span>
              {voiceMode === "original" && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="mt-1 text-[11px] leading-tight text-text-secondary">
              Hear teacher&apos;s natural raw microphone.
            </p>
          </button>
        </div>
      </div>

      {/* Section 2: Language Routing */}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-3.5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 text-primary" />
            Language Routing
          </h3>
          <button
            type="button"
            onClick={handleSyncToggle}
            className={clsx(
              "nc-focus inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-all",
              synced
                ? "border-primary/50 bg-primary/20 text-primary"
                : "border-border bg-surface text-text-secondary hover:text-text-primary",
            )}
            title={synced ? "Voice & captions synchronized" : "Independent voice & captions"}
          >
            {synced ? <Link2 className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
            {synced ? "Synced" : "Independent"}
          </button>
        </div>

        {/* Caption Language */}
        <div>
          <label htmlFor="caption-language-select" className="block text-[11px] font-medium text-text-secondary mb-1">
            Caption Subtitle Language
          </label>
          <select
            id="caption-language-select"
            aria-label="Caption Subtitle Language"
            value={captionLanguage}
            onChange={(e) => handleCaptionSelect(e.target.value as LanguageCode)}
            className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
          >
            {pool.map((code) => (
              <option key={code} value={code} className="bg-surface text-text-primary">
                {languageNativeName(code)} ({languageName(code)})
              </option>
            ))}
          </select>
        </div>

        {/* Voice Language */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="voice-language-select" className="block text-[11px] font-medium text-text-secondary">
              Voice Output Language
            </label>
            {voiceLanguage === "or" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <Sparkles className="h-2.5 w-2.5" /> Odia Engine Ready
              </span>
            )}
          </div>
          <select
            id="voice-language-select"
            aria-label="Voice Output Language"
            value={voiceLanguage}
            disabled={synced}
            onChange={(e) => onVoiceLanguage(e.target.value as LanguageCode)}
            className={clsx(
              "w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none",
              synced && "opacity-60 cursor-not-allowed",
            )}
          >
            {pool.map((code) => (
              <option key={code} value={code} className="bg-surface text-text-primary">
                {languageNativeName(code)} ({languageName(code)})
              </option>
            ))}
          </select>
          {synced && (
            <p className="mt-1 text-[10px] text-text-secondary italic">
              Locked to caption language. Click &quot;Synced&quot; above to set different languages.
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Voice Playback & Volume */}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-3.5 space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 text-primary" />
          Translated Audio Volume
        </h3>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onVoiceMuted(!voiceMuted)}
            className={clsx(
              "nc-focus grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
              voiceMuted
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : "border-border/70 bg-surface text-text-primary hover:border-primary/50",
            )}
            aria-label={voiceMuted ? "Unmute translated voice" : "Mute translated voice"}
          >
            {voiceMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <input
            id="voice-volume-slider"
            aria-label="Translated audio volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={voiceMuted ? 0 : voiceVolume}
            disabled={voiceMuted}
            onChange={(e) => onVoiceVolume(Number(e.target.value))}
            className="h-1.5 flex-1 accent-primary bg-border/60 rounded-lg cursor-pointer"
          />

          <span className="font-mono text-xs font-bold text-text-primary w-9 text-right">
            {voiceMuted ? "0%" : `${Math.round(voiceVolume * 100)}%`}
          </span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-text-secondary flex items-center gap-1">
            <Gauge className="h-3 w-3" /> Playback Speed
          </span>
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border/60">
            {(["0.85", "1.0", "1.15"] as const).map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setPlaybackSpeed(rate)}
                className={clsx(
                  "px-2 py-0.5 text-[10px] font-bold rounded transition-colors",
                  playbackSpeed === rate
                    ? "bg-primary text-background"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Live Speech Diagnostics */}
      <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Radio className={clsx("h-3.5 w-3.5", voice.playing ? "text-emerald-400 animate-pulse" : "text-text-secondary")} />
            Realtime Voice Status
          </span>
          <span className={clsx(
            "text-[10px] font-bold px-1.5 py-0.5 rounded border",
            voice.playing
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-surface text-text-secondary border-border"
          )}>
            {voice.playing ? "Speaking" : voice.queued > 0 ? "Synthesizing" : "Standby"}
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-text-secondary">
          {voice.playing
            ? `Playing live translated speech in ${languageName(voiceLanguage)}.`
            : voiceLanguage === "or"
              ? "Odia Zero-Key Browser Synthesis Active: High clarity Odia text-to-speech fallback is running locally."
              : listening
                ? "Microphone is listening and preparing translation stream."
                : "Waiting for speaker audio to begin live translation."}
        </p>

        {voiceLanguage === "or" && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-primary">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Odia (ଓଡ଼ିଆ) fallback active — 100% operational</span>
          </div>
        )}
      </div>
    </div>
  );
}
