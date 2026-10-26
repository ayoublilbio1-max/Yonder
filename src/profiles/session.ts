// Random values that are created once when the app opens and stay the same until it closes
// (rule 9.1: shuffle once per session). A new app session gives a new order.

const SESSION_SEED = Math.floor(Math.random() * 2 ** 31);

// Small string hash (FNV-1a) mixed with the session seed → 0..1, stable for the session.
export function sessionRandom(key: string) {
  let h = 2166136261 ^ SESSION_SEED;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// Demo distance shown on the card, 1–35 km, fixed for the session.
export function distanceKm(profileId: string) {
  return 1 + Math.floor(sessionRandom(`${profileId}:distance`) * 35);
}

if (__DEV__) console.log(`[deck] session seed ${SESSION_SEED}`);
