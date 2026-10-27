import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ProfileDraft } from "../onboarding/types";
import { joinedDaysAgo, lastActiveHours } from "../profiles/extras";
import { distanceKm } from "../profiles/session";
import type { Profile } from "../profiles/types";
import { INTENT_MAP } from "./similarities";

// Sort for the Swipe deck. "Recommended" keeps rule 9.1 (videos → most photos → single photo).
// The other sorts are stable: profiles that tie keep the recommended order between them.

export type SortKey =
  | "recommended"
  | "age_asc"
  | "in_their_filters"
  | "age_desc"
  | "distance"
  | "just_joined"
  | "recently_active"
  | "verified"
  | "complete_bio";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const SORT_OPTIONS: { key: SortKey; label: string; icon: IconName }[] = [
  { key: "recommended", label: "Recommended", icon: "sparkles-outline" },
  {
    key: "age_asc",
    label: "Age: youngest to oldest",
    icon: "trending-up-outline",
  },
  {
    key: "in_their_filters",
    label: "I’m in all their filters",
    icon: "funnel-outline",
  },
  {
    key: "age_desc",
    label: "Age: oldest to youngest",
    icon: "trending-down-outline",
  },
  {
    key: "distance",
    label: "Distance: closest first",
    icon: "location-outline",
  },
  { key: "just_joined", label: "Just joined", icon: "person-add-outline" },
  { key: "recently_active", label: "Recently active", icon: "time-outline" },
  {
    key: "verified",
    label: "ID and age verified",
    icon: "shield-checkmark-outline",
  },
  { key: "complete_bio", label: "Complete bio", icon: "document-text-outline" },
];

export function sortLabel(key: SortKey) {
  return SORT_OPTIONS.find((o) => o.key === key)?.label ?? "Recommended";
}

export function sortDeck(
  deck: Profile[],
  key: SortKey,
  me: ProfileDraft,
): Profile[] {
  if (key === "recommended") return deck;
  const t0 = Date.now();

  // smaller value = shown first
  const mine = me.intent ? INTENT_MAP[me.intent] : undefined;
  const VALUE: Record<
    Exclude<SortKey, "recommended">,
    (p: Profile) => number
  > = {
    age_asc: (p) => p.age,
    age_desc: (p) => -p.age,
    distance: (p) => distanceKm(p.id),
    just_joined: (p) => joinedDaysAgo(p),
    recently_active: (p) => lastActiveHours(p),
    verified: (p) => (p.verified ? 0 : 1),
    complete_bio: (p) => -(p.bio || "").length,
    // Simulated: their search matches you when you both want the same thing.
    in_their_filters: (p) => (mine && p.intent === mine ? 0 : 1),
  };
  const value = VALUE[key];

  const sorted = deck
    .map((p, i) => ({ p, i, v: value(p) }))
    .sort((a, b) => a.v - b.v || a.i - b.i)
    .map((x) => x.p);
  if (__DEV__)
    console.log(
      `[sort] deck sorted by ${key} in ${Date.now() - t0}ms · first ${sorted[0]?.id ?? "-"}`,
    );
  return sorted;
}
