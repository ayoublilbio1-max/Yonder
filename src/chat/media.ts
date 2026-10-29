import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import type { ChatMedia } from './ChatProvider';
import { tr } from '../i18n/i18n';

// Real media for chats: pick from the gallery, take a photo, save a voice note.
// Every file is copied into the app's own folder (chat-media/) so it stays after the app closes.

export type MediaResult = { ok: true; media: ChatMedia } | { ok: false; reason: 'cancelled' | 'denied' | 'error' };

const FOLDER = 'chat-media';
const MAX_VIDEO_SECONDS = 60;

function folder() {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create();
  return dir;
}

// Copy a temporary file (gallery, camera, recorder) into chat-media/ and return the new uri.
export function keepFile(uri: string, prefix: string, ext: string) {
  const dest = new File(folder(), `${prefix}_${Date.now()}.${ext}`);
  new File(uri).copy(dest);
  return dest.uri;
}

function extOf(uri: string, fallback: string) {
  const m = uri.split('?')[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : fallback;
}

export function mediaFromAsset(asset: ImagePicker.ImagePickerAsset): ChatMedia {
  const isVideo = asset.type === 'video';
  const ext = extOf(asset.uri, isVideo ? 'mp4' : 'jpg');
  return {
    kind: isVideo ? 'video' : 'photo',
    uri: keepFile(asset.uri, isVideo ? 'video' : 'photo', ext),
    width: asset.width,
    height: asset.height,
    durationMs: isVideo && asset.duration ? asset.duration : undefined,
  };
}

// Gallery: a photo or a video (up to 60 s).
export async function pickFromGallery(): Promise<MediaResult> {
  const t0 = Date.now();
  try {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (res.canceled || !res.assets?.[0]) return { ok: false, reason: 'cancelled' };
    const media = mediaFromAsset(res.assets[0]);
    if (__DEV__) console.log(`[media] gallery ${media.kind} ${media.width}x${media.height} in ${Date.now() - t0}ms`);
    return { ok: true, media };
  } catch (e) {
    if (__DEV__) console.log('[media] gallery failed', String(e));
    return { ok: false, reason: 'error' };
  }
}

// Android can close the app while the camera is open (to free memory). We remember which chat
// asked for the photo, and ChatProvider picks the photo up when the app starts again.
export const PENDING_CAMERA_KEY = 'yonder.pendingCameraChat';

// Camera: take a photo now.
export async function takePhoto(chatId: string): Promise<MediaResult> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (__DEV__) console.log('[media] camera permission', perm.status);
    if (!perm.granted) return { ok: false, reason: 'denied' };
    await AsyncStorage.setItem(PENDING_CAMERA_KEY, chatId).catch(() => {});
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    await AsyncStorage.removeItem(PENDING_CAMERA_KEY).catch(() => {});
    if (res.canceled || !res.assets?.[0]) return { ok: false, reason: 'cancelled' };
    const media = mediaFromAsset(res.assets[0]);
    if (__DEV__) console.log(`[media] camera photo ${media.width}x${media.height}`);
    return { ok: true, media };
  } catch (e) {
    if (__DEV__) console.log('[media] camera failed', String(e));
    return { ok: false, reason: 'error' };
  }
}

// 0:07 · 1:23
export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// After a restart: the photo taken while Android closed the app, and the chat it was for.
export async function recoverCameraPhoto(): Promise<{ chatId: string; media: ChatMedia } | null> {
  try {
    const chatId = await AsyncStorage.getItem(PENDING_CAMERA_KEY);
    if (!chatId) return null;
    await AsyncStorage.removeItem(PENDING_CAMERA_KEY);
    const res = await ImagePicker.getPendingResultAsync();
    if (__DEV__) console.log(`[media] pending camera result for ${chatId}:`, res ? 'found' : 'none');
    if (!res || !('assets' in res) || res.canceled || !res.assets?.[0]) return null;
    return { chatId, media: mediaFromAsset(res.assets[0]) };
  } catch (e) {
    if (__DEV__) console.log('[media] recover failed', String(e));
    return null;
  }
}

export function timerLabel(timer: PhotoTimer) {
  return timer === 'once' ? tr('View once') : tr('{timer}s photo', { timer });
}

export type PhotoTimer = 'once' | 5 | 10;

// Short text for a message in the chats list.
export function mediaPreview(media: ChatMedia) {
  if (media.timer) return `⏱ ${timerLabel(media.timer)}`;
  if (media.kind === 'photo') return `📷 ${tr('Photo')}`;
  if (media.kind === 'video') return `🎥 ${tr('Video')}`;
  return `🎤 ${tr('Voice message')}${media.durationMs ? ` (${formatDuration(media.durationMs)})` : ''}`;
}
