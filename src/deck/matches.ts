import type { SwipeAction } from "./SwipeProvider";

// Simulated matches (demo), fixed rules so testers get matches at a natural pace:
// - your first like is a match, and your first super like is a match;
// - after that, a like is a match once you have swiped 5 people since the last match;
// - after 2 super likes without a match, the next (3rd) super like is a match.

export type MatchCounters = {
  firstLikeDone: boolean;
  firstSuperDone: boolean;
  swipesSinceMatch: number; // every swipe counts (like, pass, super like)
  supersSinceMatch: number; // super likes since the last super like match
};

export const EMPTY_COUNTERS: MatchCounters = {
  firstLikeDone: false,
  firstSuperDone: false,
  swipesSinceMatch: 0,
  supersSinceMatch: 0,
};

const SWIPES_FOR_LIKE_MATCH = 5;
const SUPERS_FOR_SUPER_MATCH = 3;

export function decideMatch(
  c: MatchCounters,
  action: SwipeAction,
): { matched: boolean; next: MatchCounters } {
  const swipes = c.swipesSinceMatch + 1;
  const supers =
    action === "superlike" ? c.supersSinceMatch + 1 : c.supersSinceMatch;

  let matched = false;
  if (action === "like")
    matched = !c.firstLikeDone || swipes >= SWIPES_FOR_LIKE_MATCH;
  if (action === "superlike")
    matched = !c.firstSuperDone || supers >= SUPERS_FOR_SUPER_MATCH;

  const next: MatchCounters = {
    firstLikeDone: c.firstLikeDone || action === "like",
    firstSuperDone: c.firstSuperDone || action === "superlike",
    swipesSinceMatch: matched ? 0 : swipes,
    supersSinceMatch: matched && action === "superlike" ? 0 : supers,
  };
  return { matched, next };
}
