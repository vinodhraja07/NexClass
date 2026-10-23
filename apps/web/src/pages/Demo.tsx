import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  Play,
  Rocket,
  RotateCcw,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { DEMO_EXTRA_STUDENTS, DEMO_STUDENTS, languageNativeName } from "@nexclass/shared";
import { DemoTransport } from "@/lib/demoTransport";
import { ClassroomShell } from "@/components/classroom/ClassroomShell";
import { Button, Badge } from "@/components/ui";
import { meetingLanguagePool } from "@/components/classroom/languagePool";

/**
 * The interactive demo classroom (Demo 1: captions & voice translation).
 *
 * Runs on top of DemoTransport, evaluating the real product surface with
 * simulated multi-language students and keyless fallback voice synthesis.
 */
export default function Demo() {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const transport = useMemo(() => new DemoTransport(), []);
  const [playing, setPlaying] = useState(false);
  const [students, setStudents] = useState(transport.students.map((student) => student.id));
  const [studentLanguages, setStudentLanguages] = useState<Record<string, LanguageCode>>({});

  // Clean up transport on unmount
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
    const candidate = [...DEMO_STUDENTS, ...DEMO_EXTRA_STUDENTS].find(
      (student) => !transport.students.some((s) => s.id === student.id),
    );
    if (!candidate) return;
    transport.addStudent(candidate);
    setStudents(transport.students.map((s) => s.id));
  }, [transport]);

  const removeStudent = useCallback(
    (studentId: string) => {
      transport.removeStudent(studentId);
      setStudents(transport.students.map((s) => s.id));
    },
    [transport],
  );

  const canAddMoreStudents = useMemo(() => {
    return (
      students.length < 6 &&
      [...DEMO_STUDENTS, ...DEMO_EXTRA_STUDENTS].some(
        (candidate) => !students.includes(candidate.id),
      )
    );
  }, [students]);

  // Sync initial student languages
  useEffect(() => {
    const refresh: Record<string, LanguageCode> = {};
    transport.students.forEach((student) => {
      refresh[student.id] = student.preferredLanguage;
    });
    setStudentLanguages((current) => ({ ...current, ...refresh }));
  }, [transport, students.length]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-900 text-ivory-100">
      {/* demo overview banner */}
      <div className="border-b border-ink-700/70 bg-ink-850/60 px-3.5 py-2 sm:px-5">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-2.5">
          <Badge tone="warn">
            <CircleAlert className="h-3 w-3" aria-hidden="true" />
            Demo 1 - captions &amp; voice translation
          </Badge>

          <div className="flex items-center gap-2">
            {/* Prominent Direct Button to Demo 2 */}
            <Link
              to="/demo/room"
              className="nc-focus inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl bg-accent-400 px-3 text-xs font-semibold text-ink-900 transition-all hover:bg-accent-300 shadow-md shadow-accent-400/25 active:scale-95"
            >
              <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Directly Move to Demo 2</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>

            <Link
              to="/demo"
              className="nc-focus inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-ink-500 bg-ink-800/80 px-2.5 text-xs font-medium text-ivory-100 transition-colors hover:border-accent-400/50"
            >
              All demos
            </Link>
            <Link
              to="/register"
              className="nc-focus inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-ink-500 bg-ink-800/80 px-2.5 text-xs font-semibold text-ivory-100 transition-colors hover:border-accent-400/50"
            >
              <Rocket className="h-3 w-3" aria-hidden="true" />
              Create real classroom
            </Link>
          </div>
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
          icon={
            playing ? (
              <span className="flex items-center gap-0.5 h-3.5 mr-0.5" aria-hidden="true">
                {[0.4, 0.9, 1, 0.6].map((scale, i) => (
                  <motion.span
                    key={i}
                    animate={reduced ? {} : { scaleY: [0.25, scale, 0.25] }}
                    transition={{ repeat: Infinity, duration: 0.65 + i * 0.15, ease: "easeInOut" }}
                    className="w-0.5 h-3 rounded-full bg-accent-300 origin-bottom"
                  />
                ))}
              </span>
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )
          }
          className={
            playing
              ? clsx(
                  "border-accent-400/50 bg-accent-400/15 text-accent-200 shadow-sm shadow-accent-400/20",
                  !reduced && "animate-pulse",
                )
              : "shadow-md shadow-accent-400/25"
          }
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

        {/* Control Strip Next Demo Action */}
        <div className="ml-auto shrink-0 pl-2">
          <Link
            to="/demo/room"
            className="nc-focus inline-flex h-8 items-center gap-1.5 rounded-lg border border-accent-400/40 bg-accent-400/10 px-3 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-400/20"
          >
            <span>Demo 2 (3D Room)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* the classroom itself - the identical shell from the live room */}
      <div className="flex-1 min-h-0">
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
    </div>
  );
}
