import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mic, MicOff, PhoneOff, Square, Video, VideoOff } from "lucide-react";
import clsx from "clsx";
import type { ParticipantPublic } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import { Avatar } from "./Avatar";

export interface ParticipantsPanelProps {
  participants: ParticipantPublic[];
  selfId: string | null;
  activeSpeakerId: string | null;
  isHost: boolean;
  onEndMeeting: () => void;
  ending: boolean;
}

/**
 * The people in the room.
 *
 * Every participant is shown with the languages they chose for themselves -
 * interface, captions and voice - which makes it obvious that the language
 * choices are personal and independent.
 */
export function ParticipantsPanel({
  participants,
  selfId,
  activeSpeakerId,
  isHost,
  onEndMeeting,
  ending,
}: ParticipantsPanelProps) {
  const reduced = useReducedMotion() ?? false;
  const sorted = participants.slice().sort((a, b) => {
    if (a.id === selfId) return 1;
    if (b.id === selfId) return -1;
    if (a.role !== b.role) return a.role === "teacher" ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="nc-hairline px-4 py-3">
        <p className="nc-eyebrow">In the room</p>
        <p className="mt-1 text-[13px] text-ivory-200">
          {participants.length} {participants.length === 1 ? "person" : "people"}
        </p>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        <AnimatePresence initial={false}>
          {sorted.map((participant) => {
            const active = activeSpeakerId === participant.id;
            return (
              <motion.li
                key={participant.id}
                layout={!reduced}
                initial={reduced ? { opacity: 1 } : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, x: 8 }}
                transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className={clsx(
                  "flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors duration-200",
                  active ? "bg-accent-400/10" : "hover:bg-ink-800/60",
                )}
              >
                <Avatar
                  name={participant.displayName}
                  size="sm"
                  active={active}
                  muted={!participant.audioEnabled}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[13px] font-medium text-ivory-100">
                    {participant.displayName}
                    {participant.id === selfId ? (
                      <span className="text-2xs text-ivory-400">(you)</span>
                    ) : null}
                    {participant.role === "teacher" ? (
                      <span className="rounded bg-accent-400/15 px-1.5 py-0.5 text-2xs text-accent-300">
                        Host
                      </span>
                    ) : null}
                    {participant.isSimulated ? (
                      <span className="rounded bg-signal-info/15 px-1.5 py-0.5 text-2xs text-signal-info">
                        Simulated
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1">
                    <span
                      title="Interface language"
                      className="rounded border border-ink-600 px-1.5 py-0.5 text-2xs text-ivory-200"
                    >
                      UI <span lang={participant.interfaceLanguage}>{languageNativeName(participant.interfaceLanguage)}</span>
                    </span>
                    <span
                      title="Caption language"
                      className="rounded border border-ink-600 px-1.5 py-0.5 text-2xs text-ivory-200"
                    >
                      CC <span lang={participant.captionLanguage}>{languageNativeName(participant.captionLanguage)}</span>
                    </span>
                    <span
                      title="Voice language"
                      className="rounded border border-ink-600 px-1.5 py-0.5 text-2xs text-ivory-200"
                    >
                      VO <span lang={participant.voiceLanguage}>{languageNativeName(participant.voiceLanguage)}</span>
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={clsx(
                      "grid h-6 w-6 place-items-center rounded-full",
                      participant.audioEnabled
                        ? "bg-ink-800 text-accent-300"
                        : "bg-signal-live/80 text-white",
                    )}
                    title={participant.audioEnabled ? "Microphone on" : "Microphone muted"}
                  >
                    {participant.audioEnabled ? (
                      <Mic className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <MicOff className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {participant.audioEnabled ? "Microphone on" : "Microphone muted"}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "grid h-6 w-6 place-items-center rounded-full",
                      participant.videoEnabled ? "bg-ink-800 text-accent-300" : "bg-ink-750 text-ivory-400",
                    )}
                    title={participant.videoEnabled ? "Camera on" : "Camera off"}
                  >
                    {participant.videoEnabled ? (
                      <Video className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <VideoOff className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {participant.videoEnabled ? "Camera on" : "Camera off"}
                    </span>
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {isHost ? (
        <div className="border-t border-ink-700/70 px-4 py-3">
          <p className="nc-eyebrow mb-2">Host controls</p>
          <button
            type="button"
            onClick={onEndMeeting}
            disabled={ending}
            className="nc-focus inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-signal-live/90 text-2xs font-semibold text-white transition-colors hover:bg-signal-live disabled:opacity-50"
          >
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
            {ending ? "Ending the meeting…" : "End meeting for everyone"}
          </button>
          <p className="mt-1.5 flex items-start gap-1.5 text-2xs leading-relaxed text-ivory-400">
            <PhoneOff className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Ending closes the classroom for every participant.
          </p>
        </div>
      ) : null}
    </div>
  );
}
