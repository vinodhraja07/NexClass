import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Volume2 } from "lucide-react";
import { DEMO_SEGMENTS, type LanguageCode } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import { Container, Eyebrow, Lede, Reveal, Section, SectionTitle } from "./Primitives";

const SEGMENT = DEMO_SEGMENTS[1];

interface Participant {
  id: string;
  name: string;
  initials: string;
  caption: LanguageCode;
  voice: LanguageCode;
  role: "teacher" | "student";
}

const PARTICIPANTS: Participant[] = [
  { id: "teacher", name: "Dr. Meera Krishnan", initials: "MK", caption: "en", voice: "en", role: "teacher" },
  { id: "arjun", name: "Arjun Patel", initials: "AP", caption: "hi", voice: "hi", role: "student" },
  { id: "kavya", name: "Kavya Raman", initials: "KR", caption: "ta", voice: "ta", role: "student" },
  { id: "sourav", name: "Sourav Das", initials: "SD", caption: "bn", voice: "bn", role: "student" },
  { id: "ananya", name: "Ananya Kulkarni", initials: "AK", caption: "mr", voice: "mr", role: "student" },
  { id: "priya", name: "Priya Nayak", initials: "PN", caption: "or", voice: "or", role: "student" },
];

function captionFor(code: LanguageCode): string {
  if (code === "en") return SEGMENT.originalText;
  return SEGMENT.translations[code] ?? SEGMENT.originalText;
}

export function OneRoomManyLanguages() {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string>("kavya");
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const active = useMemo(
    () => PARTICIPANTS.find((person) => person.id === activeId) ?? PARTICIPANTS[1],
    [activeId],
  );
  const others = useMemo(
    () => PARTICIPANTS.filter((person) => person.id !== active.id).slice(0, 3),
    [active],
  );

  const selectParticipant = (id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingAudio(false);
    }
    setActiveId(id);
  };

  const playSampleAudio = async () => {
    if (playingAudio) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(true);
    try {
      const text = captionFor(active.caption);
      const res = await fetch(
        `/api/demo/speech?lang=${encodeURIComponent(active.caption)}&text=${encodeURIComponent(text)}`,
        { signal: AbortSignal.timeout(6_000) },
      );
      if (res.ok) {
        const data = (await res.json()) as { audioUrl?: string };
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          audio.onended = () => {
            if (audioRef.current === audio) {
              audioRef.current = null;
              setPlayingAudio(false);
            }
          };
          audio.onerror = () => {
            if (audioRef.current === audio) {
              audioRef.current = null;
              setPlayingAudio(false);
            }
          };
          await audio.play();
          return;
        }
      }
    } catch {
      // ignore
    }
    setPlayingAudio(false);
  };

  return (
    <Section id="languages" label="One room, many languages">
      <Container>
        <div className="max-w-[760px]">
          <Reveal>
            <Eyebrow>One room, many languages</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionTitle className="mt-5">
              Same sentence. Six readings. One meeting.
            </SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mt-6">
              Choose a participant to see exactly what lands on their screen. Changing
              one person&apos;s language never touches anyone else&apos;s — there is no
              shared "room language" to renegotiate.
            </Lede>
          </Reveal>
        </div>

        {/* --------------------------- participant chips ---------------------- */}
        <Reveal delay={0.14} className="mt-10">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Choose a participant to preview their view"
          >
            {PARTICIPANTS.map((person) => {
              const isActive = person.id === active.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => selectParticipant(person.id)}
                  aria-pressed={isActive}
                  className={[
                    "nc-focus group relative flex items-center gap-2.5 rounded-xl border py-2 pl-2 pr-3 text-left transition-colors duration-200",
                    isActive
                      ? "border-accent-400/50 text-ivory-50"
                      : "border-ink-600/70 bg-ink-850/70 hover:border-ink-500 hover:bg-ink-800",
                  ].join(" ")}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeParticipantPreviewPill"
                      className="absolute inset-0 rounded-xl bg-accent-400/[0.10] border border-accent-400/40 shadow-sm shadow-accent-400/20"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span
                    className={[
                      "relative z-10 flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[10.5px] transition-colors",
                      isActive ? "bg-accent-400/20 text-accent-200" : "bg-ink-700 text-ivory-300",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {person.initials}
                  </span>
                  <span className="relative z-10 flex flex-col">
                    <span className="text-[13px] leading-tight font-medium text-ivory-100">
                      {person.name}
                    </span>
                    <span className="text-[11px] leading-tight text-ivory-400">
                      {languageNativeName(person.caption)}
                      {person.role === "teacher" ? " · speaker" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* ----------------------------- main panel --------------------------- */}
        <Reveal delay={0.18} className="mt-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="min-w-0 rounded-2xl border border-accent-400/25 bg-ink-900/80 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/12 font-mono text-[12px] text-accent-200">
                    {active.initials}
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-ivory-50">{active.name}</p>
                    <p className="text-[11.5px] text-ivory-400">
                      captions in {languageNativeName(active.caption)} · voice in{" "}
                      {languageNativeName(active.voice)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={playSampleAudio}
                    disabled={playingAudio}
                    className="nc-focus inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/15 px-3 py-1 text-[11px] font-semibold text-accent-300 transition-all hover:bg-accent-400/25 active:scale-95 shadow-sm shadow-accent-400/20"
                    title={`Listen to sample speech in ${languageNativeName(active.caption)}`}
                  >
                    {playingAudio ? (
                      <span className="flex items-center gap-0.5 h-3">
                        {[0.4, 0.9, 1, 0.6].map((scale, i) => (
                          <motion.span
                            key={i}
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.65 + i * 0.15, ease: "easeInOut" }}
                            className="w-0.5 h-3 rounded-full bg-accent-400 origin-bottom"
                          />
                        ))}
                      </span>
                    ) : (
                      <Volume2 className="h-3 w-3 text-accent-300" aria-hidden="true" />
                    )}
                    <span>{playingAudio ? "Speaking…" : `Hear ${languageNativeName(active.caption)}`}</span>
                  </button>
                  <span className="flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-400/10 px-2.5 py-1 text-[11px] font-medium text-accent-200">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    only this view changed
                  </span>
                </div>
              </div>

              <div
                aria-live="polite"
                className="mt-6 min-h-[148px] rounded-xl border border-ink-700/70 bg-ink-950/70 p-5"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={active.id}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: reduce ? 0.14 : 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                    className="text-[16px] leading-relaxed text-ivory-50 sm:text-[19px]"
                  >
                    {captionFor(active.caption)}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-ivory-400">
                Original · {SEGMENT.originalText}
              </p>
            </div>

            {/* others unaffected */}
            <div className="min-w-0 rounded-2xl border border-ink-600/70 bg-ink-850/60 p-5 sm:p-6">
              <p className="nc-eyebrow">Unchanged for everyone else</p>
              <ul className="mt-4 space-y-3">
                {others.map((person) => (
                  <li
                    key={person.id}
                    className="rounded-xl border border-ink-700/70 bg-ink-900/70 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-ivory-100">
                        {person.name}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide text-ivory-400 uppercase">
                        <Volume2 className="h-3 w-3" aria-hidden="true" />
                        {languageNativeName(person.caption)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ivory-300/75">
                      {captionFor(person.caption)}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12.5px] leading-relaxed text-ivory-400">
                Their captions and voice are untouched. A student can switch mid-class
                without asking the teacher or anybody else.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
