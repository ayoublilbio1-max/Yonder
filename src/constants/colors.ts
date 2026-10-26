// Yonder colour tokens — the ONLY place hex values are written.
// Screens and components use `const colors = useTheme()` and the token names below.

export const brand = {
  pink: "#f13074",
  white: "#FFFFFF",
  coral: "#fa495e",
  boost: "#10c281",
} as const;

// Same in light and dark: text and buttons that sit on top of a photo,
// and the official sign-in button colours.
const onPhotoTokens = {
  onPhoto: "#FFFFFF",
  onPhotoMuted: "rgba(255, 255, 255, 0.8)",
  photoScrimTop: "rgba(0, 0, 0, 0.45)",
  photoScrimMiddle: "rgba(0, 0, 0, 0.15)",
  photoScrimBottom: "rgba(0, 0, 0, 0.9)",
  googleButton: "#FFFFFF",
  onGoogleButton: "#1F1F1F",
  appleButton: "#000000",
  onAppleButton: "#FFFFFF",
  // swipe deck
  superLike: "#2F9BFF",
  rewind: "#F5B300",
  verified: "#2F9BFF",
  stampLike: "#10c281",
  stampNope: "#FF4458",
} as const;

export type ThemeColors = {
  // surfaces
  bg: string;
  surface: string;
  card: string;
  border: string;
  // text
  text: string;
  textMuted: string;
  textSubtle: string;
  // brand
  primary: string;
  primaryAlt: string;
  onPrimary: string;
  primarySoft: string;
  gradientStart: string;
  gradientEnd: string;
  // boost (boost button + boost bottom sheet)
  boost: string;
  onBoost: string;
  boostSoft: string;
  // danger (delete, report…)
  danger: string;
  onDanger: string;
  dangerSoft: string;
  // overlays & chrome
  overlay: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  skeleton: string;
  toastBg: string;
  toastText: string;
  // on top of photos + sign-in buttons
  onPhoto: string;
  onPhotoMuted: string;
  photoScrimTop: string;
  photoScrimMiddle: string;
  photoScrimBottom: string;
  googleButton: string;
  onGoogleButton: string;
  appleButton: string;
  onAppleButton: string;
  // swipe deck
  superLike: string;
  rewind: string;
  verified: string;
  stampLike: string;
  stampNope: string;
};

export const lightColors: ThemeColors = {
  bg: "#FFFFFF",
  surface: "#F8F3F5",
  card: "#FFFFFF",
  border: "#EEE2E7",

  text: "#1F1218",
  textMuted: "#6D5A63",
  textSubtle: "#9A8890",

  primary: brand.pink,
  primaryAlt: brand.coral,
  onPrimary: brand.white,
  primarySoft: "rgba(241, 48, 116, 0.12)",
  gradientStart: brand.pink,
  gradientEnd: brand.coral,

  boost: brand.boost,
  onBoost: brand.white,
  boostSoft: "rgba(16, 194, 129, 0.14)",

  danger: "#E5383B",
  onDanger: brand.white,
  dangerSoft: "rgba(229, 56, 59, 0.12)",

  overlay: "rgba(20, 8, 14, 0.55)",
  tabBar: "#FFFFFF",
  // light mode: active tab in Yonder pink, inactive grey
  tabActive: brand.pink,
  tabInactive: "#A3A3A8",
  skeleton: "#F1E7EB",
  toastBg: "#1F1218",
  toastText: "#FFFFFF",

  ...onPhotoTokens,
};

export const darkColors: ThemeColors = {
  bg: "#120A0E",
  surface: "#1C1117",
  card: "#22141B",
  border: "#33212A",

  text: "#F6E9EF",
  textMuted: "#B49BA7",
  textSubtle: "#7E6873",

  primary: brand.pink,
  primaryAlt: brand.coral,
  onPrimary: brand.white,
  primarySoft: "rgba(241, 48, 116, 0.20)",
  gradientStart: brand.pink,
  gradientEnd: brand.coral,

  boost: brand.boost,
  onBoost: brand.white,
  boostSoft: "rgba(16, 194, 129, 0.20)",

  danger: "#FF5A5F",
  onDanger: brand.white,
  dangerSoft: "rgba(255, 90, 95, 0.18)",

  overlay: "rgba(0, 0, 0, 0.65)",
  tabBar: "#170D13",
  // tab icons match the phone's white buttons in dark mode
  tabActive: "#FFFFFF",
  tabInactive: "#8C8C91",
  skeleton: "#2A1A22",
  toastBg: "#F6E9EF",
  toastText: "#1F1218",

  ...onPhotoTokens,
};
