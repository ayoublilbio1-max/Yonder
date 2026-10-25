import Constants from 'expo-constants';

export const APP_NAME = 'Yonder';

// Read from app.json "version" so it never gets out of sync.
export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.0';

export const DEVELOPER = 'ayoubgharts';

// Public profile (not the /edit link).
export const FIVERR_URL = 'https://www.fiverr.com/ayoubgharts';

// Android bottom navigation bar (the phone's back / home / recent buttons).
// false = shown under our tab bar (test look)   ·   true = hidden (swipe up shows it for a moment)
export const HIDE_ANDROID_NAV_BAR = false;
