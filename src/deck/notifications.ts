import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';
import { isLocked } from '../profiles/extras';
import type { Profile, ProfileGender } from '../profiles/types';
import { buildDeck } from './buildDeck';
import { tr } from '../i18n/i18n';

// Demo notifications: made once per app session from the profiles the tester sees.

type IconName = ComponentProps<typeof Ionicons>['name'];

export type AppNotification = {
  id: string;
  kind: 'match' | 'like' | 'compliment' | 'superlike' | 'visit' | 'boost' | 'verify' | 'welcome';
  text: string;
  at: number; // ms
  profile?: Profile; // shows the photo
  hidden?: boolean; // photo blurred ("someone liked you")
  icon?: IconName; // when there is no photo
};

const SESSION_START = Date.now();
const MIN = 60 * 1000;

const COMPLIMENTS = ['Your smile is contagious 😊', 'Love your travel photos!', 'We’d get along, I can tell']; // shown through tr()

export function buildNotifications(show: ProfileGender, myName: string | undefined): AppNotification[] {
  // People a bit further in the deck, never locked ones (they don't share photos).
  const people = buildDeck(show, new Set())
    .slice(20)
    .filter((p) => !isLocked(p))
    .slice(0, 6);
  const [a, b, c, d, e, f] = people;
  const list: AppNotification[] = [];

  if (a) list.push({ id: 'match-a', kind: 'match', text: tr('You matched with {name}! Say hi 👋', { name: a.name }), at: SESSION_START - 2 * MIN, profile: a });
  if (b) list.push({ id: 'like-b', kind: 'like', text: tr('Someone new liked you. See who in Likes.'), at: SESSION_START - 25 * MIN, profile: b, hidden: true });
  if (c) {
    list.push({
      id: 'compliment-c',
      kind: 'compliment',
      text: tr('{name} sent you a compliment: “{text}”', { name: c.name, text: tr(COMPLIMENTS[c.age % COMPLIMENTS.length]) }),
      at: SESSION_START - 70 * MIN,
      profile: c,
    });
  }
  if (d) list.push({ id: 'super-d', kind: 'superlike', text: tr('{name} super liked you ⭐', { name: d.name }), at: SESSION_START - 3 * 60 * MIN, profile: d });
  if (e) list.push({ id: 'visit-e', kind: 'visit', text: tr('{name} viewed your profile', { name: e.name }), at: SESSION_START - 5 * 60 * MIN, profile: e });
  if (f) list.push({ id: 'like-f', kind: 'like', text: tr('2 people liked you today. See who in Likes.'), at: SESSION_START - 9 * 60 * MIN, profile: f, hidden: true });

  list.push({
    id: 'boost',
    kind: 'boost',
    text: tr('Get seen by 11x more people. Try a Boost for 3 hours.'),
    at: SESSION_START - 26 * 60 * MIN,
    icon: 'flash',
  });
  list.push({
    id: 'verify',
    kind: 'verify',
    text: tr('Verify your photos to get the blue check on your profile.'),
    at: SESSION_START - 2 * 24 * 60 * MIN,
    icon: 'shield-checkmark',
  });
  list.push({
    id: 'welcome',
    kind: 'welcome',
    text: myName ? tr('Welcome to Yonder, {name}! Your profile is live.', { name: myName }) : tr('Welcome to Yonder! Your profile is live.'),
    at: SESSION_START - 3 * 24 * 60 * MIN,
    icon: 'heart',
  });
  return list;
}

// 2m · 25m · 3h · Yesterday · 3d
export function timeAgo(at: number) {
  const mins = Math.max(1, Math.round((Date.now() - at) / MIN));
  if (mins < 60) return tr('{count}m', { count: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return tr('{count}h', { count: hours });
  const days = Math.round(hours / 24);
  return days === 1 ? tr('Yesterday') : tr('{count}d', { count: days });
}
