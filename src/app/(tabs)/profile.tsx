import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { AppText } from "../../components/AppText";
import { Checkout, type CheckoutItem } from "../../components/Checkout";
import { PressableScale } from "../../components/PressableScale";
import { Sheet } from "../../components/Sheet";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { BoostSheet } from "../../deck/BoostSheet";
import { GoldSheet } from "../../deck/GoldSheet";
import { useSwipe } from "../../deck/SwipeProvider";
import { ageOf, completion, fieldValue, nextMissing } from "../../me/myProfile";
import { VerifyModal } from "../../me/VerifyModal";
import { EASE_OUT } from "../../motion/ease";
import { countryByCode, flagOf } from "../../onboarding/countries";
import {
  COMPLIMENT_PACKS,
  formatCountdown,
  formatUsd,
  useBoostLeft,
  useWallet,
} from "../../store/WalletProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Profile tab (Muzz menu + Tinder profile header, in Yonder's look):
// photo with a "complete" ring · name · Preview / Edit · what's missing · your chips ·
// blue check · plan (Basic / Gold) · compliments and boosts.

type IconName = ComponentProps<typeof Ionicons>["name"];
type ChipItem = { icon?: IconName; flag?: string; label: string };

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AVATAR = 96;
const RING = 6;

export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { ready, me, updateMe, likedYou } = useSwipe();
  const { wallet, complimentsLeft, addCompliments } = useWallet();
  const boostLeft = useBoostLeft();
  const [goldOpen, setGoldOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [buying, setBuying] = useState<CheckoutItem | null>(null);
  const [packQty, setPackQty] = useState(0);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const percent = completion(me);
  const missing = nextMissing(me);
  const age = ageOf(me.birthday);
  const nation = countryByCode(me.nationalities?.[0]);

  const allChips: (ChipItem | null)[] = [
    nation ? { flag: flagOf(nation.code), label: nation.nationality } : null,
    me.heightCm ? { icon: "resize-outline", label: `${me.heightCm} cm` } : null,
    me.profession ? { icon: "briefcase-outline", label: me.profession } : null,
    me.intent
      ? { icon: "heart-outline", label: fieldValue(me, "intent") }
      : null,
  ];
  const chips = allChips.filter((c): c is ChipItem => c !== null);

  const open = (tab: "preview" | "edit") =>
    router.push(`/my-profile?tab=${tab}` as Href);

  if (!ready) {
    return (
      <View
        style={[
          styles.screen,
          { backgroundColor: colors.bg, paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.pad}>
          <Skeleton style={styles.skelHead} />
          <Skeleton style={styles.skelCard} />
          <Skeleton style={styles.skelCard} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.topBar}>
        <AppText variant="title">Profile</AppText>
        <PressableScale
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          scaleTo={0.9}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={[styles.pad, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* photo + name */}
        <View style={styles.head}>
          <PressableScale
            onPress={() => open("preview")}
            accessibilityRole="button"
            accessibilityLabel="Preview your profile"
            scaleTo={0.95}
          >
            <Ring percent={percent} />
            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
              {me.photos?.[0] ? (
                <Image
                  source={{ uri: me.photos[0] }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={180}
                />
              ) : (
                <Ionicons name="person" size={40} color={colors.textSubtle} />
              )}
            </View>
            <View
              style={[
                styles.percentTag,
                {
                  backgroundColor:
                    percent === 100 ? colors.boost : colors.primary,
                  borderColor: colors.bg,
                },
              ]}
            >
              <AppText variant="caption" weight="bold" color={colors.onPrimary}>
                {percent}%
              </AppText>
            </View>
          </PressableScale>
          <View style={styles.headText}>
            <View style={styles.nameRow}>
              <AppText variant="title" numberOfLines={1} style={styles.shrink}>
                {me.firstName ?? "You"}
                {age ? `, ${age}` : ""}
              </AppText>
              {me.photoVerified ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.verified}
                />
              ) : null}
            </View>
            <View style={styles.headButtons}>
              <SmallButton
                icon="eye-outline"
                label="Preview"
                onPress={() => open("preview")}
              />
              <SmallButton
                icon="create-outline"
                label="Edit"
                onPress={() => open("edit")}
              />
            </View>
          </View>
        </View>

        {/* what's missing */}
        {missing ? (
          <PressableScale
            onPress={() =>
              missing === "Verify your photo"
                ? setVerifyOpen(true)
                : open("edit")
            }
            accessibilityRole="button"
            scaleTo={0.98}
            style={[
              styles.missing,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="alert-circle" size={22} color={colors.primary} />
            <View style={styles.flex}>
              <AppText variant="body" weight="semibold">
                Complete your profile
              </AppText>
              <AppText variant="bodySmall" muted>
                {missing}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSubtle}
            />
          </PressableScale>
        ) : null}

        {/* chips */}
        {chips.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsScroll}
          >
            {chips.map((c) => (
              <PressableScale
                key={c.label}
                onPress={() => open("edit")}
                accessibilityRole="button"
                scaleTo={0.95}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {c.flag ? (
                  <AppText variant="bodySmall">{c.flag}</AppText>
                ) : null}
                {c.icon ? (
                  <Ionicons name={c.icon} size={15} color={colors.textMuted} />
                ) : null}
                <AppText variant="bodySmall" weight="medium" numberOfLines={1}>
                  {c.label}
                </AppText>
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}

        {/* blue check */}
        {!me.photoVerified ? (
          <PressableScale
            onPress={() => setVerifyOpen(true)}
            accessibilityRole="button"
            scaleTo={0.98}
            style={[
              styles.verifyCard,
              { backgroundColor: colors.surface, borderColor: colors.verified },
            ]}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.verified}
              />
            </View>
            <View style={styles.flex}>
              <AppText variant="body" weight="semibold">
                Get verified
              </AppText>
              <AppText variant="bodySmall" muted>
                Take a quick selfie to get the blue check. Verified profiles get
                more matches.
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSubtle}
            />
          </PressableScale>
        ) : null}

        {/* plan */}
        {wallet.gold ? (
          <View
            style={[
              styles.plan,
              { backgroundColor: colors.goldSoft, borderColor: colors.gold },
            ]}
          >
            <Ionicons name="star" size={22} color={colors.gold} />
            <View style={styles.flex}>
              <AppText variant="body" weight="bold">
                Yonder Gold
              </AppText>
              <AppText variant="bodySmall" muted>
                All filters, see who likes you, Active now and Nearby.
              </AppText>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.gold} />
          </View>
        ) : (
          <View
            style={[
              styles.plan,
              styles.planBasic,
              {
                backgroundColor: colors.surface,
                borderColor: colors.textSubtle,
              },
            ]}
          >
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Ionicons name="checkmark" size={18} color={colors.text} />
                <AppText variant="body" weight="bold">
                  Basic plan
                </AppText>
              </View>
              <AppText variant="bodySmall" muted>
                Limited filters. Likes you stay blurred.
              </AppText>
            </View>
            <PressableScale
              onPress={() => setGoldOpen(true)}
              accessibilityRole="button"
              scaleTo={0.95}
              style={[styles.upgrade, { backgroundColor: colors.gold }]}
            >
              <AppText variant="bodySmall" weight="bold" color={colors.onPhoto}>
                Upgrade
              </AppText>
            </PressableScale>
          </View>
        )}

        {/* likes you */}
        <PressableScale
          onPress={() => router.navigate("/likes" as Href)}
          accessibilityRole="button"
          scaleTo={0.98}
          style={[
            styles.likes,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="display" color={colors.primary}>
            {likedYou.length}
          </AppText>
          <View style={styles.flex}>
            <AppText variant="body" weight="semibold">
              {likedYou.length === 1 ? "person likes you" : "people like you"}
            </AppText>
            <AppText variant="bodySmall" muted>
              {wallet.gold
                ? "See them in Likes."
                : "Get Gold to see who they are."}
            </AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSubtle}
          />
        </PressableScale>

        {/* compliments + boosts */}
        <View style={styles.tiles}>
          <Tile
            count={String(complimentsLeft)}
            title="Compliments"
            text="Message without waiting."
            color={colors.primary}
            onPress={() => setPacksOpen(true)}
          />
          <Tile
            count={
              boostLeft > 0 ? formatCountdown(boostLeft) : String(wallet.boosts)
            }
            title={boostLeft > 0 ? "Boost is on" : "3 hour boosts"}
            text="Get seen by more people."
            color={colors.boost}
            onPress={() => setBoostOpen(true)}
          />
        </View>
      </ScrollView>

      <GoldSheet visible={goldOpen} onClose={() => setGoldOpen(false)} />
      <BoostSheet visible={boostOpen} onClose={() => setBoostOpen(false)} />
      <VerifyModal
        visible={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={() => {
          updateMe({ photoVerified: true });
          toast.show("You’re verified");
        }}
      />

      {/* compliment packs → demo checkout */}
      <Sheet
        visible={packsOpen && buying === null}
        onClose={() => setPacksOpen(false)}
      >
        <AppText variant="heading" align="center">
          Get more compliments
        </AppText>
        <AppText variant="bodySmall" muted align="center">
          Send a message before you match. You get 1 free compliment every day.
        </AppText>
        <View style={styles.packs}>
          {COMPLIMENT_PACKS.map((p) => (
            <PressableScale
              key={p.qty}
              onPress={() => {
                setPackQty(p.qty);
                setBuying({
                  title: `${p.qty} compliments`,
                  detail: `${formatUsd(p.price / p.qty)} each`,
                  total: p.price,
                });
              }}
              accessibilityRole="button"
              scaleTo={0.95}
              style={[
                styles.pack,
                {
                  borderColor: p.tag ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              {p.tag ? (
                <View style={[styles.tag, { backgroundColor: colors.primary }]}>
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={colors.onPrimary}
                  >
                    {p.tag}
                  </AppText>
                </View>
              ) : null}
              <AppText variant="title">{p.qty}</AppText>
              <AppText variant="caption" muted>
                compliments
              </AppText>
              <AppText variant="bodySmall" weight="semibold">
                {formatUsd(p.price)}
              </AppText>
            </PressableScale>
          ))}
        </View>
      </Sheet>
      <Checkout
        item={buying}
        onClose={() => {
          setBuying(null);
          setPacksOpen(false);
        }}
        onPaid={() => addCompliments(packQty)}
      />
    </View>
  );
}

// The ring around your photo fills to your "complete" % with a CSS-like ease-out.
function Ring({ percent }: { percent: number }) {
  const colors = useTheme();
  const size = AVATAR + RING * 2 + 4;
  const r = (size - RING) / 2;
  const length = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(withTiming(percent / 100, { duration: 700, easing: EASE_OUT }));
  }, [percent, p]);

  const props = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - p.get()),
  }));

  return (
    <Svg width={size} height={size} style={styles.ring}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.border}
        strokeWidth={RING}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={percent === 100 ? colors.boost : colors.primary}
        strokeWidth={RING}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${length} ${length}`}
        animatedProps={props}
      />
    </Svg>
  );
}

function SmallButton({
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
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      scaleTo={0.95}
      style={[
        styles.smallBtn,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
      <AppText variant="bodySmall" weight="semibold">
        {label}
      </AppText>
    </PressableScale>
  );
}

function Tile({
  count,
  title,
  text,
  color,
  onPress,
}: {
  count: string;
  title: string;
  text: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <AppText variant="title">{count}</AppText>
      <AppText variant="body" weight="semibold">
        {title}
      </AppText>
      <AppText variant="bodySmall" muted style={styles.flex}>
        {text}
      </AppText>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        scaleTo={0.95}
        style={[styles.getMore, { backgroundColor: color }]}
      >
        <AppText variant="bodySmall" weight="bold" color={colors.onPrimary}>
          Get more
        </AppText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  pad: {
    paddingHorizontal: 16,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
  },
  ring: {
    position: "absolute",
    left: -(RING + 2),
    top: -(RING + 2),
    transform: [{ rotate: "-90deg" }], // the ring starts at the top
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  percentTag: {
    position: "absolute",
    bottom: -10,
    alignSelf: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  headText: {
    flex: 1,
    gap: 10,
    paddingLeft: RING,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headButtons: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  missing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  chipsScroll: {
    marginHorizontal: -16,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 240,
  },
  verifyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  planBasic: {
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
  upgrade: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  likes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  tiles: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    gap: 2,
  },
  getMore: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
  },
  packs: {
    flexDirection: "row",
    gap: 10,
  },
  pack: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 2,
  },
  tag: {
    position: "absolute",
    top: -10,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  skelHead: {
    height: 110,
    borderRadius: 20,
  },
  skelCard: {
    height: 80,
    borderRadius: 18,
  },
});
