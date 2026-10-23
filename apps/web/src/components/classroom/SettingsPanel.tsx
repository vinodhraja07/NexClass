import { useState } from "react";
import {
  Accessibility,
  CircleCheck,
  CircleX,
  Hash,
  Info,
  Keyboard,
  LogOut,
  Palette,
  Server,
  Sparkles,
  Square,
} from "lucide-react";
import clsx from "clsx";
import type { MeetingPublic, ParticipantPublic } from "@nexclass/shared";
import { languageName } from "@nexclass/shared";
import type {
  ConnectionStatus,
  ProviderRuntimeStatus,
} from "@/lib/transport";
import type { CaptionScale } from "@/hooks/useClassroomPreferences";
import { meetingLanguagePool } from "./languagePool";

export interface SettingsPanelProps {
  meeting: MeetingPublic | null;
  self: ParticipantPublic | null;
  status: ConnectionStatus;
  providerStatus: ProviderRuntimeStatus | null;
  interfaceLanguage: string;
  availableLanguages: string[];
  onInterfaceLanguage: (language: string) => void;
  captionScale: CaptionScale;
  onCaptionScale: (scale: CaptionScale) => void;
  meetingCode: string;
  isHost: boolean;
  simulated?: boolean;
  onLeave: () => void;
  onEndMeeting: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-2xs text-text-secondary">{label}</span>
      <span className="min-w-0 truncate text-right text-xs font-medium text-text-primary">{value}</span>
    </div>
  );
}

function ProviderChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-2xs font-medium",
        ok
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-signal-warn/40 bg-signal-warn/10 text-signal-warn",
      )}
    >
      {ok ? (
        <CircleCheck className="h-3 w-3" aria-hidden="true" />
      ) : (
        <CircleX className="h-3 w-3" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

/**
 * Premium Classroom Settings & Preferences Panel.
 */
export function SettingsPanel({
  meeting,
  self,
  status,
  providerStatus,
  interfaceLanguage,
  availableLanguages,
  onInterfaceLanguage,
  captionScale,
  onCaptionScale,
  isHost,
  simulated = false,
  onLeave,
  onEndMeeting,
}: SettingsPanelProps) {
  const [ending, setEnding] = useState(false);
  const pool = meetingLanguagePool(availableLanguages as never, interfaceLanguage as never);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4 bg-surface/50">
      <div className="space-y-4">
        {/* Appearance & Color System */}
        <section>
          <p className="text-2xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Active Design System
          </p>
          <div className="rounded-2xl border border-border/70 bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-primary">Midnight Purple</p>
                <p className="text-[11px] text-text-secondary">Official NexClass low-saturation signature palette</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#12111E] ring-1 ring-border/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#262338]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#8980BD]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#A89ACF]" />
                <span className="ml-1 text-[10px] font-semibold text-primary">Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Meeting Details */}
        <section>
          <p className="text-2xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Classroom Information
          </p>
          <div className="divide-y divide-border/40 rounded-2xl border border-border/70 bg-surface px-3.5 py-2 shadow-xs">
            <Row label="Title" value={meeting?.title ?? "-"} />
            <Row label="Code" value={<span className="font-mono font-bold text-primary">{meeting?.code ?? "-"}</span>} />
            <Row
              label="Host Speaker Language"
              value={
                <span lang={meeting?.speakerLanguage ?? "en"}>
                  {languageName(meeting?.speakerLanguage ?? "en")}
                </span>
              }
            />
            <Row label="Instructor" value={meeting?.hostName ?? "-"} />
            <Row
              label="Network Topology"
              value={simulated ? "Demo Simulator" : "WebRTC Mesh (P2P + Relay)"}
            />
          </div>
        </section>

        {/* Real-time Infrastructure Health */}
        <section>
          <p className="text-2xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Provider Health &amp; Connections
          </p>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-surface p-3.5 shadow-xs">
            <Row
              label="Room Status"
              value={
                <span
                  className={clsx(
                    "font-semibold",
                    status === "connected"
                      ? "text-primary"
                      : status === "reconnecting" || status === "connecting"
                        ? "text-signal-warn"
                        : "text-signal-live",
                  )}
                >
                  {status.toUpperCase()}
                </span>
              }
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <ProviderChip ok={providerStatus?.translationConfigured ?? false} label="AI Translation" />
              <ProviderChip ok={providerStatus?.ttsConfigured ?? false} label="Neural TTS" />
              <ProviderChip ok={(providerStatus?.stunServers?.length ?? 0) > 0} label="STUN Relay" />
              <ProviderChip ok={providerStatus?.turnConfigured ?? false} label="TURN SFU" />
            </div>
            {simulated && (
              <p className="text-[11px] text-text-secondary leading-relaxed pt-1">
                Demo mode: pre-computed multi-language subtitles demonstrate real-time linguistic alignment.
              </p>
            )}
          </div>
        </section>

        {/* Accessibility Preferences */}
        <section>
          <p className="text-2xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
            <Accessibility className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Personal Accessibility
          </p>
          <div className="space-y-3 rounded-2xl border border-border/70 bg-surface p-3.5 shadow-xs">
            <Row
              label="App Language"
              value={
                <select
                  value={interfaceLanguage}
                  onChange={(event) => onInterfaceLanguage(event.target.value)}
                  aria-label="Interface language"
                  className="nc-focus max-w-[170px] truncate rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-text-primary"
                >
                  {pool.map((code) => (
                    <option key={code} value={code}>
                      {languageName(code)}
                    </option>
                  ))}
                </select>
              }
            />

            <Row
              label="Caption Typography Size"
              value={
                <span className="inline-flex items-center gap-1">
                  {(["sm", "md", "lg"] as CaptionScale[]).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => onCaptionScale(scale)}
                      aria-pressed={captionScale === scale}
                      className={clsx(
                        "nc-focus rounded-md border px-2 py-0.5 text-2xs font-medium transition-colors",
                        captionScale === scale
                          ? "border-primary bg-primary/20 text-primary font-bold"
                          : "border-border/60 text-text-secondary hover:text-text-primary",
                      )}
                    >
                      {scale === "sm" ? "A-" : scale === "md" ? "A" : "A+"}
                    </button>
                  ))}
                </span>
              }
            />

            {/* Keyboard Shortcuts Cheat Sheet */}
            <div className="pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                Keyboard Shortcuts
              </p>
              <div className="grid grid-cols-3 gap-1 text-[11px] text-text-secondary">
                <div className="rounded bg-background p-1.5 text-center border border-border/40">
                  <span className="font-mono font-bold text-text-primary">M</span> Mic
                </div>
                <div className="rounded bg-background p-1.5 text-center border border-border/40">
                  <span className="font-mono font-bold text-text-primary">V</span> Camera
                </div>
                <div className="rounded bg-background p-1.5 text-center border border-border/40">
                  <span className="font-mono font-bold text-text-primary">C</span> Captions
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leave or End Session */}
        <section className="space-y-2 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onLeave}
            className="nc-focus inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary shadow-xs transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>{simulated ? "Exit Demo Classroom" : "Leave This Classroom"}</span>
          </button>

          {isHost && (
            <button
              type="button"
              disabled={ending}
              onClick={() => {
                setEnding(true);
                onEndMeeting();
              }}
              className="nc-focus inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-signal-live text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              <span>{simulated ? "End Demo Session" : "End Class For Everyone"}</span>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
