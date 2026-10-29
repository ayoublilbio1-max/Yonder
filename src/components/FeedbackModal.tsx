import { Linking, Platform, StyleSheet, View } from 'react-native';
import { APP_NAME, APP_VERSION, DEVELOPER, FIVERR_URL } from '../constants/app';
import { useTheme } from '../theme/ThemeProvider';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { ThemedModal } from './ThemedModal';
import { useToast } from './Toast';
import { tr } from '../i18n/i18n';

// Settings › Help › Feedback popup.

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function FeedbackModal({ visible, onClose }: Props) {
  const colors = useTheme();
  const toast = useToast();

  const deviceInfo = `${APP_NAME} ${APP_VERSION} · ${
    Platform.OS === 'android' ? `Android API ${Platform.Version}` : `iOS ${Platform.Version}`
  }`;

  const openFiverr = async () => {
    try {
      await Linking.openURL(FIVERR_URL);
      if (__DEV__) console.log('[feedback] opened Fiverr profile');
      onClose();
    } catch (e) {
      if (__DEV__) console.log('[feedback] could not open link', String(e));
      // The toast lives under the modal, so close the modal first.
      onClose();
      toast.show(tr('Couldn\'t open the link. Search "{DEVELOPER}" on Fiverr.', { DEVELOPER }));
    }
  };

  return (
    <ThemedModal
      visible={visible}
      onClose={onClose}
      icon="chatbubble-ellipses-outline"
      iconColor={colors.primary}
      iconBg={colors.primarySoft}
      title={tr('Send feedback')}
      message={tr('Found a bug or have an idea to make {APP_NAME} better? Contact me on Fiverr ({DEVELOPER}) and tell me what happened.', { APP_NAME, DEVELOPER })}
    >
      <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="caption" muted>
          {tr('Please add this to your message:')}
        </AppText>
        <AppText variant="bodySmall" weight="semibold" selectable>
          {deviceInfo}
        </AppText>
      </View>
      <AppButton label={tr('Open my Fiverr profile')} icon="open-outline" onPress={openFiverr} />
      <AppButton label={tr('Close')} variant="secondary" onPress={onClose} />
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
});
