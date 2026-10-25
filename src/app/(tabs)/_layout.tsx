import { Tabs } from "expo-router";
import { TabBar } from "../../components/TabBar";
import { useTheme } from "../../theme/ThemeProvider";

// Every screen here must also be in TAB_CONFIG (src/components/TabBar.tsx).
export default function TabsLayout() {
  const colors = useTheme();

  return (
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
  );
}
