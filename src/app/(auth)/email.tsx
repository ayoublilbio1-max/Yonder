import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthProvider';
import { logInWithEmail, passwordProblem, signUpWithEmail } from '../../auth/emailAccounts';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { AppTextInput } from '../../components/AppTextInput';
import { useTheme } from '../../theme/ThemeProvider';
import { tr } from '../../i18n/i18n';

type Mode = 'signup' | 'login';
type Errors = { email?: string | null; password?: string | null; confirm?: string | null };

export default function EmailScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setConfirm('');
  };

  const submit = async () => {
    if (busy) return;
    if (mode === 'signup') {
      const pwProblem = passwordProblem(password);
      if (pwProblem) return setErrors({ password: pwProblem });
      if (confirm !== password) return setErrors({ confirm: tr("Passwords don't match.") });
    }
    setBusy(true);
    const result = mode === 'signup' ? await signUpWithEmail(email, password) : await logInWithEmail(email, password);
    setBusy(false);
    if (!result.ok) {
      setErrors({ [result.field]: result.error });
      return;
    }
    await signIn(result.user); // the root layout moves on to onboarding / the app
  };

  const isSignup = mode === 'signup';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        <AppText variant="display">{isSignup ? tr('Create your account') : tr('Welcome back')}</AppText>
        <AppText variant="body" muted>
          {isSignup
            ? tr('Sign up with your email. Your account is saved only on this phone.')
            : tr('Log in with the email and password you used on this phone.')}
        </AppText>

        {/* Sign up / Log in switch */}
        <View style={[styles.segment, { backgroundColor: colors.surface }]}>
          {(['signup', 'login'] as const).map((m) => {
            const selected = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.segmentItem, selected && { backgroundColor: colors.card }]}
              >
                <AppText
                  variant="bodySmall"
                  weight={selected ? 'semibold' : 'medium'}
                  color={selected ? colors.text : colors.textMuted}
                >
                  {m === 'signup' ? tr('Sign up') : tr('Log in')}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          <AppTextInput
            label={tr('Email')}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: null }));
            }}
            placeholder={tr('you@example.com')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email}
          />
          <AppTextInput
            ref={passwordRef}
            label={tr('Password')}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: null }));
            }}
            placeholder={isSignup ? tr('At least 8 characters, with a number') : tr('Your password')}
            password
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            returnKeyType={isSignup ? 'next' : 'done'}
            onSubmitEditing={() => (isSignup ? confirmRef.current?.focus() : submit())}
            error={errors.password}
          />
          {isSignup ? (
            <AppTextInput
              ref={confirmRef}
              label={tr('Confirm password')}
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: null }));
              }}
              placeholder={tr('Type it again')}
              password
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={submit}
              error={errors.confirm}
            />
          ) : null}
        </View>

        <AppButton
          label={busy ? tr('Please wait…') : isSignup ? tr('Create account') : tr('Log in')}
          onPress={submit}
          disabled={busy || !email || !password || (isSignup && !confirm)}
        />

        <Pressable onPress={() => switchMode(isSignup ? 'login' : 'signup')} style={styles.switchLink} hitSlop={6}>
          <AppText variant="bodySmall" muted align="center">
            {isSignup ? tr('Already have an account? ') : tr('New to Yonder? ')}
            <AppText variant="bodySmall" weight="semibold" color={colors.primary}>
              {isSignup ? tr('Log in') : tr('Sign up')}
            </AppText>
          </AppText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 14,
  },
  switchLink: {
    paddingVertical: 6,
  },
});
