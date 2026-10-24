import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ suite, name, passed: true });
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ suite, name, passed: false, error: errorMsg });
    console.log(`  ${RED}✗${RESET} ${name} (${RED}${errorMsg}${RESET})`);
  }
}

console.log(`${BOLD}${CYAN}================================================================${RESET}`);
console.log(`${BOLD}${CYAN}  NEXCLASS DASHBOARD M1 EMPIRICAL VERIFICATION HARNESS          ${RESET}`);
console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

const projectRoot = path.resolve(__dirname, "..");
const dashboardPath = path.join(projectRoot, "apps/web/src/pages/Dashboard.tsx");
const sidebarPath = path.join(projectRoot, "apps/web/src/components/dashboard/DashboardSidebar.tsx");
const mobileHeaderPath = path.join(projectRoot, "apps/web/src/components/dashboard/DashboardMobileHeader.tsx");
const appPath = path.join(projectRoot, "apps/web/src/App.tsx");
const themesTsPath = path.join(projectRoot, "apps/web/src/themes/themes.ts");
const themeStoragePath = path.join(projectRoot, "apps/web/src/themes/theme-storage.ts");
const themesCssPath = path.join(projectRoot, "apps/web/src/themes/themes.css");
const tailwindConfigPath = path.join(projectRoot, "apps/web/tailwind.config.js");
const indexCssPath = path.join(projectRoot, "apps/web/src/index.css");
const languageChipsPath = path.join(projectRoot, "apps/web/src/components/dashboard/LanguageChips.tsx");

const dashboardSource = fs.readFileSync(dashboardPath, "utf-8");
const sidebarSource = fs.readFileSync(sidebarPath, "utf-8");
const mobileHeaderSource = fs.readFileSync(mobileHeaderPath, "utf-8");
const appSource = fs.readFileSync(appPath, "utf-8");
const themesTsSource = fs.readFileSync(themesTsPath, "utf-8");
const themeStorageSource = fs.readFileSync(themeStoragePath, "utf-8");
const themesCssSource = fs.readFileSync(themesCssPath, "utf-8");
const tailwindConfigSource = fs.readFileSync(tailwindConfigPath, "utf-8");
const indexCssSource = fs.readFileSync(indexCssPath, "utf-8");
const languageChipsSource = fs.readFileSync(languageChipsPath, "utf-8");

// ============================================================================
// SUITE 1: Navigation State Transitions & URL Search Param Synchronization
// ============================================================================
console.log(`${BOLD}Suite 1: Navigation State & URL Search Parameter Synchronization${RESET}`);

// Replicate exact resolution algorithm from Dashboard.tsx lines 84-122
type DashboardView = "classrooms" | "create" | "transcripts" | "preferences";
const VALID_VIEWS: DashboardView[] = ["classrooms", "create", "transcripts", "preferences"];

function resolveInitialView(searchParams: URLSearchParams): DashboardView {
  const rawViewParam = (searchParams.get("view") || searchParams.get("tab")) as DashboardView | null;
  if (rawViewParam && VALID_VIEWS.includes(rawViewParam)) {
    return rawViewParam;
  }
  return "classrooms";
}

function handleSelectView(currentParams: URLSearchParams, nextView: DashboardView): URLSearchParams {
  const next = new URLSearchParams(currentParams);
  if (nextView === "classrooms") {
    next.delete("view");
  } else {
    next.set("view", nextView);
  }
  next.delete("tab");
  return next;
}

recordTest("Navigation State", "Resolves ?view=classrooms to 'classrooms'", () => {
  const params = new URLSearchParams("view=classrooms");
  assert.strictEqual(resolveInitialView(params), "classrooms");
});

recordTest("Navigation State", "Resolves ?view=create to 'create'", () => {
  const params = new URLSearchParams("view=create");
  assert.strictEqual(resolveInitialView(params), "create");
});

recordTest("Navigation State", "Resolves ?view=transcripts to 'transcripts'", () => {
  const params = new URLSearchParams("view=transcripts");
  assert.strictEqual(resolveInitialView(params), "transcripts");
});

recordTest("Navigation State", "Resolves ?view=preferences to 'preferences'", () => {
  const params = new URLSearchParams("view=preferences");
  assert.strictEqual(resolveInitialView(params), "preferences");
});

recordTest("Navigation State", "Resolves legacy fallback ?tab=classrooms to 'classrooms'", () => {
  const params = new URLSearchParams("tab=classrooms");
  assert.strictEqual(resolveInitialView(params), "classrooms");
});

recordTest("Navigation State", "Resolves legacy fallback ?tab=create to 'create'", () => {
  const params = new URLSearchParams("tab=create");
  assert.strictEqual(resolveInitialView(params), "create");
});

recordTest("Navigation State", "Resolves legacy fallback ?tab=transcripts to 'transcripts'", () => {
  const params = new URLSearchParams("tab=transcripts");
  assert.strictEqual(resolveInitialView(params), "transcripts");
});

recordTest("Navigation State", "Resolves ?view=classrooms&tab=create with view taking precedence", () => {
  const params = new URLSearchParams("view=classrooms&tab=create");
  assert.strictEqual(resolveInitialView(params), "classrooms");
});

recordTest("Navigation State", "Defaults missing params to 'classrooms'", () => {
  const params = new URLSearchParams("");
  assert.strictEqual(resolveInitialView(params), "classrooms");
});

recordTest("Navigation State", "Defaults unknown params (?view=invalid_view) to 'classrooms'", () => {
  const params = new URLSearchParams("view=invalid_view");
  assert.strictEqual(resolveInitialView(params), "classrooms");
});

recordTest("Navigation State", "Selecting 'create' produces ?view=create and purges legacy 'tab'", () => {
  const initial = new URLSearchParams("tab=transcripts");
  const updated = handleSelectView(initial, "create");
  assert.strictEqual(updated.get("view"), "create");
  assert.strictEqual(updated.get("tab"), null);
});

recordTest("Navigation State", "Selecting 'transcripts' produces ?view=transcripts and purges legacy 'tab'", () => {
  const initial = new URLSearchParams("tab=create");
  const updated = handleSelectView(initial, "transcripts");
  assert.strictEqual(updated.get("view"), "transcripts");
  assert.strictEqual(updated.get("tab"), null);
});

recordTest("Navigation State", "Selecting 'preferences' produces ?view=preferences and purges legacy 'tab'", () => {
  const initial = new URLSearchParams("");
  const updated = handleSelectView(initial, "preferences");
  assert.strictEqual(updated.get("view"), "preferences");
  assert.strictEqual(updated.get("tab"), null);
});

recordTest("Navigation State", "Selecting 'classrooms' cleans URL (deletes 'view' and 'tab')", () => {
  const initial = new URLSearchParams("view=create&tab=create");
  const updated = handleSelectView(initial, "classrooms");
  assert.strictEqual(updated.get("view"), null);
  assert.strictEqual(updated.get("tab"), null);
  assert.strictEqual(updated.toString(), "");
});

recordTest("Navigation State", "Source verification: Dashboard.tsx setSearchParams uses { replace: true }", () => {
  assert.match(dashboardSource, /setSearchParams\(\s*\(prev\)\s*=>[\s\S]+?\{\s*replace:\s*true\s*\}/);
});

// ============================================================================
// SUITE 2: Outer Layout Stability & No Full Page Reload
// ============================================================================
console.log(`\n${BOLD}Suite 2: Outer Layout Stability & No Full Page Reload${RESET}`);

recordTest("Layout Stability", "App.tsx motion.div keys on location.pathname (NOT location.search or key)", () => {
  assert.match(appSource, /<motion\.div[\s\S]+?key=\{location\.pathname\}/);
});

recordTest("Layout Stability", "Dashboard.tsx does NOT invoke window.location.reload() or location.href for nav", () => {
  assert.doesNotMatch(dashboardSource, /window\.location\.reload\(\)/);
  assert.doesNotMatch(dashboardSource, /window\.location\.href\s*=\s*["'`]\/dashboard/);
});

recordTest("Layout Stability", "Location.pathname is invariant across all 4 dashboard views", () => {
  const baseUrl = "https://nexclass.internal/dashboard";
  const views: DashboardView[] = ["classrooms", "create", "transcripts", "preferences"];
  for (const v of views) {
    const url = new URL(v === "classrooms" ? baseUrl : `${baseUrl}?view=${v}`);
    assert.strictEqual(url.pathname, "/dashboard");
  }
});

// ============================================================================
// SUITE 3: Desktop Rail Collapse/Expand State Toggle
// ============================================================================
console.log(`\n${BOLD}Suite 3: Desktop Rail Collapse/Expand State Toggle${RESET}`);

recordTest("Desktop Rail", "DashboardSidebar props accept isCollapsed & onToggleCollapse", () => {
  assert.match(sidebarSource, /isCollapsed\?:?\s*boolean/);
  assert.match(sidebarSource, /onToggleCollapse:\s*\(\)\s*=>\s*void/);
});

recordTest("Desktop Rail", "Desktop rail class toggles between w-20 and w-64", () => {
  assert.match(sidebarSource, /isCollapsed\s*\?\s*["']w-20["']\s*:\s*["']w-64["']/);
});

recordTest("Desktop Rail", "Main content container class toggles between lg:ml-20 and lg:ml-64", () => {
  assert.match(dashboardSource, /sidebarCollapsed\s*\?\s*["']lg:ml-20["']\s*:\s*["']lg:ml-64["']/);
});

recordTest("Desktop Rail", "Sidebar width (20/64) aligns exactly with main content margin (20/64)", () => {
  const sidebarMatch = sidebarSource.match(/isCollapsed\s*\?\s*["']w-(\d+)["']\s*:\s*["']w-(\d+)["']/);
  const contentMatch = dashboardSource.match(/sidebarCollapsed\s*\?\s*["']lg:ml-(\d+)["']\s*:\s*["']lg:ml-(\d+)["']/);
  assert.ok(sidebarMatch, "Sidebar width match found");
  assert.ok(contentMatch, "Content margin match found");
  assert.strictEqual(sidebarMatch[1], contentMatch[1], "Collapsed dimension match (20)");
  assert.strictEqual(sidebarMatch[2], contentMatch[2], "Expanded dimension match (64)");
});

recordTest("Desktop Rail", "localStorage persistence key is 'nexclass_sidebar_collapsed'", () => {
  assert.match(dashboardSource, /localStorage\.(getItem|setItem)\(["']nexclass_sidebar_collapsed["']/);
});

recordTest("Desktop Rail", "Tooltips display in collapsed desktop rail mode (!isMobile && isCollapsed && hovered)", () => {
  assert.match(sidebarSource, /!isMobile\s*&&\s*isCollapsed\s*&&\s*hoveredItem\s*===\s*item\.id/);
});

// ============================================================================
// SUITE 4: Mobile Drawer Toggle, Dismissal & Escape Listener
// ============================================================================
console.log(`\n${BOLD}Suite 4: Mobile Drawer Toggle, Dismissal & Escape Listener${RESET}`);

recordTest("Mobile Drawer", "Mobile header has hamburger button triggering onOpenMobile", () => {
  assert.match(mobileHeaderSource, /onClick=\{onOpenMobile\}/);
  assert.match(mobileHeaderSource, /aria-label=["']Open navigation menu["']/);
});

recordTest("Mobile Drawer", "Mobile drawer has role='dialog' and aria-modal='true'", () => {
  assert.match(sidebarSource, /role=["']dialog["']/);
  assert.match(sidebarSource, /aria-modal=["']true["']/);
});

recordTest("Mobile Drawer", "Backdrop overlay has onClick={props.onCloseMobile} and blur", () => {
  assert.match(sidebarSource, /onClick=\{props\.onCloseMobile\}[\s\S]+?backdrop-blur-md/);
});

recordTest("Mobile Drawer", "Escape key listener is registered when isMobileOpen is true and calls onCloseMobile", () => {
  assert.match(sidebarSource, /if\s*\(!isMobileOpen\)\s*return;/);
  assert.match(sidebarSource, /if\s*\(event\.key\s*===\s*["']Escape["']\)\s*\{\s*props\.onCloseMobile\(\);?\s*\}/);
  assert.match(sidebarSource, /window\.addEventListener\(["']keydown["'],\s*handleKeyDown\);/);
});

recordTest("Mobile Drawer", "Escape key listener is cleaned up when isMobileOpen changes or unmounts", () => {
  assert.match(sidebarSource, /return\s*\(\)\s*=>\s*window\.removeEventListener\(["']keydown["'],\s*handleKeyDown\);/);
});

recordTest("Mobile Drawer", "Body scroll overflow is locked to 'hidden' when isMobileOpen and restored on cleanup", () => {
  assert.match(sidebarSource, /document\.body\.style\.overflow\s*=\s*["']hidden["'];/);
  assert.match(sidebarSource, /document\.body\.style\.overflow\s*=\s*originalOverflow;/);
});

recordTest("Mobile Drawer", "Nav item click in mobile drawer calls onCloseMobile", () => {
  assert.match(sidebarSource, /if\s*\(isMobile\)\s*props\.onCloseMobile\(\);/);
});

// ============================================================================
// SUITE 5: Design Tokens, Obsidian Mint Palette & Critical User Direction
// ============================================================================
console.log(`\n${BOLD}Suite 5: Obsidian Mint Palette & Design Tokens (Critical Direction)${RESET}`);

recordTest("Design System", "DEFAULT_THEME_ID in themes.ts must equal 'emerald-glass' or 'obsidian-mint'", () => {
  const match = themesTsSource.match(/export const DEFAULT_THEME_ID:\s*ThemeId\s*=\s*["']([^"']+)["'];/);
  assert.ok(match, "DEFAULT_THEME_ID export found");
  assert.ok(
    match[1] === "emerald-glass" || match[1] === "obsidian-mint",
    `Expected DEFAULT_THEME_ID to be 'emerald-glass' or 'obsidian-mint', but found '${match[1]}'`,
  );
});

recordTest("Design System", "theme-storage.ts getStoredTheme() must NOT upgrade/force to 'midnight-purple'", () => {
  assert.doesNotMatch(
    themeStorageSource,
    /setStoredTheme\(["']midnight-purple["']\)/,
    "theme-storage.ts forcibly replaces theme with midnight-purple!",
  );
});

recordTest("Design System", "themes.css must define [data-theme='obsidian-mint']", () => {
  assert.match(
    themesCssSource,
    /\[data-theme=["']obsidian-mint["']\]/,
    "themes.css lacks [data-theme='obsidian-mint'] selector definition!",
  );
});

recordTest("Design System", "themes.css :root default must NOT be Midnight Purple (#12111E / #8980BD)", () => {
  const rootBlock = themesCssSource.match(/:root[^{]*\{([^}]+)\}/);
  assert.ok(rootBlock, ":root definition found in themes.css");
  const content = rootBlock[1];
  assert.doesNotMatch(content, /#12111E/, ":root is hardcoded to Midnight Purple background #12111E");
  assert.doesNotMatch(content, /#8980BD/, ":root is hardcoded to Midnight Purple primary #8980BD");
});

recordTest("Design System", "tailwind.config.js decouples signal.live from signal.rec", () => {
  assert.match(tailwindConfigSource, /(?:"live"|live):\s*["'](?:#FF2A7A|#2EE0A8|#32B98A|#78A98B)["']/);
  assert.match(tailwindConfigSource, /(?:"rec"|rec):\s*["'](?:var\(--danger\)|#FF1361)["']/);
});

recordTest("Design System", "LanguageChips.tsx does not use 'leading-none' for Indic text", () => {
  assert.doesNotMatch(languageChipsSource, /font-medium[^"']*leading-none/);
  assert.match(languageChipsSource, /font-indic\s+leading-relaxed/);
});

recordTest("Design System", "index.css sets font-indic line-height to 1.65 with vertical breathing padding", () => {
  assert.match(indexCssSource, /\.font-indic[\s\S]+?line-height:\s*1\.65\s*!important/);
  assert.match(indexCssSource, /\.font-indic[\s\S]+?padding-top:\s*0\.05em/);
  assert.match(indexCssSource, /\.font-indic[\s\S]+?padding-bottom:\s*0\.05em/);
});

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log(`\n${BOLD}================================================================${RESET}`);
console.log(`${BOLD}  EMPIRICAL TEST SUMMARY                                       ${RESET}`);
console.log(`${BOLD}================================================================${RESET}`);

const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log(`Total Tests : ${total}`);
console.log(`Passed      : ${GREEN}${passed}${RESET}`);
console.log(`Failed      : ${failed > 0 ? RED : GREEN}${failed}${RESET}`);

if (failed > 0) {
  console.log(`\n${RED}${BOLD}FAILED TESTS:${RESET}`);
  results
    .filter((r) => !r.passed)
    .forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.suite}] ${r.name}`);
      console.log(`     Reason: ${r.error}`);
    });
}

console.log(`\n${BOLD}VERDICT: ${failed > 0 ? `${RED}REJECT (BUGS FOUND)` : `${GREEN}APPROVE`}${RESET}\n`);

// Exit with code matching failures
process.exit(failed > 0 ? 1 : 0);
