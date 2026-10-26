import { Tabs } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { TabBar } from "../../components/TabBar";
import { SwipeProvider } from "../../deck/SwipeProvider";
import { useTheme } from "../../theme/ThemeProvider";

// Every screen here must also be in TAB_CONFIG (src/components/TabBar.tsx).
// SwipeProvider keeps the deck while switching tabs; key={userId} gives each account its own swipes.
export default function TabsLayout() {
  const colors = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id ?? "signed-out";

  return (
    <SwipeProvider key={userId} userId={userId}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="likes" />
        <Tabs.Screen name="chats" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </SwipeProvider>
  );
}
