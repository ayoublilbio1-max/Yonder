// Interests (max 15) and personality traits (max 5). Yonder's own lists.

export type Chip = { key: string; emoji: string; label: string };
export type ChipGroupData = { title: string; chips: Chip[] };

export const MAX_INTERESTS = 15;
export const MAX_TRAITS = 5;

const chip = (emoji: string, label: string): Chip => ({
  key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  emoji,
  label,
});

export const INTEREST_GROUPS: ChipGroupData[] = [
  {
    title: "Creative",
    chips: [
      chip("🎨", "Art"),
      chip("📸", "Photography"),
      chip("✍️", "Writing"),
      chip("🎭", "Theatre"),
      chip("🎬", "Film & cinema"),
      chip("📚", "Reading"),
      chip("🎸", "Playing music"),
      chip("🎤", "Singing"),
      chip("💃", "Dancing"),
      chip("🧶", "Crafts & DIY"),
      chip("👗", "Fashion"),
      chip("🖌️", "Design"),
    ],
  },
  {
    title: "Sports & fitness",
    chips: [
      chip("🏋️", "Gym"),
      chip("🏃", "Running"),
      chip("🧘", "Yoga"),
      chip("⚽", "Football"),
      chip("🏀", "Basketball"),
      chip("🎾", "Tennis"),
      chip("🏊", "Swimming"),
      chip("🚴", "Cycling"),
      chip("🥊", "Boxing"),
      chip("⛷️", "Skiing"),
      chip("🏄", "Surfing"),
      chip("🧗", "Climbing"),
    ],
  },
  {
    title: "Food & drink",
    chips: [
      chip("🍳", "Cooking"),
      chip("🍰", "Baking"),
      chip("☕", "Coffee"),
      chip("🍣", "Sushi"),
      chip("🍕", "Pizza"),
      chip("🌱", "Vegan food"),
      chip("🍔", "Street food"),
      chip("🥐", "Brunch"),
      chip("🍵", "Tea"),
    ],
  },
  {
    title: "Going out",
    chips: [
      chip("🎵", "Live music"),
      chip("🎉", "Festivals"),
      chip("🍽️", "Restaurants"),
      chip("😂", "Stand-up comedy"),
      chip("🎲", "Board games"),
      chip("🛍️", "Shopping"),
      chip("🖼️", "Museums"),
      chip("🎳", "Bowling"),
    ],
  },
  {
    title: "Outdoors & travel",
    chips: [
      chip("✈️", "Travel"),
      chip("🏕️", "Camping"),
      chip("🥾", "Hiking"),
      chip("🏖️", "Beach"),
      chip("🚗", "Road trips"),
      chip("🎣", "Fishing"),
      chip("🌿", "Gardening"),
      chip("🐾", "Animals"),
    ],
  },
  {
    title: "Staying in",
    chips: [
      chip("📺", "TV series"),
      chip("🎧", "Podcasts"),
      chip("🎮", "Video games"),
      chip("🧩", "Puzzles"),
      chip("🍿", "Movie nights"),
      chip("🌍", "Learning languages"),
      chip("💻", "Tech"),
      chip("🧠", "Self-improvement"),
    ],
  },
];

export const PERSONALITY_TRAITS: Chip[] = [
  chip("👂", "Good listener"),
  chip("🧭", "Adventurous"),
  chip("🥰", "Affectionate"),
  chip("🎯", "Ambitious"),
  chip("🐶", "Animal lover"),
  chip("📖", "Bookworm"),
  chip("😌", "Calm"),
  chip("😏", "Charismatic"),
  chip("😁", "Cheerful"),
  chip("💪", "Competitive"),
  chip("✨", "Confident"),
  chip("🎨", "Creative"),
  chip("❤️", "Empathetic"),
  chip("💼", "Entrepreneurial"),
  chip("🏡", "Family-oriented"),
  chip("😂", "Funny"),
  chip("🤗", "Generous"),
  chip("🙏", "Honest"),
  chip("🧠", "Intellectual"),
  chip("🫶", "Loyal"),
  chip("🌙", "Night owl"),
  chip("🌅", "Early bird"),
  chip("🎉", "Outgoing"),
  chip("🧘", "Patient"),
  chip("🛋️", "Homebody"),
  chip("🌹", "Romantic"),
  chip("🗺️", "Spontaneous"),
  chip("🤓", "Nerdy"),
];

export const ALL_INTEREST_CHIPS = INTEREST_GROUPS.flatMap((g) => g.chips);

export function chipLabels(all: Chip[], keys: string[] | undefined) {
  return (keys ?? [])
    .map((k) => all.find((c) => c.key === k))
    .filter((c): c is Chip => Boolean(c));
}
