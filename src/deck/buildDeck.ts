import { PROFILES } from "../profiles/data";
import { isLocked } from "../profiles/extras";
import { sessionRandom } from "../profiles/session";
import type { Profile, ProfileGender } from "../profiles/types";

// Deck order (rule 9.1, updated):
// 1. profiles with a video (random order)
// 2. then by number of photos, most first (random among equal counts)
// 3. single-photo profiles last
// + locked profiles (blurred, 2 photos or fewer) are mixed in near the start: one about every 6 cards,
//   so testers see the feature early.
// The order is built once per app session and gender, so changing a filter and back gives the same deck.

const LOCKED_EARLY = 12; // how many locked profiles are mixed into the start
const LOCKED_START = 5; // first one at position 6
const LOCKED_EVERY = 6;

const cache = new Map<ProfileGender, Profile[]>();

function priorityOrder(list: Profile[]) {
  const rank = new Map(list.map((p) => [p.id, sessionRandom(p.id)]));
  return [...list].sort((a, b) => {
    const groupA = a.video ? 0 : 1;
    const groupB = b.video ? 0 : 1;
    if (groupA !== groupB) return groupA - groupB;
    if (groupA === 1 && a.photos.length !== b.photos.length)
      return b.photos.length - a.photos.length;
    return (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0);
  });
}

function sessionOrder(show: ProfileGender) {
  const cached = cache.get(show);
  if (cached) return cached;
  const t0 = Date.now();
  const ordered = priorityOrder(PROFILES.filter((p) => p.gender === show));
  const locked = ordered.filter(isLocked);
  const open = ordered.filter((p) => !isLocked(p));
  const early = [...locked]
    .sort(
      (a, b) => sessionRandom(`${a.id}:lock`) - sessionRandom(`${b.id}:lock`),
    )
    .slice(0, LOCKED_EARLY);
  const earlyIds = new Set(early.map((p) => p.id));
  const out = [...open];
  early.forEach((p, i) =>
    out.splice(Math.min(out.length, LOCKED_START + i * LOCKED_EVERY), 0, p),
  );
  // the other locked profiles keep their natural place (they have few photos, so near the end)
  const result = [...out, ...locked.filter((p) => !earlyIds.has(p.id))];
  cache.set(show, result);
  if (__DEV__) {
    console.log(
      `[deck] ${show} order built in ${Date.now() - t0}ms · ${result.length} profiles · ${result.filter((p) => p.video).length} with video · ${locked.length} locked (${early.length} mixed in early)`,
    );
  }
  return result;
}

export function buildDeck(show: ProfileGender, hiddenIds: Set<string>) {
  return sessionOrder(show).filter((p) => !hiddenIds.has(p.id));
}
