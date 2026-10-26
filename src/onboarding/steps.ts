import type { Href } from "expo-router";
import { MIN_PHOTOS } from "./options";
import type { ProfileDraft } from "./types";

// Order of the onboarding questions.
export const STEP_IDS = [
  "gender",
  "name",
  "birthday",
  "intent",
  "marital",
  "children",
  "height",
  "smoking",
  "drinking",
  "religion",
  "profession",
  "education",
  "nationality",
  "interests",
  "personality",
  "bio",
  "photos",
  "phone",
] as const;

export type StepId = (typeof STEP_IDS)[number];

export function isStepId(value: unknown): value is StepId {
  return (
    typeof value === "string" && (STEP_IDS as readonly string[]).includes(value)
  );
}

export function stepHref(id: StepId): Href {
  return `/step/${id}` as Href;
}

export const FINISH_HREF = "/finish" as Href;

// Where to go after this step (the finish screen after the last one).
export function nextHref(id: StepId): Href {
  const next = STEP_IDS[STEP_IDS.indexOf(id) + 1];
  return next ? stepHref(next) : FINISH_HREF;
}

// 0..1 for the progress bar.
export function stepProgress(id: StepId) {
  return (STEP_IDS.indexOf(id) + 1) / (STEP_IDS.length + 1);
}

// When is a question answered? (skipped answers count as answered)
const ANSWERED: Record<StepId, (d: ProfileDraft) => boolean> = {
  gender: (d) => Boolean(d.gender),
  name: (d) => Boolean(d.firstName),
  birthday: (d) => Boolean(d.birthday),
  intent: (d) => Boolean(d.intent),
  marital: (d) => Boolean(d.maritalStatus),
  children: (d) => Boolean(d.hasChildren),
  height: (d) => d.heightCm != null,
  smoking: (d) => Boolean(d.smoking),
  drinking: (d) => Boolean(d.drinking),
  religion: (d) => Boolean(d.religion),
  profession: (d) => Boolean(d.profession),
  education: (d) => Boolean(d.education),
  nationality: (d) => (d.nationalities?.length ?? 0) > 0,
  interests: (d) => d.interests !== undefined,
  personality: (d) => d.personality !== undefined,
  bio: (d) => d.bio !== undefined,
  photos: (d) => (d.photos?.length ?? 0) >= MIN_PHOTOS,
  phone: (d) => d.phoneVerified === true,
};

export function isAnswered(draft: ProfileDraft, id: StepId) {
  return ANSWERED[id](draft);
}

export function firstUnanswered(draft: ProfileDraft): StepId | null {
  return STEP_IDS.find((id) => !isAnswered(draft, id)) ?? null;
}

export function answeredCount(draft: ProfileDraft) {
  return STEP_IDS.filter((id) => isAnswered(draft, id)).length;
}
