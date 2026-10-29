import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { mainPhotoUri } from '../profiles/data';
import { useTheme } from '../theme/ThemeProvider';
import { timeAgo, type AppNotification } from './notifications';
import { tr } from '../i18n/i18n';

// Full-screen list of the demo notifications. New ones (since the last visit) get a dot.

type Props = {
  visible: boolean;
  items: AppNotification[];
  seenAt: number; // items newer than this are "new"
  onClose: () => void;
  onBoost: () => void; // the Boost tip opens the Boost sheet
};

export function NotificationsModal({ visible, items, seenAt, onClose, onBoost }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="heading">{tr('Notifications')}</AppText>
        </View>

        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const isNew = item.at > seenAt;
            const content = (
              <View style={[styles.row, isNew ? { backgroundColor: colors.primarySoft } : null]}>
                {item.profile ? (
                  <Image
                    source={{ uri: mainPhotoUri(item.profile) }}
                    style={[styles.avatar, { backgroundColor: colors.surface }]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    blurRadius={item.hidden ? 30 : 0}
                  />
                ) : (
                  <View style={[styles.avatar, styles.iconAvatar, { backgroundColor: item.kind === 'boost' ? colors.boostSoft : colors.primarySoft }]}>
                    <Ionicons name={item.icon ?? 'notifications'} size={24} color={item.kind === 'boost' ? colors.boost : colors.primary} />
                  </View>
                )}
                <View style={styles.flex}>
                  <AppText variant="bodySmall" weight={isNew ? 'semibold' : 'regular'}>
                    {tr(item.text)}
                  </AppText>
                  <AppText variant="caption" muted>
                    {timeAgo(item.at)}
                  </AppText>
                </View>
                {isNew ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
              </View>
            );
            if (item.kind !== 'boost') return content;
            return (
              <Pressable onPress={onBoost} accessibilityRole="button">
                {content}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  iconAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
