import Constants from "expo-constants";

export const APP_NAME = "Yonder";

// Read from app.json "version" so it never gets out of sync.
export const APP_VERSION: string = Constants.expoConfig?.version ?? "1.0.0";

export const DEVELOPER = "ayoubgharts";

// Public profile (not the /edit link).
export const FIVERR_URL = "https://www.fiverr.com/ayoubgharts";

// Android bottom navigation bar (the phone's back / home / recent buttons).
// false = shown under our tab bar   ·   true = hidden (swipe up shows it for a moment)
export const HIDE_ANDROID_NAV_BAR = false;

// Google sign-in: the WEB client ID from Google Cloud (not secret).
export const GOOGLE_WEB_CLIENT_ID =
  "1015977409172-pnth1ojacqm4o4fv7e3td6mng1aiej7o.apps.googleusercontent.com";

// Public pages (GitHub Pages, docs folder of the repo).
export const HOME_URL = "https://ayoublilbio1-max.github.io/Yonder/";
export const PRIVACY_URL =
  "https://ayoublilbio1-max.github.io/Yonder/privacy.html";
// The testing guide for clients (docs/testing.html in the repo). Opened from Settings › Help.
export const TESTING_URL =
  "https://ayoublilbio1-max.github.io/Yonder/testing.html";

// Profile media on Cloudflare R2.
export const R2_BASE = "https://pub-478b6792f35141b2a8f7dcad02df4d71.r2.dev";

// Background photo of the welcome screen.
export const WELCOME_PHOTO = `${R2_BASE}/profiles/p-0150/1.webp`;
