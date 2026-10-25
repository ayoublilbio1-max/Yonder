import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";

// Chats — placeholder.
export default function ChatsScreen() {
  return (
    <Screen>
      <AppText variant="display">Chats</AppText>
      <AppText variant="body" muted>
        Your matches and conversations will appear here.
      </AppText>
    </Screen>
  );
}
