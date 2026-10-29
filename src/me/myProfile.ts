import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { countryByCode, flagOf, type Country } from "../onboarding/countries";
import {
    ALL_INTEREST_CHIPS,
    chipLabels,
    PERSONALITY_TRAITS,
} from "../onboarding/interests";
import {
    cmToFeet,
    DRINKING_OPTIONS,
    EDUCATION_OPTIONS,
    INTENT_OPTIONS,
    labelOf,
    MARITAL_OPTIONS,
    MAX_PHOTOS,
    RELIGION_OPTIONS,
    SMOKING_OPTIONS,
} from "../onboarding/options";
import type { ProfileDraft } from "../onboarding/types";

// Your own profile (the Profile tab): labels, the "complete your profile" score and the edit rows.

type IconName = ComponentProps<typeof Ionicons>["name"];

export function ageOf(birthday: string | undefined, now = new Date()) {
  if (!birthday) return null;
  const [y, m, d] = birthday.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d))
    age -= 1;
  return age;
}

export function birthdayLabel(birthday: string | undefined) {
  if (!birthday) return "";
  const [y, m, d] = birthday.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export const heightText = (cm: number | undefined) =>
  cm ? `${cm} cm (${cmToFeet(cm)})` : "";

export function nationalityText(codes: string[] | undefined) {
  return (codes ?? [])
    .map((c) => countryByCode(c))
    .filter((c): c is Country => Boolean(c))
    .map((c) => `${flagOf(c.code)} ${c.nationality}`)
    .join(", ");
}

export const interestChips = (me: ProfileDraft) =>
  chipLabels(ALL_INTEREST_CHIPS, me.interests);
export const traitChips = (me: ProfileDraft) =>
  chipLabels(PERSONALITY_TRAITS, me.personality);

// "Animation, Anime, Coding and 11 others" (like Muzz)
function listText(labels: string[]) {
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} and ${labels.length - 3} others`;
}

// ---------- edit rows ----------

export type FieldKey =
  | "firstName"
  | "birthday"
  | "gender"
  | "intent"
  | "maritalStatus"
  | "hasChildren"
  | "heightCm"
  | "smoking"
  | "drinking"
  | "religion"
  | "education"
  | "profession"
  | "nationalities"
  | "interests"
  | "personality"
  | "bio";

export type Field = {
  key: FieldKey;
  title: string;
  icon: IconName;
  empty: string; // shown in pink when there is no answer
  locked?: boolean; // can't be changed after sign-up
};

export const FIELDS: Record<FieldKey, Field> = {
  firstName: {
    key: "firstName",
    title: "First name",
    icon: "person-outline",
    empty: "Add your name",
  },
  birthday: {
    key: "birthday",
    title: "Date of birth",
    icon: "calendar-outline",
    empty: "",
    locked: true,
  },
  gender: {
    key: "gender",
    title: "Gender",
    icon: "male-female-outline",
    empty: "",
    locked: true,
  },
  intent: {
    key: "intent",
    title: "Looking for",
    icon: "heart-outline",
    empty: "What are you looking for?",
  },
  maritalStatus: {
    key: "maritalStatus",
    title: "Marital status",
    icon: "ribbon-outline",
    empty: "Complete your profile",
  },
  hasChildren: {
    key: "hasChildren",
    title: "Children",
    icon: "people-outline",
    empty: "Complete your profile",
  },
  heightCm: {
    key: "heightCm",
    title: "Height",
    icon: "resize-outline",
    empty: "Add your height",
  },
  smoking: {
    key: "smoking",
    title: "Smoking",
    icon: "flame-outline",
    empty: "Complete your profile",
  },
  drinking: {
    key: "drinking",
    title: "Alcohol",
    icon: "wine-outline",
    empty: "Complete your profile",
  },
  religion: {
    key: "religion",
    title: "Religion",
    icon: "sparkles-outline",
    empty: "Complete your profile",
  },
  education: {
    key: "education",
    title: "Education",
    icon: "school-outline",
    empty: "Add your education",
  },
  profession: {
    key: "profession",
    title: "Profession",
    icon: "briefcase-outline",
    empty: "Add your job",
  },
  nationalities: {
    key: "nationalities",
    title: "Nationality",
    icon: "flag-outline",
    empty: "Add your nationality",
  },
  interests: {
    key: "interests",
    title: "Interests",
    icon: "color-palette-outline",
    empty: "Add your interests",
  },
  personality: {
    key: "personality",
    title: "Personality",
    icon: "happy-outline",
    empty: "Describe your personality",
  },
  bio: {
    key: "bio",
    title: "Bio",
    icon: "chatbubble-outline",
    empty: "Write a few words about you",
  },
};

// Muzz-style sections on the Edit tab.
export const EDIT_SECTIONS: { title: string; keys: FieldKey[] }[] = [
  {
    title: "About me",
    keys: ["bio", "intent", "heightCm", "maritalStatus", "hasChildren"],
  },
  { title: "Interests and personality", keys: ["interests", "personality"] },
  { title: "Education and career", keys: ["education", "profession"] },
  { title: "Lifestyle", keys: ["religion", "drinking", "smoking"] },
  { title: "Background", keys: ["nationalities"] },
  { title: "Personal information", keys: ["firstName", "birthday", "gender"] },
];

export function fieldValue(me: ProfileDraft, key: FieldKey): string {
  switch (key) {
    case "firstName":
      return me.firstName ?? "";
    case "birthday":
      return birthdayLabel(me.birthday);
    case "gender":
      return me.gender === "man" ? "Man" : me.gender === "woman" ? "Woman" : "";
    case "intent":
      return labelOf(INTENT_OPTIONS, me.intent);
    case "maritalStatus":
      return labelOf(MARITAL_OPTIONS, me.maritalStatus);
    case "hasChildren":
      return me.hasChildren === "yes"
        ? "Has children"
        : me.hasChildren === "no"
          ? "No children"
          : "";
    case "heightCm":
      return heightText(me.heightCm);
    case "smoking":
      return labelOf(SMOKING_OPTIONS, me.smoking);
    case "drinking":
      return labelOf(DRINKING_OPTIONS, me.drinking);
    case "religion":
      return labelOf(RELIGION_OPTIONS, me.religion);
    case "education":
      return labelOf(EDUCATION_OPTIONS, me.education);
    case "profession":
      return me.profession ?? "";
    case "nationalities":
      return nationalityText(me.nationalities);
    case "interests":
      return listText(interestChips(me).map((c) => c.label));
    case "personality":
      return listText(traitChips(me).map((c) => c.label));
    case "bio":
      return me.bio ?? "";
  }
}

// ---------- complete your profile ----------

// Each part counts the same. 6 photos and a verified photo count too (like Tinder / Muzz).
const SCORED: FieldKey[] = [
  "intent",
  "maritalStatus",
  "hasChildren",
  "heightCm",
  "smoking",
  "drinking",
  "religion",
  "education",
  "profession",
  "nationalities",
  "interests",
  "personality",
  "bio",
];

export function completion(me: ProfileDraft) {
  const parts = [
    ...SCORED.map(
      (k) =>
        fieldValue(me, k) !== "" &&
        !(k === "religion" && me.religion === "prefer_not"),
    ),
    (me.photos?.length ?? 0) >= MAX_PHOTOS,
    Boolean(me.photoVerified),
  ];
  const done = parts.filter(Boolean).length;
  return Math.round((done / parts.length) * 100);
}

// The first thing still missing, for the "Complete your profile" hint.
export function nextMissing(me: ProfileDraft): string | null {
  if ((me.photos?.length ?? 0) < MAX_PHOTOS)
    return `Add ${MAX_PHOTOS - (me.photos?.length ?? 0)} more photos`;
  if (!me.photoVerified) return "Verify your photo";
  const k = SCORED.find((key) => fieldValue(me, key) === "");
  return k ? FIELDS[k].empty : null;
}
