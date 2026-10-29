import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { PressableScale } from '../components/PressableScale';
import { DURATION, EASE_IN_OUT, EASE_OUT } from '../motion/ease';
import { useTheme } from '../theme/ThemeProvider';
import { tr } from '../i18n/i18n';

// Photo verification (simulated, like Tinder / Muzz): copy a pose in a selfie → "Checking…" → blue check.
// The selfie is only shown on this screen. It is never saved or uploaded.

type Stage = 'intro' | 'camera' | 'checking' | 'done';

type Pose = { key: string; hand: string; text: string };
const POSES: Pose[] = [
  { key: 'peace', hand: '✌️', text: 'Hold up a peace sign next to your face' },
  { key: 'thumb', hand: '👍', text: 'Give a thumbs up next to your face' },
  { key: 'wave', hand: '🖐️', text: 'Show your open hand next to your face' },
];

const CHECK_MS = 3200;

type Props = {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
};

export function VerifyModal({ visible, onClose, onVerified }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {visible ? <VerifyFlow onClose={onClose} onVerified={onVerified} /> : null}
    </Modal>
  );
}

function VerifyFlow({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('intro');
  const [pose] = useState(() => POSES[Math.floor(Math.random() * POSES.length)]);
  const [permission, requestPermission] = useCameraPermissions();
  const [selfie, setSelfie] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const camera = useRef<CameraView>(null);
  const verifiedRef = useRef(onVerified);
  useEffect(() => {
    verifiedRef.current = onVerified;
  }, [onVerified]);

  // "Checking…" then verified.
  useEffect(() => {
    if (stage !== 'checking') return;
    const t = setTimeout(() => {
      setStage('done');
      verifiedRef.current();
      if (__DEV__) console.log('[verify] photo verified (simulated)');
    }, CHECK_MS);
    return () => clearTimeout(t);
  }, [stage]);

  const start = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (__DEV__) console.log('[verify] camera permission', res.status);
      if (!res.granted) return;
    }
    setStage('camera');
  };

  const shoot = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.5 });
      if (pic?.uri) {
        setSelfie(pic.uri);
        setStage('checking');
        if (__DEV__) console.log(`[verify] selfie taken ${pic.width}x${pic.height} · pose ${pose.key}`);
      }
    } catch (e) {
      if (__DEV__) console.log('[verify] take picture failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  const denied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View style={[styles.root, { backgroundColor: stage === 'camera' ? colors.viewerBg : colors.bg }]}>
      {stage === 'camera' ? (
        <>
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" onCameraReady={() => setReady(true)} />
          <View style={[StyleSheet.absoluteFill, styles.center, styles.noTouch]}>
            <View style={[styles.oval, { borderColor: colors.onPhoto }]} />
          </View>
          <View style={[styles.camTop, { paddingTop: insets.top + 8 }]}>
            <CloseButton onPress={onClose} light />
            <View style={[styles.poseHint, { backgroundColor: colors.photoScrimTop }]}>
              <AppText variant="heading">{pose.hand}</AppText>
              <AppText variant="body" weight="semibold" color={colors.onPhoto} style={styles.flex}>
                {tr(pose.text)}
              </AppText>
            </View>
          </View>
          <View style={[styles.camBottom, { paddingBottom: insets.bottom + 28 }]}>
            <PressableScale
              onPress={shoot}
              disabled={!ready || busy}
              accessibilityRole="button"
              accessibilityLabel="Take the selfie"
              scaleTo={0.9}
              style={styles.shutterWrap}
            >
              <View style={[styles.shutter, { borderColor: colors.onPhoto, opacity: ready ? 1 : 0.5 }]}>
                <View style={[styles.shutterInner, { backgroundColor: colors.onPhoto }]} />
              </View>
            </PressableScale>
          </View>
        </>
      ) : (
        <View style={[styles.flex, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.topRow}>
            {stage !== 'checking' ? <CloseButton onPress={onClose} /> : <View style={styles.closeBtn} />}
          </View>

          {stage === 'intro' ? (
            <Animated.View key="intro" entering={FadeIn.duration(DURATION.sheet).easing(EASE_OUT)} style={styles.body}>
              <PoseArt hand={pose.hand} />
              <AppText variant="title" align="center">
                {tr('Get your blue check')}
              </AppText>
              <AppText variant="body" muted align="center">
                {tr('Copy the pose in a quick selfie. We compare it with your profile photos, then the blue check shows on your profile.')}
              </AppText>
              <View style={[styles.poseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText variant="heading">{pose.hand}</AppText>
                <AppText variant="body" weight="semibold" style={styles.flex}>
                  {tr(pose.text)}
                </AppText>
              </View>
              <AppText variant="caption" muted align="center">
                {tr('Demo: the selfie stays on this screen. It is never saved or sent anywhere.')}
              </AppText>
            </Animated.View>
          ) : stage === 'checking' ? (
            <Animated.View key="checking" entering={FadeIn.duration(DURATION.sheet).easing(EASE_OUT)} style={styles.body}>
              {selfie ? <Scanning uri={selfie} /> : null}
              <AppText variant="title" align="center">
                {tr('Checking your selfie…')}
              </AppText>
              <AppText variant="body" muted align="center">
                {tr('This takes a few seconds.')}
              </AppText>
            </Animated.View>
          ) : (
            <Animated.View key="done" entering={FadeIn.duration(DURATION.sheet).easing(EASE_OUT)} style={styles.body}>
              <View style={[styles.doneCircle, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="checkmark-circle" size={76} color={colors.verified} />
              </View>
              <AppText variant="title" align="center">
                {tr('You’re verified')}
              </AppText>
              <AppText variant="body" muted align="center">
                {tr('The blue check is now on your profile. Verified profiles get more likes and matches.')}
              </AppText>
            </Animated.View>
          )}

          <View style={styles.footer}>
            {stage === 'intro' ? (
              denied ? (
                <>
                  <AppText variant="bodySmall" color={colors.danger} align="center">
                    {tr('Camera access is off for Yonder. Turn it on in your phone settings.')}
                  </AppText>
                  <AppButton label={tr('Open settings')} icon="settings-outline" onPress={() => Linking.openSettings().catch(() => {})} />
                </>
              ) : (
                <AppButton label={tr('Take my selfie')} icon="camera-outline" onPress={start} />
              )
            ) : stage === 'done' ? (
              <AppButton label={tr('Done')} onPress={onClose} />
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

function CloseButton({ onPress, light }: { onPress: () => void; light?: boolean }) {
  const colors = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={10}
      scaleTo={0.88}
      style={[styles.closeBtn, { backgroundColor: light ? colors.photoScrimTop : colors.surface }]}
    >
      <Ionicons name="close" size={24} color={light ? colors.onPhoto : colors.text} />
    </PressableScale>
  );
}

// A face in a dashed frame, with the hand to copy (drawn for Yonder).
function PoseArt({ hand }: { hand: string }) {
  const colors = useTheme();
  return (
    <View style={styles.art}>
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Circle cx={90} cy={90} r={86} fill={colors.primarySoft} />
        <Ellipse cx={90} cy={84} rx={46} ry={56} fill="none" stroke={colors.primary} strokeWidth={3} strokeDasharray="8 7" />
        <Circle cx={90} cy={76} r={24} fill={colors.primary} />
        <Path d="M50 150 C54 118 72 106 90 106 C108 106 126 118 130 150 Z" fill={colors.primary} />
      </Svg>
      <View style={[styles.artHand, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <AppText size={30}>{hand}</AppText>
      </View>
    </View>
  );
}

// The selfie with a soft line moving over it while "checking".
function Scanning({ uri }: { uri: string }) {
  const colors = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withRepeat(withTiming(1, { duration: 1400, easing: EASE_IN_OUT }), -1, true));
  }, [y]);
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() * 216 }] }));
  return (
    <View style={[styles.scan, { backgroundColor: colors.surface }]}>
      <Image source={{ uri }} style={[StyleSheet.absoluteFill, styles.mirror]} contentFit="cover" />
      <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary }, line]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTouch: {
    pointerEvents: 'none',
  },
  topRow: {
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  art: {
    marginBottom: 10,
  },
  artHand: {
    position: 'absolute',
    right: -6,
    top: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
  },
  oval: {
    width: 250,
    height: 330,
    borderRadius: 165,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  camTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    gap: 12,
  },
  poseHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  camBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  shutterWrap: {
    borderRadius: 39,
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  scan: {
    width: 180,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 10,
  },
  mirror: {
    transform: [{ scaleX: -1 }],
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    opacity: 0.85,
  },
  doneCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
