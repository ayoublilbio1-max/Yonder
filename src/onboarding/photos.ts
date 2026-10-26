import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

// Profile photos: take or pick → crop 3:4 → resize to 1080 px wide JPEG → save in the app's
// own folder (so Android can't clear it like the cache). Nothing is uploaded.

export type PickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: "cancelled" | "denied" | "error"; message?: string };

const PHOTO_WIDTH = 1080;
const FOLDER = "profile-photos";

function photosFolder() {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create();
  return dir;
}

export async function pickPhoto(
  source: "camera" | "library",
): Promise<PickResult> {
  const t0 = Date.now();
  try {
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (__DEV__)
        console.log("[photos] camera permission", JSON.stringify(perm.status));
      if (!perm.granted) return { ok: false, reason: "denied" };
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    };
    const picked =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (picked.canceled || !picked.assets?.[0]) {
      if (__DEV__) console.log(`[photos] ${source} cancelled`);
      return { ok: false, reason: "cancelled" };
    }
    const asset = picked.assets[0];
    const tPicked = Date.now(); // time spent in the camera / gallery is not processing time

    const context = ImageManipulator.manipulate(asset.uri);
    if (asset.width > PHOTO_WIDTH) context.resize({ width: PHOTO_WIDTH });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress: 0.8,
      format: SaveFormat.JPEG,
    });

    const dest = new File(photosFolder(), `photo_${Date.now()}.jpg`);
    new File(saved.uri).copy(dest);

    if (__DEV__) {
      const kb = Math.round((new File(dest.uri).size ?? 0) / 1024); // re-read: the size is known after the copy
      console.log(
        `[photos] ${source} → ${asset.width}x${asset.height} → saved ${kb} KB · picking ${tPicked - t0}ms · processing ${Date.now() - tPicked}ms`,
      );
    }
    return { ok: true, uri: dest.uri };
  } catch (e) {
    if (__DEV__) console.log(`[photos] ${source} failed`, String(e));
    return { ok: false, reason: "error", message: String(e) };
  }
}

export function deletePhotoFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    if (__DEV__) console.log("[photos] deleted", uri.split("/").pop());
  } catch (e) {
    if (__DEV__) console.log("[photos] delete failed", String(e));
  }
}
