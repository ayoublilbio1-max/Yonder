import { PROFILES } from "../profiles/data";
import { sessionRandom } from "../profiles/session";
import type { Profile, ProfileGender } from "../profiles/types";

// Rule 9.1 — deck priority:
// 1. profiles with a video (random order)
// 2. then by number of photos, most first (random among equal counts)
// 3. single-photo profiles last
// The order is computed once per app session, so changing a filter and back gives the same deck.

let sessionOrder: Profile[] | null = null;

function getSessionOrder() {
  if (sessionOrder) return sessionOrder;
  const t0 = Date.now();
  const rank = new Map(PROFILES.map((p) => [p.id, sessionRandom(p.id)]));
  sessionOrder = [...PROFILES].sort((a, b) => {
    const groupA = a.video ? 0 : 1;
    const groupB = b.video ? 0 : 1;
    if (groupA !== groupB) return groupA - groupB;
    if (groupA === 1 && a.photos.length !== b.photos.length)
      return b.photos.length - a.photos.length;
    return (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0);
  });
  if (__DEV__) {
    const videos = sessionOrder.filter((p) => p.video).length;
    console.log(
      `[deck] session order built in ${Date.now() - t0}ms · ${sessionOrder.length} profiles · ${videos} with video first`,
    );
  }
  return sessionOrder;
}

export function buildDeck(show: ProfileGender, hiddenIds: Set<string>) {
  return getSessionOrder().filter(
    (p) => p.gender === show && !hiddenIds.has(p.id),
  );
}
