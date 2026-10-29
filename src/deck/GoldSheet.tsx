import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Checkout, type CheckoutItem } from '../components/Checkout';
import { Sheet } from '../components/Sheet';
import { mainPhotoUri } from '../profiles/data';
import type { Profile } from '../profiles/types';
import { useToast } from '../components/Toast';
import { formatUsd, useWallet } from '../store/WalletProvider';
import { useTheme } from '../theme/ThemeProvider';
import { tr } from '../i18n/i18n';

// Yonder Gold (demo): see who likes you + advanced filters. Bought through the demo checkout.
// variant 'likes' (from the Chats / Likes screens) shows the blurred people who liked you on top.

const PLANS = [
  { key: 'week', title: '1 week', price: 9.99 },
  { key: 'month', title: '1 month', price: 24.99, tag: 'Popular' },
  { key: 'quarter', title: '3 months', price: 49.99, tag: 'Best value' },
];

const PERKS = {
  filters: [
    'Advanced filters: verified, recently active, just joined, complete bio, Gold members',
    'See everyone who likes you',
    'A Gold badge on your profile',
  ],
  likes: [
    'See everyone who likes you',
    'Like them back for an instant match',
    'Advanced filters and a Gold badge on your profile',
  ],
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoined?: () => void;
  variant?: 'filters' | 'likes';
  likers?: Profile[]; // variant 'likes': who liked you (shown blurred)
};

export function GoldSheet({ visible, onClose, onJoined, variant = 'filters', likers = [] }: Props) {
  const colors = useTheme();
  const toast = useToast();
  const { update } = useWallet();
  const [plan, setPlan] = useState('month');
  const [buying, setBuying] = useState<CheckoutItem | null>(null);
  const chosen = PLANS.find((p) => p.key === plan) ?? PLANS[1];

  return (
    <>
      <Sheet visible={visible && buying === null} onClose={onClose}>
        <View style={styles.header}>
          {variant === 'likes' && likers.length ? (
            <View style={styles.likers}>
              {likers.slice(0, 3).map((p, i) => (
                <View key={p.id} style={[styles.liker, { borderColor: colors.card, marginLeft: i ? -18 : 0 }]}>
                  <Image source={{ uri: mainPhotoUri(p) }} style={StyleSheet.absoluteFill} blurRadius={40} contentFit="cover" />
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.icon, { backgroundColor: colors.goldSoft }]}>
              <Ionicons name="star" size={28} color={colors.gold} />
            </View>
          )}
          <AppText variant="title" align="center">
            {variant === 'likes' ? tr('See who likes you') : tr('Yonder Gold')}
          </AppText>
          <AppText variant="bodySmall" muted align="center">
            {variant === 'likes'
              ? likers.length === 1
                ? tr('1 person likes you. Match with them instantly with Yonder Gold.')
                : tr('{count} people like you. Match with them instantly with Yonder Gold.', { count: likers.length })
              : tr('Find exactly who you’re looking for.')}
          </AppText>
        </View>

        <View style={styles.perks}>
          {PERKS[variant].map((t) => (
            <View key={t} style={styles.perk}>
              <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
              <AppText variant="bodySmall" style={styles.flex}>
                {tr(t)}
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
                  { borderColor: selected ? colors.gold : colors.border, backgroundColor: selected ? colors.goldSoft : colors.card },
                ]}
              >
                {p.tag ? (
                  <View style={[styles.tag, { backgroundColor: colors.gold }]}>
                    <AppText variant="caption" weight="bold" color={colors.onPhoto}>
                      {tr(p.tag)}
                    </AppText>
                  </View>
                ) : null}
                <AppText variant="body" weight="semibold">
                  {tr(p.title)}
                </AppText>
                <AppText variant="bodySmall" weight="semibold">
                  {formatUsd(p.price)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setBuying({ title: `Yonder Gold · ${tr(chosen.title)}`, detail: tr('Advanced filters + Gold badge'), total: chosen.price })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="star" size={18} color={colors.onPhoto} />
          <AppText variant="body" weight="semibold" color={colors.onPhoto}>
            {tr('Continue')}
          </AppText>
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} style={styles.later}>
          <AppText variant="bodySmall" weight="semibold" muted align="center">
            {tr('Maybe later')}
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
          toast.show(tr('Welcome to Yonder Gold ⭐'));
          if (__DEV__) console.log(`[gold] joined · ${chosen.key}`);
          onJoined?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  perks: {
    gap: 8,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  plans: {
    flexDirection: 'row',
    gap: 10,
  },
  plan: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingTop: 26,
    paddingBottom: 14,
    gap: 2,
    overflow: 'hidden',
  },
  tag: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 2,
  },
  likers: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  liker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    overflow: 'hidden',
  },
  later: {
    paddingVertical: 4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: 27,
  },
});
