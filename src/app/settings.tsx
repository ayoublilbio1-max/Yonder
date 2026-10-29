import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthProvider";
import { displayName, METHOD_LABEL } from "../auth/types";
import { AppText } from "../components/AppText";
import { ConfirmModal } from "../components/ConfirmModal";
import { FeedbackModal } from "../components/FeedbackModal";
import { PressableScale } from "../components/PressableScale";
import { APP_NAME, APP_VERSION, DEVELOPER } from "../constants/app";
import { DURATION, EASE } from "../motion/ease";
import {
  setDistanceUnit,
  useDistanceUnit,
  type DistanceUnit,
} from "../settings/units";
import { playSound, setSoundsEnabled, useSoundsEnabled } from "../sound/sounds";
import { useTheme, useThemeMode, type ThemeMode } from "../theme/ThemeProvider";

type IconName = ComponentProps<typeof Ionicons>["name"];

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string; icon: IconName }[] =
  [
    { mode: "system", label: "Follow phone", icon: "phone-portrait-outline" },
    { mode: "light", label: "Light", icon: "sunny-outline" },
    { mode: "dark", label: "Dark", icon: "moon-outline" },
  ];

export default function SettingsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, setMode } = useThemeMode();
  const { session, signOut } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const soundsOn = useSoundsEnabled();
  const unit = useDistanceUnit();

  const user = session?.user;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          scaleTo={0.88}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <AppText variant="title">Settings</AppText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {user ? (
          <>
            <AppText variant="label" muted style={styles.sectionTitle}>
              ACCOUNT
            </AppText>
            <View
              style={[
                styles.group,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                {user.photo ? (
                  <Image
                    source={{ uri: user.photo }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[styles.avatar, { backgroundColor: colors.primary }]}
                  >
                    <AppText variant="heading" color={colors.onPrimary}>
                      {displayName(user).charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
                <View style={styles.rowText}>
                  <AppText variant="body" weight="semibold">
                    {displayName(user)}
                  </AppText>
                  <AppText variant="bodySmall" muted numberOfLines={1}>
                    {user.email}
                  </AppText>
                  <AppText variant="caption" muted>
                    Signed in with {METHOD_LABEL[user.method]}
                  </AppText>
                </View>
              </View>
              <PressableScale
                onPress={() => setLogoutOpen(true)}
                accessibilityRole="button"
                scaleTo={0.99}
                dimTo={0.7}
                style={[
                  styles.row,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.dangerSoft },
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={colors.danger}
                  />
                </View>
                <AppText
                  variant="body"
                  weight="medium"
                  color={colors.danger}
                  style={styles.rowText}
                >
                  Log out
                </AppText>
              </PressableScale>
            </View>
          </>
        ) : null}

        <AppText variant="label" muted style={styles.sectionTitle}>
          APPEARANCE
        </AppText>
        <View
          style={[
            styles.group,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {APPEARANCE_OPTIONS.map((option, i) => {
            const selected = mode === option.mode;
            return (
              <PressableScale
                key={option.mode}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                scaleTo={0.99}
                dimTo={0.7}
                style={[
                  styles.row,
                  i > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Ionicons name={option.icon} size={22} color={colors.text} />
                <AppText variant="body" style={styles.rowText}>
                  {option.label}
                </AppText>
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={selected ? colors.primary : colors.textSubtle}
                />
              </PressableScale>
            );
          })}
        </View>

        <AppText variant="label" muted style={styles.sectionTitle}>
          DISTANCE
        </AppText>
        <View
          style={[
            styles.group,
            styles.unitGroup,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.unitHead}>
            <AppText variant="body" weight="medium" style={styles.rowText}>
              Show distances in
            </AppText>
            <AppText variant="body" muted>
              {unit === "km" ? "Km" : "Mi"}
            </AppText>
          </View>
          <UnitSwitch value={unit} onChange={setDistanceUnit} />
        </View>

        <AppText variant="label" muted style={styles.sectionTitle}>
          SOUNDS
        </AppText>
        <View
          style={[
            styles.group,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <PressableScale
            onPress={() => {
              setSoundsEnabled(!soundsOn);
              if (!soundsOn) playSound("purchase");
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: soundsOn }}
            scaleTo={0.99}
            dimTo={0.7}
            style={styles.row}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name={soundsOn ? "volume-high-outline" : "volume-mute-outline"}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="medium">
                App sounds
              </AppText>
              <AppText variant="bodySmall" muted>
                Matches, boosts and payments
              </AppText>
            </View>
            <Switch
              value={soundsOn}
              onValueChange={(on) => {
                setSoundsEnabled(on);
                if (on) playSound("purchase");
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </PressableScale>
        </View>

        <AppText variant="label" muted style={styles.sectionTitle}>
          HELP
        </AppText>
        <View
          style={[
            styles.group,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <PressableScale
            onPress={() => setFeedbackOpen(true)}
            accessibilityRole="button"
            scaleTo={0.99}
            dimTo={0.7}
            style={styles.row}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="medium">
                Feedback
              </AppText>
              <AppText variant="bodySmall" muted>
                Report a bug or tell us what to improve
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSubtle}
            />
          </PressableScale>
        </View>

        <View style={styles.footer}>
          <AppText variant="bodySmall" muted align="center">
            {APP_NAME} {APP_VERSION}
          </AppText>
          <AppText variant="bodySmall" muted align="center">
            Developed with{" "}
            <AppText variant="bodySmall" color={colors.primary}>
              ♥
            </AppText>{" "}
            by {DEVELOPER}
          </AppText>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
      <ConfirmModal
        visible={logoutOpen}
        title="Log out?"
        message="You'll go back to the welcome screen. Your account stays saved on this phone."
        confirmLabel="Log out"
        icon="log-out-outline"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          signOut();
        }}
      />
    </View>
  );
}

// "Km | Mi" (like Tinder): the pink pill slides to the choice with a CSS-like ease.
function UnitSwitch({
  value,
  onChange,
}: {
  value: DistanceUnit;
  onChange: (u: DistanceUnit) => void;
}) {
  const colors = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(value === "km" ? 0 : 1);
  useEffect(() => {
    x.set(
      withTiming(value === "km" ? 0 : 1, {
        duration: DURATION.quick + 60,
        easing: EASE,
      }),
    );
  }, [value, x]);
  const pill = useAnimatedStyle(() => ({
    width: w / 2,
    transform: [{ translateX: (x.get() * w) / 2 }],
  }));
  const onLayout = (e: LayoutChangeEvent) =>
    setW(e.nativeEvent.layout.width - 8);

  return (
    <View
      style={[
        styles.unitSwitch,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[styles.unitPill, { backgroundColor: colors.primary }, pill]}
      />
      {(["km", "mi"] as DistanceUnit[]).map((u) => (
        <PressableScale
          key={u}
          onPress={() => onChange(u)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === u }}
          accessibilityLabel={u === "km" ? "Kilometres" : "Miles"}
          scaleTo={0.96}
          style={styles.unitBtn}
        >
          <AppText
            variant="body"
            weight="semibold"
            color={value === u ? colors.onPrimary : colors.text}
          >
            {u === "km" ? "Km" : "Mi"}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  unitGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  unitHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitSwitch: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  unitPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 10,
  },
  unitBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  footer: {
    marginTop: 36,
    gap: 2,
  },
});
