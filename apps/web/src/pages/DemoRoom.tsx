import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Boxes, Info, Monitor, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { motion } from "motion/react";
import {
  DEMO_STUDENTS,
  SHARED_RESOURCES,
  languageName,
  languageNativeName,
  translateUi,
  type LanguageCode,
} from "@nexclass/shared";
import { DemoObjectStage, type ObjectStageLabels } from "@/components/demo/DemoObjectStage";
import { Avatar } from "@/components/classroom/Avatar";

const TEACHER = { id: "demo-teacher", name: "Dr. Meera Krishnan (teacher, English)" };

/**
 * The 3D shared-room label demo.
 *
 * The teacher chooses one object for the whole room (host control). Every
 * simulated participant then reads the same object - its name, instructions,
 * control buttons and measurement units - entirely in their own language.
 * The object geometry stays identical for everyone; only the words change.
 */
export default function DemoRoom() {
  const [resourceId, setResourceId] = useState(SHARED_RESOURCES[0].id);

  const audience = useMemo(() => {
    const teacher = { id: TEACHER.id, name: TEACHER.name, language: "en" as LanguageCode, self: true };
    const students = DEMO_STUDENTS.map((student) => ({
      id: student.id,
      name: student.name,
      language: student.language,
      self: false,
    }));
    return [teacher, ...students];
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="nc-eyebrow flex items-center gap-1.5 text-accent-300 text-sm font-semibold">
          <Boxes className="h-4 w-4" aria-hidden="true" />
          Demo 2 - 3D shared room labels
        </span>
        <div className="flex items-center gap-2">
          <Link
            to="/demo/captions"
            className="nc-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-accent-400/50 bg-gradient-to-r from-accent-400/15 to-emerald-400/15 px-3.5 text-[13px] font-semibold text-accent-300 shadow-sm shadow-accent-400/20 hover:bg-accent-400/25 hover:shadow-accent-400/35 transition-all active:scale-95"
          >
            ← Demo 1 (Captions &amp; Audio)
          </Link>
          <Link
            to="/demo"
            className="nc-focus inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-ink-600/80 bg-gradient-to-b from-ink-800/90 to-ink-900/95 px-3.5 text-[13px] font-medium text-ivory-100 hover:border-accent-400/50 hover:bg-ink-750 hover:text-white shadow-sm hover:shadow-[0_0_15px_rgba(46,224,168,0.15)] transition-all active:scale-95"
          >
            All demos
          </Link>
        </div>
      </header>

      <section
        aria-label="Teacher console"
        className="rounded-2xl border border-accent-400/25 bg-accent-400/5 p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="nc-eyebrow flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
            Teacher console - only the host changes the object
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Choose the shared object"
          className="mt-2.5 inline-flex flex-wrap items-center gap-1 rounded-xl border border-ink-600 bg-ink-900/60 p-1"
        >
          {SHARED_RESOURCES.map((resource) => {
            const selected = resource.id === resourceId;
            return (
              <button
                key={resource.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setResourceId(resource.id)}
                className={clsx(
                  "nc-focus relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  selected ? "text-ink-900" : "text-ivory-300 hover:text-ivory-50",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="sharedResourceActivePill"
                    className="absolute inset-0 rounded-lg bg-accent-400 shadow-sm shadow-accent-400/25"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{translateUi(resource.labelKey, "en")}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-2xs leading-relaxed text-ivory-400">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Switching the object updates every participant card below instantly - in each student's own language.
        </p>
      </section>

      <p className="nc-eyebrow flex items-center gap-1.5">
        <Monitor className="h-3.5 w-3.5 text-ivory-400" aria-hidden="true" />
        Same object, every participant
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {audience.map((member) => {
          const resource = SHARED_RESOURCES.find((item) => item.id === resourceId) ?? SHARED_RESOURCES[0];
          const bundle = {
            object: translateUi(resource.labelKey, member.language),
            instructions: translateUi(resource.descriptionKey, member.language),
            stage: labelsForLanguage(member.language),
          };
          return (
            <motion.div
              key={member.id}
              layout
              className={clsx(
                "rounded-2xl border bg-ink-850/70 p-3.5",
                member.self ? "border-accent-400/40" : "border-ink-700",
              )}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <Avatar name={member.name} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ivory-50">{member.name}</p>
                  <p className="truncate text-2xs text-ivory-400">
                    {languageNativeName(member.language)} ({languageName(member.language)})
                  </p>
                </div>
                {member.self ? (
                  <span className="rounded bg-accent-400/12 px-1.5 py-0.5 text-2xs font-medium text-accent-200">
                    Teacher
                  </span>
                ) : null}
              </div>
              <p lang={member.language} className="mb-0.5 text-sm font-semibold text-ivory-100">
                {bundle.object}
              </p>
              <p lang={member.language} className="mb-2.5 text-2xs leading-relaxed text-ivory-400">
                {bundle.instructions}
              </p>
              <DemoObjectStage
                labels={bundle.stage}
                variant={resource.id as "rotating-body" | "matrix-board" | "pendulum" | "spring"}
                language={member.language}
              />
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}

function labelsForLanguage(language: LanguageCode): ObjectStageLabels {
  return {
    rotate: translateUi("room.controls.rotate", language),
    reset: translateUi("room.controls.reset", language),
    measure: translateUi("room.controls.measure", language),
    vectors: translateUi("room.controls.vectors", language),
    angle: translateUi("room.unit.angle", language),
    degrees: translateUi("room.unit.degrees", language),
    newton: translateUi("room.unit.newton", language),
  };
}
