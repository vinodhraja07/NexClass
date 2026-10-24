/**
 * Empirical Verification Harness for Milestone 1 Challenger 2
 * Scope: Responsive alignment, server health footer, logout trigger, reduced motion compliance.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert";

const ROOT = resolve(__dirname, "..");

console.log("===============================================================================");
console.log("  NEXCLASS DASHBOARD M1 EMPIRICAL VERIFICATION HARNESS (CHALLENGER 2)  ");
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

async function runAsyncTest(suite: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ PASS: [${suite}] ${name}`);
    records.push({ suite, name, passed: true });
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error(`  ✗ FAIL: [${suite}] ${name}`);
    console.error(`    ${errorMsg}`);
    records.push({ suite, name, passed: false, error: errorMsg });
  }
}

async function main() {
  const dashboardSource = readFileSync(
    resolve(ROOT, "apps/web/src/pages/Dashboard.tsx"),
    "utf8",
  );
  const sidebarSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/DashboardSidebar.tsx"),
    "utf8",
  );
  const mobileHeaderSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/DashboardMobileHeader.tsx"),
    "utf8",
  );
  const authSource = readFileSync(resolve(ROOT, "apps/web/src/lib/auth.tsx"), "utf8");
  const cssSource = readFileSync(resolve(ROOT, "apps/web/src/index.css"), "utf8");
  const tailwindSource = readFileSync(resolve(ROOT, "apps/web/tailwind.config.js"), "utf8");
  const languageChipsSource = readFileSync(
    resolve(ROOT, "apps/web/src/components/dashboard/LanguageChips.tsx"),
    "utf8",
  );
  const themesSource = readFileSync(
    resolve(ROOT, "apps/web/src/themes/themes.ts"),
    "utf8",
  );
  const themeStorageSource = readFileSync(
    resolve(ROOT, "apps/web/src/themes/theme-storage.ts"),
    "utf8",
  );

  // -----------------------------------------------------------------------------
  // Suite 1: Responsive Layout Breakpoints
  // -----------------------------------------------------------------------------
  console.log("--- SUITE 1: Responsive Layout Breakpoints (<640px, 640-1024px, 1024-1440px, >1440px) ---");

  runTest(
    "Breakpoints",
    "Mobile (<640px): Desktop rail hidden, sticky header visible, drawer 280px width",
    () => {
      assert(
        sidebarSource.includes("hidden lg:flex flex-col"),
        "Desktop rail must have 'hidden lg:flex' (hidden < 1024px)",
      );
      assert(
        mobileHeaderSource.includes("lg:hidden"),
        "Mobile header must have 'lg:hidden' (visible < 1024px)",
      );
      assert(
        sidebarSource.includes("w-[280px]"),
        "Mobile drawer must have base width of 280px for narrow mobile viewports",
      );
    },
  );

  runTest(
    "Breakpoints",
    "Tablet (640-1024px): Drawer width expands to sm:w-[320px], header shows role badge (hidden sm:inline-flex)",
    () => {
      assert(
        sidebarSource.includes("sm:w-[320px]"),
        "Mobile drawer must expand to 320px on sm breakpoint (640px - 1024px)",
      );
      assert(
        mobileHeaderSource.includes("hidden sm:inline-flex"),
        "Role badge in mobile header must be hidden on <640px and inline-flex on sm (640-1024px)",
      );
    },
  );

  runTest(
    "Breakpoints",
    "Desktop (1024-1440px): Sidebar visible (w-20 or w-64), header hidden (lg:hidden), content margin offsets dynamically",
    () => {
      assert(
        sidebarSource.includes('isCollapsed ? "w-20" : "w-64"'),
        "Desktop rail width must be w-20 (collapsed) or w-64 (expanded)",
      );
      assert(
        dashboardSource.includes('sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"'),
        "Main container margin must align with rail (lg:ml-20 / lg:ml-64)",
      );
    },
  );

  runTest(
    "Breakpoints",
    "Ultrawide (>1440px): Main content bounded by max-w-[1400px] and centered with mx-auto",
    () => {
      assert(
        dashboardSource.includes("max-w-[1400px]"),
        "Main container must have max-w-[1400px] to prevent stretching on ultrawide monitors",
      );
      assert(
        dashboardSource.includes("mx-auto"),
        "Main container must be centered with mx-auto",
      );
    },
  );

  runTest(
    "Breakpoints",
    "Mobile Drawer: Escape key closes drawer and body scroll lock manages overflow",
    () => {
      assert(
        sidebarSource.includes('event.key === "Escape"'),
        "Must listen for Escape key to dismiss drawer",
      );
      assert(
        sidebarSource.includes('document.body.style.overflow = "hidden"'),
        "Must lock body scroll when mobile drawer is open",
      );
      assert(
        sidebarSource.includes("document.body.style.overflow = originalOverflow"),
        "Must restore body scroll when mobile drawer closes",
      );
    },
  );

  // -----------------------------------------------------------------------------
  // Suite 2: Server Connection Status Beacon & Provider Telemetry
  // -----------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Server Connection Status Beacon & Provider Telemetry ---");

  runTest(
    "Server Beacon",
    "Sidebar footer checks WebRTC STUN/TURN, Neural TTS, and Database Storage status",
    () => {
      assert(
        sidebarSource.includes('p.category === "turn"'),
        "Sidebar must query 'turn' category provider",
      );
      assert(
        sidebarSource.includes('p.category === "tts"'),
        "Sidebar must query 'tts' category provider",
      );
      assert(
        sidebarSource.includes("serverStatus?.infrastructure.mongodb"),
        "Sidebar must query mongodb infrastructure status",
      );
      assert(
        sidebarSource.includes("overallHealthy ="),
        "Sidebar must calculate overallHealthy boolean",
      );
    },
  );

  runTest(
    "Server Beacon",
    "DISCREPANCY CHECK: Sidebar footer diagnostics omits 'asr' and 'translation' indicators",
    () => {
      const hasAsr = sidebarSource.includes('"asr"') || sidebarSource.includes("'asr'");
      const hasTranslation = sidebarSource.includes('"translation"') || sidebarSource.includes("'translation'");
      if (!hasAsr || !hasTranslation) {
        throw new Error(
          `Sidebar footer diagnostics popover only checks turn, tts, mongodb. It omits 'asr' (hasAsr=${hasAsr}) and 'translation' (hasTranslation=${hasTranslation}) which are returned by api.providerStatus!`,
        );
      }
    },
  );

  runTest(
    "Server Beacon",
    "Pulsing beacon visually distinguishes healthy from degraded/offline (amber #FBBF24)",
    () => {
      assert(
        sidebarSource.includes("bg-accent-400 shadow-[0_0_8px_#0284C7]") ||
          sidebarSource.includes("bg-emerald-400 shadow-[0_0_8px_#2EE0A8]") ||
          sidebarSource.includes("bg-accent-300 shadow-[0_0_8px_#32B98A]") ||
          sidebarSource.includes("bg-accent-400 shadow-[0_0_8px_#78A98B]"),
        "Healthy beacon must use accent/emerald with shadow",
      );
      assert(
        sidebarSource.includes("bg-amber-400 shadow-[0_0_8px_#FBBF24]"),
        "Degraded/offline beacon must use amber #FBBF24 with shadow",
      );
    },
  );

  runTest(
    "Server Beacon",
    "Diagnostics popover provides status refresh trigger with loading spinner",
    () => {
      assert(
        sidebarSource.includes("onRefreshServerStatus"),
        "Sidebar must accept onRefreshServerStatus",
      );
      assert(
        sidebarSource.includes('props.serverLoading && "animate-spin"'),
        "Refresh icon must spin when serverLoading is true",
      );
    },
  );

  // -----------------------------------------------------------------------------
  // Suite 3: Logout Trigger Behavior
  // -----------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Logout Trigger Behavior ---");

  runTest(
    "Logout Trigger",
    "Logout button is rendered with accessible title and aria-label in both desktop and mobile footers",
    () => {
      assert(
        sidebarSource.includes('aria-label="Sign out of NexClass"'),
        "Logout button must have aria-label='Sign out of NexClass'",
      );
      assert(
        sidebarSource.includes("{renderFooter(false)}"),
        "Desktop rail must render footer with logout button",
      );
      assert(
        sidebarSource.includes("{renderFooter(true)}"),
        "Mobile drawer must render footer with logout button",
      );
    },
  );

  runTest(
    "Logout Trigger",
    "handleSignOut invokes logout() and redirects to /login with replace: true",
    () => {
      assert(
        dashboardSource.includes("await logout()"),
        "handleSignOut must await logout()",
      );
      assert(
        dashboardSource.includes('navigate("/login", { replace: true })'),
        "handleSignOut must redirect to /login with replace: true",
      );
    },
  );

  runTest(
    "Logout Trigger",
    "Client-side logout discards tokens and resets user state even when network fails",
    () => {
      assert(
        authSource.includes("try {\n      await api.logout();\n    } catch {"),
        "auth.tsx logout must wrap api.logout() in try/catch to ensure tokens are always discarded",
      );
      assert(
        authSource.includes("setAuthToken(null)"),
        "auth.tsx logout must clear auth token",
      );
      assert(
        authSource.includes("setUser(null)"),
        "auth.tsx logout must reset user state",
      );
    },
  );

  // -----------------------------------------------------------------------------
  // Suite 4: prefers-reduced-motion Compliance
  // -----------------------------------------------------------------------------
  console.log("\n--- SUITE 4: prefers-reduced-motion Compliance ---");

  runTest(
    "Reduced Motion",
    "<MotionConfig reducedMotion=\"user\"> placed at root of Dashboard",
    () => {
      assert(
        dashboardSource.includes('<MotionConfig reducedMotion="user">'),
        "Dashboard.tsx must wrap tree in <MotionConfig reducedMotion=\"user\">",
      );
    },
  );

  runTest(
    "Reduced Motion",
    "useReducedMotion hook guards continuous background glow orbs and beacon pulse",
    () => {
      assert(
        dashboardSource.includes("const reduced = useReducedMotion()"),
        "Dashboard.tsx must query useReducedMotion()",
      );
      assert(
        dashboardSource.includes("{!reduced && ("),
        "Ambient glow orb continuous animation must be conditionally suppressed by !reduced",
      );
      assert(
        sidebarSource.includes("{!reduced && ("),
        "Status beacon pulsing ring must be conditionally suppressed by !reduced",
      );
    },
  );

  runTest(
    "Reduced Motion",
    "CSS @media (prefers-reduced-motion: reduce) sets 0.001ms duration across all animations and transitions",
    () => {
      assert(
        cssSource.includes("@media (prefers-reduced-motion: reduce)"),
        "index.css must include @media (prefers-reduced-motion: reduce)",
      );
      assert(
        cssSource.includes("animation-duration: 0.001ms !important"),
        "Must override animation-duration to 0.001ms !important",
      );
      assert(
        cssSource.includes("transition-duration: 0.001ms !important"),
        "Must override transition-duration to 0.001ms !important",
      );
      assert(
        cssSource.includes("scroll-behavior: auto !important"),
        "Must override scroll-behavior to auto !important",
      );
    },
  );

  // -----------------------------------------------------------------------------
  // Suite 5: Palette & Design System Contradiction Checks
  // -----------------------------------------------------------------------------
  console.log("\n--- SUITE 5: Critical User Direction & Palette Compliance ---");

  runTest(
    "Palette & Direction",
    "CRITICAL CONTRADICTION: DEFAULT_THEME_ID in themes.ts matches 'emerald-glass' or 'obsidian-mint'",
    () => {
      const match = themesSource.match(/export const DEFAULT_THEME_ID:\s*ThemeId\s*=\s*["']([^"']+)["'];/);
      assert.ok(match, "DEFAULT_THEME_ID found");
      if (match[1] !== "obsidian-mint" && match[1] !== "emerald-glass") {
        throw new Error(
          `CRITICAL BUG: User explicitly requested 'emerald-glass', but themes.ts line 216 has DEFAULT_THEME_ID = "${match[1]}"`,
        );
      }
    },
  );

  runTest(
    "Palette & Direction",
    "CRITICAL REGRESSION: theme-storage.ts does NOT force-upgrade to midnight-purple",
    () => {
      if (themeStorageSource.includes('setStoredTheme("midnight-purple")')) {
        throw new Error(
          `CRITICAL BUG: theme-storage.ts forcibly upgrades to 'midnight-purple'`,
        );
      }
    },
  );

  runTest(
    "Palette & Direction",
    "UNFULFILLED WORKER CLAIM: tailwind.config.js signal.live is decoupled to #FF2A7A, #2EE0A8 or #32B98A",
    () => {
      const liveMatch = tailwindSource.match(/(?:"live"|live):\s*["']([^"']+)["']/);
      assert.ok(liveMatch, "signal.live found");
      if (liveMatch[1] !== "#FF2A7A" && liveMatch[1] !== "#2EE0A8" && liveMatch[1] !== "#32B98A") {
        throw new Error(
          `Worker claimed signal.live was decoupled, but tailwind.config.js has signal.live = "${liveMatch[1]}"`,
        );
      }
    },
  );

  // -----------------------------------------------------------------------------
  // Suite 6: Live API Integration
  // -----------------------------------------------------------------------------
  console.log("\n--- SUITE 6: Live API Endpoint Integration ---");

  await runAsyncTest(
    "Live API",
    "GET /api/providers/status returns all 4 categories (asr, translation, tts, turn)",
    async () => {
      const appModulePath = pathToFileURL(resolve(ROOT, "apps/api/src/app.ts")).href;
      const { createApp } = await import(appModulePath);
      const request = (await import("supertest")).default;
      const app = createApp();

      const res = await request(app).get("/api/providers/status");
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.providers));
      const categories = res.body.providers.map((p: { category: string }) => p.category);
      assert(categories.includes("asr"), "Missing asr");
      assert(categories.includes("translation"), "Missing translation");
      assert(categories.includes("tts"), "Missing tts");
      assert(categories.includes("turn"), "Missing turn");
    },
  );

  await runAsyncTest(
    "Live API",
    "POST /api/auth/logout succeeds with 200 when authenticated with valid user token",
    async () => {
      const appModulePath = pathToFileURL(resolve(ROOT, "apps/api/src/app.ts")).href;
      const { createApp } = await import(appModulePath);
      const request = (await import("supertest")).default;
      const app = createApp();

      // Register a test user
      const uniqueEmail = `test_logout_${Date.now()}@example.com`;
      const reg = await request(app).post("/api/auth/register").send({
        name: "Test Logout Teacher",
        email: uniqueEmail,
        password: "Password123!",
        role: "teacher",
        preferredLanguage: "en",
      });
      assert.strictEqual(reg.status, 201);
      const token = reg.body.token;

      // Now logout with token
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);
      assert.strictEqual(logoutRes.status, 200);
      assert.strictEqual(logoutRes.body.ok, true);
    },
  );

  // -----------------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------------
  console.log("\n===============================================================================");
  const passed = records.filter((r) => r.passed).length;
  const failed = records.filter((r) => !r.passed).length;
  console.log(`  VERIFICATION RESULTS: ${passed} / ${records.length} TESTS PASSED  `);
  console.log(`  PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    console.log("CRITICAL FINDINGS & DEFECTS SUMMARY:");
    records
      .filter((r) => !r.passed)
      .forEach((r, idx) => {
        console.log(`  ${idx + 1}. [${r.suite}] ${r.name}`);
        console.log(`     Error: ${r.error}\n`);
      });
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
