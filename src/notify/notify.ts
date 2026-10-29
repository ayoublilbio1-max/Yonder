import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getNotifyPrefs, type NotifyType } from "./prefs";

// Real phone notifications (local only: the app makes them itself, there is no push server).
// - silent and without vibration (Yonder only plays sounds for a match, a boost and a payment)
// - shown as a banner even while the app is open, and kept in the notification tray
// - each one carries the screen to open when you tap it (data.url)

const CHANNEL = "yonder-quiet";
const DAILY_ID = "yonder-daily";
const BOOST_END_ID = "yonder-boost-end";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady: Promise<unknown> | null = null;
function ensureChannel() {
  if (Platform.OS !== "android") return Promise.resolve();
  channelReady ??= Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "Yonder",
    description: "Matches, messages, likes and reminders",
    // tsc finds AndroidImportance (it is in the package's types); the lint import plugin can't follow the re-export
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
    enableVibrate: false,
    vibrationPattern: [0],
    showBadge: true,
  }).catch((e) => {
    if (__DEV__) console.log("[notify] channel failed", String(e));
  });
  return channelReady;
}

export type PermissionState = "granted" | "denied" | "undetermined";

export async function permissionState(): Promise<PermissionState> {
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted) return "granted";
    return p.canAskAgain ? "undetermined" : "denied";
  } catch {
    return "undetermined";
  }
}

// Asks Android once (Android 13+ shows the system popup). Returns true when allowed.
export async function askPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const now = await Notifications.getPermissionsAsync();
    if (now.granted) return true;
    if (!now.canAskAgain) return false;
    const res = await Notifications.requestPermissionsAsync();
    if (__DEV__)
      console.log(`[notify] permission ${res.granted ? "granted" : "refused"}`);
    return res.granted;
  } catch (e) {
    if (__DEV__) console.log("[notify] permission failed", String(e));
    return false;
  }
}

function allowed(type: NotifyType) {
  const p = getNotifyPrefs();
  return p.enabled && p[type];
}

type Note = { title: string; body: string; url?: string };

// Shows a notification now (if that type is switched on and Android allows it).
export async function notify(type: NotifyType, note: Note) {
  if (!allowed(type)) {
    if (__DEV__) console.log(`[notify] ${type} skipped (switched off)`);
    return;
  }
  try {
    await ensureChannel();
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) {
      if (__DEV__) console.log(`[notify] ${type} skipped (no permission)`);
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title,
        body: note.body,
        data: { url: note.url ?? "/" },
        sound: false,
      },
      trigger: Platform.OS === "android" ? { channelId: CHANNEL } : null,
    });
    if (__DEV__) console.log(`[notify] ${type} · ${note.title}`);
  } catch (e) {
    if (__DEV__) console.log(`[notify] ${type} failed`, String(e));
  }
}

// "New people near you" every day at 7 pm (works even when the app is closed). Off = cancelled.
export async function syncDailyPicks() {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(
      () => {},
    );
    if (!allowed("daily")) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: {
        title: "New people near you ✨",
        body: "Fresh profiles joined today. Come and see who’s new.",
        data: { url: "/" },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
        channelId: CHANNEL,
      },
    });
    if (__DEV__) console.log("[notify] daily picks scheduled for 19:00");
  } catch (e) {
    if (__DEV__) console.log("[notify] daily picks failed", String(e));
  }
}

// Boost: "is on" now, and "has ended" at the end time (also when the app is closed).
export async function notifyBoost(endsAt: number) {
  await notify("boost", {
    title: "Your boost is on ⚡",
    body: "For the next 3 hours more people see your profile first.",
    url: "/",
  });
  try {
    await Notifications.cancelScheduledNotificationAsync(BOOST_END_ID).catch(
      () => {},
    );
    if (!allowed("boost") || endsAt <= Date.now()) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.scheduleNotificationAsync({
      identifier: BOOST_END_ID,
      content: {
        title: "Your boost has ended",
        body: "See who liked you while you were boosted.",
        data: { url: "/likes" },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endsAt),
        channelId: CHANNEL,
      },
    });
    if (__DEV__)
      console.log(
        `[notify] boost end scheduled · ${new Date(endsAt).toLocaleTimeString()}`,
      );
  } catch (e) {
    if (__DEV__) console.log("[notify] boost end failed", String(e));
  }
}

// Everything planned for later is removed (log out / delete profile / notifications off).
export async function cancelScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  if (__DEV__) console.log("[notify] scheduled notifications cancelled");
}
