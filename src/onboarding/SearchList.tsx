import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from "react-native";
import { AppText } from "../components/AppText";
import { fonts } from "../constants/fonts";
import { useTheme } from "../theme/ThemeProvider";

// Search box + list (profession, nationality).
// Shows "Suggested" then "All" when the search is empty.

export type SearchItem = { key: string; label: string; left?: string };

type Row =
  | { type: "header"; key: string; title: string }
  | { type: "item"; key: string; item: SearchItem }
  | { type: "custom"; key: string; text: string };

type Props = {
  items: SearchItem[];
  selected: string[];
  onPress: (key: string) => void;
  placeholder: string;
  multi?: boolean;
  suggested?: string[];
  onCustom?: (text: string) => void; // shows "Use “…”" when nothing matches exactly
  customHint?: string; // always-visible row at the top, e.g. "Not in the list? Write your own"
};

const ROW = 56;

export function SearchList({
  items,
  selected,
  onPress,
  placeholder,
  multi,
  suggested = [],
  onCustom,
  customHint,
}: Props) {
  const colors = useTheme();
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInputInstance>(null);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      const matches: Row[] = items
        .filter((i) => i.label.toLowerCase().includes(q))
        .map((item) => ({ type: "item", key: item.key, item }));
      const exact = items.some((i) => i.label.toLowerCase() === q);
      if (onCustom && !exact)
        matches.unshift({
          type: "custom",
          key: "__custom",
          text: query.trim(),
        });
      return matches;
    }
    const suggestedItems = items.filter((i) => suggested.includes(i.key));
    const out: Row[] = [];
    if (suggestedItems.length) {
      out.push({ type: "header", key: "__h_suggested", title: "Suggested" });
      suggestedItems.forEach((item) =>
        out.push({ type: "item", key: `s_${item.key}`, item }),
      );
      out.push({ type: "header", key: "__h_all", title: "All" });
    }
    items.forEach((item) => out.push({ type: "item", key: item.key, item }));
    return out;
  }, [items, query, suggested, onCustom]);

  return (
    <View style={styles.flex}>
      <View style={[styles.search, { borderBottomColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSubtle} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          autoCorrect={false}
          returnKeyType="search"
          style={[
            styles.searchInput,
            { color: colors.text, fontFamily: fonts.regular },
          ]}
        />
        {query ? (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={10}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={20} color={colors.textSubtle} />
          </Pressable>
        ) : null}
      </View>

      {customHint && onCustom && !query.trim() ? (
        <Pressable
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="button"
          style={[styles.hint, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <AppText
            variant="bodySmall"
            weight="semibold"
            color={colors.primary}
            style={styles.flex}
          >
            {customHint}
          </AppText>
        </Pressable>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        ListEmptyComponent={
          <AppText variant="body" muted style={styles.empty}>
            No results. Try another word.
          </AppText>
        }
        renderItem={({ item: row }) => {
          if (row.type === "header") {
            return (
              <AppText variant="label" muted style={styles.header}>
                {row.title}
              </AppText>
            );
          }
          if (row.type === "custom") {
            return (
              <Pressable
                onPress={() => onCustom?.(row.text)}
                style={styles.row}
                accessibilityRole="button"
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={colors.primary}
                />
                <AppText
                  variant="body"
                  weight="semibold"
                  color={colors.primary}
                  style={styles.flex}
                >
                  Use “{row.text}”
                </AppText>
              </Pressable>
            );
          }
          const isSelected = selected.includes(row.item.key);
          const color = isSelected ? colors.primary : colors.text;
          return (
            <Pressable
              onPress={() => onPress(row.item.key)}
              accessibilityRole={multi ? "checkbox" : "radio"}
              accessibilityState={{ checked: isSelected, selected: isSelected }}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {row.item.left ? (
                <AppText variant="heading">{row.item.left}</AppText>
              ) : null}
              <AppText
                variant="body"
                weight={isSelected ? "bold" : "semibold"}
                color={color}
                style={styles.flex}
              >
                {row.item.label}
              </AppText>
              {multi ? (
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color={isSelected ? colors.primary : colors.textSubtle}
                />
              ) : isSelected ? (
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  header: {
    marginTop: 14,
    marginBottom: 4,
  },
  row: {
    minHeight: ROW,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  empty: {
    marginTop: 20,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 6,
  },
});
