import Ionicons from "@expo/vector-icons/Ionicons";
import { getLocales } from "expo-localization";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { Sheet } from "../components/Sheet";
import { fonts } from "../constants/fonts";
import { useTheme } from "../theme/ThemeProvider";
import { COUNTRIES, countryByCode, flagOf, type Country } from "./countries";
import { useOnboarding } from "./OnboardingProvider";
import { StepLayout } from "./StepLayout";
import { useAdvance } from "./useAdvance";

// Simulated phone verification: number → 6-digit code.
// No SMS is sent. A demo message banner "receives" the code after a moment.

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const BANNER_DELAY_MS = 1800;

const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));

function defaultCountry(): Country {
  const region = getLocales()[0]?.regionCode;
  return countryByCode(region) ?? countryByCode("US")!;
}

export function PhoneStep() {
  const { draft, update } = useOnboarding();
  const advance = useAdvance("phone");

  const [stage, setStage] = useState<"number" | "code">("number");
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [digits, setDigits] = useState("");
  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState(0);

  if (draft.phoneVerified && draft.phone && stage === "number" && !digits) {
    // Already verified earlier (came back with the back arrow): show it and allow continuing.
    return (
      <VerifiedView
        phone={draft.phone}
        onContinue={() => advance(0)}
        onChange={() => update({ phoneVerified: false })}
      />
    );
  }

  if (stage === "code") {
    return (
      <CodeView
        key={sentAt}
        phone={`+${country.dial} ${digits}`}
        code={code}
        onResend={() => {
          const next = makeCode();
          setCode(next);
          setSentAt(Date.now());
          if (__DEV__) console.log(`[phone] new demo code ${next}`);
        }}
        onChangeNumber={() => setStage("number")}
        onVerified={() => {
          update({ phone: `+${country.dial}${digits}`, phoneVerified: true });
          if (__DEV__)
            console.log(`[phone] verified +${country.dial}${digits}`);
          advance(300);
        }}
      />
    );
  }

  return (
    <NumberView
      country={country}
      onCountry={setCountry}
      digits={digits}
      onDigits={setDigits}
      onSubmit={() => {
        const next = makeCode();
        setCode(next);
        setSentAt(Date.now());
        setStage("code");
        if (__DEV__)
          console.log(
            `[phone] demo code for +${country.dial}${digits} is ${next}`,
          );
      }}
    />
  );
}

// ───────────────────────── already verified ─────────────────────────

function VerifiedView({
  phone,
  onContinue,
  onChange,
}: {
  phone: string;
  onContinue: () => void;
  onChange: () => void;
}) {
  const colors = useTheme();
  return (
    <StepLayout
      stepId="phone"
      title="Your phone is verified"
      footer={
        <>
          <AppButton label="Continue" onPress={onContinue} />
          <AppButton
            label="Use another number"
            variant="secondary"
            onPress={onChange}
          />
        </>
      }
    >
      <View style={[styles.verifiedBox, { backgroundColor: colors.boostSoft }]}>
        <Ionicons name="shield-checkmark" size={26} color={colors.boost} />
        <AppText variant="body" weight="semibold">
          {phone}
        </AppText>
      </View>
    </StepLayout>
  );
}

// ───────────────────────── number ─────────────────────────

function NumberView({
  country,
  onCountry,
  digits,
  onDigits,
  onSubmit,
}: {
  country: Country;
  onCountry: (c: Country) => void;
  digits: string;
  onDigits: (d: string) => void;
  onSubmit: () => void;
}) {
  const colors = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const valid = digits.length >= 6 && digits.length <= 14;
  const sortedCountries = useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  return (
    <StepLayout
      stepId="phone"
      title="Verify your phone number"
      subtitle="We’ll send you a 6-digit code."
      footer={
        <AppButton label="Send code" onPress={onSubmit} disabled={!valid} />
      }
    >
      <View style={[styles.phoneRow, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Country code"
          style={styles.dial}
        >
          <AppText variant="heading">{flagOf(country.code)}</AppText>
          <AppText variant="body" weight="semibold">
            +{country.dial}
          </AppText>
          <Ionicons name="caret-down" size={14} color={colors.text} />
        </Pressable>
        <TextInput
          value={digits}
          onChangeText={(t) =>
            onDigits(t.replace(/\D/g, "").replace(/^0+/, "").slice(0, 14))
          }
          placeholder="Phone number"
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          keyboardType="phone-pad"
          autoComplete="tel"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => valid && onSubmit()}
          style={[
            styles.phoneInput,
            { color: colors.text, fontFamily: fonts.medium },
          ]}
        />
      </View>
      <AppText variant="bodySmall" muted style={styles.note}>
        Your number is only used for verification and is never shown on your
        profile. This is a demo: no SMS is sent, and your number stays on this
        phone.
      </AppText>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <AppText variant="heading" align="center">
          Country code
        </AppText>
        <FlatList
          style={styles.countryList}
          data={sortedCountries}
          keyExtractor={(c) => c.code}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onCountry(item);
                setPickerOpen(false);
              }}
              style={styles.countryRow}
            >
              <AppText variant="heading">{flagOf(item.code)}</AppText>
              <AppText variant="body" style={styles.flex}>
                {item.name}
              </AppText>
              <AppText variant="body" muted>
                +{item.dial}
              </AppText>
            </Pressable>
          )}
        />
      </Sheet>
    </StepLayout>
  );
}

// ───────────────────────── code ─────────────────────────

function CodeView({
  phone,
  code,
  onResend,
  onChangeNumber,
  onVerified,
}: {
  phone: string;
  code: string;
  onResend: () => void;
  onChangeNumber: () => void;
  onVerified: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [entered, setEntered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [bannerVisible, setBannerVisible] = useState(false);
  const done = useRef(false);

  // Countdown for "send a new code" + the demo message banner.
  useEffect(() => {
    const banner = setTimeout(() => setBannerVisible(true), BANNER_DELAY_MS);
    const timer = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => {
      clearTimeout(banner);
      clearInterval(timer);
    };
  }, []);

  const check = (value: string) => {
    if (value.length < CODE_LENGTH || done.current) return;
    if (value === code) {
      done.current = true;
      setError(null);
      setBannerVisible(false);
      onVerified();
    } else {
      setError("Wrong code. Check the message and try again.");
      setTimeout(() => setEntered(""), 500);
      if (__DEV__) console.log("[phone] wrong code entered");
    }
  };

  const press = (key: string) => {
    if (done.current) return;
    if (key === "del") {
      setEntered((e) => e.slice(0, -1));
      setError(null);
      return;
    }
    if (entered.length >= CODE_LENGTH) return;
    const next = entered + key;
    setEntered(next);
    check(next);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <View style={styles.flex}>
      <StepLayout
        stepId="phone"
        title="Enter the code"
        subtitle={`Enter the 6-digit code sent to ${phone} by SMS.`}
      >
        <View style={styles.boxes}>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const filled = i < entered.length;
            const active = i === entered.length;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    borderColor: error
                      ? colors.danger
                      : active
                        ? colors.primary
                        : colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <AppText variant="title">{filled ? entered[i] : ""}</AppText>
              </View>
            );
          })}
        </View>
        {error ? (
          <AppText variant="bodySmall" color={colors.danger} align="center">
            {error}
          </AppText>
        ) : null}

        <View style={styles.links}>
          {secondsLeft > 0 ? (
            <AppText variant="bodySmall" muted align="center">
              You can request a new code in {secondsLeft} seconds
            </AppText>
          ) : (
            <Pressable
              onPress={onResend}
              accessibilityRole="button"
              hitSlop={6}
            >
              <AppText
                variant="bodySmall"
                weight="semibold"
                color={colors.primary}
                align="center"
              >
                Send a new code
              </AppText>
            </Pressable>
          )}
          <Pressable
            onPress={onChangeNumber}
            accessibilityRole="button"
            hitSlop={6}
          >
            <AppText variant="bodySmall" weight="semibold" muted align="center">
              Change number
            </AppText>
          </Pressable>
        </View>

        <View style={styles.keypad}>
          {keys.map((k, i) =>
            k === "" ? (
              <View key={`empty-${i}`} style={styles.key} />
            ) : (
              <Pressable
                key={k}
                onPress={() => press(k)}
                accessibilityRole="button"
                accessibilityLabel={k === "del" ? "Delete" : k}
                style={({ pressed }) => [
                  styles.key,
                  pressed && { backgroundColor: colors.surface },
                ]}
              >
                {k === "del" ? (
                  <Ionicons
                    name="backspace-outline"
                    size={26}
                    color={colors.text}
                  />
                ) : (
                  <AppText variant="title" weight="medium">
                    {k}
                  </AppText>
                )}
              </Pressable>
            ),
          )}
        </View>
      </StepLayout>

      {/* Demo "message received" banner: tap to fill the code */}
      {bannerVisible ? (
        <Animated.View
          entering={FadeInUp.duration(250)}
          exiting={FadeOutUp.duration(200)}
          style={[styles.banner, { top: insets.top + 8 }]}
        >
          <Pressable
            onPress={() => {
              setBannerVisible(false);
              setEntered(code);
              check(code);
            }}
            accessibilityRole="button"
            accessibilityLabel="Fill the code from the message"
            style={[
              styles.bannerCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.bannerIcon, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="chatbubble" size={18} color={colors.onPrimary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="caption" muted>
                Messages · now · demo
              </AppText>
              <AppText variant="bodySmall" weight="semibold">
                Your Yonder code is {code}
              </AppText>
              <AppText variant="caption" color={colors.primary}>
                Tap to fill it in
              </AppText>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1.5,
    paddingBottom: 6,
  },
  dial: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 10,
  },
  note: {
    marginTop: 14,
  },
  countryList: {
    maxHeight: 420,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  verifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  boxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  box: {
    flex: 1,
    maxWidth: 52,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  links: {
    gap: 12,
    marginTop: 14,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
  },
  key: {
    width: "33.33%",
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    elevation: 6,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
