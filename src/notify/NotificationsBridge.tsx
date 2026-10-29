import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { useSwipe } from "../deck/SwipeProvider";
import { askPermission, notify, syncDailyPicks } from "./notify";
import { notifyPrefsReady, useNotifyPrefs } from "./prefs";

// No UI. Mounted once inside UserProviders:
// - "Welcome back" each time you open Yonder (app start, or back after 5+ minutes away)
// - keeps the daily 7 pm reminder in sync with Settings
// - tapping a notification opens its screen (a chat, Likes, Swipe…)

const AWAY_MS = 5 * 60_000;
let welcomedThisLaunch = false;

export function NotificationsBridge() {
  const router = useRouter();
  const { session } = useAuth();
  const { ready, me, likedYou } = useSwipe();
  const prefs = useNotifyPrefs();
  const onboarded = Boolean(session?.onboarded);
  const likesRef = useRef(likedYou.length);
  const nameRef = useRef(me.firstName);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    likesRef.current = likedYou.length;
    nameRef.current = me.firstName;
  }, [likedYou.length, me.firstName]);

  // Welcome: once per app start, then again when you come back after a while.
  useEffect(() => {
    if (!ready || !onboarded) return;
    const welcome = async () => {
      await notifyPrefsReady();
      const ok = await askPermission();
      if (!ok) return;
      const n = likesRef.current;
      await notify("welcome", {
        title: `Welcome back${nameRef.current ? `, ${nameRef.current}` : ""} 👋`,
        body:
          n > 0
            ? `${n} ${n === 1 ? "person likes" : "people like"} you. Keep swiping!`
            : "New people are waiting for you. Start swiping!",
        url: "/",
      });
      syncDailyPicks();
    };
    if (!welcomedThisLaunch) {
      welcomedThisLaunch = true;
      welcome();
    }
    let leftAt = 0;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") leftAt = Date.now();
      if (state === "active" && leftAt && Date.now() - leftAt >= AWAY_MS) {
        leftAt = 0;
        welcome();
      }
    });
    return () => sub.remove();
  }, [ready, onboarded]);

  // Settings changed → the daily reminder follows.
  useEffect(() => {
    if (!ready || !onboarded) return;
    syncDailyPicks();
  }, [ready, onboarded, prefs.enabled, prefs.daily]);

  // Tap on a notification → its screen.
  useEffect(() => {
    if (!onboarded) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id =
        response.notification.request.identifier +
        String(response.notification.date);
      if (handled.current === id) return;
      handled.current = id;
      Notifications.clearLastNotificationResponseAsync().catch(() => {}); // never opened again on the next start
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string" && url !== "/") {
        if (__DEV__) console.log(`[notify] tapped → ${url}`);
        router.push(url as Href);
      }
    };
    Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [onboarded, router]);

  return null;
}
