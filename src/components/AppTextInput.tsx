import Ionicons from "@expo/vector-icons/Ionicons";
import { forwardRef, useState } from "react";
import {
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type TextInputInstance,
    type TextInputProps,
} from "react-native";
import { fonts } from "../constants/fonts";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";

// Themed input: label, error under the field, optional show/hide password eye.

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  password?: boolean;
};

// SDK 58 (strict React Native types): refs use the instance type TextInputInstance.
export const AppTextInput = forwardRef<TextInputInstance, Props>(
  function AppTextInput(
    { label, error, password, style, onFocus, onBlur, ...rest },
    ref,
  ) {
    const colors = useTheme();
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);

    const borderColor = error
      ? colors.danger
      : focused
        ? colors.primary
        : colors.border;

    return (
      <View style={styles.wrap}>
        <AppText variant="label" muted>
          {label}
        </AppText>
        <View
          style={[
            styles.field,
            { backgroundColor: colors.surface, borderColor },
          ]}
        >
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={password ? hidden : rest.secureTextEntry}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              { color: colors.text, fontFamily: fonts.regular },
              style,
            ]}
          />
          {password ? (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Show password" : "Hide password"}
            >
              <Ionicons
                name={hidden ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <AppText variant="caption" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  field: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
});
