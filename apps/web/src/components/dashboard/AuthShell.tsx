import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";

export interface StoryPoint {
  icon: ReactNode;
  title: string;
  body: string;
}

export interface AuthShellProps {
  eyebrow: string;
  headline: string;
  description: string;
  points?: StoryPoint[];
  stage?: ReactNode;
  children: ReactNode;
}

/**
 * Two column shell for the authentication pages: the product story on the
 * left, the form card on the right. On small screens the form comes first.
 */
export function AuthShell({
  eyebrow,
  headline,
  description,
  points = [],
  stage,
  children,
}: AuthShellProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-900">
      <div
        className="pointer-events-none absolute inset-0 bg-mesh-dark opacity-80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 nc-grain opacity-60"
        aria-hidden="true"
      />

      <header className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="nc-focus inline-flex items-center gap-2.5 rounded-lg text-ivory-50"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400/15 text-accent-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">NexClass</span>
        </Link>
        <Link
          to="/"
          className="nc-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ivory-400 transition-colors hover:text-ivory-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to home
        </Link>
      </header>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row">
        <section
          aria-label="About NexClass"
          className="order-2 flex flex-col justify-center gap-8 px-5 pb-14 pt-4 sm:px-8 lg:order-1 lg:w-[52%] lg:py-14 xl:px-14"
        >
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <p className="nc-eyebrow">{eyebrow}</p>
            <p className="mt-3 max-w-xl text-balance font-display text-[30px] font-semibold leading-[1.15] text-ivory-50 sm:text-[38px]">
              {headline}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-400">{description}</p>
          </motion.div>

          {stage ? (
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.5, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }
              }
              className="max-w-xl"
            >
              {stage}
            </motion.div>
          ) : null}

          {points.length > 0 ? (
            <ul className="grid max-w-xl gap-3 sm:grid-cols-3">
              {points.map((point, index) => (
                <motion.li
                  key={point.title}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.4, delay: 0.14 + index * 0.06, ease: [0.2, 0.8, 0.2, 1] }
                  }
                  className="rounded-xl border border-ink-700/70 bg-ink-850/70 p-3.5"
                >
                  <span className="text-accent-300">{point.icon}</span>
                  <p className="mt-2.5 text-[13px] font-semibold text-ivory-100">{point.title}</p>
                  <p className="mt-1 text-2xs leading-relaxed text-ivory-400">{point.body}</p>
                </motion.li>
              ))}
            </ul>
          ) : null}
        </section>

        <main className="order-1 flex items-center justify-center px-5 py-6 sm:px-8 lg:order-2 lg:w-[48%] lg:py-14">
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-[440px]"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
