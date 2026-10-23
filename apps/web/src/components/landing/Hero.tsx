import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Container, Eyebrow } from "./Primitives";
import { ClassroomMock } from "./ClassroomMock";

const FACTS = [
  "One live meeting room",
  "Captions in 6 languages",
  "Original transcript never overwritten",
];

export function Hero() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [joinCode, setJoinCode] = useState("");

  const fade = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.25 : 0.7, delay: reduce ? 0 : delay, ease: [0.2, 0.8, 0.2, 1] as const },
  });

  return (
    <div id="top" className="relative overflow-hidden">
      {/* Animated kinetic background glow orbs */}
      <motion.div
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.22, 0.96, 1],
                x: ["-50%", "-47%", "-53%", "-50%"],
                y: [0, -20, 10, 0],
                opacity: [0.22, 0.35, 0.25, 0.22],
              }
        }
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-36 left-1/2 w-[760px] h-[450px] bg-gradient-to-tr from-accent-400/25 via-lime-400/18 to-teal-500/10 blur-[130px] rounded-full"
        aria-hidden="true"
      />
      <motion.div
        animate={
          reduce
            ? undefined
            : {
                scale: [0.95, 1.15, 0.95],
                x: [0, 30, -20, 0],
                y: [0, 25, -15, 0],
                opacity: [0.12, 0.28, 0.12],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="pointer-events-none absolute top-36 -right-20 w-[450px] h-[450px] bg-gradient-to-bl from-accent-500/18 via-lime-400/12 to-transparent blur-[120px] rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-mesh-dark opacity-75"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-grid-fade"
        aria-hidden="true"
      />

      <Container className="relative pt-2 pb-16 sm:pt-4 lg:pt-5 lg:pb-24">
        <div className="max-w-[860px]">
          <motion.div {...fade(0)}>
            <Eyebrow>Live multilingual classroom</Eyebrow>
          </motion.div>

          <motion.h1
            {...fade(0.06)}
            className="mt-3.5 text-balance font-display text-[38px] leading-[1.03] font-semibold tracking-[-0.035em] text-ivory-50 sm:text-[54px] lg:text-[68px]"
          >
            One teacher.
            <br />
            One live classroom.
            <br />
            <span className="bg-gradient-to-r from-accent-300 via-lime-300 to-accent-400 bg-clip-text text-transparent">
              Every student in their own language.
            </span>
          </motion.h1>

          <motion.p
            {...fade(0.12)}
            className="mt-5 max-w-[640px] text-balance text-[16px] leading-relaxed text-ivory-300 sm:text-[18px]"
          >
            NexClass is a real-time meeting room where live speech becomes captions
            and a translated voice in the language each participant picks — English,
            Tamil, Hindi, Bengali, Marathi or Odia. The teacher&apos;s original
            transcript is kept exactly as spoken.
          </motion.p>

          {/* Quick Launch & Join Deck - Makes handling the app effortless */}
          <motion.div
            {...fade(0.18)}
            className="mt-7 rounded-2xl border border-ink-600/90 bg-ink-850/85 p-4 sm:p-5 backdrop-blur-xl shadow-panel max-w-[660px]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="hero-quick-join"
                  className="block text-2xs font-semibold uppercase tracking-wider text-accent-300"
                >
                  Join a Live Class (No Account Required)
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="hero-quick-join"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-char code (e.g. 7KQ2MD)"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && joinCode.trim().length === 6) {
                        navigate(`/join?code=${joinCode.trim()}`);
                      }
                    }}
                    className="nc-focus h-11 w-full rounded-xl border border-ink-600 bg-ink-900/90 px-3.5 font-mono text-[15px] font-semibold tracking-wider text-ivory-50 placeholder:text-ivory-400/40 transition-colors focus:border-accent-400"
                  />
                  <Button
                    size="md"
                    disabled={joinCode.trim().length !== 6}
                    onClick={() => navigate(`/join?code=${joinCode.trim()}`)}
                    trailing={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  >
                    Join
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-ink-700/60 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-2xs text-ivory-400">Want to host or explore?</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/demo")}
                  icon={<Play className="h-3.5 w-3.5" aria-hidden="true" />}
                >
                  Try Interactive Demo
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/dashboard")}
                  trailing={<Radio className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />}
                >
                  Create a Classroom
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div {...fade(0.24)} className="mt-8">
            <ul className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
              {FACTS.map((fact, index) => (
                <li key={fact} className="flex items-center gap-2.5">
                  {index > 0 ? (
                    <span className="hidden h-3 w-px bg-ink-600 sm:block" aria-hidden="true" />
                  ) : null}
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" aria-hidden="true" />
                  <span className="text-[13px] text-ivory-300">{fact}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3.5 flex items-start gap-2 text-[12.5px] leading-relaxed text-ivory-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400/80" aria-hidden="true" />
              <span>
                Live rooms translate the teacher as they speak. Technical terms such as
                torque and eigenvalue are locked before translation so they survive intact.
              </span>
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.3 : 0.9, delay: reduce ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-10 lg:mt-14"
        >
          <ClassroomMock />
        </motion.div>
      </Container>
    </div>
  );
}
