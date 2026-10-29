import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { ThemedModal } from '../components/ThemedModal';
import { useTheme } from '../theme/ThemeProvider';
import { stepProgress, type StepId } from './steps';
import { tr } from '../i18n/i18n';

// Frame of every onboarding question: back · progress bar · help, then title, content, footer.
// The footer sticks above the keyboard when it opens.

type Props = {
  stepId: StepId;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean; // false when the content has its own list (height, search lists)
};

export function StepLayout({ stepId, title, subtitle, children, footer, scroll = true }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const progress = stepProgress(stepId);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/start' as Href);
  };

  const body = (
    <>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" muted>
          {subtitle}
        </AppText>
      ) : null}
      <View style={styles.content}>{children}</View>
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` as `${number}%` },
            ]}
          />
        </View>
        <Pressable onPress={() => setHelpOpen(true)} accessibilityRole="button" accessibilityLabel="Help" hitSlop={10}>
          <Ionicons name="help-circle-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.scrollContent]}>{body}</View>
      )}

      {footer ? (
        <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
          <View style={[styles.footer, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 16 }]}>{footer}</View>
        </KeyboardStickyView>
      ) : null}

      <ThemedModal
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        icon="help-buoy-outline"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title={tr('Why we ask')}
        message={tr('Your answers help Yonder show you people who fit what you’re looking for. You can change them later in your profile.')}
      >
        <AppButton label={tr('Got it')} onPress={() => setHelpOpen(false)} />
      </ThemedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 8,
  },
  title: {
    marginBottom: 2,
  },
  content: {
    marginTop: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 10,
  },
});
