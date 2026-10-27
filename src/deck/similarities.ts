import { countryByCode } from "../onboarding/countries";
import { ALL_INTEREST_CHIPS, chipLabels } from "../onboarding/interests";
import type { ProfileDraft } from "../onboarding/types";
import type { Profile } from "../profiles/types";

// "Your similarities": what the tester (onboarding answers) has in common with a profile.

export type Similarity = { key: string; emoji: string; label: string };

// tester intent (onboarding) → profile intent
export const INTENT_MAP: Record<string, Profile["intent"]> = {
  marriage: "marriage",
  serious: "serious_relationship",
  friends: "new_friends",
  fun: "for_fun",
};

const INTENT_TEXT: Record<Profile["intent"], string> = {
  marriage: "Both ready for marriage",
  serious_relationship: "Both want something serious",
  new_friends: "Both open to new friends",
  for_fun: "Both here for fun",
};

// tester religion value → words that appear in profile religions
const RELIGION_WORDS: Record<string, string[]> = {
  christianity: ["christian", "catholic", "orthodox", "protestant"],
  islam: ["muslim", "islam"],
  judaism: ["jewish", "judaism"],
  hinduism: ["hindu"],
  buddhism: ["buddhist"],
  spiritual: ["spiritual"],
  agnostic: ["agnostic"],
  atheist: ["atheist"],
};

const SMOKING_MAP: Record<string, string> = {
  never: "never",
  sometimes: "socially",
  often: "regularly",
};
const DRINKING_MAP: Record<string, string> = {
  never: "never",
  sometimes: "socially",
  often: "regularly",
};

const EDUCATION_MAP: Record<string, string[]> = {
  high_school: ["High school"],
  vocational: ["Trade school"],
  bachelor: ["Bachelor’s degree", "Bachelor's degree", "In college"],
  master: ["Master’s degree", "Master's degree", "In grad school"],
  doctorate: ["PhD"],
};

export function similaritiesOf(me: ProfileDraft, p: Profile): Similarity[] {
  const out: Similarity[] = [];

  if (me.intent && INTENT_MAP[me.intent] === p.intent) {
    out.push({ key: "intent", emoji: "💞", label: INTENT_TEXT[p.intent] });
  }
  if (me.hasChildren) {
    const meHas = me.hasChildren === "yes";
    if (meHas === p.hasChildren)
      out.push({
        key: "children",
        emoji: "👶",
        label: meHas ? "Both have children" : "Neither has children",
      });
  }
  if (me.maritalStatus) {
    const map: Record<string, Profile["marital"]> = {
      never_married: "neverMarried",
      divorced: "divorced",
      widowed: "widowed",
    };
    if (map[me.maritalStatus] === p.marital && p.marital === "neverMarried") {
      out.push({ key: "marital", emoji: "💍", label: "Both never married" });
    }
  }
  if (me.religion && RELIGION_WORDS[me.religion]) {
    const r = p.religion.toLowerCase();
    if (RELIGION_WORDS[me.religion].some((w) => r.includes(w)))
      out.push({ key: "religion", emoji: "🙏", label: `Both ${p.religion}` });
  }
  if (
    me.smoking &&
    SMOKING_MAP[me.smoking] === p.smoking &&
    p.smoking === "never"
  ) {
    out.push({ key: "smoking", emoji: "🚭", label: "Neither of you smokes" });
  }
  if (me.drinking && DRINKING_MAP[me.drinking] === p.drinking) {
    out.push({
      key: "drinking",
      emoji: p.drinking === "never" ? "🧃" : "🥂",
      label:
        p.drinking === "never"
          ? "Neither of you drinks"
          : `Both drink ${p.drinking}`,
    });
  }
  if (me.education && EDUCATION_MAP[me.education]?.includes(p.education)) {
    out.push({
      key: "education",
      emoji: "🎓",
      label: `Same education: ${p.education}`,
    });
  }
  const myNationalities = (me.nationalities ?? []).map((c) =>
    countryByCode(c)?.nationality.toLowerCase(),
  );
  if (p.origins && myNationalities.includes(p.origins.toLowerCase())) {
    out.push({ key: "origins", emoji: "🌍", label: `Both ${p.origins}` });
  }
  const myInterests = new Set(
    chipLabels(ALL_INTEREST_CHIPS, me.interests).map((c) =>
      c.label.toLowerCase(),
    ),
  );
  p.interests
    .filter((i) => myInterests.has(i.toLowerCase()))
    .slice(0, 4)
    .forEach((i) =>
      out.push({
        key: `interest-${i}`,
        emoji: "✨",
        label: `You both like ${i.toLowerCase()}`,
      }),
    );

  return out;
}

// Lower-cased interest labels the tester picked (to highlight shared ones).
export function myInterestSet(me: ProfileDraft) {
  return new Set(
    chipLabels(ALL_INTEREST_CHIPS, me.interests).map((c) =>
      c.label.toLowerCase(),
    ),
  );
}
