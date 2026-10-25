import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";

// Likes — placeholder.
export default function LikesScreen() {
  return (
    <Screen>
      <AppText variant="display">Likes</AppText>
      <AppText variant="body" muted>
        People who liked you will appear here.
      </AppText>
    </Screen>
  );
}
