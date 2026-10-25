import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { ConfirmModal } from "../../components/ConfirmModal";
import { NotInDemoModal } from "../../components/NotInDemoModal";
import { Screen } from "../../components/Screen";
import { useToast } from "../../components/Toast";

// Profile — placeholder, with buttons to test the base components after the first build.
export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);

  return (
    <Screen>
      <AppText variant="display">Profile</AppText>
      <AppText variant="body" muted>
        Your photos, details and preferences will appear here.
      </AppText>

      <View style={styles.actions}>
        <AppButton
          label="Settings"
          icon="settings-outline"
          variant="secondary"
          onPress={() => router.push("/settings")}
        />
        <AppButton
          label="Boost"
          icon="flash"
          variant="boost"
          onPress={() => setBoostOpen(true)}
        />
        <AppButton
          label="Test: delete confirmation"
          icon="trash-outline"
          variant="danger"
          onPress={() => setConfirmOpen(true)}
        />
      </View>

      <ConfirmModal
        visible={confirmOpen}
        title="Delete this photo?"
        message="This photo will be removed from your profile. You can't undo this."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.show("Photo deleted");
        }}
      />
      <NotInDemoModal
        visible={boostOpen}
        feature="Boost"
        onClose={() => setBoostOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 24,
    gap: 12,
  },
});
