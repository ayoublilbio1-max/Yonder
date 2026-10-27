import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Checkout, type CheckoutItem } from '../components/Checkout';
import { Sheet } from '../components/Sheet';
import { fonts } from '../constants/fonts';
import type { Profile } from '../profiles/types';
import { COMPLIMENT_PACKS, formatUsd, useWallet } from '../store/WalletProvider';
import { useTheme } from '../theme/ThemeProvider';

// Send a compliment = your like + a short message they see first.
// 1 free compliment per day, then demo packs bought through the simulated checkout.

const MAX = 140;

type Props = {
  profile: Profile | null; // null = closed
  onClose: () => void;
  onSent: (text: string) => void;
};

export function ComplimentSheet({ profile, onClose, onSent }: Props) {
  const colors = useTheme();
  const { freeComplimentLeft, complimentsLeft, wallet, spendCompliment, addCompliments } = useWallet();
  const [text, setText] = useState('');
  const [buying, setBuying] = useState<CheckoutItem | null>(null);
  const [packQty, setPackQty] = useState(0);

  const pronoun = profile?.gender === 'male' ? 'his' : 'her';
  const canSend = text.trim().length >= 2 && complimentsLeft > 0;

  const close = () => {
    setText('');
    onClose();
  };

  const send = () => {
    if (!canSend) return;
    if (!spendCompliment()) return;
    onSent(text.trim());
    setText('');
  };

  return (
    <>
      <Sheet visible={profile !== null && buying === null} onClose={close}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="chatbubble-ellipses" size={26} color={colors.primary} />
          </View>
          <AppText variant="heading" align="center">
            Send a compliment to {profile?.name ?? ''}
          </AppText>
          <AppText variant="bodySmall" muted align="center">
            Your like and message go to the top of {pronoun} likes, so {pronoun === 'his' ? 'he' : 'she'} sees you first.
          </AppText>
        </View>

        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={text}
            onChangeText={(t) => setText(t.slice(0, MAX))}
            placeholder={`Say something nice about ${pronoun} profile…`}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            multiline
            textAlignVertical="top"
            style={[styles.input, { color: colors.text, fontFamily: fonts.regular }]}
          />
        </View>
        <View style={styles.meta}>
          <AppText variant="caption" muted style={styles.flex}>
            {freeComplimentLeft
              ? '1 free compliment today'
              : wallet.compliments > 0
                ? `${wallet.compliments} compliment${wallet.compliments > 1 ? 's' : ''} left`
                : 'No compliments left'}
          </AppText>
          <AppText variant="caption" muted>
            {text.length}/{MAX}
          </AppText>
        </View>

        {complimentsLeft > 0 ? (
          <AppButton label="Send compliment" icon="send" onPress={send} disabled={!canSend} />
        ) : (
          <>
            <AppText variant="label" muted>
              GET MORE COMPLIMENTS
            </AppText>
            <View style={styles.packs}>
              {COMPLIMENT_PACKS.map((p) => (
                <Pressable
                  key={p.qty}
                  onPress={() => {
                    setPackQty(p.qty);
                    setBuying({
                      title: `${p.qty} compliments`,
                      detail: `${formatUsd(p.price / p.qty)} each`,
                      total: p.price,
                    });
                  }}
                  accessibilityRole="button"
                  style={[styles.pack, { borderColor: p.tag ? colors.primary : colors.border, backgroundColor: colors.card }]}
                >
                  {p.tag ? (
                    <View style={[styles.tag, { backgroundColor: colors.primary }]}>
                      <AppText variant="caption" weight="bold" color={colors.onPrimary}>
                        {p.tag}
                      </AppText>
                    </View>
                  ) : null}
                  <AppText variant="title">{p.qty}</AppText>
                  <AppText variant="caption" muted>
                    compliments
                  </AppText>
                  <AppText variant="bodySmall" weight="semibold">
                    {formatUsd(p.price)}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="caption" muted align="center">
              You get 1 free compliment again tomorrow.
            </AppText>
          </>
        )}
      </Sheet>

      <Checkout
        item={buying}
        onClose={() => setBuying(null)}
        onPaid={() => addCompliments(packQty)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    minHeight: 94,
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  packs: {
    flexDirection: 'row',
    gap: 10,
  },
  pack: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingTop: 26, // room for the tag
    paddingBottom: 14,
    gap: 2,
    overflow: 'hidden',
  },
  tag: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 2,
  },
});
