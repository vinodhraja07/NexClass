import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { AudioLines, Boxes, CircleAlert, ChevronRight } from "lucide-react";

/**
 * The demo hub: two separate demo pages, one concept each.
 *
 * 1. Captions + voice translation (the live classroom experience).
 * 2. 3D shared-room label translation (one object, every language).
 */
export default function DemoIndex() {
  const reduced = useReducedMotion() ?? false;

  const demos = [
    {
      to: "/demo/captions",
      index: "Demo 1",
      icon: AudioLines,
      title: "Caption & voice translation",
      body: "A prepared lecture plays while simulated students follow in Hindi, Tamil, Bengali, Marathi and Odia. Pick your own caption and voice language and hear the translated voice for every language, synthesized by the keyless fallback voice.",
      points: [
        "Per-student caption isolation - only your view changes",
        "Real synthesized voice in every language the fallback engine supports - Odia reports honestly when no voice exists",
        "Terminology protection keeps words like torque intact",
      ],
    },
    {
      to: "/demo/room",
      index: "Demo 2",
      icon: Boxes,
      title: "3D shared-room labels",
      body: "The teacher highlights one object for the whole room. Every participant sees the same geometry, but each card renders the object name, instructions, control buttons and units entirely in that student's own language.",
      points: [
        "Host-only switching, enforced the same way as live rooms",
        "Six synchronized views, one per language",
        "Hand-authored labels - nothing is machine mistranslated",
      ],
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-signal-warn/15 px-2.5 py-1 text-2xs font-semibold text-signal-warn">
            <span className="inline-flex items-center gap-1.5">
              <CircleAlert className="h-3 w-3" aria-hidden="true" />
              Demo mode - simulated
            </span>
          </span>
          <h1 className="text-2xl font-semibold text-ivory-50">Choose a demo</h1>
        </div>
      </header>

      <p className="max-w-2xl text-sm leading-relaxed text-ivory-300">
        Each demo isolates one part of the multilingual classroom so it can be evaluated on its own. Both run on
        prepared, hand-authored content without any external API key.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {demos.map((demo, position) => {
          const Icon = demo.icon;
          return (
            <motion.div
              key={demo.to}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={
                reduced
                  ? {}
                  : {
                      y: -5,
                      borderColor: "rgba(46,224,168,0.45)",
                      boxShadow: "0 24px 48px -18px rgba(0,0,0,0.85), 0 0 24px rgba(46,224,168,0.14)",
                    }
              }
              transition={
                reduced ? { duration: 0 } : { duration: 0.35, delay: position * 0.1, ease: [0.2, 0.8, 0.2, 1] }
              }
              className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/80 p-6 backdrop-blur transition-all duration-300"
            >
              {/* Subtle card glow on hover */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent-400/8 blur-3xl transition-all duration-500 group-hover:bg-accent-400/18" />

              <span className="nc-eyebrow flex items-center gap-1.5 text-accent-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-400/12 text-accent-300 transition-colors group-hover:bg-accent-400/20">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {demo.index}
              </span>
              <h2 className="mt-3 font-display text-lg font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                {demo.title}
              </h2>
              <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-ivory-300">{demo.body}</p>
              <ul className="mt-4 space-y-1.5">
                {demo.points.map((point) => (
                  <li key={point} className="flex items-start gap-1.5 text-2xs text-ivory-400">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent-400" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={demo.to}
                className="nc-focus mt-5 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent-400 px-5 text-[13.5px] font-semibold text-ink-900 transition-all duration-200 hover:bg-accent-300 shadow-md shadow-accent-400/20 active:scale-[0.98]"
              >
                Open {demo.index.toLowerCase()}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
