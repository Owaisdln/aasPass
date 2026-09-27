// ---------------------------------------------------------------------------
// Design tokens for aasPass mobile app.
// Direct port of styles.css from the web app with exact color matching.
// ---------------------------------------------------------------------------

export const colors = {
  // Brand & core
  primary: "#3a8f52",
  primaryForeground: "#fafbf9",
  secondary: "#d37a28",
  secondaryForeground: "#382c22",
  background: "#fbfaf6",
  foreground: "#38342e",
  card: "#ffffff",
  cardForeground: "#38342e",
  popover: "#ffffff",
  popoverForeground: "#38342e",
  muted: "#f2efe9",
  mutedForeground: "#7d7567",
  accent: "#d8f3df",
  accentForeground: "#1c5e31",
  destructive: "#d4341f",
  destructiveForeground: "#ffffff",
  border: "#e3dfd6",
  input: "#dedad0",
  ring: "#3a8f52",

  // Highlight & promo
  offer: "#dd6e1c",
  offerSoft: "#fcf1de",
  offerForeground: "#753406",

  // Category soft backgrounds & text
  freshSoft: "#eaf5e6",
  freshText: "#2d7332",
  dairySoft: "#eaf0fb",
  dairyText: "#3553a6",
  dailySoft: "#f9f2e3",
  dailyText: "#7a591e",
  snackSoft: "#fdeeee",
  snackText: "#8e2b2c",
  bevSoft: "#e4f6f8",
  bevText: "#1e6878",
  careSoft: "#fbebf2",
  careText: "#8b2658",
  homeSoft: "#f4ecf7",
  homeText: "#6b3280",
  healthSoft: "#e5f3fa",
  healthText: "#1b5e80",
  trustSoft: "#e8f0f8",

  // Utilities
  black: "#000000",
  white: "#ffffff",
  overlay: "rgba(0, 0, 0, 0.45)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 20,
  full: 9999,
};

export const typography = {
  fontFamily: "NunitoSans_400Regular",
  fontFamilySemiBold: "NunitoSans_600SemiBold",
  fontFamilyBold: "NunitoSans_700Bold",
  fontFamilyExtraBold: "NunitoSans_800ExtraBold",
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
};
