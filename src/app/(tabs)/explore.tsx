import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";

// Explore — placeholder.
export default function ExploreScreen() {
  return (
    <Screen>
      <AppText variant="display">Explore</AppText>
      <AppText variant="body" muted>
        Browse people by interests and categories.
      </AppText>
    </Screen>
  );
}
