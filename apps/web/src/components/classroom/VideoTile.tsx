import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Mic, MicOff, MonitorUp, Signal, SignalLow, TriangleAlert, VideoOff } from "lucide-react";
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
      return { label: "Connected", icon: Signal, tone: "text-accent-300" };
    case "connecting":
      return { label: "Connecting", icon: SignalLow, tone: "text-signal-warn" };
    case "failed":
      return { label: "Connection failed", icon: TriangleAlert, tone: "text-signal-live" };
    case "closed":
      return { label: "Connection closed", icon: SignalLow, tone: "text-ivory-400" };
    case "local":
      return { label: "Local preview", icon: Signal, tone: "text-accent-300" };
    default:
      return { label: "Waiting for media", icon: SignalLow, tone: "text-ivory-400" };
  }
}

/**
 * One participant tile.
 *
 * When no video arrives the tile shows the participant's initials instead of a
 * black rectangle, and the connection state is always visible.
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

  return (
    <div
      className={clsx(
        "group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-xl border bg-ink-900 p-3 transition-colors duration-300",
        activeSpeaker ? "border-accent-400/70" : "border-ink-700",
        className,
      )}
    >
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

      <div
        className={clsx(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_35%,rgba(46,224,168,0.10),transparent_62%)]",
          cameraOn ? "opacity-0 transition-opacity duration-300 group-hover:opacity-100" : "opacity-100",
        )}
        aria-hidden={cameraOn ? "true" : undefined}
      >
        <Avatar
          name={participant.displayName}
          size="lg"
          active={activeSpeaker}
          muted={!participant.audioEnabled}
        />
        {!participant.videoEnabled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-800/90 px-2 py-0.5 text-2xs text-ivory-400">
            <VideoOff className="h-3 w-3" aria-hidden="true" />
            Camera off
          </span>
        ) : null}
      </div>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ivory-50 drop-shadow">
            {participant.displayName}
            {isSelf ? " (you)" : ""}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-ivory-300/90">
            <span lang={participant.interfaceLanguage} className="rounded bg-ink-800/80 px-1.5 py-0.5">
              {languageNativeName(participant.interfaceLanguage)}
            </span>
            {participant.role === "teacher" ? (
              <span className="rounded bg-accent-400/15 px-1.5 py-0.5 text-accent-300">Host</span>
            ) : null}
            {participant.isSimulated ? (
              <span className="rounded bg-signal-info/15 px-1.5 py-0.5 text-signal-info">Simulated</span>
            ) : null}
            {participant.screenSharing ? (
              <span className="inline-flex items-center gap-1 rounded bg-lime-400/15 px-1.5 py-0.5 text-lime-300">
                <MonitorUp className="h-2.5 w-2.5" aria-hidden="true" />
                Sharing
              </span>
            ) : null}
          </p>
        </div>

        <span
          className={clsx("inline-flex items-center gap-1 text-2xs", meta.tone)}
          title={meta.label}
        >
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{meta.label}</span>
        </span>
      </div>

      <div className="relative z-10 mt-2 flex items-center gap-1.5">
        <span
          className={clsx(
            "inline-flex h-6 w-6 items-center justify-center rounded-full",
            participant.audioEnabled ? "bg-ink-800/85 text-accent-300" : "bg-signal-live/85 text-white",
          )}
          title={participant.audioEnabled ? "Microphone on" : "Microphone muted"}
        >
          {participant.audioEnabled ? (
            <Mic className="h-3 w-3" aria-hidden="true" />
          ) : (
            <MicOff className="h-3 w-3" aria-hidden="true" />
          )}
          <span className="sr-only">{participant.audioEnabled ? "Microphone on" : "Microphone muted"}</span>
        </span>
        {activeSpeaker ? (
          <motion.span
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 rounded-full bg-accent-400/15 px-2 py-0.5 text-2xs text-accent-300"
          >
            Speaking
          </motion.span>
        ) : null}
      </div>
    </div>
  );
}
