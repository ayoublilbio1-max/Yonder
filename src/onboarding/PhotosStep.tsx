import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState, type ComponentProps } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ConfirmModal } from "../components/ConfirmModal";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { useTheme } from "../theme/ThemeProvider";
import { useOnboarding } from "./OnboardingProvider";
import { MAX_PHOTOS, MIN_PHOTOS } from "./options";
import { deletePhotoFile, pickPhoto } from "./photos";
import { StepLayout } from "./StepLayout";
import { useAdvance } from "./useAdvance";

type IconName = ComponentProps<typeof Ionicons>["name"];

const COLUMNS = 3;
const GAP = 12;
const SIDE_PADDING = 24;

const GOOD: { icon: IconName; text: string }[] = [
  { icon: "person-outline", text: "Only you in the photo" },
  { icon: "happy-outline", text: "Your face is clear and well lit" },
  { icon: "image-outline", text: "Recent photos that look like you" },
];
const AVOID: { icon: IconName; text: string }[] = [
  { icon: "glasses-outline", text: "Sunglasses, masks or a covered face" },
  { icon: "resize-outline", text: "Photos taken from far away" },
  { icon: "color-wand-outline", text: "AI images or heavy filters" },
  { icon: "cube-outline", text: "Objects, pets or landscapes only" },
];

export function PhotosStep() {
  const colors = useTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { draft, update } = useOnboarding();
  const advance = useAdvance("photos");

  const photos = draft.photos ?? [];
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [photoMenu, setPhotoMenu] = useState<number | null>(null); // index of a filled photo
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  const slotWidth = Math.floor(
    (width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
  );
  const slotHeight = Math.round((slotWidth * 4) / 3);

  const add = async (source: "camera" | "library") => {
    setSourceSheetOpen(false);
    setBusySlot(photos.length);
    // Let the sheet finish closing before Android opens the camera / gallery.
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await pickPhoto(source);
    setBusySlot(null);
    if (result.ok) {
      update({ photos: [...photos, result.uri] });
      return;
    }
    if (result.reason === "denied") {
      toast.show("Allow camera access in your phone settings to take a photo.");
      Linking.openSettings().catch(() => {});
    } else if (result.reason === "error") {
      toast.show("Couldn’t add this photo. Try another one.");
    }
  };

  const makeMain = (index: number) => {
    const next = [photos[index], ...photos.filter((_, i) => i !== index)];
    update({ photos: next });
    setPhotoMenu(null);
    if (__DEV__)
      console.log(`[photos] photo ${index + 1} is now the main photo`);
  };

  const remove = (index: number) => {
    deletePhotoFile(photos[index]);
    update({ photos: photos.filter((_, i) => i !== index) });
    setConfirmDelete(null);
    toast.show("Photo removed");
  };

  const count = photos.length;
  const missing = Math.max(0, MIN_PHOTOS - count);

  return (
    <StepLayout
      stepId="photos"
      title="Add your profile photos"
      subtitle={`Add at least ${MIN_PHOTOS} photos to continue. The first one is your main photo.`}
      footer={
        <AppButton
          label={
            missing > 0
              ? `Add ${missing} more photo${missing > 1 ? "s" : ""}`
              : "Continue"
          }
          disabled={missing > 0 || busySlot !== null}
          onPress={() => advance(0)}
        />
      }
    >
      <View style={styles.grid}>
        {Array.from({ length: MAX_PHOTOS }, (_, i) => {
          const uri = photos[i];
          const isNextEmpty = i === count;
          const isBusy = busySlot === i;
          return (
            <Pressable
              key={i}
              onPress={() => {
                if (uri) setPhotoMenu(i);
                else if (busySlot === null) setSourceSheetOpen(true);
              }}
              disabled={!uri && !isNextEmpty}
              accessibilityRole="button"
              accessibilityLabel={uri ? `Photo ${i + 1}` : "Add a photo"}
              style={[
                styles.slot,
                {
                  width: slotWidth,
                  height: slotHeight,
                  borderColor: uri ? "transparent" : colors.border,
                  backgroundColor: colors.surface,
                  borderStyle: uri ? "solid" : "dashed",
                },
              ]}
            >
              {uri ? (
                <Image
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={150}
                />
              ) : isBusy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons
                  name="add"
                  size={30}
                  color={isNextEmpty ? colors.primary : colors.textSubtle}
                />
              )}
              {i === 0 ? (
                <View
                  style={[
                    styles.mainBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight="semibold"
                    color={colors.onPrimary}
                  >
                    Main
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setGuidelinesOpen(true)}
        accessibilityRole="button"
        style={styles.guidelinesLink}
        hitSlop={6}
      >
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.primary}
        />
        <AppText variant="bodySmall" weight="semibold" color={colors.primary}>
          Photo guidelines
        </AppText>
      </Pressable>
      <AppText variant="caption" muted>
        Your photos stay on this phone. They’re only used in this demo.
      </AppText>

      {/* Camera or gallery */}
      <Sheet
        visible={sourceSheetOpen}
        onClose={() => setSourceSheetOpen(false)}
      >
        <AppText variant="heading" align="center">
          Add a photo
        </AppText>
        <AppButton
          label="Take a photo"
          icon="camera-outline"
          onPress={() => add("camera")}
        />
        <AppButton
          label="Choose from gallery"
          icon="images-outline"
          variant="secondary"
          onPress={() => add("library")}
        />
      </Sheet>

      {/* Actions on a filled photo */}
      <Sheet visible={photoMenu !== null} onClose={() => setPhotoMenu(null)}>
        <AppText variant="heading" align="center">
          Photo {photoMenu !== null ? photoMenu + 1 : ""}
        </AppText>
        {photoMenu !== null && photoMenu > 0 ? (
          <AppButton
            label="Make main photo"
            icon="star-outline"
            onPress={() => makeMain(photoMenu)}
          />
        ) : null}
        <AppButton
          label="Remove photo"
          icon="trash-outline"
          variant="danger"
          onPress={() => {
            setConfirmDelete(photoMenu);
            setPhotoMenu(null);
          }}
        />
        <AppButton
          label="Cancel"
          variant="secondary"
          onPress={() => setPhotoMenu(null)}
        />
      </Sheet>

      <ConfirmModal
        visible={confirmDelete !== null}
        title="Remove this photo?"
        message="It will be removed from your profile."
        confirmLabel="Remove"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete !== null) remove(confirmDelete);
        }}
      />

      {/* Guidelines */}
      <Sheet visible={guidelinesOpen} onClose={() => setGuidelinesOpen(false)}>
        <AppText variant="heading">Use good photos</AppText>
        {GOOD.map((g) => (
          <View key={g.text} style={styles.ruleRow}>
            <View
              style={[styles.ruleIcon, { backgroundColor: colors.boostSoft }]}
            >
              <Ionicons name={g.icon} size={18} color={colors.boost} />
            </View>
            <AppText variant="body" style={styles.flex}>
              {g.text}
            </AppText>
            <Ionicons name="checkmark-circle" size={22} color={colors.boost} />
          </View>
        ))}
        <AppText variant="heading" style={styles.avoidTitle}>
          Avoid
        </AppText>
        {AVOID.map((g) => (
          <View key={g.text} style={styles.ruleRow}>
            <View
              style={[styles.ruleIcon, { backgroundColor: colors.dangerSoft }]}
            >
              <Ionicons name={g.icon} size={18} color={colors.danger} />
            </View>
            <AppText variant="body" style={styles.flex}>
              {g.text}
            </AppText>
            <Ionicons name="close-circle" size={22} color={colors.danger} />
          </View>
        ))}
        <AppButton
          label="Ok, got it"
          onPress={() => setGuidelinesOpen(false)}
        />
      </Sheet>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  slot: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mainBadge: {
    position: "absolute",
    left: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopRightRadius: 10,
  },
  guidelinesLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    marginBottom: 6,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avoidTitle: {
    marginTop: 6,
  },
  flex: {
    flex: 1,
  },
});
