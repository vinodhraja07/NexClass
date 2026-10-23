export type ThemeId =
  | "monsoon-aurora"
  | "earth-sand"
  | "forest-moderne"
  | "ocean-blue"
  | "midnight-purple";

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
  "monsoon-aurora": {
    id: "monsoon-aurora",
    name: "Monsoon Aurora",
    tagline: "Default · Oceanic Atmospheric",
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
    tagline: "Warm Clay & Dune",
    personality: ["Minimal", "Warm", "Natural", "Sophisticated", "Comfortable"],
    description: "Natural terracotta clay and warm stone for comfortable extended reading.",
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
    tagline: "Organic Sage & Moss",
    personality: ["Natural", "Calm", "Balanced", "Focused", "Organic"],
    description: "Restrained organic woodland greens providing serene visual focus.",
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
    tagline: "Scientific Maritime Slate",
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
  "midnight-purple": {
    id: "midnight-purple",
    name: "Midnight Purple",
    tagline: "Twilight Lavender & Amethyst",
    personality: ["Elegant", "Immersive", "Premium", "Creative", "Intelligent"],
    description: "Thoughtful deep violet and refined muted lavender for deep immersion.",
    colors: {
      background: "#12111E",
      backgroundSecondary: "#1B192A",
      surface: "#262338",
      surfaceElevated: "#302D45",
      primary: "#8980BD",
      secondaryAccent: "#A89ACF",
      aiAccent: "#807A9D",
      textPrimary: "#EFEDF5",
      textSecondary: "#B8B3CB",
      border: "#403B56",
      muted: "#201E31",
    },
    rgb: {
      background: "18 17 30",
      backgroundSecondary: "27 25 42",
      surface: "38 35 56",
      surfaceElevated: "48 45 69",
      primary: "137 128 189",
      secondaryAccent: "168 154 207",
      aiAccent: "128 122 157",
      textPrimary: "239 237 245",
      textSecondary: "184 179 203",
      border: "64 59 86",
      muted: "32 30 49",
    },
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME_ID: ThemeId = "midnight-purple";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES;
}
