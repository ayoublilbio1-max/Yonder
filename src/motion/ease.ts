import { Easing } from "react-native-reanimated";

// Yonder motion rule (brief, section 7): everything that moves eases like CSS `transition`.
// No bounce, no overshoot, no frame jumps.

export const EASE = Easing.bezier(0.25, 0.1, 0.25, 1); // CSS "ease"
export const EASE_OUT = Easing.bezier(0, 0, 0.58, 1); // CSS "ease-out" — things arriving
export const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1); // CSS "ease-in-out" — things leaving / switching

export const DURATION = {
  press: 160, // finger down
  release: 220, // finger up
  quick: 200, // small state changes (a tab, a check)
  sheet: 320, // sheets, popups, pages
  page: 300,
} as const;
