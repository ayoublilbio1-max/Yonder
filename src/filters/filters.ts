import { PROFILES } from '../profiles/data';
import { isGold, isJustJoined, isLocked, lastActiveHours } from '../profiles/extras';
import { sessionRandom, setDistanceCap } from '../profiles/session';
import type { Profile, ProfileGender, ProfileMarital } from '../profiles/types';

// Filters for the Swipe deck + rule 9.4 "never an empty result".
//
// Hard filters (never faked): age, height, ethnicity, nationality, blurred photos, Gold filters.
// Soft filters (rule 9.4, adjusted silently when too few people match): religion, marital status,
// children, languages, education, profession, interests, personality, alcohol, smoking.
// An adjusted profile keeps its new details for the whole session, everywhere in the app.

export const MIN_RESULTS = 30;

export const AGE_BUCKETS = [
  { key: '18-20', min: 18, max: 20 },
  { key: '21-25', min: 21, max: 25 },
  { key: '26-30', min: 26, max: 30 },
  { key: '31-40', min: 31, max: 40 },
  { key: '41-50', min: 41, max: 50 },
  { key: '50+', min: 51, max: 120 },
] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number]['key'];

export const HEIGHT_BUCKETS = [
  { key: 'under160', label: 'Under 160 cm', min: 0, max: 159 },
  { key: '160-169', label: '160–169 cm', min: 160, max: 169 },
  { key: '170-179', label: '170–179 cm', min: 170, max: 179 },
  { key: '180-189', label: '180–189 cm', min: 180, max: 189 },
  { key: '190plus', label: '190 cm +', min: 190, max: 300 },
] as const;
export type HeightBucket = (typeof HEIGHT_BUCKETS)[number]['key'];

export const DISTANCES: { km: number | null; label: string }[] = [
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 25, label: '25 km' },
  { km: null, label: 'Anywhere' },
];

// Ethnicity = the region of the profile's origins (the data has no other ethnicity field).
export const ETHNICITY_OF: Record<string, string> = {
  American: 'North American',
  British: 'British & Irish',
  Irish: 'British & Irish',
  French: 'Western European',
  German: 'Western European',
  Dutch: 'Western European',
  Belgian: 'Western European',
  Spanish: 'Southern European',
  Italian: 'Southern European',
  Portuguese: 'Southern European',
  Greek: 'Southern European',
  Swedish: 'Northern European',
  Polish: 'Central & Eastern European',
};

export type ActiveWithin = 'any' | '8h' | 'today' | 'week' | 'month';
export const ACTIVE_OPTIONS: { key: ActiveWithin; label: string }[] = [
  { key: 'any', label: 'Any time' },
  { key: '8h', label: 'Last 8 hours' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last week' },
  { key: 'month', label: 'Last month' },
];
const ACTIVE_HOURS: Record<ActiveWithin, number> = { any: Infinity, '8h': 8, today: 23, week: 24 * 7, month: 24 * 31 };

export type Filters = {
  ages: AgeBucket[]; // [] = all ages (18 to 50+)
  distance: number | null; // km, null = anywhere
  religions: string[];
  ethnicities: string[];
  nationalities: string[]; // origins, e.g. "French"
  heights: HeightBucket[];
  marital: ProfileMarital[];
  children: 'any' | 'yes' | 'no';
  languages: string[];
  education: string[];
  professions: string[];
  interests: string[];
  personality: string[];
  drinking: string[];
  smoking: string[];
  photos: 'any' | 'clear' | 'blurred';
  // Gold (advanced)
  completeBio: boolean;
  verified: boolean;
  active: ActiveWithin;
  goldOnly: boolean;
  justJoined: boolean;
};

export const DEFAULT_FILTERS: Filters = {
  ages: [],
  distance: null,
  religions: [],
  ethnicities: [],
  nationalities: [],
  heights: [],
  marital: [],
  children: 'any',
  languages: [],
  education: [],
  professions: [],
  interests: [],
  personality: [],
  drinking: [],
  smoking: [],
  photos: 'any',
  completeBio: false,
  verified: false,
  active: 'any',
  goldOnly: false,
  justJoined: false,
};

export function activeFilterCount(f: Filters) {
  const lists = [
    f.ages,
    f.religions,
    f.ethnicities,
    f.nationalities,
    f.heights,
    f.marital,
    f.languages,
    f.education,
    f.professions,
    f.interests,
    f.personality,
    f.drinking,
    f.smoking,
  ].filter((l) => l.length > 0).length;
  const singles = [
    f.distance !== null,
    f.children !== 'any',
    f.photos !== 'any',
    f.completeBio,
    f.verified,
    f.active !== 'any',
    f.goldOnly,
    f.justJoined,
  ].filter(Boolean).length;
  return lists + singles;
}

export function hasGoldFilters(f: Filters) {
  return f.completeBio || f.verified || f.active !== 'any' || f.goldOnly || f.justJoined;
}

// Options shown in the Filters screen, most common first.
function valuesBy<T extends string>(pick: (p: Profile) => T | T[]) {
  const count = new Map<T, number>();
  PROFILES.forEach((p) => {
    const v = pick(p);
    (Array.isArray(v) ? v : [v]).forEach((x) => count.set(x, (count.get(x) ?? 0) + 1));
  });
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

export const OPTIONS = {
  religions: valuesBy((p) => p.religion).filter((r) => r !== 'Prefer not to say'),
  ethnicities: [...new Set(Object.values(ETHNICITY_OF))],
  nationalities: valuesBy((p) => p.origins),
  languages: valuesBy((p) => p.languages),
  education: valuesBy((p) => p.education),
  professions: valuesBy((p) => p.profession).sort((a, b) => a.localeCompare(b)),
  interests: valuesBy((p) => p.interests),
  personality: valuesBy((p) => p.personality),
};

// ---------- rule 9.4: adjusted details (fixed for the session) ----------

const OVERRIDES = new Map<string, Partial<Profile>>();

export function withOverrides(p: Profile): Profile {
  const o = OVERRIDES.get(p.id);
  return o ? { ...p, ...o } : p;
}

function pick<T>(p: Profile, field: string, list: readonly T[]): T {
  return list[Math.floor(sessionRandom(`${p.id}:adj:${field}`) * list.length)];
}

function passesSoft(p: Profile, f: Filters) {
  if (f.religions.length && !f.religions.includes(p.religion)) return false;
  if (f.marital.length && !f.marital.includes(p.marital)) return false;
  if (f.children !== 'any' && p.hasChildren !== (f.children === 'yes')) return false;
  if (f.languages.length && !p.languages.some((l) => f.languages.includes(l))) return false;
  if (f.education.length && !f.education.includes(p.education)) return false;
  if (f.professions.length && !f.professions.includes(p.profession)) return false;
  if (f.interests.length && !p.interests.some((i) => f.interests.includes(i))) return false;
  if (f.personality.length && !f.personality.includes(p.personality)) return false;
  if (f.drinking.length && !f.drinking.includes(p.drinking)) return false;
  if (f.smoking.length && !f.smoking.includes(p.smoking)) return false;
  return true;
}

function adjust(p: Profile, f: Filters): Profile {
  const o: Partial<Profile> = {};
  if (f.religions.length && !f.religions.includes(p.religion)) o.religion = pick(p, 'religion', f.religions);
  if (f.marital.length && !f.marital.includes(p.marital)) o.marital = pick(p, 'marital', f.marital);
  if (f.children !== 'any' && p.hasChildren !== (f.children === 'yes')) o.hasChildren = f.children === 'yes';
  if (f.languages.length && !p.languages.some((l) => f.languages.includes(l))) {
    o.languages = [...p.languages, pick(p, 'language', f.languages)];
  }
  if (f.education.length && !f.education.includes(p.education)) o.education = pick(p, 'education', f.education);
  if (f.professions.length && !f.professions.includes(p.profession)) o.profession = pick(p, 'profession', f.professions);
  if (f.interests.length && !p.interests.some((i) => f.interests.includes(i))) {
    o.interests = [pick(p, 'interest', f.interests), ...p.interests].slice(0, 6);
  }
  if (f.personality.length && !f.personality.includes(p.personality)) o.personality = pick(p, 'personality', f.personality);
  if (f.drinking.length && !f.drinking.includes(p.drinking)) o.drinking = pick(p, 'drinking', f.drinking);
  if (f.smoking.length && !f.smoking.includes(p.smoking)) o.smoking = pick(p, 'smoking', f.smoking);
  OVERRIDES.set(p.id, o);
  return { ...p, ...o };
}

// ---------- hard filters ----------

function inAges(p: Profile, ranges: { min: number; max: number }[]) {
  return ranges.length === 0 || ranges.some((r) => p.age >= r.min && p.age <= r.max);
}

function passesHard(p: Profile, f: Filters, relaxOthers: boolean) {
  if (relaxOthers) return true;
  if (f.heights.length) {
    const ok = HEIGHT_BUCKETS.some(
      (b) => f.heights.includes(b.key) && p.heightCm !== null && p.heightCm >= b.min && p.heightCm <= b.max,
    );
    if (!ok) return false;
  }
  if (f.ethnicities.length && !f.ethnicities.includes(ETHNICITY_OF[p.origins] ?? '')) return false;
  if (f.nationalities.length && !f.nationalities.includes(p.origins)) return false;
  if (f.photos === 'clear' && isLocked(p)) return false;
  if (f.photos === 'blurred' && !isLocked(p)) return false;
  if (f.completeBio && p.bio.trim().length < 40) return false;
  if (f.verified && !p.verified) return false;
  if (f.active !== 'any' && lastActiveHours(p) > ACTIVE_HOURS[f.active]) return false;
  if (f.goldOnly && !isGold(p)) return false;
  if (f.justJoined && !isJustJoined(p)) return false;
  return true;
}

// Nearby age buckets: 26-30 → 21-25 + 31-40, never far.
function stretchedAges(ages: AgeBucket[], steps: number) {
  const idx = new Set(ages.map((a) => AGE_BUCKETS.findIndex((b) => b.key === a)));
  for (let s = 0; s < steps; s++) {
    [...idx].forEach((i) => {
      if (i > 0) idx.add(i - 1);
      if (i < AGE_BUCKETS.length - 1) idx.add(i + 1);
    });
  }
  return [...idx].map((i) => AGE_BUCKETS[i]);
}

export type FilterResult = {
  list: Profile[]; // in deck order, with adjusted details
  notice: 'none' | 'age' | 'close'; // banner to show
};

const cache = new Map<string, FilterResult>();

// pool = the full session order for the gender shown (buildDeck with nothing hidden).
export function applyFilters(pool: Profile[], f: Filters, show: ProfileGender): FilterResult {
  setDistanceCap(f.distance); // rule 9.4: distance never empties the deck
  const key = `${show}|${JSON.stringify(f)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const t0 = Date.now();
  const base = pool.map(withOverrides);

  const run = (ranges: { min: number; max: number }[], relaxOthers: boolean) => {
    const hard = base.filter((p) => inAges(p, ranges) && passesHard(p, f, relaxOthers));
    const strictIds = new Set(hard.filter((p) => passesSoft(p, f)).map((p) => p.id));
    let missing = MIN_RESULTS - strictIds.size;
    let adjusted = 0;
    const list = hard
      .map((p) => {
        if (strictIds.has(p.id)) return p;
        if (missing > 0 && !OVERRIDES.has(p.id)) {
          missing--;
          adjusted++;
          return adjust(p, f);
        }
        return null;
      })
      .filter((p): p is Profile => p !== null);
    return { list, strict: strictIds.size, adjusted };
  };

  const ages = f.ages.length ? stretchedAges(f.ages, 0) : [];
  let notice: FilterResult['notice'] = 'none';
  let r = run(ages, false);
  if (r.list.length < MIN_RESULTS && f.ages.length) {
    // one bucket on each side only (26-30 → 21-25 + 31-40), never far
    const wider = run(stretchedAges(f.ages, 1), false);
    if (wider.list.length > r.list.length) {
      r = wider;
      notice = 'age';
    }
  }
  if (r.list.length === 0) {
    r = run(ages.length ? stretchedAges(f.ages, 1) : [], true);
    notice = 'close';
  }

  if (__DEV__) {
    console.log(
      `[filters] ${r.list.length} profiles in ${Date.now() - t0}ms · ${r.strict} match all · ${r.adjusted} adjusted · notice=${notice} · distance=${f.distance ?? 'any'}`,
    );
  }
  const result = { list: r.list, notice };
  cache.set(key, result);
  return result;
}
