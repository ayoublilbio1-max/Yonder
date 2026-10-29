import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

// "Show distances in" (Settings): km or mi, one setting for the whole phone.
// Inside the app every distance stays in km; only the text you see changes.

export type DistanceUnit = "km" | "mi";

const KEY = "yonder.units";
const KM_PER_MI = 1.609344;
let unit: DistanceUnit = "km";
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v === "mi") {
      unit = "mi";
      listeners.forEach((l) => l());
    }
    if (__DEV__) console.log(`[units] loaded · ${unit}`);
  })
  .catch(() => {});

export function setDistanceUnit(next: DistanceUnit) {
  if (next === unit) return;
  unit = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, next).catch(() => {});
  if (__DEV__) console.log(`[units] distances in ${next}`);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// Use this hook in every component that shows a distance, so it updates right away.
export function useDistanceUnit(): DistanceUnit {
  return useSyncExternalStore(
    subscribe,
    () => unit,
    () => unit,
  );
}

// km → the number shown in the chosen unit (never 0).
export function distanceIn(km: number, u: DistanceUnit) {
  return Math.max(1, Math.round(u === "mi" ? km / KM_PER_MI : km));
}

// 12 → "12 km" / "7 mi"
export function formatDistance(km: number, u: DistanceUnit) {
  return `${distanceIn(km, u)} ${u}`;
}
