import { PROFILES } from '../profiles/data';
import { isGold, isJustJoined, isLocked, lastActiveHours } from '../profiles/extras';
import { distanceKm, sessionRandom } from '../profiles/session';
import type { Profile, ProfileGender, ProfileIntent, ProfileMarital } from '../profiles/types';
import { formatDistance, type DistanceUnit } from '../settings/units';
import { tr } from '../i18n/i18n';

// Filters for the Swipe deck + rule 9.4 "never an empty result".
//
// Free for everyone: age, distance, religion, ethnicity, nationality. Everything else is Gold.
// Hard filters (never faked): age, height, ethnicity, nationality, blurred photos, Gold switches.
// Soft filters (rule 9.4, adjusted silently when too few people match): looking for, religion,
// marital status, children, languages, education, profession, interests, personality, alcohol, smoking.
// An adjusted profile keeps its new details for the whole session, everywhere in the app.

export const MIN_RESULTS = 30;

// Sliders (like Tinder / Muzz). The last value of each slider means "and above".
export const AGE_MIN = 18;
export const AGE_MAX = 50; // 50 = 50+
export const HEIGHT_MIN = 150;
export const HEIGHT_MAX = 195; // 195 = 195 cm +
export const DISTANCE_MIN = 1;
export const DISTANCE_MAX = 100; // 100 = anywhere

export function ageLabel(min: number, max: number) {
  return `${min} – ${max >= AGE_MAX ? `${AGE_MAX}+` : max}`;
}
export function heightRangeLabel(min: number, max: number) {
  return `${min} – ${max >= HEIGHT_MAX ? `${HEIGHT_MAX}+` : max} cm`;
}
export function distanceLabel(km: number | null, unit: DistanceUnit = 'km') {
  return km === null ? tr('Anywhere') : tr('Up to {v}', { v: formatDistance(km, unit) });
}

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
  ageMin: number;
  ageMax: number; // AGE_MAX = 50+
  distance: number | null; // km, null = anywhere
  intents: ProfileIntent[];
  religions: string[];
  ethnicities: string[];
  nationalities: string[]; // origins, e.g. "French"
  heightMin: number;
  heightMax: number; // HEIGHT_MAX = 195 cm +
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
  ageMin: AGE_MIN,
  ageMax: AGE_MAX,
  distance: null,
  intents: [],
  religions: [],
  ethnicities: [],
  nationalities: [],
  heightMin: HEIGHT_MIN,
  heightMax: HEIGHT_MAX,
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
    f.intents,
    f.religions,
    f.ethnicities,
    f.nationalities,
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
    f.ageMin !== AGE_MIN || f.ageMax !== AGE_MAX,
    f.heightMin !== HEIGHT_MIN || f.heightMax !== HEIGHT_MAX,
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

// Without Gold only the free filters count (Gold ones stay saved for when Gold is bought).
export function withoutGold(f: Filters): Filters {
  return {
    ...DEFAULT_FILTERS,
    ageMin: f.ageMin,
    ageMax: f.ageMax,
    distance: f.distance,
    religions: f.religions,
    ethnicities: f.ethnicities,
    nationalities: f.nationalities,
  };
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
  if (f.intents.length && !f.intents.includes(p.intent)) return false;
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
  if (f.intents.length && !f.intents.includes(p.intent)) o.intent = pick(p, 'intent', f.intents);
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

function inAge(p: Profile, min: number, max: number) {
  return p.age >= min && (max >= AGE_MAX ? true : p.age <= max);
}

function passesHard(p: Profile, f: Filters, relaxOthers: boolean) {
  if (relaxOthers) return true;
  if (f.heightMin !== HEIGHT_MIN || f.heightMax !== HEIGHT_MAX) {
    const h = p.heightCm;
    if (h === null || h < f.heightMin || (f.heightMax < HEIGHT_MAX && h > f.heightMax)) return false;
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

// Nearby ages only: 26–30 → 21–35, never far (never 18–20 → 50+).
export const AGE_STRETCH = 5;

export type FilterResult = {
  list: Profile[]; // in deck order, with adjusted details
  notice: 'none' | 'age' | 'close'; // banner to show
};

const cache = new Map<string, FilterResult>();

// pool = the full session order for the gender shown (buildDeck with nothing hidden).
export function applyFilters(pool: Profile[], f: Filters, show: ProfileGender): FilterResult {
  if (pool.length === 0) return { list: [], notice: 'none' }; // still loading: never cache this
  // the pool's first ids tell one shuffle from another
  const key = `${show}|${pool.length}|${pool.slice(0, 8).map((p) => p.id).join(',')}|${JSON.stringify(f)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const t0 = Date.now();
  const base = pool.map(withOverrides);

  const run = (min: number, max: number, relaxOthers: boolean) => {
    const hard = base.filter((p) => inAge(p, min, max) && passesHard(p, f, relaxOthers));
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

  const ageSet = f.ageMin !== AGE_MIN || f.ageMax !== AGE_MAX;
  const wideMin = Math.max(AGE_MIN, f.ageMin - AGE_STRETCH);
  const wideMax = f.ageMax >= AGE_MAX ? AGE_MAX : Math.min(AGE_MAX, f.ageMax + AGE_STRETCH);
  let notice: FilterResult['notice'] = 'none';
  let r = run(f.ageMin, f.ageMax, false);
  if (r.list.length < MIN_RESULTS && ageSet) {
    const wider = run(wideMin, wideMax, false);
    if (wider.list.length > r.list.length) {
      r = wider;
      notice = 'age';
    }
  }
  if (r.list.length === 0) {
    r = run(wideMin, wideMax, true);
    notice = 'close';
  }

  if (__DEV__) {
    console.log(
      `[filters] ${r.list.length} profiles in ${Date.now() - t0}ms · ${r.strict} match all · ${r.adjusted} adjusted · notice=${notice} · age ${ageLabel(f.ageMin, f.ageMax)} · distance=${f.distance ?? 'any'}`,
    );
  }
  // Rule 9.4: every profile gets its distance inside the chosen maximum (new objects, so the cards update).
  const result = { list: r.list.map((p) => ({ ...p, km: distanceKm(p.id, f.distance) })), notice };
  cache.set(key, result);
  return result;
}

// "You've seen everyone" buttons (rule 9.5).
export function widerDistance(f: Filters): Filters {
  if (f.distance === null) return f;
  const next = f.distance * 2;
  return { ...f, distance: next >= DISTANCE_MAX ? null : next };
}

export function widerAge(f: Filters): Filters {
  return {
    ...f,
    ageMin: Math.max(AGE_MIN, f.ageMin - AGE_STRETCH),
    ageMax: f.ageMax >= AGE_MAX ? AGE_MAX : Math.min(AGE_MAX, f.ageMax + AGE_STRETCH),
  };
}
