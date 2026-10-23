import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Crown,
  Mic,
  MicOff,
  MonitorUp,
  Pin,
  PinOff,
  Radio,
  Signal,
  SignalLow,
  WifiOff,
} from "lucide-react";
import clsx from "clsx";
import type { ParticipantPublic } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import { Avatar } from "./Avatar";

export type TileStatus = "connecting" | "connected" | "failed" | "closed" | "idle" | "local";

export interface VideoTileProps {
  participant: ParticipantPublic;
  isSelf: boolean;
  stream: MediaStream | null;
  status: TileStatus;
  activeSpeaker?: boolean;
  audioMuted?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
  className?: string;
}

function statusMeta(status: TileStatus): { label: string; icon: typeof Signal; tone: string } {
  switch (status) {
    case "connected":
      return { label: "Connected (Good)", icon: Signal, tone: "text-emerald-400" };
    case "connecting":
      return { label: "Connecting…", icon: SignalLow, tone: "text-amber-400" };
    case "failed":
      return { label: "Connection lost", icon: WifiOff, tone: "text-rose-400" };
    case "closed":
      return { label: "Left room", icon: AlertTriangle, tone: "text-text-secondary" };
    case "local":
      return { label: "You", icon: Signal, tone: "text-primary" };
    case "idle":
    default:
      return { label: "Connected", icon: Signal, tone: "text-emerald-400" };
  }
}

/**
 * Google Meet Video Tile.
 *
 * Implements bottom-left translucent name pill, mic indicator,
 * active speaking equalizer bars, and centered large initials avatar on camera off.
 */
export function VideoTile({
  participant,
  isSelf,
  stream,
  status,
  activeSpeaker = false,
  audioMuted = false,
  onPin,
  isPinned = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  const cameraOn = participant.videoEnabled && Boolean(stream);
  const isHost = participant.role === "teacher";
  const meta = statusMeta(status);
  const StatusIcon = meta.icon;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    if (stream && cameraOn) {
      element.srcObject = stream;
      void element.play().catch(() => undefined);
    } else {
      element.srcObject = null;
    }
  }, [stream, cameraOn]);

  return (
    <motion.div
      layout={!reduced}
      className={clsx(
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl transition-all duration-200 select-none",
        "bg-[#1B192A] border shadow-md",
        activeSpeaker
          ? "border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/20"
          : "border-[#403B56]/50 hover:border-[#403B56]",
        className,
      )}
    >
      {/* Video element when camera is on */}
      {cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf || audioMuted}
          aria-label={`${participant.displayName} video`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : stream && !isSelf ? (
        /* Hidden audio element ensuring incoming microphone audio continues when camera is off */
        <audio
          ref={(el) => {
            if (el && el.srcObject !== stream) {
              el.srcObject = stream;
              void el.play().catch(() => undefined);
            }
          }}
          autoPlay
          playsInline
          muted={audioMuted}
        />
      ) : null}

      {/* Camera-off Avatar Canvas */}
      <div
        className={clsx(
          "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#262338]/80 to-[#12111E]/95",
          cameraOn ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <Avatar
          name={participant.displayName}
          size="xl"
          active={activeSpeaker}
          muted={!participant.audioEnabled}
        />
      </div>

      {/* Google Meet Top-Right Controls (Hover Overlay) */}
      <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span
          className={clsx(
            "grid h-7 w-7 place-items-center rounded-full bg-black/60 backdrop-blur-md text-white/80 shadow-sm border border-white/10",
            meta.tone,
          )}
          title={meta.label}
        >
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{meta.label}</span>
        </span>
        {onPin && (
          <button
            type="button"
            onClick={onPin}
            aria-label={isPinned ? "Unpin tile" : "Pin tile"}
            title={isPinned ? "Unpin from main screen" : "Pin to main screen"}
            className={clsx(
              "grid h-7 w-7 place-items-center rounded-full bg-black/60 backdrop-blur-md shadow-sm border border-white/10 transition-colors",
              isPinned ? "bg-primary text-background font-bold" : "text-white/80 hover:text-white",
            )}
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Google Meet Signature Bottom-Left Name Pill */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex max-w-[90%] items-center gap-1.5 rounded-lg bg-black/65 px-2.5 py-1 text-xs text-white backdrop-blur-md shadow-md border border-white/10">
        {/* Mic status inside name pill */}
        {participant.audioEnabled ? (
          activeSpeaker ? (
            /* Active speaking equalizer bars */
            <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
              {[0.4, 0.9, 1, 0.6].map((scale, i) => (
                <motion.span
                  key={i}
                  animate={reduced ? {} : { scaleY: [0.25, 1, 0.25] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.7 + i * 0.12,
                    ease: "easeInOut",
                  }}
                  className="w-0.5 h-2.5 rounded-full bg-emerald-400 origin-bottom"
                />
              ))}
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Microphone on" />
          )
        ) : (
          <span
            className="grid h-4 w-4 place-items-center rounded-full bg-rose-600/90 text-white shadow-sm"
            title="Microphone muted"
          >
            <MicOff className="h-2.5 w-2.5" aria-hidden="true" />
          </span>
        )}

        {/* Participant Name */}
        <span className="truncate font-medium text-white/95 text-[12px] drop-shadow-sm">
          {participant.displayName}
          {isSelf ? " (You)" : ""}
        </span>

        {/* Host Badge */}
        {isHost && (
          <span
            title="Host of this classroom"
            className="inline-flex items-center gap-0.5 rounded bg-amber-400/20 px-1 py-0.5 text-[10px] font-bold text-amber-300"
          >
            <Crown className="h-2.5 w-2.5" />
            <span>Host</span>
          </span>
        )}

        {/* Language Badge */}
        <span
          lang={participant.interfaceLanguage}
          className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80"
          title={`Language: ${languageNativeName(participant.interfaceLanguage)}`}
        >
          {languageNativeName(participant.interfaceLanguage)}
        </span>

        {/* Screen sharing pill */}
        {participant.screenSharing && (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/30 px-1.5 py-0.5 text-[10px] text-blue-200">
            <MonitorUp className="h-2.5 w-2.5" />
            <span>Sharing</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
