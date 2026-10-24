import { useState, useCallback, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, KeyRound, Play, ArrowRight, Zap, Radio, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { LanguageCode } from "@nexclass/shared";
import { ALL_LANGUAGE_CODES } from "./LanguageChips";
import { Button } from "@/components/ui";
import { storeRecentMeeting } from "./guestSession";
import { SPRINGS } from "@/lib/motion";

const EDUCATIONAL_TITLES: Record<LanguageCode, string[]> = {
  en: [
    "Physics: Mechanics & Wave Motion",
    "Mathematics: Applied Differential Calculus",
    "Computer Science: Distributed Architectures",
    "Molecular Biology & Cellular Genetics",
    "Global Economics & Trade Systems",
  ],
  hi: [
    "भौतिक विज्ञान: गति एवं तरंग यांत्रिकी",
    "गणित: व्यावहारिक कलन एवं बीजगणित",
    "कंप्यूटर विज्ञान: वितरित प्रणालियाँ",
    "जीव विज्ञान: आनुवंशिकी एवं कोशिका",
    "वैश्विक इतिहास एवं संस्कृति",
  ],
  ta: [
    "இயற்பியல்: இயக்கவியல் மற்றும் அலைகள்",
    "கணிதம்: பயன்பாட்டு நுண்கணிதம்",
    "கணினி அறிவியல்: விநியோகிக்கப்பட்ட அமைப்புகள்",
    "உயிரியல்: மரபியல் மற்றும் செல் கட்டமைப்பு",
    "உலகளாவிய வரலாறு மற்றும் கலாச்சாரம்",
  ],
  bn: [
    "পদার্থবিজ্ঞান: বলবিদ্যা ও তরঙ্গ গতি",
    "গণিত: ফলিত ক্যালকুলাস ও বীজগণিত",
    "কম্পিউটার বিজ্ঞান: বিতরণকৃত সিস্টেম",
    "জীববিজ্ঞান: কোষ ও জিনতত্ত্ব",
    "বিশ্ব ইতিহাস ও আধুনিক সংস্কৃতি",
  ],
  mr: [
    "भौतिकशास्त्र: यांत्रिकी आणि तरंग गती",
    "गणित: उपयोजित कलन आणि बीजगणित",
    "संगणक विज्ञान: वितरित प्रणाली",
    "जीवशास्त्र: आनुवंशिकी आणि पेशी",
    "जागतिक इतिहास आणि संस्कृती",
  ],
  or: [
    "ପଦାର୍ଥ ବିଜ୍ଞାନ: ବଳଗତି ବିଜ୍ଞାନ ଓ ତରଙ୍ଗ",
    "ଗଣିତ: ପ୍ରୟୋଗାତ୍ମକ କାଲକୁଲସ",
    "କମ୍ପ୍ୟୁଟର ବିଜ୍ଞାନ: ବିତରିତ ପ୍ରଣାଳୀ",
    "ଜୀବ ବିଜ୍ଞାନ: ଆନୁବଂଶିକତା ଓ କୋଷ",
    "ବିଶ୍ୱ ଇତିହାସ ଓ ସଂସ୍କୃତି",
  ],
};

export interface HeroActionDeckProps {
  isTeacher?: boolean;
  onInstantCreateComplete?: (meetingCode: string) => void;
  className?: string;
}

export function HeroActionDeck({
  isTeacher = true,
  onInstantCreateComplete,
  className,
}: HeroActionDeckProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduced = useReducedMotion() ?? false;

  // Instant meeting creation state
  const [creatingInstant, setCreatingInstant] = useState(false);
  const [instantError, setInstantError] = useState<string | null>(null);

  // Join by code state
  const [joinCode, setJoinCode] = useState("");
  const [joinFocused, setJoinFocused] = useState(false);

  const teacherLang = (user?.preferredLanguage ?? "en") as LanguageCode;

  const handleInstantMeeting = useCallback(async () => {
    setCreatingInstant(true);
    setInstantError(null);
    try {
      const titles = EDUCATIONAL_TITLES[teacherLang] || EDUCATIONAL_TITLES.en;
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];

      const result = await api.createMeeting({
        title: randomTitle,
        speakerLanguage: teacherLang,
        availableLanguages: ALL_LANGUAGE_CODES,
        participantPermissions: {
          canUnmute: true,
          canShareScreen: true,
          canChat: true,
        },
        captionsEnabledByDefault: true,
        voiceEnabledByDefault: true,
      });

      storeRecentMeeting({
        code: result.meeting.code,
        title: result.meeting.title,
        joinedAt: new Date().toISOString(),
      });

      if (onInstantCreateComplete) {
        onInstantCreateComplete(result.meeting.code);
      }

      // Mandatory requirement: navigate('/meet/' + meeting.code) on completion
      navigate(`/meet/${result.meeting.code}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setInstantError(err.message);
      } else {
        setInstantError("Could not start instant meeting. Please verify server connectivity.");
      }
    } finally {
      setCreatingInstant(false);
    }
  }, [teacherLang, navigate, onInstantCreateComplete]);

  const handleJoinByCode = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length === 6) {
      navigate(`/meet/${code}`);
    }
  }, [joinCode, navigate]);

  const handleCodeKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && joinCode.trim().length === 6) {
        e.preventDefault();
        handleJoinByCode();
      }
    },
    [joinCode, handleJoinByCode],
  );

  return (
    <div className={clsx("space-y-3", className)}>
      {instantError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{instantError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Instant 1-Click Meeting */}
        <motion.div
          whileHover={reduced ? undefined : { y: -2, transition: SPRINGS.card }}
          className={clsx(
            "relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6",
            "border border-accent-400/40 bg-gradient-to-br from-ink-800/90 via-ink-850/85 to-ink-900/90",
            "backdrop-blur-xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
            "transition-colors duration-200 hover:border-accent-400/70",
          )}
        >
          {/* Subtle Ambient Emerald Glow */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-400/15 blur-3xl" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300/40 bg-accent-300/15 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-accent-300">
                <Zap className="h-3 w-3 fill-current" />
                <span>Instant 1-Click Meeting</span>
              </span>
              <span className="font-mono text-3xs uppercase tracking-widest text-ivory-400">
                Auto-Launch
              </span>
            </div>

            <h3 className="mt-3.5 font-display text-lg font-bold text-ivory-50 tracking-tight">
              Start Teaching Immediately
            </h3>
            <p className="mt-1 text-xs text-ivory-300 leading-relaxed">
              Instantly provisions a live multilingual classroom with lecture title in your preferred language and navigates directly to stage.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-ink-650/80">
            <Button
              size="md"
              variant="primary"
              loading={creatingInstant}
              onClick={handleInstantMeeting}
              className="w-full text-xs font-semibold shadow-[0_4px_20px_-4px_rgba(50,185,138,0.4)]"
              icon={<Sparkles className="h-4 w-4" />}
            >
              {creatingInstant ? "Provisioning Classroom…" : "Launch Instant Meeting"}
            </Button>
          </div>
        </motion.div>

        {/* Card 2: Join by Code */}
        <motion.div
          whileHover={reduced ? undefined : { y: -2, transition: SPRINGS.card }}
          className={clsx(
            "relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6",
            "border border-ink-600/80 bg-ink-800/60 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.035)]",
            "transition-colors duration-200 hover:border-accent-400/50",
          )}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-600/80 bg-ink-750/70 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-ivory-300">
                <KeyRound className="h-3 w-3 text-accent-300" />
                <span>Join by Code</span>
              </span>
              <span
                className={clsx(
                  "font-mono text-3xs font-semibold transition-colors",
                  joinCode.length === 6 ? "text-accent-300" : "text-ivory-400",
                )}
              >
                {joinCode.length} / 6
              </span>
            </div>

            <h3 className="mt-3.5 font-display text-lg font-bold text-ivory-50 tracking-tight">
              Enter Classroom
            </h3>
            <p className="mt-1 text-xs text-ivory-300 leading-relaxed">
              Enter the 6-character room code to join an ongoing session with live captions and neural audio.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-ink-650/80 space-y-2.5">
            <div
              className={clsx(
                "relative flex items-center rounded-xl border bg-ink-900/90 transition-all duration-200",
                joinFocused || joinCode.length === 6
                  ? "border-accent-400 shadow-[0_0_16px_rgba(120,169,139,0.22)]"
                  : "border-ink-600/90 hover:border-ink-500",
              )}
            >
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onFocus={() => setJoinFocused(true)}
                onBlur={() => setJoinFocused(false)}
                onChange={(e) =>
                  setJoinCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6),
                  )
                }
                onKeyDown={handleCodeKeyDown}
                placeholder="ABC123"
                aria-label="6-character meeting code"
                className="h-10 w-full bg-transparent px-3 text-center font-mono text-sm font-bold uppercase tracking-[0.3em] text-ivory-50 placeholder:text-ivory-400/40 focus:outline-none"
              />
            </div>

            <Button
              size="sm"
              variant="secondary"
              disabled={joinCode.trim().length !== 6}
              onClick={handleJoinByCode}
              className="w-full text-xs font-semibold"
              icon={<Radio className="h-3.5 w-3.5 text-accent-300" />}
            >
              Enter Room &rarr;
            </Button>
          </div>
        </motion.div>

        {/* Card 3: Open Demo */}
        <motion.div
          whileHover={reduced ? undefined : { y: -2, transition: SPRINGS.card }}
          className={clsx(
            "relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6",
            "border border-ink-600/80 bg-ink-800/60 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.035)]",
            "transition-colors duration-200 hover:border-accent-400/50",
            "md:col-span-2 lg:col-span-1",
          )}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-400/30 bg-sage-400/15 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-sage-400">
                <Play className="h-3 w-3 fill-current" />
                <span>Open Demo</span>
              </span>
              <span className="font-mono text-3xs uppercase tracking-widest text-ivory-400">
                Interactive
              </span>
            </div>

            <h3 className="mt-3.5 font-display text-lg font-bold text-ivory-50 tracking-tight">
              Interactive Demo Room
            </h3>
            <p className="mt-1 text-xs text-ivory-300 leading-relaxed">
              Experience the virtual classroom sandbox with simulated peers, multilingual audio synthesis, and terminology popovers.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-ink-650/80">
            <Button
              size="md"
              variant="secondary"
              onClick={() => navigate("/demo/room")}
              className="w-full text-xs font-semibold hover:border-sage-400/50 hover:text-ivory-50"
              icon={<ArrowRight className="h-4 w-4 text-sage-400" />}
            >
              Launch Demo Sandbox
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
