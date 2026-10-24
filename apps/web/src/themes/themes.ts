export type ThemeId =
  | "obsidian-mint"
  | "monsoon-aurora"
  | "earth-sand"
  | "forest-moderne"
  | "ocean-blue";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  secondaryAccent: string;
  aiAccent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  muted: string;
}

export interface ThemeRgb {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
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
  "obsidian-mint": {
    id: "obsidian-mint",
    name: "Obsidian & Mint",
    tagline: "Original Signature · Emerald Mint & Obsidian",
    personality: ["Signature", "Futuristic", "Luminous", "High-Contrast", "Calm"],
    description: "The classic NexClass signature: deep obsidian black with luminous emerald mint and lime accents.",
    colors: {
      background: "#070B14",
      backgroundSecondary: "#0A101C",
      surface: "#0E1524",
      surfaceElevated: "#172136",
      primary: "#2EE0A8",
      secondaryAccent: "#D3F25C",
      aiAccent: "#5FEAB9",
      textPrimary: "#FBF8F2",
      textSecondary: "#A79C8B",
      border: "#1F2C45",
      muted: "#121A2C",
    },
    rgb: {
      background: "7 11 20",
      backgroundSecondary: "10 16 28",
      surface: "14 21 36",
      surfaceElevated: "23 33 54",
      primary: "46 224 168",
      secondaryAccent: "211 242 92",
      aiAccent: "95 234 185",
      textPrimary: "251 248 242",
      textSecondary: "167 156 139",
      border: "31 44 69",
      muted: "18 26 44",
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
  "forest-moderne": {
    id: "forest-moderne",
    name: "Forest Moderne",
    tagline: "Nordic Botanical Emerald",
    personality: ["Balanced", "Deep", "Organic", "Sophisticated", "Refined"],
    description: "Deep pine forest darks with sage highlights and muted bronze accents.",
    colors: {
      background: "#101A16",
      backgroundSecondary: "#17231D",
      surface: "#1D3028",
      surfaceElevated: "#294034",
      primary: "#78A98B",
      secondaryAccent: "#C4B887",
      aiAccent: "#9B9B78",
      textPrimary: "#E9EFE8",
      textSecondary: "#ACBCAF",
      border: "#34483B",
      muted: "#1A2A21",
    },
    rgb: {
      background: "16 26 22",
      backgroundSecondary: "23 35 29",
      surface: "29 48 40",
      surfaceElevated: "41 64 52",
      primary: "120 169 139",
      secondaryAccent: "196 184 135",
      aiAccent: "155 155 120",
      textPrimary: "233 239 232",
      textSecondary: "172 188 175",
      border: "52 72 59",
      muted: "26 42 33",
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

export const DEFAULT_THEME_ID: ThemeId = "obsidian-mint";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES;
}
