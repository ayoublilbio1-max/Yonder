import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { Checkout, type CheckoutItem } from "../components/Checkout";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { formatUsd, useWallet } from "../store/WalletProvider";
import { useTheme } from "../theme/ThemeProvider";

// Yonder Gold (demo): unlocks the advanced filters. Bought through the demo checkout.

const PLANS = [
  { key: "week", title: "1 week", price: 9.99 },
  { key: "month", title: "1 month", price: 24.99, tag: "Popular" },
  { key: "quarter", title: "3 months", price: 49.99, tag: "Best value" },
];

const PERKS = [
  "Advanced filters: verified, recently active, just joined, complete bio, Gold members",
  "A Gold badge on your profile",
  "Stand out to people who use advanced filters",
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoined?: () => void;
};

export function GoldSheet({ visible, onClose, onJoined }: Props) {
  const colors = useTheme();
  const toast = useToast();
  const { update } = useWallet();
  const [plan, setPlan] = useState("month");
  const [buying, setBuying] = useState<CheckoutItem | null>(null);
  const chosen = PLANS.find((p) => p.key === plan) ?? PLANS[1];

  return (
    <>
      <Sheet visible={visible && buying === null} onClose={onClose}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: colors.goldSoft }]}>
            <Ionicons name="star" size={28} color={colors.gold} />
          </View>
          <AppText variant="title" align="center">
            Yonder Gold
          </AppText>
          <AppText variant="bodySmall" muted align="center">
            Find exactly who you’re looking for.
          </AppText>
        </View>

        <View style={styles.perks}>
          {PERKS.map((t) => (
            <View key={t} style={styles.perk}>
              <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
              <AppText variant="bodySmall" style={styles.flex}>
                {t}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const selected = p.key === plan;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPlan(p.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.plan,
                  {
                    borderColor: selected ? colors.gold : colors.border,
                    backgroundColor: selected ? colors.goldSoft : colors.card,
                  },
                ]}
              >
                {p.tag ? (
                  <View style={[styles.tag, { backgroundColor: colors.gold }]}>
                    <AppText
                      variant="caption"
                      weight="bold"
                      color={colors.onPhoto}
                    >
                      {p.tag}
                    </AppText>
                  </View>
                ) : null}
                <AppText variant="body" weight="semibold">
                  {p.title}
                </AppText>
                <AppText variant="bodySmall" weight="semibold">
                  {formatUsd(p.price)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() =>
            setBuying({
              title: `Yonder Gold · ${chosen.title}`,
              detail: "Advanced filters + Gold badge",
              total: chosen.price,
            })
          }
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="star" size={18} color={colors.onPhoto} />
          <AppText variant="body" weight="semibold" color={colors.onPhoto}>
            Continue
          </AppText>
        </Pressable>
      </Sheet>

      <Checkout
        item={buying}
        onClose={() => {
          setBuying(null);
          onClose();
        }}
        onPaid={() => {
          update({ gold: true });
          toast.show("Welcome to Yonder Gold ⭐");
          if (__DEV__) console.log(`[gold] joined · ${chosen.key}`);
          onJoined?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: 4,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  perks: {
    gap: 8,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  plans: {
    flexDirection: "row",
    gap: 10,
  },
  plan: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingTop: 26,
    paddingBottom: 14,
    gap: 2,
    overflow: "hidden",
  },
  tag: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 2,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    borderRadius: 27,
  },
});
