import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AudioLines, Captions, Globe2 } from "lucide-react";
import clsx from "clsx";
import { LANGUAGES, type LanguageCode } from "@nexclass/shared";
import { LiveDot } from "@/components/ui";

interface CaptionSegment {
  id: string;
  speaker: string;
  subject: string;
  timestamp: string;
  captions: Record<LanguageCode, string>;
}

const SEGMENTS: CaptionSegment[] = [
  {
    id: "torque",
    speaker: "Dr. Meera Raghavan",
    subject: "Physics - Rotational Motion",
    timestamp: "10:04",
    captions: {
      en: "Rotate the body slowly and watch how the torque changes with the angle.",
      ta: "உடலை மெதுவாகச் சுழற்றி, கோணத்துடன் டார்க் எவ்வாறு மாறுகிறது என்பதைப் பாருங்கள்.",
      hi: "शरीर को धीरे-धीरे घुमाएँ और देखें कि कोण के साथ टॉर्क कैसे बदलता है।",
      bn: "দেহটি ধীরে ঘোরান এবং দেখুন কোণের সাথে টর্ক কীভাবে পরিবর্তন হয়।",
      mr: "शरीर हळू फिरवा आणि पहा की कोणासोबत टॉर्क कसा बदलतो.",
      or: "ଦେହଟି ଧୀରେ ଘୂରାନ୍ତୁ ଏବଂ କୋଣ ସହ ଟର୍କ କିପରି ବଦଳେ ଦେଖନ୍ତୁ।",
    },
  },
  {
    id: "cell",
    speaker: "Dr. Meera Raghavan",
    subject: "Biology - Cell Division",
    timestamp: "10:09",
    captions: {
      en: "Every cell divides once, and the chromosomes line up before the membrane pinches.",
      ta: "ஒவ்வொரு கலமும் ஒருமுறை பிரிகிறது, மென்சவ்வு சுருங்குவதற்கு முன் நிறமூர்த்தங்கள் வரிசையில் அமைகின்றன.",
      hi: "हर कोशिका एक बार विभाजित होता है, और झिल्ली सिकुड़ने से पहले गुणसूत्र सीध में हो जाते हैं।",
      bn: "প্রতিটি কোষ একবার বিভাজিত হয়, এবং ঝিল্লি সংকুচিত হওয়ার আগে ক্রোমোজোম সারিবদ্ধ হয়।",
      mr: "प्रत्येक पेशी एकदा विभाजित होतो, आणि पटली सुरकल्यापूर्वी गुणसूत्रे सरळी झाली.",
      or: "ପ୍ରତ୍ୟେକ କୋଷ ଏବେ ବିଭାଜିତ ହୁଏ, ଏବଂ ଝିଲ୍ଲୀ ସଙ୍କୁଚିତ ହଓବା ପୂର୍ବେ ହ୍ରୋମୋଜୋମ ସରଳରେ ସଜ୍ଜାଇଥାନ୍ତି।",
    },
  },
  {
    id: "demand",
    speaker: "Dr. Meera Raghavan",
    subject: "Economics - Market Equilibrium",
    timestamp: "10:13",
    captions: {
      en: "Demand shifts right when income rises, so the equilibrium price moves with it.",
      ta: "வருமானம் உயர்ந்தால் கோரிக்கை வலப்புறம் நகரும், எனவே சமநிலை விலை அதனுடன் நகரும்.",
      hi: "आय बढ़ने पर मांग दाएँ की ओर खिसकती है, इसलिए संतुलन मूल्य भी उसके साथ बदलता है।",
      bn: "আয় বাড়লে চাহিদা ডানদিকে সরে যায়, তাই সমতুল্য মূল্যও তার সঙ্গে বদলায়।",
      mr: "उत्पन्न वाढल्यास मागणी उजवीकडे हलतो, त्यामुळे संतुलन किंमतही त्याचबरोबर बदलते.",
      or: "ଆଯାନ ବଢ଼ିଲେ ଚাহିଦା ଡାହିନ ଦିକରେ ବାହାରେ, ତେଣୁ ସନ୍ତୁଲନ ଦର ମଧ୍ୟ ତାହା ସହିତ ବଦଳେ।",
    },
  },
];

const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

function WaveBars() {
  return (
    <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className="h-full w-[3px] origin-bottom animate-wave-bar rounded-full bg-accent-400/70"
          style={{ animationDelay: `${index * 130}ms` }}
        />
      ))}
    </span>
  );
}

export interface CaptionStageProps {
  /** Controlled focus language. */
  focus?: LanguageCode;
  onFocusChange?: (code: LanguageCode) => void;
  /** Hide the built in chip switcher (when the parent owns the selection). */
  showSwitcher?: boolean;
  autoAdvance?: boolean;
  className?: string;
}

/**
 * A small, honest illustration of a live multilingual classroom: one English
 * lecture line with translated captions underneath and a language chip switcher.
 */
export function CaptionStage({
  focus: focusProp,
  onFocusChange,
  showSwitcher = true,
  autoAdvance = true,
  className,
}: CaptionStageProps) {
  const reduced = useReducedMotion() ?? false;
  const layoutId = useId();
  const [internalFocus, setInternalFocus] = useState<LanguageCode>("ta");
  const [index, setIndex] = useState(0);

  const focus = focusProp ?? internalFocus;

  function selectFocus(code: LanguageCode) {
    setInternalFocus(code);
    onFocusChange?.(code);
  }

  useEffect(() => {
    if (!autoAdvance || reduced) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SEGMENTS.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [autoAdvance, reduced]);

  const segment = SEGMENTS[index];

  const rows = useMemo(() => {
    const list: LanguageCode[] = [];
    const push = (code: LanguageCode) => {
      if (code === "en") return;
      if (!list.includes(code)) list.push(code);
    };
    push(focus);
    push("ta");
    push("hi");
    return list;
  }, [focus]);

  const ease = [0.2, 0.8, 0.2, 1] as [number, number, number, number];

  return (
    <div className={clsx("nc-panel overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-700 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="nc-eyebrow">Live caption preview</span>
        </div>
        <div className="flex items-center gap-2 text-accent-300">
          <Captions className="h-3.5 w-3.5" aria-hidden="true" />
          <WaveBars />
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-400/15 font-display text-2xs font-semibold text-accent-300"
            aria-hidden="true"
          >
            MR
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ivory-100">{segment.speaker}</p>
            <p className="truncate text-2xs text-ivory-400">{segment.subject}</p>
          </div>
          <span className="ml-auto font-mono text-2xs text-ivory-400">{segment.timestamp}</span>
        </div>

        <div className="mt-3.5 min-h-[76px] rounded-xl border border-ink-700 bg-ink-900/60 px-3.5 py-3">
          <p className="nc-eyebrow mb-1.5 flex items-center gap-1.5">
            <AudioLines className="h-3 w-3" aria-hidden="true" />
            English
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={segment.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={reduced ? { duration: 0 } : { duration: 0.3, ease }}
              className="text-balance font-display text-[15px] leading-relaxed text-ivory-50"
            >
              {segment.captions.en}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-2.5 space-y-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={segment.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={reduced ? { duration: 0 } : { duration: 0.34, ease }}
              className="space-y-2"
            >
              {rows.map((code, position) => {
                const language = LANGUAGE_BY_CODE.get(code);
                if (!language) return null;
                const active = code === focus;
                return (
                  <div
                    key={`${segment.id}-${code}`}
                    className={clsx(
                      "rounded-xl border px-3.5 py-2.5 transition-colors duration-300",
                      active
                        ? "border-accent-400/40 bg-accent-400/8"
                        : "border-ink-700 bg-ink-900/40",
                    )}
                  >
                    <p
                      className={clsx(
                        "mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        active ? "text-accent-300" : "text-ivory-400",
                      )}
                    >
                      <span
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          active ? "bg-accent-400" : "bg-ink-500",
                        )}
                        aria-hidden="true"
                      />
                      {language.nativeName} {active ? "- selected" : ""}
                    </p>
                    <p
                      lang={code}
                      className={clsx(
                        "text-balance text-[13px] leading-relaxed",
                        active ? "text-ivory-50" : "text-ivory-300",
                      )}
                      style={{ transitionDelay: `${position * 40}ms` }}
                    >
                      {segment.captions[code]}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {showSwitcher ? (
          <div className="mt-4 border-t border-ink-700 pt-3.5">
            <p className="nc-eyebrow mb-2 flex items-center gap-1.5">
              <Globe2 className="h-3 w-3" aria-hidden="true" />
              Caption language
            </p>
            <div role="group" aria-label="Caption language" className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((language) => {
                const active = language.code === focus;
                return (
                  <button
                    key={language.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectFocus(language.code)}
                    className={clsx(
                      "nc-focus relative rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-200",
                      active
                        ? "border-accent-400/50 text-ivory-50"
                        : "border-ink-600 text-ivory-400 hover:border-ink-500 hover:text-ivory-100",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId={`caption-stage-chip-${layoutId}`}
                        className="absolute inset-0 rounded-full bg-accent-400/15"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative">{language.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
