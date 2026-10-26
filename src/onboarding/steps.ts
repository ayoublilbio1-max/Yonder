import type { Href } from "expo-router";
import type { ProfileDraft } from "./types";

// Order of the onboarding questions. Part 2b adds more ids here.
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

const ANSWER_OF: Record<StepId, keyof ProfileDraft> = {
  gender: "gender",
  name: "firstName",
  birthday: "birthday",
  intent: "intent",
  marital: "maritalStatus",
  children: "hasChildren",
  height: "heightCm",
  smoking: "smoking",
  drinking: "drinking",
  religion: "religion",
};

export function isAnswered(draft: ProfileDraft, id: StepId) {
  const value = draft[ANSWER_OF[id]];
  return value !== undefined && value !== "";
}

export function firstUnanswered(draft: ProfileDraft): StepId | null {
  return STEP_IDS.find((id) => !isAnswered(draft, id)) ?? null;
}

export function answeredCount(draft: ProfileDraft) {
  return STEP_IDS.filter((id) => isAnswered(draft, id)).length;
}
