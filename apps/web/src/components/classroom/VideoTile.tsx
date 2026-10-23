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
import { useVisualizerMode } from "@/components/easter-eggs/HiddenEasterEggs";

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
  const [visualizerMode, toggleVisualizer] = useVisualizerMode();

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

  const springTransition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 350, damping: 32 };

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      transition={springTransition}
      className={clsx(
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl select-none",
        "bg-[#1B192A] border shadow-md",
        activeSpeaker
          ? "border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/25"
          : "border-[#403B56]/50 hover:border-[#403B56]",
        className,
      )}
      style={{
        transitionProperty: "border-color, box-shadow, background-color",
        transitionDuration: reduced ? "0ms" : "300ms",
        transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
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
          <motion.button
            type="button"
            whileHover={reduced ? {} : { scale: 1.1 }}
            whileTap={reduced ? {} : { scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            aria-label={isPinned ? "Unpin tile" : "Pin tile to stage"}
            title={isPinned ? "Unpin from spotlight" : "Pin to stage spotlight"}
            className={clsx(
              "grid h-7 w-7 place-items-center rounded-full backdrop-blur-md shadow-sm border transition-colors cursor-pointer",
              isPinned
                ? "bg-primary text-background font-bold border-primary shadow-primary/30"
                : "bg-black/60 text-white/80 hover:text-white border-white/10 hover:bg-black/80",
            )}
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </motion.button>
        )}
      </div>

      {/* Google Meet Signature Bottom-Left Name Pill */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex max-w-[90%] items-center gap-1.5 rounded-lg bg-black/65 px-2.5 py-1 text-xs text-white backdrop-blur-md shadow-md border border-white/10">
        {/* Mic status inside name pill */}
        {participant.audioEnabled ? (
          activeSpeaker ? (
            /* Active speaking dynamic equalizer wave with secret visualizer modes */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleVisualizer();
              }}
              title="Speaking · Easter Egg: Click to cycle secret visualizer modes!"
              className="group/vis relative flex items-center justify-center cursor-pointer p-0.5 rounded transition-transform active:scale-90"
            >
              {visualizerMode === "rings" ? (
                /* Kinetic Neon Rings Easter Egg */
                <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                  <motion.span
                    animate={reduced ? {} : { scale: [0.8, 1.8], opacity: [0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: "easeOut" }}
                    className="absolute h-3.5 w-3.5 rounded-full border border-emerald-400"
                  />
                  <motion.span
                    animate={reduced ? {} : { scale: [0.6, 1.4], opacity: [0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, delay: 0.45, ease: "easeOut" }}
                    className="absolute h-3 w-3 rounded-full border border-teal-300"
                  />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                </span>
              ) : visualizerMode === "pulsar" ? (
                /* Radiant Quantum Pulsar Easter Egg */
                <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                  <motion.span
                    animate={reduced ? {} : { rotate: 360, scale: [0.9, 1.15, 0.9] }}
                    transition={{ rotate: { repeat: Infinity, duration: 3, ease: "linear" }, scale: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } }}
                    className="absolute flex items-center justify-center text-[10px] text-emerald-300"
                  >
                    ✦
                  </motion.span>
                </span>
              ) : (
                /* Standard Dynamic Equalizer Bars with glow */
                <span className="flex items-end gap-[3px] h-3.5 px-0.5" aria-hidden="true">
                  {[
                    { id: 0, scaleY: [0.3, 0.85, 0.45, 1.0, 0.35, 0.7, 0.3], duration: 0.78, delay: 0 },
                    { id: 1, scaleY: [0.45, 1.0, 0.35, 0.8, 0.55, 0.95, 0.45], duration: 0.64, delay: 0.1 },
                    { id: 2, scaleY: [0.35, 0.75, 0.5, 0.95, 0.3, 0.85, 0.35], duration: 0.86, delay: 0.18 },
                    { id: 3, scaleY: [0.25, 0.65, 0.4, 0.75, 0.45, 0.6, 0.25], duration: 0.72, delay: 0.08 },
                  ].map((bar) => (
                    <motion.span
                      key={bar.id}
                      animate={
                        reduced
                          ? { scaleY: 0.6 }
                          : { scaleY: bar.scaleY }
                      }
                      transition={
                        reduced
                          ? { duration: 0 }
                          : {
                              repeat: Infinity,
                              repeatType: "reverse",
                              duration: bar.duration,
                              delay: bar.delay,
                              ease: "easeInOut",
                            }
                      }
                      className="w-[2.5px] h-3 rounded-full bg-emerald-400 origin-bottom shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    />
                  ))}
                </span>
              )}
            </button>
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
          className="font-indic rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80 leading-[1.6]"
          title={`Language: ${languageNativeName(participant.interfaceLanguage)}`}
        >
          {languageNativeName(participant.interfaceLanguage)}
        </span>

        {/* Pinned pill indicator */}
        {isPinned && (
          <span
            title="Pinned to stage spotlight"
            className="inline-flex items-center gap-0.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] font-semibold text-primary border border-primary/30"
          >
            <Pin className="h-2.5 w-2.5" />
            <span>Pinned</span>
          </span>
        )}

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
