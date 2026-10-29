import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';
import { es } from './es';
import { fr } from './fr';
import { nl } from './nl';

// App language (Settings › Language, and the globe on the welcome screen): English, French,
// Spanish, Dutch — or "Follow phone" (the default).
// - tr('English text', { name }) gives the text in the current language ({name} is filled in).
//   The English text is the key, so anything missing simply stays in English.
// - Changing the language re-opens the app screens (the root layout is keyed on the language),
//   so every screen is drawn again in the new language.
// - Demo profile data (bios, cities, jobs from profiles.json) and the simulated chat replies stay in English.

export type Lang = 'en' | 'fr' | 'es' | 'nl';
export type LangSetting = 'system' | Lang;

export const LANGUAGES: { key: Lang; name: string; native: string }[] = [
  { key: 'en', name: 'English', native: 'English' },
  { key: 'fr', name: 'French', native: 'Français' },
  { key: 'es', name: 'Spanish', native: 'Español' },
  { key: 'nl', name: 'Dutch', native: 'Nederlands' },
];

const DICTS: Record<Exclude<Lang, 'en'>, Record<string, string>> = { fr, es, nl };
const LOCALE: Record<Lang, string> = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL' };
const KEY = 'yonder.language';

function phoneLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'fr' || code === 'es' || code === 'nl' ? code : 'en';
}

let setting: LangSetting = 'system';
let lang: Lang = phoneLang();
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v === 'en' || v === 'fr' || v === 'es' || v === 'nl') {
      setting = v;
      lang = v;
    }
    if (__DEV__) console.log(`[i18n] ${setting === 'system' ? `follow phone (${lang})` : lang}`);
  })
  .catch(() => {})
  .finally(() => {
    ready = true;
    emit();
  });

// The text in the current language. Use it at render time (not in module-level constants).
export function tr(key: string, vars?: Record<string, string | number>): string {
  const dict = lang === 'en' ? null : DICTS[lang];
  let out = dict?.[key] ?? key;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  return out;
}

export function currentLang() {
  return lang;
}

// For dates and times: 'fr-FR', 'es-ES'…
export function locale() {
  return LOCALE[lang];
}

// The screen to open again after the app is redrawn in the new language (e.g. Settings).
// Only right after the change (if the screen is still open, nothing is opened later by surprise).
let reopen: { path: string; at: number } | null = null;
export function takeReopen() {
  const r = reopen;
  reopen = null;
  return r && Date.now() - r.at < 3000 ? r.path : null;
}

export function setLanguage(next: LangSetting, reopenPath?: string) {
  reopen = reopenPath ? { path: reopenPath, at: Date.now() } : null;
  setting = next;
  lang = next === 'system' ? phoneLang() : next;
  AsyncStorage.setItem(KEY, next).catch(() => {});
  if (__DEV__) console.log(`[i18n] language → ${next} (${lang})`);
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const snapshot = () => `${ready ? 1 : 0}|${setting}|${lang}`;

// { ready, setting, lang } — re-renders when the language changes.
export function useLanguage() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [r, st, l] = s.split('|');
  return { ready: r === '1', setting: st as LangSetting, lang: l as Lang };
}
