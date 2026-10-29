import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AuthUser } from '../auth/types';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Sheet } from './Sheet';
import { tr } from '../i18n/i18n';

// Backup when real Google sign-in isn’t available: looks like Google's account chooser,
// with demo accounts. The tester is never stuck.

const DEMO_ACCOUNTS: AuthUser[] = [
  { id: 'gdemo_emma', name: 'Emma Clarke', email: 'emma.clarke.demo@gmail.com', photo: null, method: 'google-demo' },
  { id: 'gdemo_lucas', name: 'Lucas Bauer', email: 'lucas.bauer.demo@gmail.com', photo: null, method: 'google-demo' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (user: AuthUser) => void;
  onUseEmail: () => void;
};

export function GoogleDemoChooser({ visible, onClose, onPick, onUseEmail }: Props) {
  const colors = useTheme();
  const avatarColors = [colors.primary, colors.boost];

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Ionicons name="logo-google" size={26} color={colors.text} />
        <AppText variant="heading" align="center">
          {tr('Choose an account')}
        </AppText>
        <AppText variant="bodySmall" muted align="center">
          {tr('to continue to Yonder')}
        </AppText>
      </View>

      <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <AppText variant="caption" style={styles.flex}>
          {tr('Google sign-in isn’t available on this phone right now, so you can continue with a demo account.')}
        </AppText>
      </View>

      <View>
        {DEMO_ACCOUNTS.map((account, i) => (
          <Pressable
            key={account.id}
            onPress={() => {
              if (__DEV__) console.log(`[google-demo] picked ${account.email}`);
              onPick(account);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Continue as ${account.name}`}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: avatarColors[i % avatarColors.length] }]}>
              <AppText variant="body" weight="semibold" color={colors.onPrimary}>
                {account.name.charAt(0)}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="body" weight="medium">
                {account.name}
              </AppText>
              <AppText variant="bodySmall" muted>
                {account.email}
              </AppText>
            </View>
          </Pressable>
        ))}

        <Pressable
          onPress={onUseEmail}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            <Ionicons name="person-add-outline" size={20} color={colors.text} />
          </View>
          <AppText variant="body" weight="medium">
            {tr('Use your email instead')}
          </AppText>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 2,
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
