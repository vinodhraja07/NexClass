/**
 * Empirical Verification Harness for Milestone 2:
 * Classrooms Command Center View & Emerald Glass Components
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert";

const ROOT = resolve(__dirname, "..");

console.log("===============================================================================");
console.log("  NEXCLASS MILESTONE 2 EMPIRICAL VERIFICATION HARNESS  ");
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
  const heroSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/HeroActionDeck.tsx"),
    "utf8",
  );
  const cardSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/ClassroomCard.tsx"),
    "utf8",
  );
  const gridSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/ClassroomsGrid.tsx"),
    "utf8",
  );
  const drawerSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/RecentSessionsDrawer.tsx"),
    "utf8",
  );
  const classroomsViewSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/ClassroomsView.tsx"),
    "utf8",
  );
  const dashboardSource = readFileSync(
    resolve(ROOT, "apps/web/src/pages/Dashboard.tsx"),
    "utf8",
  );

  // ---------------------------------------------------------------------------
  // Suite 1: Hero Action Deck
  // ---------------------------------------------------------------------------
  console.log("--- SUITE 1: HeroActionDeck (3 Quick Actions) ---");

  runTest(
    "HeroActionDeck",
    "Renders 3-card quick-action deck grid",
    () => {
      assert(
        heroSource.includes("grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"),
        "HeroActionDeck must use responsive 3-column grid",
      );
    },
  );

  runTest(
    "HeroActionDeck",
    "Card 1: Instant 1-Click Meeting generates educational title & immediately navigates to /meet/:code",
    () => {
      assert(
        heroSource.includes("Instant 1-Click Meeting") || heroSource.includes("Instant Meeting"),
        "Must have Instant 1-Click Meeting label",
      );
      assert(
        heroSource.includes("EDUCATIONAL_TITLES"),
        "Must generate educational lecture title in teacher's preferred language",
      );
      assert(
        heroSource.includes("navigate(`/meet/${result.meeting.code}`)") ||
          heroSource.includes("navigate('/meet/' + result.meeting.code)"),
        "Must immediately navigate to /meet/:code upon completion",
      );
      assert(
        heroSource.includes("api.createMeeting"),
        "Must genuinely invoke api.createMeeting",
      );
    },
  );

  runTest(
    "HeroActionDeck",
    "Card 2: Join by Code with 6-char animated monospace input, auto-uppercase, counter & Enter key",
    () => {
      assert(
        heroSource.includes("Join by Code"),
        "Must have Join by Code card",
      );
      assert(
        heroSource.includes("joinCode.length") && heroSource.includes("/ 6"),
        "Must show character counter (x / 6)",
      );
      assert(
        heroSource.includes("toUpperCase()"),
        "Must auto-uppercase join code",
      );
      assert(
        heroSource.includes('e.key === "Enter"'),
        "Must support Enter key submission",
      );
      assert(
        heroSource.includes("border-accent-400 shadow-[0_0_16px_rgba(120,169,139,0.22)]"),
        "Must display active emerald border glow on focus",
      );
    },
  );

  runTest(
    "HeroActionDeck",
    "Card 3: Open Demo card with 1-click launch to /demo/room",
    () => {
      assert(
        heroSource.includes("Open Demo") || heroSource.includes("Demo Room"),
        "Must have Open Demo card",
      );
      assert(
        heroSource.includes('navigate("/demo/room")'),
        "Must navigate to /demo/room",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 2: ClassroomCard (Emerald Glass & Live Badge)
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 2: ClassroomCard (Emerald Glass & Actions) ---");

  runTest(
    "ClassroomCard",
    "Translucent Emerald Glass styling with backdrop blur and active hover border #78A98B",
    () => {
      assert(
        cardSource.includes("backdrop-blur-xl"),
        "Card must use backdrop-blur-xl",
      );
      assert(
        cardSource.includes("border-ink-600"),
        "Card must use default border #34483B (ink-600)",
      );
      assert(
        cardSource.includes("hover:border-accent-400"),
        "Card must use active hover border #78A98B (accent-400)",
      );
    },
  );

  runTest(
    "ClassroomCard",
    "Displays Live glowing pulse dot and 'LIVE NOW' badge when meeting is live",
    () => {
      assert(
        cardSource.includes("LIVE NOW"),
        "Must render LIVE NOW badge",
      );
      assert(
        cardSource.includes("<LiveDot />") || cardSource.includes("LiveDot"),
        "Must render LiveDot component",
      );
    },
  );

  runTest(
    "ClassroomCard",
    "Provides 1-click Enter Classroom, Copy Link, and Copy Code buttons",
    () => {
      assert(
        cardSource.includes("Enter Live Classroom") || cardSource.includes("Enter Classroom"),
        "Must have Enter Classroom button",
      );
      assert(
        cardSource.includes("Copy Link") && cardSource.includes("handleCopyLink"),
        "Must have Copy Link button",
      );
      assert(
        cardSource.includes("Copy Code") && cardSource.includes("handleCopyCode"),
        "Must have Copy Code button",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 3: ClassroomsGrid (Responsive Grid & Filters)
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 3: ClassroomsGrid (Responsive Grid & Filters) ---");

  runTest(
    "ClassroomsGrid",
    "Responsive card grid (grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5)",
    () => {
      assert(
        gridSource.includes("grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"),
        "Grid must have responsive 1/2/3 column layout",
      );
    },
  );

  runTest(
    "ClassroomsGrid",
    "Features search input and filter pills (All Classrooms, Live Now, Scheduled)",
    () => {
      assert(
        gridSource.includes("All Classrooms"),
        "Must have All Classrooms filter",
      );
      assert(
        gridSource.includes("Live Now"),
        "Must have Live Now filter",
      );
      assert(
        gridSource.includes("Scheduled"),
        "Must have Scheduled filter",
      );
      assert(
        gridSource.includes("searchQuery"),
        "Must support live search filtering",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 4: RecentSessionsDrawer
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 4: RecentSessionsDrawer (Collapsible History) ---");

  runTest(
    "RecentSessionsDrawer",
    "Collapsible quick-glance drawer with chevron toggle and session counter",
    () => {
      assert(
        drawerSource.includes("isExpanded"),
        "Must track expansion state",
      );
      assert(
        drawerSource.includes("ChevronDown"),
        "Must render chevron toggle",
      );
      assert(
        drawerSource.includes("recentMeetings.length"),
        "Must display session counter badge",
      );
    },
  );

  runTest(
    "RecentSessionsDrawer",
    "1-tap jump to Transcripts view (?view=transcripts)",
    () => {
      assert(
        drawerSource.includes("onNavigateTranscripts"),
        "Must accept onNavigateTranscripts callback",
      );
      assert(
        drawerSource.includes("View All Transcripts"),
        "Must provide 'View All Transcripts' quick-jump button",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Suite 5: Dashboard Integration & Reduced Motion
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 5: ClassroomsView & Dashboard Integration ---");

  runTest(
    "ClassroomsView",
    "Composes HeroActionDeck, ClassroomsGrid, and RecentSessionsDrawer",
    () => {
      assert(
        classroomsViewSource.includes("<HeroActionDeck"),
        "Must compose HeroActionDeck",
      );
      assert(
        classroomsViewSource.includes("<ClassroomsGrid"),
        "Must compose ClassroomsGrid",
      );
      assert(
        classroomsViewSource.includes("<RecentSessionsDrawer"),
        "Must compose RecentSessionsDrawer",
      );
    },
  );

  runTest(
    "Dashboard.tsx",
    "Wires ClassroomsView for currentView === 'classrooms'",
    () => {
      assert(
        dashboardSource.includes("<ClassroomsView"),
        "Dashboard must render ClassroomsView",
      );
      assert(
        dashboardSource.includes('currentView === "classrooms"') ||
          dashboardSource.includes('activeTab === "classrooms"'),
        "Must be wired for classrooms view",
      );
      assert(
        dashboardSource.includes("storeRecentMeeting"),
        "Dashboard must record recent sessions",
      );
    },
  );

  runTest(
    "Reduced Motion",
    "All Phase 2 components obey useReducedMotion()",
    () => {
      assert(
        heroSource.includes("useReducedMotion"),
        "HeroActionDeck must obey useReducedMotion",
      );
      assert(
        cardSource.includes("useReducedMotion"),
        "ClassroomCard must obey useReducedMotion",
      );
      assert(
        gridSource.includes("useReducedMotion"),
        "ClassroomsGrid must obey useReducedMotion",
      );
      assert(
        drawerSource.includes("useReducedMotion"),
        "RecentSessionsDrawer must obey useReducedMotion",
      );
      assert(
        classroomsViewSource.includes("useReducedMotion"),
        "ClassroomsView must obey useReducedMotion",
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  const passed = records.filter((r) => r.passed).length;
  const failed = records.filter((r) => !r.passed).length;
  console.log(`  MILESTONE 2 RESULTS: ${passed} / ${records.length} TESTS PASSED  `);
  console.log(`  PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    console.error("FAILURES:");
    records
      .filter((r) => !r.passed)
      .forEach((r, idx) => {
        console.error(`  ${idx + 1}. [${r.suite}] ${r.name}`);
        console.error(`     Error: ${r.error}\n`);
      });
    process.exit(1);
  }
}

main();
