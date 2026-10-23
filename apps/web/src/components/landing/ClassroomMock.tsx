import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Captions, Mic, Volume2 } from "lucide-react";
import { DEMO_SEGMENTS, LANGUAGES, type LanguageCode } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import clsx from "clsx";

const CURRENT = DEMO_SEGMENTS[1];
const PREVIOUS = DEMO_SEGMENTS[0];
const ORDER: LanguageCode[] = ["en", "ta", "hi", "bn", "mr", "or"];

const PEOPLE = [
  { name: "Dr. Meera Krishnan", initials: "MK" },
  { name: "Arjun Patel", initials: "AP" },
  { name: "Kavya Raman", initials: "KR" },
  { name: "Ananya Kulkarni", initials: "AK" },
  { name: "Sourav Das", initials: "SD" },
];

function lineFor(segment: (typeof DEMO_SEGMENTS)[number], code: LanguageCode): string {
  if (code === "en") return segment.originalText;
  return segment.translations[code] ?? segment.originalText;
}

const BAR_HEIGHTS = [6, 12, 20, 9, 16, 11, 7, 18, 13, 8, 15, 10, 6, 12, 17, 9, 14, 8];

function Waveform({ accent = false }: { accent?: boolean }) {
  return (
    <div className="flex h-6 items-end gap-[3px]" aria-hidden="true">
      {BAR_HEIGHTS.map((height, index) => (
        <motion.span
          key={index}
          className={clsx(
            "w-[3px] rounded-full",
            accent ? "bg-accent-400" : "bg-ivory-400/45",
          )}
          animate={{
            height: [`${Math.max(4, height * 0.35)}px`, `${Math.max(6, height)}px`, `${Math.max(4, height * 0.35)}px`],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.75 + (index % 4) * 0.15,
            ease: "easeInOut",
          }}
          style={{ height }}
        />
      ))}
    </div>
  );
}

/**
 * A working mock of the NexClass classroom: a live meeting strip on the left,
 * and a caption panel on the right that can be switched between every
 * supported language.
 */
export function ClassroomMock() {
  const reduce = useReducedMotion();
  const [lang, setLang] = useState<LanguageCode>("en");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (pinned || reduce) return;
    const timer = window.setInterval(() => {
      setLang((current) => ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [pinned, reduce]);

  const caption = useMemo(() => lineFor(CURRENT, lang), [lang]);
  const previous = useMemo(() => lineFor(PREVIOUS, lang), [lang]);
  const language = LANGUAGES.find((item) => item.code === lang) ?? LANGUAGES[0];

  return (
    <figure className="nc-panel relative overflow-hidden shadow-lift border border-ink-600/80 hover:border-accent-400/30 transition-all duration-500 group">
      {/* ambient glow gradient */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-400/15 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />

      <figcaption className="sr-only">
        A NexClass live classroom with one teacher and four students. The caption panel
        shows the same spoken sentence in the language chosen by the viewer.
      </figcaption>

      {/* window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-700/70 bg-ink-900/60 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-live">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-signal-live" />
            </span>
          </span>
          <span className="truncate font-mono text-[11.5px] tracking-wide text-ivory-300">
            PHYS-204 / Rotational Motion
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-ink-600 bg-ink-850 px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.14em] text-ivory-400 uppercase">
          Live room
        </span>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_1.05fr]">
        {/* ---------------------------- video strip --------------------------- */}
        <div className="border-b border-ink-700/70 p-3 sm:p-4 xl:border-b-0 xl:border-r">
          <div className="overflow-hidden rounded-xl border border-ink-600/70 bg-ink-900">
            <div className="relative flex aspect-[16/9] flex-col items-center justify-center gap-4 bg-[radial-gradient(120%_120%_at_50%_0%,#16203a_0%,#080d18_72%)] overflow-hidden">
              <motion.span
                className="absolute h-36 w-36 rounded-full border border-accent-400/20 pointer-events-none"
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                aria-hidden="true"
              />
              <motion.span
                className="absolute h-48 w-48 rounded-full border border-accent-400/10 pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.45, 0.15] }}
                transition={{ repeat: Infinity, duration: 4.5, delay: 0.8, ease: "easeInOut" }}
                aria-hidden="true"
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-400/40 bg-accent-400/15 font-display text-[20px] font-semibold tracking-wide text-accent-300 shadow-lg shadow-accent-400/20">
                MK
              </span>
              <Waveform accent />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-ink-700/70 bg-ink-950/70 px-3 py-2">
              <span className="truncate text-[12.5px] font-medium text-ivory-100">
                Dr. Meera Krishnan
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-accent-400/12 px-1.5 py-0.5 text-[10.5px] font-medium text-accent-300">
                <Mic className="h-3 w-3" aria-hidden="true" />
                Speaking
              </span>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PEOPLE.slice(1).map((person) => (
              <motion.li
                key={person.name}
                whileHover={{ y: -2 }}
                className="flex items-center gap-2 rounded-lg border border-ink-700/70 bg-ink-850/80 px-2 py-1.5 transition-colors hover:border-accent-400/30"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-700 font-mono text-[10px] text-ivory-300">
                  {person.initials}
                </span>
                <span className="truncate text-[11.5px] text-ivory-300">
                  {person.name.split(" ")[0]}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* --------------------------- caption panel -------------------------- */}
        <div className="flex flex-col p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="nc-eyebrow flex items-center gap-1.5">
              <Captions className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
              Captions
            </p>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide text-ivory-400">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              voice {language.name}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Caption language">
            {ORDER.map((code) => {
              const item = LANGUAGES.find((entry) => entry.code === code);
              const active = code === lang;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLang(code);
                    setPinned(true);
                  }}
                  aria-pressed={active}
                  className={clsx(
                    "nc-focus relative rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-200",
                    active
                      ? "text-accent-200 border-accent-400/50"
                      : "border-ink-600 bg-ink-850 text-ivory-400 hover:text-ivory-100",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="mockActiveLangPill"
                      className="absolute inset-0 rounded-lg bg-accent-400/15 border border-accent-400/40 -z-10 shadow-sm shadow-accent-400/20"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item?.nativeName ?? code}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-1 flex-col justify-center rounded-xl border border-ink-700/70 bg-ink-900/80 p-4">
            <p className="mb-3 line-clamp-2 text-[12.5px] leading-relaxed text-ivory-400/55">
              {previous}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={lang}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduce ? 0.12 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="text-[15px] leading-relaxed text-ivory-50 sm:text-[17px]"
              >
                {caption}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-3 rounded-xl border border-ink-700/70 bg-ink-950/60 px-3 py-2.5">
            <p className="nc-eyebrow">Original transcript</p>
            <p className="mt-1 font-mono text-[11.5px] leading-relaxed text-ivory-400">
              {CURRENT.originalText}
            </p>
          </div>

          <p className="mt-2.5 text-[11px] leading-relaxed text-ivory-400/80">
            Prepared sample segment · shown in {language.name} ({languageNativeName(lang)}) ·
            original kept verbatim
          </p>
        </div>
      </div>
    </figure>
  );
}
