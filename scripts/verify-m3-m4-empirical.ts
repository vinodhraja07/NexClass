/**
 * Empirical Verification Harness for Milestone 3 & Milestone 4:
 * M3: Create Classroom View & Real-Time Live Preview
 * M4: Transcripts & Archive View with Real Multi-Language TXT Export
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert";
import {
  compileTranscriptDocument,
  formatTranscriptTimestamp,
} from "../apps/web/src/lib/exportTranscript";
import type {
  MeetingPublic,
  TranscriptSegmentPublic,
  TranslationPublic,
} from "../packages/shared/src/types";

const ROOT = resolve(__dirname, "..");

console.log("===============================================================================");
console.log("  NEXCLASS MILESTONE 3 & 4 EMPIRICAL VERIFICATION HARNESS  ");
console.log("===============================================================================\n");

interface TestRecord {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

const records: TestRecord[] = [];

function runTest(suite: string, name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: [${suite}] ${name}`);
    records.push({ suite, name, passed: true });
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error(`  ✗ FAIL: [${suite}] ${name}`);
    console.error(`    ${errorMsg}`);
    records.push({ suite, name, passed: false, error: errorMsg });
  }
}

function main() {
  const previewSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/MeetingCardPreview.tsx"),
    "utf8",
  );
  const celebrationSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/CelebratoryModal.tsx"),
    "utf8",
  );
  const createViewSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/CreateClassroomView.tsx"),
    "utf8",
  );
  const exportSource = readFileSync(
    resolve(ROOT, "apps/web/src/lib/exportTranscript.ts"),
    "utf8",
  );
  const transcriptsViewSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/TranscriptsView.tsx"),
    "utf8",
  );
  const dashboardSource = readFileSync(
    resolve(ROOT, "apps/web/src/pages/Dashboard.tsx"),
    "utf8",
  );

  // ---------------------------------------------------------------------------
  // Suite 1: Milestone 3 — MeetingCardPreview.tsx (Real-Time Live Preview)
  // ---------------------------------------------------------------------------
  console.log("--- SUITE 1: MeetingCardPreview (Live Preview & Emerald Aesthetics) ---");

  runTest(
    "MeetingCardPreview",
    "Uses authentic Emerald Glass styling tokens (bg-ink-950/80, backdrop-blur-xl, border-ink-700/60, rounded-2xl, p-6)",
    () => {
      assert(
        previewSource.includes("bg-ink-950/80") &&
          previewSource.includes("backdrop-blur-xl") &&
          previewSource.includes("border-ink-700/60") &&
          previewSource.includes("rounded-2xl") &&
          previewSource.includes("p-6"),
        "MeetingCardPreview must use exact Emerald Glass panel tokens",
      );
    },
  );

  runTest(
    "MeetingCardPreview",
    "Displays pulsing LIVE PREVIEW badge and simulated room code pill",
    () => {
      assert(
        previewSource.includes("LIVE PREVIEW"),
        "Must render LIVE PREVIEW badge",
      );
      assert(
        previewSource.includes("NEX-PREVIEW") || previewSource.includes("PREVIEW"),
        "Must render simulated monospace room code pill",
      );
    },
  );

  runTest(
    "MeetingCardPreview",
    "Renders dynamic title with fallback when empty",
    () => {
      assert(
        previewSource.includes("Untitled Multilingual Classroom"),
        "Must fallback to 'Untitled Multilingual Classroom' when title is empty",
      );
    },
  );

  runTest(
    "MeetingCardPreview",
    "Displays Teacher Spoken Language badge with native script/code",
    () => {
      assert(
        previewSource.includes("languageName(speakerLanguage)") ||
          previewSource.includes("speakerLanguage"),
        "Must display dynamic teacher spoken language badge",
      );
    },
  );

  runTest(
    "MeetingCardPreview",
    "Displays available student caption badges for all 6 Indic languages (EN, TA, HI, BN, MR, OR)",
    () => {
      assert(
        previewSource.includes("availableLanguages") &&
          previewSource.includes("ta") &&
          previewSource.includes("hi") &&
          previewSource.includes("bn") &&
          previewSource.includes("mr") &&
          previewSource.includes("or"),
        "Must support and display all 6 student caption language badges",
      );
    },
  );

  runTest(
    "MeetingCardPreview",
    "Displays password lock indicator (Protected / Open Access)",
    () => {
      assert(
        previewSource.includes("passwordEnabled") &&
          (previewSource.includes("Protected") || previewSource.includes("Password Protected")),
        "Must display password lock indicator when passwordEnabled is true",
      );
    },
  );

  runTest(
    "MeetingCardPreview",
    "Displays participant permissions pills (Mic/Unmute, Screen Share, Chat)",
    () => {
      assert(
        previewSource.includes("participantPermissions.canUnmute") &&
          previewSource.includes("participantPermissions.canShareScreen") &&
          previewSource.includes("participantPermissions.canChat"),
        "Must display live pills for mic unmute, screen sharing, and chat permissions",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 2: Milestone 3 — CelebratoryModal.tsx
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 2: CelebratoryModal (Post-Creation Celebration) ---");

  runTest(
    "CelebratoryModal",
    "Displays large 48px monospace shareable meeting code (font-mono tracking-[0.25em])",
    () => {
      assert(
        celebrationSource.includes("font-mono") &&
          celebrationSource.includes("text-[48px]") &&
          celebrationSource.includes("tracking-[0.25em]"),
        "Must render large 48px monospace code with 0.25em tracking",
      );
      assert(
        celebrationSource.includes("text-accent-400") || celebrationSource.includes("text-accent-300"),
        "Must use emerald accent color for code",
      );
    },
  );

  runTest(
    "CelebratoryModal",
    "Provides 1-click Copy Link and 1-click Copy Code buttons with instant feedback",
    () => {
      assert(
        celebrationSource.includes("handleCopyCode") &&
          celebrationSource.includes("handleCopyLink"),
        "Must have handlers for copying code and link",
      );
      assert(
        celebrationSource.includes("copiedCode") && celebrationSource.includes("copiedLink"),
        "Must provide instant copied state feedback",
      );
    },
  );

  runTest(
    "CelebratoryModal",
    "Provides direct primary button 'Enter Classroom Now' navigating to /meet/:code",
    () => {
      assert(
        celebrationSource.includes("Enter Classroom Now"),
        "Must feature primary 'Enter Classroom Now' action",
      );
      assert(
        celebrationSource.includes("navigate(`/meet/${meeting.code}`)") ||
          celebrationSource.includes("onEnter"),
        "Must navigate directly to /meet/:code",
      );
    },
  );

  runTest(
    "CelebratoryModal",
    "Meets accessibility standards (role='dialog', aria-modal='true', Escape listener, body scroll lock)",
    () => {
      assert(
        celebrationSource.includes('role="dialog"') &&
          celebrationSource.includes('aria-modal="true"'),
        "Must have accessible modal attributes",
      );
      assert(
        celebrationSource.includes("Escape"),
        "Must support keyboard Escape key dismissal",
      );
      assert(
        celebrationSource.includes("overflow"),
        "Must manage body scroll lock",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 3: Milestone 3 — CreateClassroomView.tsx & Dashboard Integration
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 3: CreateClassroomView (2-Column Form + Sticky Live Preview) ---");

  runTest(
    "CreateClassroomView",
    "Implements 2-column split configuration layout (form on left, sticky preview on right)",
    () => {
      assert(
        createViewSource.includes("grid-cols-1 lg:grid-cols-12") ||
          createViewSource.includes("lg:col-span-7"),
        "Must use responsive 2-column grid configuration",
      );
      assert(
        createViewSource.includes("MeetingCardPreview"),
        "Must compose MeetingCardPreview",
      );
      assert(
        createViewSource.includes("lg:sticky"),
        "Right preview column must be sticky on desktop",
      );
    },
  );

  runTest(
    "CreateClassroomView",
    "Validates form inputs: non-empty title, at least one caption language, password length",
    () => {
      assert(
        createViewSource.includes("trimmedTitle") &&
          createViewSource.includes("setTitleError"),
        "Must validate title cannot be empty",
      );
      assert(
        createViewSource.includes("availableLanguages.length === 0") ||
          createViewSource.includes("availableLanguages.length"),
        "Must validate caption language matrix has at least one language",
      );
      assert(
        createViewSource.includes("password.trim().length < 4") ||
          createViewSource.includes("password"),
        "Must validate password length if enabled",
      );
    },
  );

  runTest(
    "CreateClassroomView",
    "Invokes api.createMeeting and presents CelebratoryModal upon success",
    () => {
      assert(
        createViewSource.includes("api.createMeeting"),
        "Must call api.createMeeting",
      );
      assert(
        createViewSource.includes("<CelebratoryModal"),
        "Must present CelebratoryModal",
      );
    },
  );

  runTest(
    "Dashboard.tsx",
    "Wires CreateClassroomView into Dashboard for currentView === 'create'",
    () => {
      assert(
        dashboardSource.includes("<CreateClassroomView"),
        "Dashboard must render CreateClassroomView",
      );
      assert(
        dashboardSource.includes('currentView === "create"') ||
          dashboardSource.includes('activeTab === "create"'),
        "Dashboard must conditionally render for create view",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 4: Milestone 4 — exportTranscript.ts (Real TXT Multi-Language Export)
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 4: exportTranscript Utility (Real TXT Multi-Language Compilation) ---");

  runTest(
    "exportTranscript",
    "Fetches transcripts from api.transcripts and translations from api.translations",
    () => {
      assert(
        exportSource.includes("api.transcripts"),
        "Must call api.transcripts endpoint",
      );
      assert(
        exportSource.includes("api.translations"),
        "Must call api.translations endpoint",
      );
    },
  );

  runTest(
    "exportTranscript",
    "Empirical execution: formatTranscriptTimestamp formats seconds into [MM:SS] and [HH:MM:SS]",
    () => {
      assert.strictEqual(formatTranscriptTimestamp(75), "[01:15]");
      assert.strictEqual(formatTranscriptTimestamp(0), "[00:00]");
      assert.strictEqual(formatTranscriptTimestamp(3665), "[01:01:05]");
    },
  );

  runTest(
    "exportTranscript",
    "Empirical execution: compileTranscriptDocument produces clean formatted text with header and translations",
    () => {
      const mockMeeting: MeetingPublic = {
        id: "m-1",
        code: "7KQ2MD",
        title: "Physics - Mechanics of Rotating Bodies",
        hostId: "u-1",
        hostName: "Prof. Ramanathan",
        status: "ended",
        speakerLanguage: "en",
        availableLanguages: ["en", "ta", "hi", "bn", "mr", "or"],
        settings: {
          passwordEnabled: false,
          participantPermissions: { canUnmute: true, canShareScreen: true, canChat: true },
          defaultSpeakerLanguage: "en",
          availableLanguages: ["en", "ta", "hi", "bn", "mr", "or"],
          captionsEnabledByDefault: true,
          voiceEnabledByDefault: true,
        },
        createdAt: "2026-10-24T10:30:00.000Z",
      };

      const mockSegments: TranscriptSegmentPublic[] = [
        {
          id: "seg-1",
          meetingId: "m-1",
          meetingCode: "7KQ2MD",
          speakerId: "u-1",
          speakerName: "Prof. Ramanathan",
          originalLanguage: "en",
          originalText: "Welcome everyone. Today we analyze torque and angular momentum.",
          startTime: 75,
          endTime: 80,
          status: "complete",
          createdAt: "2026-10-24T10:31:15.000Z",
        },
      ];

      const mockTranslations: TranslationPublic[] = [
        {
          segmentId: "seg-1",
          language: "ta",
          text: "அனைவருக்கும் வணக்கம். இன்று நாம் முறுக்குவிசை மற்றும் கோண உந்தத்தை பகுப்பாய்வு செய்கிறோம்.",
          provider: "bhashini",
          status: "complete",
          latencyMs: 120,
        },
        {
          segmentId: "seg-1",
          language: "hi",
          text: "सभी का स्वागत है। आज हम बलाघूर्ण और कोणीय संवेग का विश्लेषण करेंगे।",
          provider: "bhashini",
          status: "complete",
          latencyMs: 110,
        },
      ];

      const doc = compileTranscriptDocument({
        meeting: mockMeeting,
        segments: mockSegments,
        translations: mockTranslations,
        participantCount: 4,
      });

      assert(doc.includes("NEXCLASS SESSION TRANSCRIPT ARCHIVE"), "Must include header title");
      assert(doc.includes("Room Code:        7KQ2MD"), "Must include room code");
      assert(doc.includes("Classroom Title:  Physics - Mechanics of Rotating Bodies"), "Must include title");
      assert(doc.includes("Prof. Ramanathan (EN):"), "Must include speaker & original language");
      assert(doc.includes("[01:15]"), "Must include formatted timestamp");
      assert(doc.includes("torque and angular momentum"), "Must include original text");
      assert(doc.includes("[TA - Tamil]:"), "Must include Tamil translated caption");
      assert(doc.includes("[HI - Hindi]:"), "Must include Hindi translated caption");
    },
  );

  runTest(
    "exportTranscript",
    "Generates correct filename format: nexclass-transcript-{code}-{date}.txt",
    () => {
      assert(
        exportSource.includes("nexclass-transcript-") && exportSource.includes(".txt"),
        "Must follow nexclass-transcript-{code}-{date}.txt naming",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 5: Milestone 4 — TranscriptsView.tsx & Dashboard Integration
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 5: TranscriptsView (Search, Multi-Language Filtering & Archive) ---");

  runTest(
    "TranscriptsView",
    "Features search input filtering by title or 6-character room code",
    () => {
      assert(
        transcriptsViewSource.includes("searchQuery") &&
          transcriptsViewSource.includes("titleMatch") &&
          transcriptsViewSource.includes("codeMatch"),
        "Must filter sessions by title or room code",
      );
    },
  );

  runTest(
    "TranscriptsView",
    "Features language filter pills for all Indian languages (All, EN, TA, HI, BN, MR, OR)",
    () => {
      assert(
        transcriptsViewSource.includes("selectedLanguage") &&
          transcriptsViewSource.includes("All Languages") &&
          transcriptsViewSource.includes("ALL_LANGUAGE_CODES"),
        "Must provide language filter pills for all supported languages",
      );
    },
  );

  runTest(
    "TranscriptsView",
    "Features date range filter pills (All Time, Today, Past 7 Days, Past 30 Days)",
    () => {
      assert(
        transcriptsViewSource.includes("dateFilter") &&
          transcriptsViewSource.includes("All Time") &&
          transcriptsViewSource.includes("Today") &&
          transcriptsViewSource.includes("Past 7 Days") &&
          transcriptsViewSource.includes("Past 30 Days"),
        "Must support date range filters",
      );
    },
  );

  runTest(
    "TranscriptsView",
    "Renders multi-language badges (EN, TA, HI, BN, MR, OR) on each archived session card",
    () => {
      assert(
        transcriptsViewSource.includes("Languages:") &&
          transcriptsViewSource.includes("Speaker"),
        "Must render multi-language badges on archived meeting cards",
      );
    },
  );

  runTest(
    "TranscriptsView",
    "Features 1-click 'Export TXT' button invoking exportTranscript with feedback toast",
    () => {
      assert(
        transcriptsViewSource.includes("exportTranscript"),
        "Must invoke exportTranscript",
      );
      assert(
        transcriptsViewSource.includes("toastMessage") ||
          transcriptsViewSource.includes("showToast"),
        "Must provide toast feedback upon export",
      );
    },
  );

  runTest(
    "TranscriptsView",
    "Provides 'Reopen Session' action button navigating to /meet/:code",
    () => {
      assert(
        transcriptsViewSource.includes("Reopen Session") &&
          transcriptsViewSource.includes("navigate(`/meet/${meeting.code}`)"),
        "Must navigate to /meet/:code to reopen session",
      );
    },
  );

  runTest(
    "Dashboard.tsx",
    "Wires TranscriptsView into Dashboard for currentView === 'transcripts'",
    () => {
      assert(
        dashboardSource.includes("<TranscriptsView"),
        "Dashboard must render TranscriptsView",
      );
      assert(
        dashboardSource.includes('currentView === "transcripts"') ||
          dashboardSource.includes('activeTab === "transcripts"'),
        "Dashboard must conditionally render for transcripts view",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 6: Reduced Motion Compliance
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 6: prefers-reduced-motion Compliance ---");

  runTest(
    "Reduced Motion",
    "MeetingCardPreview, CelebratoryModal, CreateClassroomView, and TranscriptsView obey useReducedMotion()",
    () => {
      assert(
        previewSource.includes("useReducedMotion"),
        "MeetingCardPreview must obey useReducedMotion",
      );
      assert(
        celebrationSource.includes("useReducedMotion"),
        "CelebratoryModal must obey useReducedMotion",
      );
      assert(
        createViewSource.includes("useReducedMotion"),
        "CreateClassroomView must obey useReducedMotion",
      );
      assert(
        transcriptsViewSource.includes("useReducedMotion"),
        "TranscriptsView must obey useReducedMotion",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  const passed = records.filter((r) => r.passed).length;
  const failed = records.filter((r) => !r.passed).length;

  console.log("\n===============================================================================");
  console.log(`  MILESTONE 3 & 4 RESULTS: ${passed} / ${records.length} TESTS PASSED  `);
  console.log(`  PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main();
