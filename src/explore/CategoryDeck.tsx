import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { actionGradients } from '../constants/colors';
import { ProfileModal } from '../deck/ProfileModal';
import { SwipeCard, type FlingFn } from '../deck/SwipeCard';
import { useSwipe, type SwipeAction } from '../deck/SwipeProvider';
import { mainPhotoUri } from '../profiles/data';
import type { Profile } from '../profiles/types';
import { useTheme } from '../theme/ThemeProvider';
import type { Category } from './categories';
import { tr } from '../i18n/i18n';

// One Explore category as its own swipe deck: the same card, buttons and match rules as Swipe.
// Tap the card for the full profile.

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  category: Category | null; // null = closed
  onClose: () => void;
  onMatch: (p: Profile) => void; // the screen shows "It's a match!"
};

export function CategoryDeck({ category, onClose, onMatch }: Props) {
  return (
    <Modal visible={category !== null} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {category ? <DeckContent key={category.key} category={category} onClose={onClose} onMatch={onMatch} /> : null}
    </Modal>
  );
}

function DeckContent({ category, onClose, onMatch }: { category: Category; onClose: () => void; onMatch: (p: Profile) => void }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { deck, swipe, saved } = useSwipe();
  const progress = useSharedValue(0);
  const flingRef = useRef<FlingFn | null>(null);
  const busyRef = useRef(false);
  const [open, setOpen] = useState<Profile | null>(null);

  const list = deck.filter(category.test);
  const top = list[0];
  const next = list[1];
  const cardH = Math.round(height * 0.62);

  // next photos ready before they're needed
  const upcoming = list
    .slice(1, 4)
    .map((p) => mainPhotoUri(p))
    .join('|');
  useEffect(() => {
    if (upcoming) Image.prefetch(upcoming.split('|')).catch(() => {});
  }, [upcoming]);

  const topId = top?.id;
  useEffect(() => {
    busyRef.current = false;
    progress.set(withTiming(0, { duration: 220 }));
  }, [topId, progress]);

  useEffect(() => {
    if (__DEV__) console.log(`[explore] open ${category.key} · ${list.length} people`);
    // log once when the category opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSwiped = (action: SwipeAction) => {
    busyRef.current = false;
    if (!top) return;
    const matched = swipe(top.id, action);
    if (matched) onMatch(top);
  };

  const press = (action: SwipeAction) => {
    if (!top || busyRef.current) return;
    busyRef.current = true;
    if (flingRef.current) flingRef.current(action);
    else onSwiped(action);
  };

  const fromProfile = (action: 'like' | 'pass') => {
    const p = open;
    setOpen(null);
    if (!p) return;
    const matched = swipe(p.id, action);
    if (matched) onMatch(p);
  };

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={category.icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading" numberOfLines={1}>
            {tr(category.title)}
          </AppText>
          <AppText variant="caption" muted>
            {list.length === 1 ? tr('1 person') : tr('{count} people', { count: list.length })}
          </AppText>
        </View>
      </View>

      {top ? (
        <>
          <View style={[styles.cardBox, { height: cardH }]}>
            {next ? <SwipeCard key={next.id} profile={next} isTop={false} progress={progress} onSwiped={onSwiped} /> : null}
            <SwipeCard
              key={top.id}
              profile={top}
              isTop
              progress={progress}
              onSwiped={onSwiped}
              onOpen={() => setOpen(top)}
              registerFling={(fn) => {
                flingRef.current = fn;
              }}
            />
          </View>
          <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
            <Round icon="close" gradient={actionGradients.pass} size={64} label={tr('Pass')} onPress={() => press('pass')} />
            <Round icon="star" gradient={actionGradients.superLike} size={52} label={tr('Super like')} onPress={() => press('superlike')} />
            <Round icon="heart" gradient={actionGradients.like} size={64} label={tr('Like')} onPress={() => press('like')} />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={category.icon} size={38} color={colors.primary} />
          </View>
          <AppText variant="heading" align="center">
            {tr('You’ve seen everyone here')}
          </AppText>
          <AppText variant="body" muted align="center">
            {tr('New people join every day. Try another category.')}
          </AppText>
          <AppButton label={tr('Back to Explore')} onPress={onClose} style={styles.emptyButton} />
        </View>
      )}

      <ProfileModal
        profile={open}
        matched={open ? Boolean(saved.matches[open.id]) : false}
        liked={false}
        onClose={() => setOpen(null)}
        onLike={() => fromProfile('like')}
        onPass={() => fromProfile('pass')}
        onOpenChat={() => setOpen(null)}
      />
    </GestureHandlerRootView>
  );
}

function Round({
  icon,
  gradient,
  size,
  label,
  onPress,
}: {
  icon: IconName;
  gradient: readonly [string, string];
  size: number;
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: gradient[1], shadowColor: gradient[1], transform: [{ scale: pressed ? 0.9 : 1 }] },
      ]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.roundFill, { borderRadius: size / 2 }]}>
        <Ionicons name={icon} size={size * 0.48} color={colors.onPhoto} />
      </LinearGradient>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBox: {
    marginHorizontal: 12,
    marginTop: 4,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  round: {
    elevation: 6,
  },
  roundFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: 14,
  },
});
