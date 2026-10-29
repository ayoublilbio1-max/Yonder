import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AuthUser } from '../auth/types';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Sheet } from './Sheet';
import { tr } from '../i18n/i18n';

// Simulated "Sign in with Apple": name + Share / Hide my email, then Continue.

const DEMO_NAME = 'Alex Morgan';
const SHARED_EMAIL = 'alex.morgan@icloud.com';
const HIDDEN_EMAIL = 'k7mq2x9p4d@privaterelay.appleid.com';

type Props = {
  visible: boolean;
  onClose: () => void;
  onContinue: (user: AuthUser) => void;
};

export function AppleDemoSheet({ visible, onClose, onContinue }: Props) {
  const colors = useTheme();
  const [hideEmail, setHideEmail] = useState(false);

  const options = [
    { hide: false, title: 'Share My Email', detail: SHARED_EMAIL },
    { hide: true, title: 'Hide My Email', detail: tr('Forward to: {email}', { email: HIDDEN_EMAIL }) },
  ];

  const continueWithApple = () => {
    const user: AuthUser = {
      id: 'apple_demo_alex',
      name: DEMO_NAME,
      email: hideEmail ? HIDDEN_EMAIL : SHARED_EMAIL,
      photo: null,
      method: 'apple-demo',
    };
    if (__DEV__) console.log(`[apple-demo] continue · hideEmail=${hideEmail}`);
    onContinue(user);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Ionicons name="logo-apple" size={30} color={colors.text} />
        <AppText variant="heading" align="center">
          {tr('Sign in with Apple')}
        </AppText>
        <AppText variant="bodySmall" muted align="center">
          {tr('Create an account for Yonder using your Apple ID. This is a demo — no real Apple ID is used.')}
        </AppText>
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <AppText variant="caption" muted>
            {tr('NAME')}
          </AppText>
          <AppText variant="body" weight="medium">
            {DEMO_NAME}
          </AppText>
        </View>
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {options.map((option, i) => {
          const selected = hideEmail === option.hide;
          return (
            <Pressable
              key={option.title}
              onPress={() => setHideEmail(option.hide)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.optionRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}
            >
              <View style={styles.flex}>
                <AppText variant="body" weight="medium">
                  {tr(option.title)}
                </AppText>
                <AppText variant="caption" muted>
                  {tr(option.detail)}
                </AppText>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={selected ? colors.primary : colors.textSubtle}
              />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={continueWithApple}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 }]}
      >
        <AppText variant="body" weight="semibold" color={colors.bg}>
          {tr('Continue')}
        </AppText>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 4,
  },
  group: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
