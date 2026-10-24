export type ThemeId =
  | "emerald-glass"
  | "monsoon-aurora"
  | "earth-sand"
  | "ocean-blue"
  | "obsidian-mint";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceFloating?: string;
  surfaceMuted?: string;
  primary: string;
  primaryHover?: string;
  primaryMuted?: string;
  secondaryAccent: string;
  aiAccent: string;
  paleMint?: string;
  textPrimary: string;
  textSecondary: string;
  textMuted?: string;
  border: string;
  borderSubtle?: string;
  borderActive?: string;
  muted: string;
}

export interface ThemeRgb {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceFloating?: string;
  primary: string;
  secondaryAccent: string;
  aiAccent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  muted: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  personality: string[];
  description: string;
  colors: ThemeColors;
  rgb: ThemeRgb;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  "emerald-glass": {
    id: "emerald-glass",
    name: "Emerald Glass",
    tagline: "Official NexClass · Apple-Inspired Futuristic Emerald",
    personality: ["Premium", "Apple-Inspired", "Futuristic", "Calm", "Sophisticated"],
    description: "Deep green-black backgrounds (#101A16), muted emerald accents (#78A98B), soft emerald (#32B98A), and translucent glass surfaces.",
    colors: {
      background: "#101A16",
      backgroundSecondary: "#17231D",
      surface: "#1D3028",
      surfaceElevated: "#294034",
      surfaceFloating: "#20382E",
      surfaceMuted: "#1A2A21",
      primary: "#78A98B",
      primaryHover: "#32B98A",
      primaryMuted: "#176B55",
      secondaryAccent: "#C4B887",
      aiAccent: "#9B9B78",
      paleMint: "#B3E5C5",
      textPrimary: "#E9EFE8",
      textSecondary: "#ACBCAF",
      textMuted: "#829487",
      border: "#34483B",
      borderSubtle: "#293C32",
      borderActive: "#78A98B",
      muted: "#1A2A21",
    },
    rgb: {
      background: "16 26 22",
      backgroundSecondary: "23 35 29",
      surface: "29 48 40",
      surfaceElevated: "41 64 52",
      surfaceFloating: "32 56 46",
      primary: "120 169 139",
      secondaryAccent: "196 184 135",
      aiAccent: "155 155 120",
      textPrimary: "233 239 232",
      textSecondary: "172 188 175",
      border: "52 72 59",
      muted: "26 42 33",
    },
  },
  "obsidian-mint": {
    id: "obsidian-mint",
    name: "Obsidian & Mint",
    tagline: "Classic Signature · Obsidian & Mint",
    personality: ["High-Contrast", "Deep", "Luminous"],
    description: "Deep dark canvas with vivid mint accents and crisp ivory text.",
    colors: {
      background: "#08090C",
      backgroundSecondary: "#0D0E14",
      surface: "#12141C",
      surfaceElevated: "#1E2230",
      primary: "#0284C7",
      secondaryAccent: "#FF2A7A",
      aiAccent: "#38BDF8",
      textPrimary: "#F1F5F9",
      textSecondary: "#94A3B8",
      border: "#282D40",
      muted: "#171A24",
    },
    rgb: {
      background: "8 9 12",
      backgroundSecondary: "13 14 20",
      surface: "18 20 28",
      surfaceElevated: "30 34 48",
      primary: "2 132 199",
      secondaryAccent: "255 42 122",
      aiAccent: "56 189 248",
      textPrimary: "241 245 249",
      textSecondary: "148 163 184",
      border: "40 45 64",
      muted: "23 26 36",
    },
  },
  "monsoon-aurora": {
    id: "monsoon-aurora",
    name: "Monsoon Aurora",
    tagline: "Atmospheric Deep Cyan",
    personality: ["Premium", "Futuristic", "Calm", "Intelligent", "Modern"],
    description: "Atmospheric deep navy with luminous cyan and warm amber accents.",
    colors: {
      background: "#101D2B",
      backgroundSecondary: "#152635",
      surface: "#1D3544",
      surfaceElevated: "#254251",
      primary: "#42DCC5",
      secondaryAccent: "#FFCA78",
      aiAccent: "#B7A4FF",
      textPrimary: "#F3F8F7",
      textSecondary: "#A8BBC5",
      border: "#304957",
      muted: "#182C39",
    },
    rgb: {
      background: "16 29 43",
      backgroundSecondary: "21 38 53",
      surface: "29 53 68",
      surfaceElevated: "37 66 81",
      primary: "66 220 197",
      secondaryAccent: "255 202 120",
      aiAccent: "183 164 255",
      textPrimary: "243 248 247",
      textSecondary: "168 187 197",
      border: "48 73 87",
      muted: "24 44 57",
    },
  },
  "earth-sand": {
    id: "earth-sand",
    name: "Earth Sand",
    tagline: "Warm Organic Terracotta",
    personality: ["Warm", "Approachable", "Human", "Grounded", "Harmonious"],
    description: "Earthy dark espresso base with warm terracotta and golden sand accents.",
    colors: {
      background: "#1A1714",
      backgroundSecondary: "#211D19",
      surface: "#302820",
      surfaceElevated: "#3A3027",
      primary: "#C9A17A",
      secondaryAccent: "#D4BD75",
      aiAccent: "#A9A08D",
      textPrimary: "#F3EBDD",
      textSecondary: "#BDB1A1",
      border: "#514438",
      muted: "#28221D",
    },
    rgb: {
      background: "26 23 20",
      backgroundSecondary: "33 29 25",
      surface: "48 40 32",
      surfaceElevated: "58 48 39",
      primary: "201 161 122",
      secondaryAccent: "212 189 117",
      aiAccent: "169 160 141",
      textPrimary: "243 235 221",
      textSecondary: "189 177 161",
      border: "81 68 56",
      muted: "40 34 29",
    },
  },
  "ocean-blue": {
    id: "ocean-blue",
    name: "Ocean Blue",
    tagline: "Precision Slate Cobalt",
    personality: ["Professional", "Clean", "Trustworthy", "Scientific", "Focused"],
    description: "Deep oceanic slate and cobalt for clean, technical, high-precision clarity.",
    colors: {
      background: "#0B1724",
      backgroundSecondary: "#122131",
      surface: "#192B3A",
      surfaceElevated: "#233A4B",
      primary: "#438EAC",
      secondaryAccent: "#78B8C9",
      aiAccent: "#9EACC0",
      textPrimary: "#E8EFF4",
      textSecondary: "#A8BAC8",
      border: "#30485A",
      muted: "#172735",
    },
    rgb: {
      background: "11 23 36",
      backgroundSecondary: "18 33 49",
      surface: "25 43 58",
      surfaceElevated: "35 58 75",
      primary: "67 142 172",
      secondaryAccent: "120 184 201",
      aiAccent: "158 172 192",
      textPrimary: "232 239 244",
      textSecondary: "168 186 200",
      border: "48 72 90",
      muted: "23 39 53",
    },
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME_ID: ThemeId = "emerald-glass";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES;
}
