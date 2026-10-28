import { sessionRandom } from "../profiles/session";
import type { SwipeAction } from "./SwipeProvider";

// Simulated matches (demo): does this like come back as a match?
// - your very first like always matches, so testers see the match screen quickly;
// - after that: like ≈ 35%, super like ≈ 70% (fixed per profile for the session).

const LIKE_CHANCE = 0.35;
const SUPER_LIKE_CHANCE = 0.7;

export function willMatch(
  profileId: string,
  action: SwipeAction,
  isFirstLike: boolean,
) {
  if (action === "pass") return false;
  if (isFirstLike) return true;
  const r = sessionRandom(`${profileId}:match`);
  return r < (action === "superlike" ? SUPER_LIKE_CHANCE : LIKE_CHANCE);
}
