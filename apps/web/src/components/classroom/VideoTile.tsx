import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Crown,
  Mic,
  MicOff,
  MonitorUp,
  Signal,
  SignalLow,
  Sparkles,
  TriangleAlert,
  VideoOff,
} from "lucide-react";
import clsx from "clsx";
import type { ParticipantPublic } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import { Avatar } from "./Avatar";

export type TileStatus = "connecting" | "connected" | "failed" | "closed" | "idle" | "local";

export interface VideoTileProps {
  participant: ParticipantPublic;
  stream: MediaStream | null;
  status: TileStatus;
  isSelf?: boolean;
  activeSpeaker?: boolean;
  /** Remote audio is muted while the translated voice mode is active. */
  audioMuted?: boolean;
  className?: string;
}

function statusMeta(status: TileStatus) {
  switch (status) {
    case "connected":
      return { label: "Connected (Good)", icon: Signal, tone: "text-primary" };
    case "connecting":
      return { label: "Connecting…", icon: SignalLow, tone: "text-signal-warn" };
    case "failed":
      return { label: "Connection failed", icon: TriangleAlert, tone: "text-signal-live" };
    case "closed":
      return { label: "Connection closed", icon: SignalLow, tone: "text-text-secondary" };
    case "local":
      return { label: "Your video preview", icon: Signal, tone: "text-primary" };
    default:
      return { label: "Waiting for stream", icon: SignalLow, tone: "text-text-secondary" };
  }
}

/**
 * Premium Participant Card.
 *
 * Implements Apple/Linear design precision with theme-aware borders,
 * refined active-speaker wave visualizer, and clear role/language hierarchy.
 */
export function VideoTile({
  participant,
  stream,
  status,
  isSelf = false,
  activeSpeaker = false,
  audioMuted = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    if (stream) {
      element.srcObject = stream;
      void element.play().catch(() => undefined);
    } else {
      element.srcObject = null;
    }
  }, [stream]);

  const cameraOn = participant.videoEnabled && Boolean(stream);
  const meta = statusMeta(status);
  const StatusIcon = meta.icon;
  const isHost = participant.role === "teacher";

  return (
    <motion.div
      layout={!reduced}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className={clsx(
        "group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border p-3 transition-all duration-300 select-none shadow-sm",
        "bg-surface/90 hover:bg-surface",
        activeSpeaker
          ? "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/15"
          : "border-border/70 hover:border-border hover:shadow-md",
        className,
      )}
    >
      {/* Active speaker border light */}
      {activeSpeaker && !reduced && (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/[0.06] via-transparent to-primary/[0.04]"
          aria-hidden="true"
        />
      )}

      {/* Video stream container */}
      {cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf || audioMuted}
          aria-label={`${participant.displayName} video`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* Camera Off Avatar Surface */}
      <div
        className={clsx(
          "absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-gradient-to-b from-surface/60 to-background/90",
          cameraOn
            ? "opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-sm"
            : "opacity-100",
        )}
        aria-hidden={cameraOn ? "true" : undefined}
      >
        <Avatar
          name={participant.displayName}
          size="lg"
          active={activeSpeaker}
          muted={!participant.audioEnabled}
          showMutedBadge
        />
        {!participant.videoEnabled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-2.5 py-0.5 text-2xs text-text-secondary backdrop-blur-sm">
            <VideoOff className="h-3 w-3" aria-hidden="true" />
            <span>Camera off</span>
          </span>
        ) : null}
      </div>

      {/* Top Participant Meta Bar */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 max-w-[85%] rounded-xl border border-border/50 bg-background/85 px-2.5 py-1.5 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-text-primary">
              {participant.displayName}
              {isSelf ? <span className="font-normal text-text-secondary"> (you)</span> : ""}
            </p>
            {isHost && (
              <span
                title="Classroom Host"
                className="inline-flex items-center gap-1 rounded-md border border-secondary-accent/40 bg-secondary-accent/15 px-1.5 py-0.2 text-[10px] font-bold text-secondary-accent shrink-0"
              >
                <Crown className="h-2.5 w-2.5" aria-hidden="true" />
                <span>Host</span>
              </span>
            )}
            {participant.isSimulated && (
              <span className="rounded-md border border-ai-accent/30 bg-ai-accent/10 px-1.5 py-0.2 text-[10px] font-medium text-ai-accent shrink-0">
                AI Demo
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-secondary">
            <span
              lang={participant.interfaceLanguage}
              className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
              title={`Language: ${languageNativeName(participant.interfaceLanguage)}`}
            >
              {languageNativeName(participant.interfaceLanguage)}
            </span>
            {participant.screenSharing && (
              <span className="inline-flex items-center gap-1 rounded bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-medium text-lime-300">
                <MonitorUp className="h-2.5 w-2.5" aria-hidden="true" />
                Sharing
              </span>
            )}
          </div>
        </div>

        {/* Network status icon badge */}
        <span
          className={clsx(
            "grid h-6 w-6 place-items-center rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm transition-colors",
            meta.tone,
          )}
          title={meta.label}
        >
          <StatusIcon className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">{meta.label}</span>
        </span>
      </div>

      {/* Bottom State Bar: Mic & Active Speaker Wave */}
      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              "inline-flex h-6 w-6 items-center justify-center rounded-lg border backdrop-blur-sm shadow-sm transition-colors",
              participant.audioEnabled
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-signal-live/50 bg-signal-live/20 text-signal-live",
            )}
            title={participant.audioEnabled ? "Microphone active" : "Microphone muted"}
          >
            {participant.audioEnabled ? (
              <Mic className="h-3 w-3" aria-hidden="true" />
            ) : (
              <MicOff className="h-3 w-3" aria-hidden="true" />
            )}
            <span className="sr-only">
              {participant.audioEnabled ? "Microphone active" : "Microphone muted"}
            </span>
          </span>

          {activeSpeaker && (
            <motion.span
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-background/90 px-2 py-0.5 text-[11px] font-medium text-primary shadow-sm backdrop-blur-md"
            >
              <span className="flex items-center gap-0.5 h-3" aria-hidden="true">
                {[0.4, 0.9, 1, 0.6].map((scale, i) => (
                  <motion.span
                    key={i}
                    animate={reduced ? {} : { scaleY: [0.25, 1, 0.25] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.75 + i * 0.15,
                      ease: "easeInOut",
                    }}
                    className="w-0.5 h-2.5 rounded-full bg-primary origin-bottom"
                  />
                ))}
              </span>
              <span>Speaking</span>
            </motion.span>
          )}
        </div>

        {/* Audio muted mode badge */}
        {audioMuted && !isSelf && (
          <span
            className="rounded border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] text-text-secondary backdrop-blur-sm"
            title="Audio replaced by translated speech"
          >
            Translated
          </span>
        )}
      </div>
    </motion.div>
  );
}
