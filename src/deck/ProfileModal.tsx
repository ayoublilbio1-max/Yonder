import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { actionGradients } from '../constants/colors';
import { isLocked } from '../profiles/extras';
import type { Profile } from '../profiles/types';
import { useTheme } from '../theme/ThemeProvider';
import { MediaViewer } from './MediaViewer';
import { ProfileCard } from './ProfileCard';
import { ProfileSections } from './ProfileSections';
import { ReportSheet } from './ReportSheet';
import { useSwipe } from './SwipeProvider';
import { tr } from '../i18n/i18n';

// A full profile opened from the Likes tab (people who like you, your favorites):
// card + all sections, and Pass / Like at the bottom (or "Open chat" once you've matched).

type Props = {
  profile: Profile | null; // null = closed
  matched: boolean;
  liked: boolean; // you already liked them
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
  onOpenChat: () => void;
};

export function ProfileModal(props: Props) {
  return (
    <Modal visible={props.profile !== null} animationType="slide" onRequestClose={props.onClose} statusBarTranslucent navigationBarTranslucent>
      {props.profile ? <Content {...props} profile={props.profile} /> : null}
    </Modal>
  );
}

function Content({ profile, matched, liked, onClose, onLike, onPass, onOpenChat }: Props & { profile: Profile }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const toast = useToast();
  const { me, saved, toggleFavorite, block } = useSwipe();
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);

  const hide = (reason: string, message: string) => {
    block(profile.id, reason);
    toast.show(message);
    onClose();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="heading" numberOfLines={1} style={styles.flex}>
          {profile.name}, {profile.age}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
        <ProfileCard
          profile={profile}
          height={Math.round(height * 0.58)}
          onOpen={() => {
            if (isLocked(profile)) toast.show(tr('{name}’s photos unlock after you match', { name: profile.name }));
            else setViewing(profile);
          }}
        />
        <ProfileSections
          profile={profile}
          me={me}
          isFavorite={saved.favorites.includes(profile.id)}
          onFavorite={() => {
            const on = toggleFavorite(profile.id);
            toast.show(on ? tr('{name} added to your favorites', { name: profile.name }) : tr('{name} removed from favorites', { name: profile.name }));
          }}
          onBlock={() => setBlocking(true)}
          onReport={() => setReporting(true)}
          onShare={() => {
            Share.share({ message: tr('Check out {name}, {age} on Yonder (demo profile).', { name: profile.name, age: profile.age }) }).catch(() => {});
          }}
        />
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 14 }]}>
        <LinearGradient colors={[colors.bgFade, colors.bg]} locations={[0, 0.4]} style={[StyleSheet.absoluteFill, styles.noTouch]} />
        {matched ? (
          <Pressable onPress={onOpenChat} accessibilityRole="button" style={({ pressed }) => [styles.chatBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.onPrimary} />
            <AppText variant="body" weight="semibold" color={colors.onPrimary}>
              {tr('Open chat')}
            </AppText>
          </Pressable>
        ) : liked ? (
          <AppText variant="bodySmall" muted align="center">
            {profile.gender === 'male'
              ? tr('You liked {name}. You’ll match if he likes you back.', { name: profile.name })
              : tr('You liked {name}. You’ll match if she likes you back.', { name: profile.name })}
          </AppText>
        ) : (
          <View style={styles.actions}>
            <Round icon="close" gradient={actionGradients.pass} label={tr('Pass')} onPress={onPass} />
            <Round icon="heart" gradient={actionGradients.like} label={tr('Like')} onPress={onLike} />
          </View>
        )}
      </View>

      <MediaViewer profile={viewing} onClose={() => setViewing(null)} onReport={() => { setViewing(null); setReporting(true); }} />
      <ConfirmModal
        visible={blocking}
        icon="ban-outline"
        title={tr('Block {name}?', { name: profile.name })}
        message={tr('You won’t see each other on Yonder again. They won’t be told.')}
        confirmLabel={tr('Block')}
        onCancel={() => setBlocking(false)}
        onConfirm={() => {
          setBlocking(false);
          hide('block', tr('{name} is blocked', { name: profile.name }));
        }}
      />
      <ReportSheet
        profile={reporting ? profile : null}
        onClose={() => setReporting(false)}
        onReport={(reason) => {
          setReporting(false);
          hide(`report: ${reason}`, tr('Thanks. {name} was reported and hidden.', { name: profile.name }));
        }}
      />
    </View>
  );
}

function Round({
  icon,
  gradient,
  label,
  onPress,
}: {
  icon: 'close' | 'heart';
  gradient: readonly [string, string];
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.round, { backgroundColor: gradient[1], shadowColor: gradient[1], transform: [{ scale: pressed ? 0.9 : 1 }] }]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.roundFill}>
        <Ionicons name={icon} size={32} color={colors.onPhoto} />
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
  noTouch: {
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 12,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  round: {
    width: 66,
    height: 66,
    borderRadius: 33,
    elevation: 6,
  },
  roundFill: {
    flex: 1,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 27,
  },
});
