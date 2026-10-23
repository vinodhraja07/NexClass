import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
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

  const fade = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.25 : 0.7, delay: reduce ? 0 : delay, ease: [0.2, 0.8, 0.2, 1] as const },
  });

  return (
    <div id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-mesh-dark opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-grid-fade"
        aria-hidden="true"
      />

      <Container className="relative pt-16 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
        <div className="max-w-[860px]">
          <motion.div {...fade(0)}>
            <Eyebrow>Live multilingual classroom</Eyebrow>
          </motion.div>

          <motion.h1
            {...fade(0.06)}
            className="mt-6 text-balance font-display text-[38px] leading-[1.03] font-semibold tracking-[-0.035em] text-ivory-50 sm:text-[54px] lg:text-[68px]"
          >
            One teacher.
            <br />
            One live classroom.
            <br />
            <span className="text-accent-300">Every student in their own language.</span>
          </motion.h1>

          <motion.p
            {...fade(0.12)}
            className="mt-7 max-w-[640px] text-balance text-[16px] leading-relaxed text-ivory-300 sm:text-[18px]"
          >
            NexClass is a real-time meeting room where live speech becomes captions
            and a translated voice in the language each participant picks — English,
            Tamil, Hindi, Bengali, Marathi or Odia. The teacher&apos;s original
            transcript is kept exactly as spoken.
          </motion.p>

          <motion.div {...fade(0.18)} className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/demo")}
              icon={<Play className="h-4 w-4" aria-hidden="true" />}
            >
              Try the interactive demo
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/register")}
              trailing={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Create a classroom
            </Button>
          </motion.div>

          <motion.div {...fade(0.24)} className="mt-10">
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
            <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-ivory-400">
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
          className="mt-14 lg:mt-20"
        >
          <ClassroomMock />
        </motion.div>
      </Container>
    </div>
  );
}
