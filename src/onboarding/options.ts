import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { Frequency, Intent, MaritalStatus, YesNo } from "./types";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
};

export const INTENT_OPTIONS: Option<Intent>[] = [
  {
    value: "marriage",
    label: "Ready to get married",
    description: "I want to find my life partner soon.",
    icon: "diamond-outline",
  },
  {
    value: "serious",
    label: "A serious relationship",
    description: "I want something long-term.",
    icon: "heart-outline",
  },
  {
    value: "friends",
    label: "New friends",
    description: "I want to meet new people first.",
    icon: "people-outline",
  },
  {
    value: "fun",
    label: "Just for fun",
    description: "Let’s see where it goes.",
    icon: "sparkles-outline",
  },
];

export const MARITAL_OPTIONS: Option<MaritalStatus>[] = [
  { value: "never_married", label: "Never married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

export const CHILDREN_OPTIONS: Option<YesNo>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const SMOKING_OPTIONS: Option<Frequency>[] = [
  { value: "never", label: "No, never" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Yes, regularly" },
];

export const DRINKING_OPTIONS: Option<Frequency>[] = [
  { value: "never", label: "No, never" },
  { value: "sometimes", label: "Socially" },
  { value: "often", label: "Yes, regularly" },
];

export const RELIGION_OPTIONS: Option<string>[] = [
  { value: "christianity", label: "Christianity" },
  { value: "islam", label: "Islam" },
  { value: "judaism", label: "Judaism" },
  { value: "hinduism", label: "Hinduism" },
  { value: "buddhism", label: "Buddhism" },
  { value: "spiritual", label: "Spiritual" },
  { value: "agnostic", label: "Agnostic" },
  { value: "atheist", label: "Atheist" },
  { value: "other", label: "Other" },
  { value: "prefer_not", label: "Prefer not to say" },
];

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const HEIGHT_MIN_CM = 140;
export const HEIGHT_MAX_CM = 210;

export function cmToFeet(cm: number) {
  let feet = Math.floor(cm / 2.54 / 12);
  let inches = Math.round(cm / 2.54 - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return `${feet}′ ${inches}″`;
}

export function labelOf<T extends string>(
  options: Option<T>[],
  value: T | undefined,
) {
  return options.find((o) => o.value === value)?.label ?? "";
}
