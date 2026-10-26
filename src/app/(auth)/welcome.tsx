import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../auth/AuthProvider";
import { signInWithGoogle } from "../../auth/google";
import type { AuthUser } from "../../auth/types";
import { AppButton } from "../../components/AppButton";
import { AppleDemoSheet } from "../../components/AppleDemoSheet";
import { AppText } from "../../components/AppText";
import { FeedbackModal } from "../../components/FeedbackModal";
import { GoogleDemoChooser } from "../../components/GoogleDemoChooser";
import { NotInDemoModal } from "../../components/NotInDemoModal";
import { ThemedModal } from "../../components/ThemedModal";
import { useToast } from "../../components/Toast";
import { PRIVACY_URL, WELCOME_PHOTO } from "../../constants/app";
import { useTheme } from "../../theme/ThemeProvider";

const LOGO = require("../../../assets/images/splash-icon.png");

type Busy = null | "google";

export default function WelcomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useAuth();

  const [busy, setBusy] = useState<Busy>(null);
  const [googleDemoOpen, setGoogleDemoOpen] = useState(false);
  const [appleOpen, setAppleOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);

  // The root layout sends the user to onboarding / the app when the session changes.
  const finish = async (user: AuthUser) => {
    setGoogleDemoOpen(false);
    setAppleOpen(false);
    await signIn(user);
  };

  const onGoogle = async () => {
    if (busy) return;
    setBusy("google");
    const result = await signInWithGoogle();
    setBusy(null);
    if (result.kind === "success") {
      await finish(result.user);
    } else if (result.kind === "failed") {
      if (__DEV__)
        console.log(
          `[welcome] Google failed (${result.reason}) → demo chooser`,
        );
      setGoogleDemoOpen(true);
    }
    // cancelled → stay on the welcome screen, no message
  };

  const openPrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(() =>
      toast.show("Couldn't open the privacy policy."),
    );
  };

  const goToEmail = () => {
    setGoogleDemoOpen(false);
    router.push("/email" as Href);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.gradientStart }]}>
      <StatusBar style="light" />

      {/* Background: brand gradient, then the photo on top (the gradient shows if the photo can't load) */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={{ uri: WELCOME_PHOTO }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
        cachePolicy="memory-disk"
        onError={() => {
          if (__DEV__)
            console.log("[welcome] background photo failed, showing gradient");
        }}
      />
      <LinearGradient
        colors={[
          colors.photoScrimTop,
          colors.photoScrimMiddle,
          colors.photoScrimBottom,
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top row: language + help */}
      <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => setLanguagesOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Language: English"
          hitSlop={8}
          style={styles.language}
        >
          <Ionicons name="globe-outline" size={22} color={colors.onPhoto} />
          <AppText variant="body" weight="medium" color={colors.onPhoto}>
            English
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setHelpOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Help"
          hitSlop={8}
        >
          <Ionicons
            name="help-circle-outline"
            size={26}
            color={colors.onPhoto}
          />
        </Pressable>
      </View>

      {/* Logo + tagline */}
      <View style={styles.center}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <AppText
          variant="heading"
          weight="medium"
          color={colors.onPhoto}
          align="center"
          style={styles.tagline}
        >
          Meet people worth the journey.
        </AppText>
      </View>

      {/* Sign-in buttons */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={onGoogle}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={({ pressed }) => [
            styles.authButton,
            {
              backgroundColor: colors.googleButton,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          {busy === "google" ? (
            <ActivityIndicator color={colors.onGoogleButton} />
          ) : (
            <>
              <Ionicons
                name="logo-google"
                size={20}
                color={colors.onGoogleButton}
              />
              <AppText
                variant="body"
                weight="semibold"
                color={colors.onGoogleButton}
              >
                Continue with Google
              </AppText>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => setAppleOpen(true)}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          style={({ pressed }) => [
            styles.authButton,
            {
              backgroundColor: colors.appleButton,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons name="logo-apple" size={22} color={colors.onAppleButton} />
          <AppText
            variant="body"
            weight="semibold"
            color={colors.onAppleButton}
          >
            Continue with Apple
          </AppText>
        </Pressable>

        <Pressable
          onPress={goToEmail}
          disabled={busy !== null}
          accessibilityRole="button"
          hitSlop={6}
          style={styles.emailLink}
        >
          <AppText variant="body" weight="semibold" color={colors.onPhoto}>
            Continue with email
          </AppText>
        </Pressable>

        <AppText variant="caption" color={colors.onPhotoMuted} align="center">
          By continuing you agree to our{" "}
          <AppText
            variant="caption"
            weight="semibold"
            color={colors.onPhoto}
            onPress={openPrivacy}
          >
            Privacy Policy
          </AppText>
          .
        </AppText>
      </View>

      <GoogleDemoChooser
        visible={googleDemoOpen}
        onClose={() => setGoogleDemoOpen(false)}
        onPick={finish}
        onUseEmail={goToEmail}
      />
      <AppleDemoSheet
        visible={appleOpen}
        onClose={() => setAppleOpen(false)}
        onContinue={finish}
      />
      <NotInDemoModal
        visible={languagesOpen}
        feature="Other languages"
        onClose={() => setLanguagesOpen(false)}
      />
      <ThemedModal
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        icon="help-buoy-outline"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Help"
        message="Welcome to Yonder! Sign up or log in to start meeting new people. This is a demo: your account and everything you do stay on this phone."
      >
        <AppButton
          label="Send feedback"
          icon="chatbubble-ellipses-outline"
          onPress={() => {
            setHelpOpen(false);
            setFeedbackOpen(true);
          }}
        />
        <AppButton
          label="Close"
          variant="secondary"
          onPress={() => setHelpOpen(false)}
        />
      </ThemedModal>
      <FeedbackModal
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  language: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 340,
    height: 340,
    maxWidth: "100%",
    marginBottom: -110, // the logo file has empty space around the wordmark
    marginTop: -110,
  },
  tagline: {
    marginTop: 8,
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 12,
  },
  authButton: {
    minHeight: 54,
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emailLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
