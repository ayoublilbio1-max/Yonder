import { R2_BASE } from "../constants/app";
import raw from "../data/profiles.json";
import type { MediaItem, Profile, ProfileIntent } from "./types";

export const PROFILES = raw as unknown as Profile[];

const BY_ID = new Map(PROFILES.map((p) => [p.id, p]));

export function profileById(id: string) {
  return BY_ID.get(id);
}

// R2 folder: p0001 → profiles/p-0001/
export function mediaBase(p: Profile) {
  return `${R2_BASE}/profiles/p-${p.id.slice(1)}/`;
}

export function mainPhotoUri(p: Profile) {
  return mediaBase(p) + p.photos[0];
}

// Rule 9.2: 1.webp, then the video, then the other photos.
// Rule 9.3: a blurred profile never shows its video.
export function mediaOf(p: Profile): MediaItem[] {
  const base = mediaBase(p);
  const [first, ...rest] = p.photos;
  const items: MediaItem[] = [{ type: "photo", uri: base + first }];
  if (p.video && !p.blurred) items.push({ type: "video", uri: base + p.video });
  rest.forEach((file) => items.push({ type: "photo", uri: base + file }));
  return items;
}

export const INTENT_LABEL: Record<ProfileIntent, string> = {
  marriage: "Ready for marriage",
  serious_relationship: "Serious relationship",
  new_friends: "New friends",
  for_fun: "Just for fun",
};

export const INTENT_ICON: Record<
  ProfileIntent,
  "diamond-outline" | "heart-outline" | "people-outline" | "sparkles-outline"
> = {
  marriage: "diamond-outline",
  serious_relationship: "heart-outline",
  new_friends: "people-outline",
  for_fun: "sparkles-outline",
};
