import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { mainPhotoUri } from '../profiles/data';
import { isLocked } from '../profiles/extras';
import type { Profile } from '../profiles/types';
import { playSound } from '../sound/sounds';
import { useTheme } from '../theme/ThemeProvider';
import { tr } from '../i18n/i18n';

// "It's a match!" — full screen over the deck, with the match sound.
// Everything eases in like a CSS transition (no bounce): background fades, the two photos
// slide in from the sides, then the title and the buttons. Closing fades it all out.

const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const PHOTO = 132;

type Props = {
  profile: Profile | null; // null = closed
  myPhoto?: string; // the tester's main photo (local file)
  myName?: string;
  onClose: () => void; // "Keep swiping"
  onMessage: () => void; // "Send a message"
};

export function MatchModal({ profile, myPhoto, myName, onClose, onMessage }: Props) {
  return (
    <Modal visible={profile !== null} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {profile ? <MatchContent key={profile.id} profile={profile} myPhoto={myPhoto} myName={myName} onClose={onClose} onMessage={onMessage} /> : null}
    </Modal>
  );
}

function MatchContent({ profile, myPhoto, myName, onClose, onMessage }: Props & { profile: Profile }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const bg = useSharedValue(0);
  const photos = useSharedValue(0);
  const text = useSharedValue(0);
  const locked = isLocked(profile);

  useEffect(() => {
    playSound('match');
    bg.set(withTiming(1, { duration: 280, easing: EASE }));
    photos.set(withDelay(80, withTiming(1, { duration: 460, easing: EASE_OUT })));
    text.set(withDelay(260, withTiming(1, { duration: 360, easing: EASE_OUT })));
    if (__DEV__) console.log(`[match] shown · ${profile.id}${locked ? ' (locked photos)' : ''}`);
  }, [bg, photos, text, profile.id, locked]);

  // Fade everything out, then tell the screen.
  const leave = (next: () => void) => {
    text.set(withTiming(0, { duration: 160, easing: EASE }));
    photos.set(withTiming(0, { duration: 200, easing: EASE }));
    bg.set(
      withTiming(0, { duration: 220, easing: EASE }, (finished) => {
        if (finished) scheduleOnRN(next);
      }),
    );
  };

  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.get() }));
  const leftStyle = useAnimatedStyle(() => ({
    opacity: photos.get(),
    transform: [{ translateX: (1 - photos.get()) * -90 }, { rotate: `${-8 * photos.get()}deg` }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: photos.get(),
    transform: [{ translateX: (1 - photos.get()) * 90 }, { rotate: `${8 * photos.get()}deg` }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.get(),
    transform: [{ translateY: (1 - text.get()) * 16 }, { scale: 0.96 + text.get() * 0.04 }],
  }));

  const male = profile.gender === 'male';

  return (
    <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.photos}>
          <Animated.View style={[styles.photoWrap, { borderColor: colors.onPhoto }, leftStyle]}>
            {myPhoto ? (
              <Image source={{ uri: myPhoto }} style={styles.photo} contentFit="cover" />
            ) : (
              <View style={[styles.photo, styles.initial, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="display" color={colors.primary}>
                  {(myName ?? tr('You')).charAt(0).toUpperCase()}
                </AppText>
              </View>
            )}
          </Animated.View>
          <Animated.View style={[styles.photoWrap, styles.overlap, { borderColor: colors.onPhoto }, rightStyle]}>
            <Image
              source={{ uri: mainPhotoUri(profile) }}
              style={styles.photo}
              contentFit="cover"
              blurRadius={locked ? 40 : 0}
              cachePolicy="memory-disk"
            />
            {locked ? (
              <View style={[styles.lock, { backgroundColor: colors.photoScrimTop }]}>
                <Ionicons name="lock-closed" size={22} color={colors.onPhoto} />
              </View>
            ) : null}
          </Animated.View>
        </View>

        <Animated.View style={[styles.texts, textStyle]}>
          <AppText variant="display" align="center" color={colors.onPhoto}>
            {tr('It’s a match!')}
          </AppText>
          <AppText variant="body" align="center" color={colors.onPhotoMuted}>
            {tr('You and {name} like each other.', { name: profile.name })}
            {locked
              ? ` ${male ? tr('{name} will share his photos once you chat.', { name: profile.name }) : tr('{name} will share her photos once you chat.', { name: profile.name })}`
              : ''}
          </AppText>
        </Animated.View>

        <Animated.View style={[styles.buttons, textStyle]}>
          <Pressable
            onPress={() => leave(onMessage)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, { backgroundColor: colors.onPhoto, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <AppText variant="body" weight="semibold" color={colors.primary}>
              {male ? tr('Send him a message') : tr('Send her a message')}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => leave(onClose)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, styles.outline, { borderColor: colors.onPhoto, opacity: pressed ? 0.7 : 1 }]}
          >
            <AppText variant="body" weight="semibold" color={colors.onPhoto}>
              {tr('Keep swiping')}
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 36,
  },
  photos: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoWrap: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    borderWidth: 4,
    overflow: 'hidden',
  },
  overlap: {
    marginLeft: -22,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    alignSelf: 'center',
    top: PHOTO / 2 - 22,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    gap: 8,
  },
  buttons: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 27,
  },
  outline: {
    borderWidth: 1.5,
  },
});
