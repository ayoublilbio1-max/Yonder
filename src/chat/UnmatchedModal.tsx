import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import type { Unmatch } from "../deck/SwipeProvider";
import { mainPhotoUri, profileById } from "../profiles/data";
import { isLocked } from "../profiles/extras";
import { useTheme } from "../theme/ThemeProvider";
import { chatTime } from "./ChatProvider";

// "Unmatched": everyone you unmatched / blocked / reported from a chat, and everyone who unmatched you.

type Props = {
  visible: boolean;
  unmatched: Record<string, Unmatch>;
  onClose: () => void;
};

function reasonText(u: Unmatch, name: string) {
  if (u.by === "them") return `${name} unmatched you`;
  if (u.reason === "block") return "You blocked them";
  if (u.reason.startsWith("report")) return "You reported and blocked them";
  return "You unmatched";
}

export function UnmatchedModal({ visible, unmatched, onClose }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const rows = Object.entries(unmatched)
    .flatMap(([id, u]) => {
      const p = profileById(id);
      return p ? [{ id, u, p }] : [];
    })
    .sort((a, b) => b.u.at - a.u.at);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.root,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="heading">Unmatched</AppText>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 20 },
            rows.length === 0 && styles.grow,
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons
                  name="heart-dislike-outline"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <AppText variant="heading" align="center">
                Nobody here
              </AppText>
              <AppText variant="body" muted align="center">
                People you unmatch, and people who unmatch you, show up here.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const p = item.p;
            const them = item.u.by === "them";
            return (
              <View style={styles.row}>
                <View
                  style={[styles.avatar, { backgroundColor: colors.surface }]}
                >
                  <Image
                    source={{ uri: mainPhotoUri(p) }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    blurRadius={isLocked(p) ? 30 : 0}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText variant="body" weight="semibold">
                    {p.name}, {p.age}
                  </AppText>
                  <AppText
                    variant="bodySmall"
                    color={them ? colors.danger : colors.textMuted}
                  >
                    {reasonText(item.u, p.name)}
                  </AppText>
                </View>
                <AppText variant="caption" muted>
                  {chatTime(item.u.at)}
                </AppText>
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  grow: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
});
