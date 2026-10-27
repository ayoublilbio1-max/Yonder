import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import type { ProfileDraft } from "../onboarding/types";
import { INTENT_ICON, INTENT_LABEL } from "../profiles/data";
import {
  DRINKING_LABEL,
  heightLabel,
  MARITAL_LABEL,
  PERSONALITY_NAME,
  SMOKING_LABEL,
} from "../profiles/extras";
import { distanceKm } from "../profiles/session";
import type { Profile } from "../profiles/types";
import { useTheme } from "../theme/ThemeProvider";
import { myInterestSet, similaritiesOf } from "./similarities";

// Everything under the card on the Swipe page, in Muzz order:
// intent · bio · verified · marital status & children · your similarities · about · interests · personality ·
// education & career · languages · share · favorite / block / report.

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  profile: Profile;
  me: ProfileDraft;
  isFavorite: boolean;
  onFavorite: () => void;
  onBlock: () => void;
  onReport: () => void;
  onShare: () => void;
};

function Section({
  title,
  icon,
  children,
}: {
  title?: string;
  icon?: IconName;
  children: ReactNode;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {title ? (
        <View style={styles.sectionTitle}>
          {icon ? (
            <Ionicons name={icon} size={18} color={colors.primary} />
          ) : null}
          <AppText variant="heading">{title}</AppText>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Chip({
  label,
  icon,
  highlight,
}: {
  label: string;
  icon?: IconName;
  highlight?: boolean;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: highlight ? colors.primarySoft : colors.card,
          borderColor: highlight ? colors.primary : colors.border,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={highlight ? colors.primary : colors.textMuted}
        />
      ) : null}
      <AppText
        variant="bodySmall"
        weight="medium"
        color={highlight ? colors.primary : colors.text}
      >
        {label}
      </AppText>
    </View>
  );
}

export function ProfileSections({
  profile,
  me,
  isFavorite,
  onFavorite,
  onBlock,
  onReport,
  onShare,
}: Props) {
  const colors = useTheme();
  const similarities = similaritiesOf(me, profile);
  const shared = myInterestSet(me);
  const pronoun = profile.gender === "male" ? "him" : "her";

  const aboutAll: { icon: IconName; label: string }[] = [
    { icon: "resize-outline", label: heightLabel(profile.heightCm) },
    { icon: "sparkles-outline", label: profile.religion },
    { icon: "flame-outline", label: SMOKING_LABEL[profile.smoking] ?? "" },
    { icon: "wine-outline", label: DRINKING_LABEL[profile.drinking] ?? "" },
    { icon: "earth-outline", label: profile.origins },
    { icon: "location-outline", label: `${distanceKm(profile.id)} km away` },
  ];
  const about = aboutAll.filter(
    (a) => a.label && a.label !== "Prefer not to say",
  );

  return (
    <View style={styles.wrap}>
      <Section>
        <View style={styles.intentRow}>
          <View
            style={[styles.intentIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Ionicons
              name={INTENT_ICON[profile.intent]}
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" muted>
              LOOKING FOR
            </AppText>
            <AppText variant="heading">{INTENT_LABEL[profile.intent]}</AppText>
          </View>
        </View>
      </Section>

      {profile.bio ? (
        <Section title="Bio" icon="chatbubble-outline">
          <AppText variant="body">{profile.bio}</AppText>
        </Section>
      ) : null}

      {profile.verified ? (
        <Section>
          <View style={styles.intentRow}>
            <Ionicons
              name="shield-checkmark"
              size={26}
              color={colors.verified}
            />
            <View style={styles.flex}>
              <AppText variant="body" weight="semibold">
                Verified profile
              </AppText>
              <AppText variant="bodySmall" muted>
                {profile.name}’s main photo has been verified.
              </AppText>
            </View>
          </View>
        </Section>
      ) : null}

      <Section title="Marital status & children" icon="ribbon-outline">
        <View style={styles.chips}>
          <Chip icon="ribbon-outline" label={MARITAL_LABEL[profile.marital]} />
          <Chip
            icon="people-outline"
            label={profile.hasChildren ? "Has children" : "No children"}
          />
        </View>
      </Section>

      <Section title="Your similarities" icon="heart-circle-outline">
        {similarities.length ? (
          <View style={styles.chips}>
            {similarities.map((s) => (
              <View
                key={s.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <AppText variant="bodySmall">{s.emoji}</AppText>
                <AppText
                  variant="bodySmall"
                  weight="medium"
                  color={colors.primary}
                >
                  {s.label}
                </AppText>
              </View>
            ))}
          </View>
        ) : (
          <AppText variant="bodySmall" muted>
            Nothing in common yet. Say hi and find out more about {pronoun}!
          </AppText>
        )}
      </Section>

      <Section title="About" icon="person-outline">
        <View style={styles.chips}>
          {about.map((a) => (
            <Chip key={a.icon} icon={a.icon} label={a.label} />
          ))}
        </View>
      </Section>

      {profile.interests.length ? (
        <Section title="Interests" icon="sparkles-outline">
          <View style={styles.chips}>
            {profile.interests.map((i) => (
              <Chip key={i} label={i} highlight={shared.has(i.toLowerCase())} />
            ))}
          </View>
        </Section>
      ) : null}

      {profile.personality ? (
        <Section title="Personality" icon="happy-outline">
          <View style={styles.chips}>
            <Chip
              icon="bulb-outline"
              label={`${profile.personality} · ${PERSONALITY_NAME[profile.personality] ?? ""}`}
            />
          </View>
        </Section>
      ) : null}

      <Section title="Education and career" icon="school-outline">
        <View style={styles.chips}>
          {profile.education ? (
            <Chip icon="school-outline" label={profile.education} />
          ) : null}
          {profile.profession ? (
            <Chip icon="briefcase-outline" label={profile.profession} />
          ) : null}
        </View>
      </Section>

      {profile.languages.length ? (
        <Section title="Languages" icon="language-outline">
          <View style={styles.chips}>
            {profile.languages.map((l) => (
              <Chip key={l} label={l} />
            ))}
          </View>
        </Section>
      ) : null}

      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        style={[styles.share, { borderColor: colors.border }]}
      >
        <Ionicons name="share-social-outline" size={20} color={colors.text} />
        <AppText variant="body" weight="semibold">
          Share {profile.name}’s profile
        </AppText>
      </Pressable>

      <View style={styles.actions}>
        <ActionTile
          icon={isFavorite ? "star" : "star-outline"}
          label={isFavorite ? "Favorited" : "Favorite"}
          color={isFavorite ? colors.gold : colors.text}
          onPress={onFavorite}
        />
        <ActionTile
          icon="ban-outline"
          label="Block"
          color={colors.text}
          onPress={onBlock}
        />
        <ActionTile
          icon="flag-outline"
          label="Report"
          color={colors.danger}
          onPress={onReport}
        />
      </View>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={color} />
      <AppText variant="bodySmall" weight="semibold" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingTop: 12, // same gap under the card as between sections
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
  flex: {
    flex: 1,
  },
  section: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  intentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  share: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 14,
  },
});
