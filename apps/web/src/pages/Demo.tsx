import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioLines, Camera, RotateCcw, Play, Pause, Rocket, Shapes, SignalHigh, UserPlus, UserMinus, CircleAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { DEMO_EXTRA_STUDENTS, DEMO_STUDENTS, languageNativeName } from "@nexclass/shared";
import { DemoTransport } from "@/lib/demoTransport";
import { ClassroomShell } from "@/components/classroom/ClassroomShell";
import { Button, Badge } from "@/components/ui";
import { meetingLanguagePool } from "@/components/classroom/languagePool";

/**
 * The interactive demo classroom.
 *
 * The exact same classroom components as the live room run on top of
 * DemoTransport, so what is being evaluated here is the real product surface -
 * not a mock-up.
 */
export default function Demo() {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const transport = useMemo(() => new DemoTransport(), []);
  const [playing, setPlaying] = useState(false);
  const [students, setStudents] = useState(transport.students.map((student) => student.id));
  const [studentLanguages, setStudentLanguages] = useState<Record<string, LanguageCode>>({});

  // The demo highlight the room starts with.
  useEffect(() => {
    return () => transport.disconnect();
  }, [transport]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaying(transport.playing);
      const ids = transport.students.map((student) => student.id);
      setStudents((current) => (current.join(",") === ids.join(",") ? current : ids));
    }, 700);
    return () => window.clearInterval(timer);
  }, [transport]);

  const togglePlayback = useCallback(() => {
    if (transport.playing) {
      transport.pausePlayback();
      setPlaying(false);
    } else {
      transport.startPlayback();
      setPlaying(true);
    }
  }, [transport]);

  const restart = useCallback(() => {
    transport.resetPlayback();
    transport.startPlayback();
    setPlaying(true);
  }, [transport]);

  const addStudent = useCallback(() => {
    // The five base students are in the room from the start, so new joiners
    // come from the extra pool until it is exhausted.
    const candidate = [...DEMO_STUDENTS, ...DEMO_EXTRA_STUDENTS].find(
      (student) => !transport.students.some((existing) => existing.id === student.id),
    );
    if (candidate) {
      transport.addStudent(candidate);
      setStudents(transport.students.map((student) => student.id));
    }
  }, [transport]);

  const removeStudent = useCallback((id: string) => {
    transport.removeStudent(id);
    setStudents(transport.students.map((student) => student.id));
  }, [transport]);

  // "Add student" has a finite pool of simulated learners; grey it out instead
  // of leaving a control that silently does nothing once everyone has joined.
  const canAddMoreStudents = useMemo(
    () =>
      [...DEMO_STUDENTS, ...DEMO_EXTRA_STUDENTS].some(
        (candidate) => !transport.students.some((existing) => existing.id === candidate.id),
      ),
    [transport, students.length],
  );

  useEffect(() => {
    const refresh: Record<string, LanguageCode> = {};
    transport.students.forEach((student) => {
      refresh[student.id] = student.preferredLanguage;
    });
    setStudentLanguages((current) => ({ ...current, ...refresh }));
  }, [transport, students.length]);

  return (
    <div className="flex min-h-full flex-col bg-ink-900 text-ivory-100">
      {/* demo overview banner */}
      <div className="border-b border-ink-700/70 bg-ink-850/60 px-3.5 py-3 sm:px-5">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-2.5">
          <Badge tone="warn">
            <CircleAlert className="h-3 w-3" aria-hidden="true" />
            Demo 1 - captions &amp; voice translation
          </Badge>
          <p className="min-w-0 flex-1 text-balance text-2xs leading-relaxed text-ivory-300">
            A prepared lecture with simulated students. Your captions and translated voice are separate from
            everyone else's. The keyless fallback voice on the API server synthesizes speech where the
            endpoint supports it; unavailable voices fall back to this browser and are reported honestly.
            Nothing else reaches the network.
          </p>
          <Link
            to="/demo"
            className="nc-focus inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-ink-500 bg-ink-800/80 px-3 text-[13px] font-medium text-ivory-100 transition-colors hover:border-accent-400/50"
          >
            All demos
          </Link>
          <Link
            to="/register"
            className="nc-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent-400 px-3 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-accent-300"
          >
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            Create a real classroom
          </Link>
          <Link
            to="/login"
            className="nc-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-ink-500 bg-ink-800/80 px-3 text-[13px] font-medium text-ivory-100 transition-colors hover:border-accent-400/50"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* demo control strip */}
      <div
        className="flex items-center gap-2 overflow-x-auto border-b border-ink-700/70 bg-ink-900/80 px-3.5 py-2.5 scrollbar-none sm:px-5"
        aria-label="Demo controls"
      >
        <Button
          size="sm"
          variant={playing ? "secondary" : "primary"}
          icon={playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={togglePlayback}
        >
          {playing ? "Pause lecture" : "Play lecture"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={restart}
        >
          Restart
        </Button>
        <span className="mx-0.5 hidden h-6 w-px bg-ink-600 sm:block" aria-hidden="true" />
        <Button
          size="sm"
          variant="secondary"
          icon={<UserPlus className="h-3.5 w-3.5" aria-hidden="true" />}
          disabled={!canAddMoreStudents}
          onClick={addStudent}
        >
          {canAddMoreStudents ? "Add student" : "Room full"}
        </Button>
        <span className="mx-0.5 hidden h-6 w-px bg-ink-600 sm:block" aria-hidden="true" />

        {/* Students own their language choice. These pills simulate each
            learner switching her own caption and voice language, so the host
            never overrides a student's language. */}
        {transport.students.map((student) => {
          const languages = meetingLanguagePool(
            transport.meeting.availableLanguages,
            studentLanguages[student.id] ?? student.preferredLanguage,
          );
          return (
            <label
              key={student.id}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800/70 px-2 py-1 text-2xs text-ivory-200"
            >
              <span className="font-medium">{student.displayName.split(" ")[0]} switches</span>
              <select
                value={studentLanguages[student.id] ?? student.preferredLanguage}
                onChange={(event) => {
                  const language = event.target.value as LanguageCode;
                  transport.setStudentLanguage(student.id, language);
                  setStudentLanguages((current) => ({ ...current, [student.id]: language }));
                }}
                aria-label={`Simulate ${student.displayName} switching her own caption and voice language`}
                className="nc-focus max-w-[110px] rounded bg-ink-900 px-1 py-0.5 text-2xs text-ivory-50"
              >
                {languages.map((language) => (
                  <option key={language} value={language} lang={language}>
                    {languageNativeName(language)}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        {students.length > 2 ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<UserMinus className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => {
              const last = students[students.length - 1];
              if (last) removeStudent(last);
            }}
          >
            Remove latest
          </Button>
        ) : null}
      </div>

      {/* the classroom itself - the identical shell from the live room */}
      <div className="min-h-[75vh] flex-1 xl:h-[82vh]">
    <ClassroomShell
      transport={transport}
      simulated
      meetingCode="DEMO01"
      name={transport.self.displayName}
      language={transport.self.preferredLanguage}
      voiceActive={playing}
      onLeft={() => navigate("/")}
    />
      </div>

      {/* explainer */}
      <section className="border-t border-ink-700/70 bg-ink-850/50 px-3.5 py-6 sm:px-5">
        <div className="mx-auto w-full max-w-[1400px]">
          <h2 className="font-display text-lg font-semibold text-ivory-50">
            How this demo works
          </h2>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: AudioLines,
                title: "Prepared samples",
                body: "The lecture segments are recorded ahead of time in this repository, together with hand-authored translations for each language.",
              },
              {
                icon: Shapes,
                title: "Simulated students",
                body: "Every additional participant is generated locally and switches languages on demand, so per-participant independence is easy to verify.",
              },
              {
                icon: SignalHigh,
                title: "Real fallback voice",
                body: "Translated voice is synthesized by the API server's keyless fallback voice in the languages that endpoint supports; when no synthesizer exists (Odia) the browser voice is tried and a clear error is reported instead of fake audio.",
              },
              {
                icon: Camera,
                title: "No fake server",
                body: "The interface calls the very same transport contract the live classroom uses - socket events, participant rows, caption segments.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.title}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={
                    reduced ? { duration: 0 } : { duration: 0.3, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }
                  }
                  className="rounded-xl border border-ink-700 bg-ink-900/50 p-3.5"
                >
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-ivory-50">
                    <Icon className="h-4 w-4 text-accent-300" aria-hidden="true" />
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-2xs leading-relaxed text-ivory-300">{item.body}</p>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
