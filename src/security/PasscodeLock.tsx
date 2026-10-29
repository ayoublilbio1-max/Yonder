import { useEffect, useRef, useState } from "react";
import { AppState, Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthProvider";
import { AppText } from "../components/AppText";
import { ConfirmModal } from "../components/ConfirmModal";
import { PressableScale } from "../components/PressableScale";
import { cancelScheduled } from "../notify/notify";
import { useTheme } from "../theme/ThemeProvider";
import { clearPasscode, getPasscode } from "./passcode";
import { PinPad } from "./PinPad";

// Covers the whole app until the passcode is typed:
// - when Yonder starts (not right after you log in — you just proved it's you)
// - when you come back after more than a minute away (the camera / gallery don't count)
// "Forgot passcode?" logs you out; logging in again removes the passcode.

const AWAY_MS = 60_000;
let checkedThisLaunch = false;

export function PasscodeLock() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const userId = session?.onboarded ? session.user.id : null;
  const [lockedFor, setLockedFor] = useState<string | null>(null); // the account that is locked
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const codeRef = useRef<string | null>(null);
  const signedInAt = session?.signedInAt ?? 0;

  // Read the code for this account; lock on app start (only if the session is older than this launch).
  useEffect(() => {
    if (!userId) {
      codeRef.current = null;
      return;
    }
    let alive = true;
    getPasscode(userId).then((code) => {
      if (!alive) return;
      codeRef.current = code;
      const freshLogin = Date.now() - signedInAt < 30_000;
      if (code && !checkedThisLaunch && !freshLogin) {
        setLockedFor(userId);
        if (__DEV__) console.log("[passcode] locked (app start)");
      }
      checkedThisLaunch = true;
    });
    return () => {
      alive = false;
    };
  }, [userId, signedInAt]);

  // Back after a minute away → locked again.
  useEffect(() => {
    if (!userId) return;
    let leftAt = 0;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") leftAt = Date.now();
      if (state !== "active" || !leftAt) return;
      const away = Date.now() - leftAt;
      leftAt = 0;
      getPasscode(userId).then((code) => {
        codeRef.current = code;
        if (code && away >= AWAY_MS) {
          setLockedFor(userId);
          if (__DEV__)
            console.log(`[passcode] locked (away ${Math.round(away / 1000)}s)`);
        }
      });
    });
    return () => sub.remove();
  }, [userId]);

  const check = (code: string) => {
    if (code === codeRef.current) {
      setLockedFor(null);
      setError(null);
      if (__DEV__) console.log("[passcode] unlocked");
    } else {
      setError("Wrong passcode. Try again.");
      setResetKey((k) => k + 1);
      if (__DEV__) console.log("[passcode] wrong code");
    }
  };

  return (
    <Modal
      visible={lockedFor !== null && lockedFor === userId}
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.bg,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <PinPad
          title="Enter your passcode"
          subtitle="Yonder is locked"
          error={error}
          resetKey={resetKey}
          onDone={check}
        />
        <PressableScale
          onPress={() => setForgotOpen(true)}
          accessibilityRole="button"
          scaleTo={0.95}
          dimTo={0.7}
          style={styles.forgot}
        >
          <AppText variant="body" weight="semibold" color={colors.primary}>
            Forgot passcode?
          </AppText>
        </PressableScale>
      </View>
      <ConfirmModal
        visible={forgotOpen}
        icon="log-out-outline"
        title="Forgot your passcode?"
        message="Log out and log in again. The passcode is removed, and you can set a new one in Settings."
        confirmLabel="Log out"
        onCancel={() => setForgotOpen(false)}
        onConfirm={async () => {
          setForgotOpen(false);
          if (userId) await clearPasscode(userId);
          await cancelScheduled();
          setLockedFor(null);
          signOut();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
