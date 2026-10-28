import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { type ComponentProps } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { mainPhotoUri } from "../profiles/data";
import { isLocked } from "../profiles/extras";
import type { Profile } from "../profiles/types";
import { useTheme } from "../theme/ThemeProvider";

// "Chat options" (the ⋮ menu of a chat), shown as its own screen sliding in from the side.

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  profile: Profile | null; // null = closed
  onClose: () => void;
  onAudio: () => void;
  onVideo: () => void;
  onShare: () => void;
  onSearch: () => void;
  onExport: () => void;
  onUnmatch: () => void;
  onBlock: () => void;
  onReport: () => void;
};

export function ChatOptions({
  profile,
  onClose,
  onAudio,
  onVideo,
  onShare,
  onSearch,
  onExport,
  onUnmatch,
  onBlock,
  onReport,
}: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={profile !== null}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {profile ? (
        <View
          style={[
            styles.root,
            { backgroundColor: colors.bg, paddingTop: insets.top },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.side}>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={10}
                style={styles.headerBtn}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            </View>
            <AppText variant="heading" align="center" style={styles.flex}>
              Chat options
            </AppText>
            <View style={styles.side} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            <View style={styles.who}>
              <View
                style={[styles.avatar, { backgroundColor: colors.surface }]}
              >
                <Image
                  source={{ uri: mainPhotoUri(profile) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  blurRadius={isLocked(profile) ? 40 : 0}
                  cachePolicy="memory-disk"
                />
              </View>
              <View style={styles.nameRow}>
                <AppText variant="title" align="center">
                  {profile.fullName}
                </AppText>
                {profile.verified ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.verified}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.quick}>
              <Quick icon="call-outline" label="Audio" onPress={onAudio} />
              <Quick icon="videocam-outline" label="Video" onPress={onVideo} />
              <Quick
                icon="share-social-outline"
                label="Share profile"
                onPress={onShare}
              />
            </View>

            <View
              style={[
                styles.group,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Row
                label="Search chat"
                icon="search-outline"
                onPress={onSearch}
                first
              />
              <Row
                label="Export chat"
                icon="download-outline"
                onPress={onExport}
              />
              <Row
                label="Unmatch"
                icon="heart-dislike-outline"
                onPress={onUnmatch}
              />
            </View>

            <AppText variant="label" muted style={styles.section}>
              SAFETY OPTIONS
            </AppText>
            <View
              style={[
                styles.group,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Row
                label="Block"
                icon="ban-outline"
                onPress={onBlock}
                danger
                first
              />
              <Row
                label="Report and block"
                icon="flag-outline"
                onPress={onReport}
                danger
              />
            </View>
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

function Quick({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.quickItem,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View
        style={[styles.quickCircle, { backgroundColor: colors.primarySoft }]}
      >
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <AppText variant="bodySmall" weight="medium">
        {label}
      </AppText>
    </Pressable>
  );
}

function Row({
  label,
  icon,
  onPress,
  danger,
  first,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  danger?: boolean;
  first?: boolean;
}) {
  const colors = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <AppText variant="body" weight="medium" color={color} style={styles.flex}>
        {label}
      </AppText>
      <Ionicons name={icon} size={21} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 48,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  who: {
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    overflow: "hidden",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quick: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 4,
  },
  quickItem: {
    alignItems: "center",
    gap: 6,
    minWidth: 88,
  },
  quickCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  group: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  section: {
    marginBottom: -8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
});
