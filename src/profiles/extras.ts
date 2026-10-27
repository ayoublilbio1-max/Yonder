import { sessionRandom } from "./session";
import type { Profile } from "./types";

// Simulated profile extras, fixed for one app session: locked photos, Gold, just joined, last active.

// Locked = marked blurred in the data AND 2 photos or fewer (agreed rule, replaces "all blurred").
export function isLocked(p: Profile) {
  return p.blurred && p.photos.length <= 2;
}

export function isGold(p: Profile) {
  return sessionRandom(`${p.id}:gold`) < 0.15;
}

// Days since the profile joined (about 12% joined in the last week).
export function joinedDaysAgo(p: Profile) {
  const r = sessionRandom(`${p.id}:joined`);
  return r < 0.12 ? Math.floor((r / 0.12) * 7) : 8 + Math.floor(r * 400);
}

export function isJustJoined(p: Profile) {
  return joinedDaysAgo(p) <= 7;
}

// Hours since last active: now · a few hours · today · this week · this month.
export function lastActiveHours(p: Profile) {
  const r = sessionRandom(`${p.id}:active`);
  if (r < 0.2) return 0;
  if (r < 0.45) return 1 + Math.floor(((r - 0.2) / 0.25) * 8);
  if (r < 0.7) return 9 + Math.floor(((r - 0.45) / 0.25) * 15);
  if (r < 0.85) return 24 * (2 + Math.floor(((r - 0.7) / 0.15) * 6));
  return 24 * (8 + Math.floor(((r - 0.85) / 0.15) * 22));
}

export function isRecentlyActive(p: Profile) {
  return lastActiveHours(p) < 24;
}

export function activityLabel(p: Profile) {
  const h = lastActiveHours(p);
  if (h === 0) return "Active now";
  if (h === 1) return "Active 1 hour ago";
  if (h <= 8) return `Active ${h} hours ago`;
  if (h < 24) return "Active today";
  if (h < 48) return "Active yesterday";
  if (h < 24 * 8) return `Active ${Math.round(h / 24)} days ago`;
  return "Active last month";
}

export const MARITAL_LABEL: Record<Profile["marital"], string> = {
  neverMarried: "Never married",
  divorced: "Divorced",
  widowed: "Widowed",
};

export const SMOKING_LABEL: Record<string, string> = {
  never: "Doesn’t smoke",
  socially: "Smokes socially",
  regularly: "Smokes regularly",
  trying_to_quit: "Trying to quit smoking",
};

export const DRINKING_LABEL: Record<string, string> = {
  never: "Doesn’t drink",
  socially: "Drinks socially",
  regularly: "Drinks regularly",
};

export const PERSONALITY_NAME: Record<string, string> = {
  INTJ: "Architect",
  INTP: "Logician",
  ENTJ: "Commander",
  ENTP: "Debater",
  INFJ: "Advocate",
  INFP: "Mediator",
  ENFJ: "Protagonist",
  ENFP: "Campaigner",
  ISTJ: "Logistician",
  ISFJ: "Defender",
  ESTJ: "Executive",
  ESFJ: "Consul",
  ISTP: "Virtuoso",
  ISFP: "Adventurer",
  ESTP: "Entrepreneur",
  ESFP: "Entertainer",
};

export function heightLabel(cm: number | null) {
  if (!cm) return "";
  const totalIn = Math.round(cm / 2.54);
  return `${cm} cm · ${Math.floor(totalIn / 12)}′ ${totalIn % 12}″`;
}
