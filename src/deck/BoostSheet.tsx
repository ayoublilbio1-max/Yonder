import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Checkout, type CheckoutItem } from '../components/Checkout';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import {
  BOOST_HOURS,
  BOOST_PACKS,
  formatCountdown,
  formatUsd,
  useBoostLeft,
  useWallet,
} from '../store/WalletProvider';
import { useTheme } from '../theme/ThemeProvider';

// Boost: 3 hours at the front of the queue. Buy 1 / 5 / 10 through the demo checkout;
// the first one starts right away, the rest wait in the wallet.

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function BoostSheet({ visible, onClose }: Props) {
  const colors = useTheme();
  const toast = useToast();
  const { wallet, addBoosts, startBoost } = useWallet();
  const left = useBoostLeft();
  const active = left > 0;
  const [packQty, setPackQty] = useState(5);
  const [buying, setBuying] = useState<CheckoutItem | null>(null);

  const pack = BOOST_PACKS.find((p) => p.qty === packQty) ?? BOOST_PACKS[0];
  const total = Math.round(pack.qty * pack.each * 100) / 100;

  const startOne = () => {
    if (startBoost()) {
      toast.show(`Boost is on for ${BOOST_HOURS} hours`);
      onClose();
    }
  };

  return (
    <>
      <Sheet visible={visible && buying === null} onClose={onClose}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: colors.boostSoft }]}>
            <Ionicons name="flash" size={30} color={colors.boost} />
          </View>
          {active ? (
            <>
              <AppText variant="title" align="center">
                Your boost is on
              </AppText>
              <AppText variant="display" align="center" color={colors.boost}>
                {formatCountdown(left)}
              </AppText>
              <AppText variant="bodySmall" muted align="center">
                You’re at the front of the queue. More people see your profile right now.
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="title" align="center">
                {'Get seen more.\nBoost your profile'}
              </AppText>
              <AppText variant="body" muted align="center">
                Get seen by 11x more people... more visits... more matches.
              </AppText>
            </>
          )}
          <AppText variant="body" weight="bold" align="center" color={colors.boost}>
            Stay front of the queue with cheaper boost bundles
          </AppText>
        </View>

        {!active && wallet.boosts > 0 ? (
          <AppButton
            label={`Use 1 of your ${wallet.boosts} boost${wallet.boosts > 1 ? 's' : ''}`}
            icon="flash"
            variant="boost"
            onPress={startOne}
          />
        ) : null}

        <View style={styles.packs}>
          {BOOST_PACKS.map((p) => {
            const selected = p.qty === packQty;
            return (
              <Pressable
                key={p.qty}
                onPress={() => setPackQty(p.qty)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.pack,
                  {
                    borderColor: selected ? colors.boost : colors.border,
                    backgroundColor: selected ? colors.boostSoft : colors.card,
                  },
                ]}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? colors.boost : colors.textSubtle}
                />
                <View style={styles.flex}>
                  <AppText variant="body" weight="semibold">
                    {p.qty} boost{p.qty > 1 ? 's' : ''}
                  </AppText>
                  <AppText variant="caption" muted>
                    {BOOST_HOURS} hours profile boost
                  </AppText>
                </View>
                <View style={styles.price}>
                  {p.tag ? (
                    <View style={[styles.tag, { backgroundColor: colors.boost }]}>
                      <AppText variant="caption" weight="bold" color={colors.onBoost}>
                        {p.tag}
                      </AppText>
                    </View>
                  ) : null}
                  <AppText variant="bodySmall" weight="semibold">
                    {formatUsd(p.each)} each
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          label="Continue"
          variant="boost"
          onPress={() =>
            setBuying({
              title: `${pack.qty} boost${pack.qty > 1 ? 's' : ''}`,
              detail: `${BOOST_HOURS} hours profile boost · ${formatUsd(pack.each)} each`,
              total,
            })
          }
        />
      </Sheet>

      <Checkout
        item={buying}
        onClose={() => {
          setBuying(null);
          onClose();
        }}
        onPaid={() => {
          addBoosts(pack.qty, !active);
          if (!active) toast.show(`Boost is on for ${BOOST_HOURS} hours`);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  packs: {
    gap: 10,
  },
  pack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  flex: {
    flex: 1,
  },
  price: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
});
