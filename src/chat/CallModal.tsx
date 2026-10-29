import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { mainPhotoUri } from '../profiles/data';
import { isLocked } from '../profiles/extras';
import type { Profile } from '../profiles/types';
import { useTheme } from '../theme/ThemeProvider';
import { tr } from '../i18n/i18n';

// Simulated audio / video call (demo: there is no call server).
// "Calling…" → "Ringing…" → after 15 s "No answer" and it closes by itself.
// Video: your front camera fills the screen behind (asks for the camera the first time).

export type CallKind = 'audio' | 'video';
type IconName = ComponentProps<typeof Ionicons>['name'];

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const RING_AFTER = 2000;
const NO_ANSWER_AFTER = 15000;
const CLOSE_AFTER = 2200;

type Props = {
  profile: Profile | null;
  kind: CallKind | null; // null = closed
  onClose: () => void;
};

export function CallModal({ profile, kind, onClose }: Props) {
  const open = profile !== null && kind !== null;
  return (
    <Modal visible={open} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {open ? <CallContent key={`${profile.id}-${kind}`} profile={profile} kind={kind} onClose={onClose} /> : null}
    </Modal>
  );
}

function CallContent({ profile, kind, onClose }: { profile: Profile; kind: CallKind; onClose: () => void }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<'calling' | 'ringing' | 'noAnswer'>('calling');
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(kind === 'video');
  const [cameraOff, setCameraOff] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const pulse = useSharedValue(0);
  const locked = isLocked(profile);
  const closeRef = useRef(onClose); // the timers below always call the latest onClose
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (__DEV__) console.log(`[call] ${kind} call to ${profile.id} (simulated)`);
    pulse.set(withRepeat(withSequence(withTiming(1, { duration: 900, easing: EASE }), withTiming(0, { duration: 900, easing: EASE })), -1));
    const t1 = setTimeout(() => setStage('ringing'), RING_AFTER);
    const t2 = setTimeout(() => {
      setStage('noAnswer');
      if (__DEV__) console.log(`[call] ${profile.id} no answer`);
    }, NO_ANSWER_AFTER);
    const t3 = setTimeout(() => closeRef.current(), NO_ANSWER_AFTER + CLOSE_AFTER);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [kind, profile.id, pulse]);

  useEffect(() => {
    if (kind === 'video' && permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => {});
    }
  }, [kind, permission, requestPermission]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 - pulse.get() * 0.5,
    transform: [{ scale: 1 + pulse.get() * 0.35 }],
  }));

  const showCamera = kind === 'video' && permission?.granted && !cameraOff;
  const status = stage === 'calling' ? tr('Calling…') : stage === 'ringing' ? tr('Ringing…') : tr('No answer');

  return (
    <View style={[styles.root, { backgroundColor: colors.viewerBg }]}>
      {showCamera ? <CameraView style={StyleSheet.absoluteFill} facing="front" /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.photoScrimTop }]} />

      <View style={[styles.top, { paddingTop: insets.top + 60 }]}>
        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.ring, { borderColor: colors.onPhoto }, ringStyle]} />
          <View style={styles.avatar}>
            <Image source={{ uri: mainPhotoUri(profile) }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={locked ? 40 : 0} />
          </View>
        </View>
        <AppText variant="title" color={colors.onPhoto} align="center">
          {profile.name}
        </AppText>
        <AppText variant="body" color={colors.onPhotoMuted} align="center">
          {kind === 'video' ? tr('Video call · ') : tr('Audio call · ')}
          {status}
        </AppText>
        <AppText variant="caption" color={colors.onPhotoMuted} align="center">
          {tr('Demo call — nobody is really called.')}
        </AppText>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 40 }]}>
        <Control icon={muted ? 'mic-off' : 'mic'} label={muted ? tr('Unmute') : tr('Mute')} active={muted} onPress={() => setMuted((m) => !m)} />
        {kind === 'video' ? (
          <Control
            icon={cameraOff ? 'videocam-off' : 'videocam'}
            label={cameraOff ? tr('Camera on') : tr('Camera off')}
            active={cameraOff}
            onPress={() => setCameraOff((c) => !c)}
          />
        ) : (
          <Control icon="volume-high" label={tr('Speaker')} active={speaker} onPress={() => setSpeaker((s) => !s)} />
        )}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="End call"
          style={({ pressed }) => [styles.end, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="call" size={30} color={colors.onDanger} style={styles.endIcon} />
        </Pressable>
      </View>
    </View>
  );
}

function Control({ icon, label, active, onPress }: { icon: IconName; label: string; active: boolean; onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.control}>
      <View style={[styles.controlCircle, { backgroundColor: active ? colors.onPhoto : colors.photoScrimTop }]}>
        <Ionicons name={icon} size={26} color={active ? colors.viewerBg : colors.onPhoto} />
      </View>
      <AppText variant="caption" color={colors.onPhoto}>
        {label}
      </AppText>
    </Pressable>
  );
}

const AVATAR = 130;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    width: AVATAR + 40,
    height: AVATAR + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ring: {
    position: 'absolute',
    width: AVATAR + 20,
    height: AVATAR + 20,
    borderRadius: (AVATAR + 20) / 2,
    borderWidth: 3,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
  },
  control: {
    alignItems: 'center',
    gap: 6,
  },
  controlCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  end: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
