import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MonitorUp, Pin } from "lucide-react";
import clsx from "clsx";
import type { ParticipantPublic } from "@nexclass/shared";
import { VideoTile, type TileStatus } from "./VideoTile";

export interface StageProps {
  participants: ParticipantPublic[];
  selfId: string | null;
  streams: Record<string, MediaStream | null>;
  statuses: Record<string, TileStatus>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  activeSpeakerId: string | null;
  /** Remote audio is muted while the translated voice mode is active. */
  audioMuted?: boolean;
  /** Optional external pinned participant ID */
  pinnedParticipantId?: string | null;
  /** Optional callback when a tile pin is toggled */
  onPinParticipant?: (id: string | null) => void;
  className?: string;
}

type TileDisplayMode = "grid" | "spotlight" | "sidebar" | "screenFilmstrip";

/**
 * Google Meet-Style Adaptive Stage.
 *
 * Expands to full height and width, intelligently scaling video tiles
 * like Google Meet (1, 2, 3, 4, 6, 9 participants), supporting:
 * - Fluid layout spring animations (motion/react) for participant join, leave, reorder.
 * - Interactive pin-to-stage expansion with spotlight and sidebar strips.
 * - Strict useReducedMotion() compliance.
 */
export function Stage({
  participants,
  selfId,
  streams,
  statuses,
  localStream,
  screenStream,
  activeSpeakerId,
  audioMuted = false,
  pinnedParticipantId,
  onPinParticipant,
  className,
}: StageProps) {
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion() ?? false;
  const [internalPinnedId, setInternalPinnedId] = useState<string | null>(null);

  const activePinnedId = pinnedParticipantId !== undefined ? pinnedParticipantId : internalPinnedId;

  // Clean up pinned state if participant disconnects / leaves
  useEffect(() => {
    if (activePinnedId && !participants.some((p) => p.id === activePinnedId)) {
      if (onPinParticipant) {
        onPinParticipant(null);
      } else {
        setInternalPinnedId(null);
      }
    }
  }, [participants, activePinnedId, onPinParticipant]);

  const handleTogglePin = (id: string) => {
    const nextId = activePinnedId === id ? null : id;
    if (onPinParticipant) {
      onPinParticipant(nextId);
    } else {
      setInternalPinnedId(nextId);
    }
  };

  useEffect(() => {
    const element = screenRef.current;
    if (!element) return;
    element.srcObject = screenStream;
    if (screenStream) void element.play().catch(() => undefined);
  }, [screenStream]);

  const count = participants.length;
  const springTransition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 350, damping: 32 };

  // Google Meet dynamic grid styles
  const gridLayout = (() => {
    if (count <= 1) return "grid-cols-1 max-w-4xl max-h-[82vh]";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-[82vh]";
    if (count <= 4) return "grid-cols-2 max-w-6xl max-h-[85vh]";
    if (count <= 6) return "grid-cols-2 sm:grid-cols-3 max-w-7xl max-h-[88vh]";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl max-h-[90vh]";
  })();

  const renderTile = (participant: ParticipantPublic, mode: TileDisplayMode = "grid") => {
    const isSelf = participant.id === selfId;
    const stream = isSelf ? localStream : streams[participant.id] ?? null;
    const status: TileStatus = isSelf
      ? localStream
        ? "local"
        : "idle"
      : statuses[participant.id] ?? "idle";

    const tileClassName = (() => {
      switch (mode) {
        case "spotlight":
          return "aspect-video w-full h-full max-h-[82vh] max-w-6xl shadow-2xl";
        case "sidebar":
          return "aspect-video h-24 sm:h-28 lg:h-36 shrink-0 w-auto lg:w-full";
        case "screenFilmstrip":
          return "aspect-video h-28 sm:h-36 shrink-0";
        case "grid":
        default:
          return count <= 2
            ? "aspect-video max-h-[75vh]"
            : count <= 4
              ? "aspect-video max-h-[38vh]"
              : "aspect-video max-h-[28vh]";
      }
    })();

    return (
      <VideoTile
        key={participant.id}
        participant={participant}
        stream={stream}
        status={status}
        isSelf={isSelf}
        activeSpeaker={activeSpeakerId === participant.id}
        audioMuted={audioMuted}
        isPinned={activePinnedId === participant.id}
        onPin={() => handleTogglePin(participant.id)}
        className={tileClassName}
      />
    );
  };

  /* Screen Sharing View */
  if (screenStream) {
    return (
      <motion.div
        layout={!reduced}
        transition={springTransition}
        className={clsx("flex h-full w-full flex-col gap-2 p-2 sm:p-3 overflow-hidden", className)}
      >
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#0e0d17] border border-[#403B56]/60 shadow-2xl flex items-center justify-center">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            aria-label="Shared screen stream"
            className="h-full w-full object-contain"
          />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md border border-white/10">
            <MonitorUp className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span>Shared Screen</span>
          </div>
        </div>

        {/* Filmstrip below shared screen with layout spring animations */}
        <div className="flex h-32 sm:h-40 shrink-0 gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {participants.map((participant) => renderTile(participant, "screenFilmstrip"))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  const pinnedParticipant = participants.find((p) => p.id === activePinnedId);
  const otherParticipants = participants.filter((p) => p.id !== activePinnedId);

  /* Pin-to-Stage Spotlight View */
  if (pinnedParticipant) {
    return (
      <motion.div
        layout={!reduced}
        transition={springTransition}
        className={clsx(
          "relative flex h-full w-full flex-1 flex-col lg:flex-row items-center justify-center gap-3 p-2 sm:p-4 overflow-hidden",
          className,
        )}
      >
        {/* Primary Spotlight Stage Tile */}
        <div className="relative flex-1 h-full w-full min-h-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {renderTile(pinnedParticipant, "spotlight")}
          </AnimatePresence>
        </div>

        {/* Other participants side filmstrip */}
        {otherParticipants.length > 0 && (
          <div className="flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto shrink-0 w-full lg:w-64 xl:w-72 max-h-[22vh] lg:max-h-full pb-1 lg:pb-0 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {otherParticipants.map((p) => renderTile(p, "sidebar"))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  }

  /* Normal Google Meet Multi-tile Grid View */
  return (
    <div
      className={clsx(
        "relative flex h-full w-full flex-1 items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden scrollbar-none",
        className,
      )}
    >
      {participants.length === 0 ? (
        <div className="flex aspect-video w-full max-w-lg items-center justify-center rounded-2xl border border-dashed border-[#403B56] bg-[#1B192A]/50 p-8 text-center text-white/50">
          <p className="text-sm">Waiting for participants to join the meeting…</p>
        </div>
      ) : (
        <motion.div
          layout={!reduced}
          transition={springTransition}
          className={clsx("grid h-full w-full items-center justify-center gap-3", gridLayout)}
        >
          <AnimatePresence mode="popLayout">
            {participants.map((participant) => renderTile(participant, "grid"))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
