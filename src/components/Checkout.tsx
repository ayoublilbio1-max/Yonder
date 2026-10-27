import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { playSound } from "../sound/sounds";
import { formatUsd } from "../store/WalletProvider";
import { useTheme } from "../theme/ThemeProvider";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { Sheet } from "./Sheet";

// Simulated checkout used by every demo purchase (compliments, boosts, Gold).
// No card number is ever asked for: it uses a ready-made demo card, and nothing is charged.

export type CheckoutItem = { title: string; detail: string; total: number };

type Method = "card" | "gpay";
type Stage = "review" | "paying" | "done";

type Props = {
  item: CheckoutItem | null; // null = closed
  onClose: () => void;
  onPaid: (item: CheckoutItem) => void;
};

export function Checkout({ item, onClose, onPaid }: Props) {
  const colors = useTheme();
  const [method, setMethod] = useState<Method>("card");
  const [stage, setStage] = useState<Stage>("review");

  const close = () => {
    if (stage === "paying") return;
    setStage("review");
    onClose();
  };

  const pay = () => {
    if (!item) return;
    setStage("paying");
    if (__DEV__)
      console.log(
        `[checkout] paying ${item.title} · ${item.total} · ${method} (demo)`,
      );
    setTimeout(() => {
      playSound("purchase");
      setStage("done");
      onPaid(item);
    }, 1400);
  };

  const methods: {
    key: Method;
    icon: "card-outline" | "logo-google";
    title: string;
    detail: string;
  }[] = [
    {
      key: "card",
      icon: "card-outline",
      title: "Visa •••• 4242",
      detail: "Demo card",
    },
    { key: "gpay", icon: "logo-google", title: "Google Pay", detail: "Demo" },
  ];

  return (
    <Sheet visible={item !== null} onClose={close}>
      {item && stage === "done" ? (
        <View style={styles.done}>
          <View
            style={[styles.doneIcon, { backgroundColor: colors.boostSoft }]}
          >
            <Ionicons name="checkmark" size={40} color={colors.boost} />
          </View>
          <AppText variant="title" align="center">
            Payment successful
          </AppText>
          <AppText variant="body" muted align="center">
            {item.title} added to your account.
          </AppText>
          <AppText variant="caption" muted align="center">
            This was a demo. No money was charged.
          </AppText>
          <AppButton label="Done" onPress={close} style={styles.full} />
        </View>
      ) : item ? (
        <>
          <AppText variant="heading" align="center">
            Checkout
          </AppText>

          <View
            style={[
              styles.box,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="body" weight="semibold">
                  {item.title}
                </AppText>
                <AppText variant="caption" muted>
                  {item.detail}
                </AppText>
              </View>
              <AppText variant="body" weight="semibold">
                {formatUsd(item.total)}
              </AppText>
            </View>
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
            <View style={styles.row}>
              <AppText variant="body" weight="bold" style={styles.flex}>
                Total
              </AppText>
              <AppText variant="body" weight="bold">
                {formatUsd(item.total)}
              </AppText>
            </View>
          </View>

          <AppText variant="label" muted>
            PAYMENT METHOD
          </AppText>
          <View
            style={[
              styles.box,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {methods.map((m, i) => {
              const selected = method === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMethod(m.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.row, i > 0 && styles.methodGap]}
                >
                  <Ionicons name={m.icon} size={22} color={colors.text} />
                  <View style={styles.flex}>
                    <AppText variant="body" weight="medium">
                      {m.title}
                    </AppText>
                    <AppText variant="caption" muted>
                      {m.detail}
                    </AppText>
                  </View>
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={selected ? colors.primary : colors.textSubtle}
                  />
                </Pressable>
              );
            })}
          </View>

          {stage === "paying" ? (
            <View style={[styles.paying, { backgroundColor: colors.primary }]}>
              <ActivityIndicator color={colors.onPrimary} />
            </View>
          ) : (
            <AppButton label={`Pay ${formatUsd(item.total)}`} onPress={pay} />
          )}
          <View style={styles.demoNote}>
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color={colors.textMuted}
            />
            <AppText variant="caption" muted>
              Demo checkout — no real payment is made.
            </AppText>
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  full: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodGap: {
    marginTop: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  paying: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  demoNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  done: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  doneIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
});
