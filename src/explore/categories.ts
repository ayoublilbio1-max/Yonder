import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { isJustJoined, isLocked, lastActiveHours } from "../profiles/extras";
import { profileKm } from "../profiles/session";
import type { Profile } from "../profiles/types";

// Explore categories (like Tinder Explore). Each one is a filter on your deck
// (your filters + rule 9.4 still apply, swiped / matched / blocked people are not shown).

type IconName = ComponentProps<typeof Ionicons>["name"];

export type Category = {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  gold?: boolean; // Yonder Gold only
  test: (p: Profile) => boolean;
};

const hasAny = (p: Profile, list: string[]) =>
  p.interests.some((i) => list.includes(i));

export const LOOKING_FOR: Category[] = [
  {
    key: "marriage",
    title: "Ready for marriage",
    subtitle: "Looking for a husband or wife",
    icon: "diamond-outline",
    test: (p) => p.intent === "marriage",
  },
  {
    key: "serious",
    title: "Something serious",
    subtitle: "A long-term relationship",
    icon: "heart-outline",
    test: (p) => p.intent === "serious_relationship",
  },
  {
    key: "friends",
    title: "New friends",
    subtitle: "Meet people, no pressure",
    icon: "people-outline",
    test: (p) => p.intent === "new_friends",
  },
  {
    key: "fun",
    title: "Just for fun",
    subtitle: "See where it goes",
    icon: "sparkles-outline",
    test: (p) => p.intent === "for_fun",
  },
];

export const HIGHLIGHTS: Category[] = [
  {
    key: "verified",
    title: "Verified",
    subtitle: "Photo-verified profiles",
    icon: "shield-checkmark-outline",
    test: (p) => p.verified,
  },
  {
    key: "new",
    title: "Just joined",
    subtitle: "New this week",
    icon: "person-add-outline",
    test: (p) => isJustJoined(p),
  },
  {
    key: "active",
    title: "Active now",
    subtitle: "Online in the last hour",
    icon: "pulse-outline",
    gold: true,
    test: (p) => lastActiveHours(p) <= 1,
  },
  {
    key: "nearby",
    title: "Nearby",
    subtitle: "Less than 10 km away",
    icon: "location-outline",
    gold: true,
    test: (p) => profileKm(p) < 10,
  },
  {
    key: "video",
    title: "With a video",
    subtitle: "See them move and talk",
    icon: "videocam-outline",
    test: (p) => Boolean(p.video) && !isLocked(p),
  },
];

export const PASSIONS: Category[] = [
  {
    key: "travel",
    title: "Travel lovers",
    subtitle: "Trips, beaches, road trips",
    icon: "airplane-outline",
    test: (p) => hasAny(p, ["Travel", "Road trips", "Camping", "Beach"]),
  },
  {
    key: "food",
    title: "Foodies",
    subtitle: "Cooking, coffee, good food",
    icon: "restaurant-outline",
    test: (p) =>
      hasAny(p, ["Food", "Cooking", "Baking", "Coffee", "Wine tasting"]),
  },
  {
    key: "fitness",
    title: "Fitness",
    subtitle: "Gym, running, yoga",
    icon: "barbell-outline",
    test: (p) =>
      hasAny(p, [
        "Gym",
        "Running",
        "Yoga",
        "Sport",
        "Cycling",
        "Climbing",
        "Swimming",
      ]),
  },
  {
    key: "music",
    title: "Music & concerts",
    subtitle: "Gigs, dancing, playlists",
    icon: "musical-notes-outline",
    test: (p) => hasAny(p, ["Music", "Concerts", "Dancing"]),
  },
  {
    key: "outdoors",
    title: "Outdoors",
    subtitle: "Hiking, nature, sea",
    icon: "leaf-outline",
    test: (p) =>
      hasAny(p, [
        "Hiking",
        "Nature",
        "Skiing",
        "Surfing",
        "Diving",
        "Horse riding",
      ]),
  },
  {
    key: "books",
    title: "Book lovers",
    subtitle: "Reading, writing, history",
    icon: "book-outline",
    test: (p) => hasAny(p, ["Reading", "Writing", "Poetry", "History"]),
  },
  {
    key: "games",
    title: "Gamers",
    subtitle: "Video & board games",
    icon: "game-controller-outline",
    test: (p) => hasAny(p, ["Gaming", "Board games", "Technology"]),
  },
  {
    key: "pets",
    title: "Pet lovers",
    subtitle: "Dogs and cats people",
    icon: "paw-outline",
    test: (p) => hasAny(p, ["Dogs", "Cats"]),
  },
];

// A photo for the category card: the first person in it whose photos aren't private.
export function coverOf(list: Profile[]) {
  return list.find((p) => !isLocked(p)) ?? list[0];
}
