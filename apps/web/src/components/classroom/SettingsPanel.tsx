import { useState } from "react";
import {
  Accessibility,
  CircleCheck,
  CircleX,
  Hash,
  Info,
  LogOut,
  Server,
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
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-2xs text-ivory-400">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] text-ivory-100">{value}</span>
    </div>
  );
}

function ProviderChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-2xs",
        ok
          ? "border-accent-400/35 bg-accent-400/10 text-accent-200"
          : "border-signal-warn/35 bg-signal-warn/10 text-signal-warn",
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
 * The settings tab: meeting facts, provider health, connection state and the
 * accessibility controls that belong to this device only.
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
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-3.5">
      <div className="space-y-4">
        <section>
          <p className="nc-eyebrow mb-1.5 flex items-center gap-1.5">
            <Info className="h-3 w-3" aria-hidden="true" />
            This meeting
          </p>
          <div className="divide-y divide-ink-700/60 rounded-xl border border-ink-700 bg-ink-900/40 px-3 py-2">
            <Row label="Title" value={meeting?.title ?? "-"} />
            <Row label="Code" value={<span className="font-mono">{meeting?.code ?? "-"}</span>} />
            <Row
              label="Speaker"
              value={
                <span lang={meeting?.speakerLanguage ?? "en"}>
                  {languageName(meeting?.speakerLanguage ?? "en")}
                </span>
              }
            />
            <Row label="Host" value={meeting?.hostName ?? "-"} />
            <Row label="Status" value={meeting?.status ?? "-"} />
            {simulated ? (
              <Row label="Transport" value="Local demo simulation" />
            ) : (
              <Row label="Transport" value="Socket.IO + WebRTC mesh" />
            )}
          </div>
        </section>

        <section>
          <p className="nc-eyebrow mb-1.5 flex items-center gap-1.5">
            <Server className="h-3 w-3" aria-hidden="true" />
            Connection and providers
          </p>
          <div className="space-y-2 rounded-xl border border-ink-700 bg-ink-900/40 px-3 py-2.5">
            <Row
              label="Room connection"
              value={
                <span
                  className={clsx(
                    status === "connected"
                      ? "text-accent-300"
                      : status === "reconnecting" || status === "connecting"
                        ? "text-signal-warn"
                        : "text-signal-live",
                  )}
                >
                  {status}
                </span>
              }
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <ProviderChip ok={providerStatus?.translationConfigured ?? false} label="Translation" />
              <ProviderChip ok={providerStatus?.ttsConfigured ?? false} label="Voice" />
              <ProviderChip
                ok={(providerStatus?.stunServers?.length ?? 0) > 0}
                label="STUN"
              />
              <ProviderChip ok={providerStatus?.turnConfigured ?? false} label="TURN" />
            </div>
            {providerStatus && !providerStatus.turnConfigured ? (
              <p className="pt-0.5 text-2xs leading-relaxed text-ivory-400">
                No TURN relay is configured for this deployment. STUN-only WebRTC cannot reach every
                network - some participants may stay in "connecting". Production needs TURN plus an
                SFU for large classes.
              </p>
            ) : null}
            {simulated ? (
              <p className="pt-0.5 text-2xs leading-relaxed text-ivory-400">
                Demo: captions are hand-authored samples, so the Translation chip shows the truth -
                no live AI provider is configured. Captions come from prepared segments, and the
                green Voice chip is the real keyless fallback voice on the API server.
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <p className="nc-eyebrow mb-1.5 flex items-center gap-1.5">
            <Accessibility className="h-3 w-3" aria-hidden="true" />
            Accessibility - this device only
          </p>
          <div className="space-y-2.5 rounded-xl border border-ink-700 bg-ink-900/40 px-3 py-2.5">
            <Row
              label="Interface language"
              value={
                <select
                  value={interfaceLanguage}
                  onChange={(event) => onInterfaceLanguage(event.target.value)}
                  aria-label="Interface language"
                  className="nc-focus max-w-[170px] truncate rounded-lg border border-ink-600 bg-ink-900 px-2 py-1 text-[13px] text-ivory-50"
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
              label="Caption size"
              value={
                <span className="inline-flex items-center gap-1">
                  {(["sm", "md", "lg"] as CaptionScale[]).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => onCaptionScale(scale)}
                      aria-pressed={captionScale === scale}
                      className={clsx(
                        "nc-focus rounded-md border px-2 py-1 text-2xs",
                        captionScale === scale
                          ? "border-accent-400/50 bg-accent-400/15 text-accent-200"
                          : "border-ink-600 text-ivory-300 hover:text-ivory-50",
                      )}
                    >
                      {scale === "sm" ? "S" : scale === "md" ? "M" : "L"}
                    </button>
                  ))}
                </span>
              }
            />
            <p className="text-2xs leading-relaxed text-ivory-400">
              Keyboard: M microphone, V camera, C captions. Captions and chat are announced as they
              arrive. Your preferences never affect other participants.
            </p>
          </div>
        </section>

        <section className="space-y-2 border-t border-ink-700/70 pt-3">
          <p className="nc-eyebrow flex items-center gap-1.5">
            <Hash className="h-3 w-3" aria-hidden="true" />
            Leaving
          </p>
          <button
            type="button"
            onClick={onLeave}
            className="nc-focus inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-ink-700 text-sm font-medium text-ivory-100 transition-colors hover:bg-ink-600"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {simulated ? "Leave the demo (simulated)" : "Leave this class"}
          </button>
          {isHost ? (
            <button
              type="button"
              disabled={ending}
              onClick={() => {
                setEnding(true);
                onEndMeeting();
              }}
              className="nc-focus inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-signal-live/90 text-sm font-semibold text-white transition-colors hover:bg-signal-live disabled:opacity-60"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              {simulated ? "End demo for everyone (simulated)" : "End meeting for everyone"}
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}
