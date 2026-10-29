import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ConfirmModal } from "../components/ConfirmModal";
import { PressableScale } from "../components/PressableScale";
import { Sheet } from "../components/Sheet";
import { useSwipe, type Visibility } from "../deck/SwipeProvider";
import { DURATION, EASE_OUT } from "../motion/ease";
import { mainPhotoUri, profileById } from "../profiles/data";
import { isLocked } from "../profiles/extras";
import type { Profile } from "../profiles/types";
import { formatUsd, useWallet } from "../store/WalletProvider";
import { useTheme } from "../theme/ThemeProvider";
import { DEMO_CONTACTS } from "./demoContacts";

// Full pages opened from Settings: Profiles I’ve blocked · Block my phone contacts · Manage purchases,
// and the "Who can see my profile" sheet.

type IconName = ComponentProps<typeof Ionicons>["name"];

function Page({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
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
          styles.page,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <PressableScale
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            scaleTo={0.88}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </PressableScale>
          <AppText variant="heading" numberOfLines={1} style={styles.flex}>
            {title}
          </AppText>
        </View>
        <Animated.View
          entering={FadeIn.duration(DURATION.quick + 60).easing(EASE_OUT)}
          style={[styles.flex, { paddingBottom: insets.bottom }]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  const colors = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="body" muted align="center">
        {text}
      </AppText>
    </View>
  );
}

// ---------- Profiles I’ve blocked ----------

export function BlockedProfilesPage({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useTheme();
  const { saved, unblock } = useSwipe();
  const [confirm, setConfirm] = useState<Profile | null>(null);

  // blocked from Swipe, or blocked / reported in a chat (a plain unmatch is not a block)
  const rows = saved.blocked
    .filter((id) => {
      const u = saved.unmatched[id];
      return (
        !u ||
        (u.by === "me" &&
          (u.reason === "block" || u.reason.startsWith("report")))
      );
    })
    .map((id) => profileById(id))
    .filter((p): p is Profile => Boolean(p));

  return (
    <Page visible={visible} title="Profiles I’ve blocked" onClose={onClose}>
      <FlatList
        data={rows}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, rows.length === 0 && styles.grow]}
        ListHeaderComponent={
          rows.length ? (
            <AppText variant="bodySmall" muted style={styles.hint}>
              They can’t see you and you won’t see them. Unblock someone to see
              them in Swipe again.
            </AppText>
          ) : undefined
        }
        ListEmptyComponent={
          <Empty
            icon="ban-outline"
            title="Nobody blocked"
            text="People you block or report show up here."
          />
        }
        renderItem={({ item: p }) => (
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
              <Image
                source={{ uri: mainPhotoUri(p) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                blurRadius={isLocked(p) ? 30 : 0}
              />
            </View>
            <View style={styles.flex}>
              <AppText variant="body" weight="semibold">
                {p.name}, {p.age}
              </AppText>
              <AppText variant="bodySmall" muted>
                {saved.unmatched[p.id]?.reason.startsWith("report")
                  ? "Reported and blocked"
                  : "Blocked"}
              </AppText>
            </View>
            <PressableScale
              onPress={() => setConfirm(p)}
              accessibilityRole="button"
              scaleTo={0.95}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <AppText variant="bodySmall" weight="semibold">
                Unblock
              </AppText>
            </PressableScale>
          </View>
        )}
      />
      <ConfirmModal
        visible={confirm !== null}
        icon="lock-open-outline"
        title={`Unblock ${confirm?.name ?? ""}?`}
        message="You may see each other in Swipe again. Your old chat doesn’t come back."
        confirmLabel="Unblock"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) unblock(confirm.id);
          setConfirm(null);
        }}
      />
    </Page>
  );
}

// ---------- Block my phone contacts (demo list) ----------

export function BlockContactsPage({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useTheme();
  const { saved, setPrivacy } = useSwipe();
  const blocked = saved.blockedContacts;
  const all = blocked.length === DEMO_CONTACTS.length;

  const toggle = (id: string) =>
    setPrivacy({
      blockedContacts: blocked.includes(id)
        ? blocked.filter((b) => b !== id)
        : [...blocked, id],
    });

  return (
    <Page visible={visible} title="Block my phone contacts" onClose={onClose}>
      <FlatList
        data={DEMO_CONTACTS}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppText variant="bodySmall" muted>
              People you block here can’t see you on Yonder, and you won’t see
              them. Demo: these are made-up contacts, not the ones on your
              phone.
            </AppText>
            <AppButton
              label={
                all ? "Unblock all" : `Block all (${DEMO_CONTACTS.length})`
              }
              icon={all ? "lock-open-outline" : "ban-outline"}
              variant="secondary"
              onPress={() =>
                setPrivacy({
                  blockedContacts: all ? [] : DEMO_CONTACTS.map((c) => c.id),
                })
              }
            />
            <AppText variant="label" muted>
              {blocked.length} BLOCKED
            </AppText>
          </View>
        }
        renderItem={({ item: c }) => {
          const on = blocked.includes(c.id);
          return (
            <PressableScale
              onPress={() => toggle(c.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              scaleTo={0.99}
              dimTo={0.7}
              style={styles.row}
            >
              <View
                style={[
                  styles.initial,
                  {
                    backgroundColor: on
                      ? colors.dangerSoft
                      : colors.primarySoft,
                  },
                ]}
              >
                <AppText
                  variant="body"
                  weight="bold"
                  color={on ? colors.danger : colors.primary}
                >
                  {c.name.charAt(0)}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="body" weight="semibold">
                  {c.name}
                </AppText>
                <AppText variant="bodySmall" muted>
                  {c.phone}
                </AppText>
              </View>
              <Ionicons
                name={on ? "ban" : "ellipse-outline"}
                size={24}
                color={on ? colors.danger : colors.textSubtle}
              />
            </PressableScale>
          );
        }}
      />
    </Page>
  );
}

// ---------- Manage purchases ----------

export function PurchasesPage({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useTheme();
  const { wallet } = useWallet();
  const [restore, setRestore] = useState<"idle" | "busy" | "done">("idle");

  const doRestore = () => {
    setRestore("busy");
    if (__DEV__) console.log("[purchases] restore (demo)");
    setTimeout(() => setRestore("done"), 1400);
  };

  return (
    <Page
      visible={visible}
      title="Manage purchases"
      onClose={() => {
        setRestore("idle");
        onClose();
      }}
    >
      <FlatList
        data={wallet.purchases}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[
          styles.list,
          wallet.purchases.length === 0 && styles.grow,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: wallet.gold
                    ? colors.goldSoft
                    : colors.surface,
                  borderColor: wallet.gold ? colors.gold : colors.border,
                },
              ]}
            >
              <Ionicons
                name={wallet.gold ? "star" : "star-outline"}
                size={22}
                color={colors.gold}
              />
              <View style={styles.flex}>
                <AppText variant="body" weight="semibold">
                  {wallet.gold ? "Yonder Gold · active" : "Basic plan"}
                </AppText>
                <AppText variant="bodySmall" muted>
                  {wallet.boosts} boosts · {wallet.compliments} compliments left
                </AppText>
              </View>
            </View>
            <AppButton
              label={restore === "busy" ? "Restoring…" : "Restore purchases"}
              icon="refresh-outline"
              variant="secondary"
              disabled={restore === "busy"}
              onPress={doRestore}
            />
            {restore === "busy" ? (
              <ActivityIndicator color={colors.primary} />
            ) : null}
            {restore === "done" ? (
              <AppText variant="bodySmall" color={colors.boost} align="center">
                ✓ Everything is up to date. Nothing else to restore.
              </AppText>
            ) : null}
            {wallet.purchases.length ? (
              <AppText variant="label" muted>
                HISTORY
              </AppText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Empty
            icon="receipt-outline"
            title="No purchases yet"
            text="Gold, boosts and compliments you buy show up here."
          />
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              styles.purchase,
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.flex}>
              <AppText variant="body" weight="semibold">
                {item.title}
              </AppText>
              <AppText variant="bodySmall" muted>
                {new Date(item.at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </AppText>
            </View>
            <AppText variant="body" weight="semibold">
              {formatUsd(item.total)}
            </AppText>
          </View>
        )}
        ListFooterComponent={
          <AppText variant="caption" muted align="center" style={styles.footer}>
            Demo: nothing was ever charged.
          </AppText>
        }
      />
    </Page>
  );
}

// ---------- Who can see my profile ----------

const VISIBILITY: {
  key: Visibility;
  title: string;
  text: string;
  icon: IconName;
}[] = [
  {
    key: "everyone",
    title: "Everyone",
    text: "You show up in Swipe and Explore for everyone.",
    icon: "eye-outline",
  },
  {
    key: "liked",
    title: "Only people I like",
    text: "Only people you like can see you. Nobody new shows up in Likes.",
    icon: "heart-outline",
  },
  {
    key: "hidden",
    title: "No one",
    text: "Your profile is hidden. You can still swipe, but nobody can see you or match with you.",
    icon: "eye-off-outline",
  },
];

export function visibilityLabel(v: Visibility) {
  return VISIBILITY.find((o) => o.key === v)?.title ?? "Everyone";
}

export function VisibilitySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useTheme();
  const { saved, setPrivacy } = useSwipe();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText variant="heading" align="center">
        Who can see my profile
      </AppText>
      <View style={styles.options}>
        {VISIBILITY.map((o) => {
          const selected = saved.visibility === o.key;
          return (
            <PressableScale
              key={o.key}
              onPress={() => {
                setPrivacy({ visibility: o.key });
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              scaleTo={0.98}
              style={[
                styles.option,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card,
                },
              ]}
            >
              <Ionicons
                name={o.icon}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
              />
              <View style={styles.flex}>
                <AppText
                  variant="body"
                  weight="semibold"
                  color={selected ? colors.primary : colors.text}
                >
                  {o.title}
                </AppText>
                <AppText variant="bodySmall" muted>
                  {o.text}
                </AppText>
              </View>
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selected ? colors.primary : colors.textSubtle}
              />
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  flex: {
    flex: 1,
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
    padding: 16,
    paddingBottom: 32,
  },
  hint: {
    marginBottom: 8,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
  },
  initial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  purchase: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  footer: {
    marginTop: 16,
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
  options: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
});
