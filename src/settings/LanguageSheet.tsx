import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { PressableScale } from '../components/PressableScale';
import { Sheet } from '../components/Sheet';
import { LANGUAGES, setLanguage, tr, useLanguage, type Lang, type LangSetting } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeProvider';

// "Language": Follow phone · English · Français · Español · Nederlands.
// Choosing one redraws the app in that language; `reopen` is the screen to show again (e.g. '/settings').

type Props = {
  visible: boolean;
  onClose: () => void;
  reopen?: string;
};

export function languageName(setting: LangSetting, lang: Lang) {
  const native = LANGUAGES.find((l) => l.key === lang)?.native ?? 'English';
  return setting === 'system' ? `${tr('Follow phone')} (${native})` : native;
}

export function LanguageSheet({ visible, onClose, reopen }: Props) {
  const colors = useTheme();
  const { setting } = useLanguage();
  const rows: { key: LangSetting; title: string; sub?: string }[] = [
    { key: 'system', title: tr('Follow phone'), sub: tr('Use the language of your phone') },
    ...LANGUAGES.map((l) => ({ key: l.key as LangSetting, title: l.native, sub: l.native === tr(l.name) ? undefined : tr(l.name) })),
  ];

  const choose = (key: LangSetting) => {
    onClose();
    if (key === setting) return;
    // let the sheet close before the screens are drawn again
    setTimeout(() => setLanguage(key, reopen), 250);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText variant="heading" align="center">
        {tr('Language')}
      </AppText>
      <View>
        {rows.map((r) => {
          const selected = r.key === setting;
          return (
            <PressableScale
              key={r.key}
              onPress={() => choose(r.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              scaleTo={0.99}
              dimTo={0.6}
              style={styles.row}
            >
              <View style={styles.flex}>
                <AppText variant="body" weight={selected ? 'semibold' : 'regular'} color={selected ? colors.primary : colors.text}>
                  {r.title}
                </AppText>
                {r.sub ? (
                  <AppText variant="caption" muted>
                    {r.sub}
                  </AppText>
                ) : null}
              </View>
              <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.textSubtle} />
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
  },
});
