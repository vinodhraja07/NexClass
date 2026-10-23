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
      <header className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-signal-warn/15 px-2.5 py-1 text-2xs font-semibold text-signal-warn">
          <span className="inline-flex items-center gap-1.5">
            <CircleAlert className="h-3 w-3" aria-hidden="true" />
            Demo mode - simulated
          </span>
        </span>
        <h1 className="text-2xl font-semibold text-ivory-50">Choose a demo</h1>
      </header>

      <p className="max-w-2xl text-sm leading-relaxed text-ivory-300">
        Each demo isolates one part of the multilingual classroom so it can be evaluated on its own. Both run on
        prepared, hand-authored content without any external API key.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {demos.map((demo, position) => {
          const Icon = demo.icon;
          return (
            <motion.div
              key={demo.to}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.3, delay: position * 0.08, ease: [0.2, 0.8, 0.2, 1] }
              }
              className="flex min-h-[300px] flex-col rounded-2xl border border-ink-700 bg-ink-850/70 p-5 transition-colors hover:border-accent-400/40"
            >
              <span className="nc-eyebrow flex items-center gap-1.5 text-accent-300">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {demo.index}
              </span>
              <h2 className="mt-2 font-display text-lg font-semibold text-ivory-50">{demo.title}</h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ivory-300">{demo.body}</p>
              <ul className="mt-3 space-y-1">
                {demo.points.map((point) => (
                  <li key={point} className="flex items-start gap-1.5 text-2xs text-ivory-400">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent-400" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                to={demo.to}
                className="nc-focus mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent-400 px-4 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-accent-300"
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
