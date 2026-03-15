import { Tabs } from "expo-router";
import { Text } from "react-native";
import { COLORS } from "../../src/lib/constants";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.indigo,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.slate100,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        headerStyle: { backgroundColor: COLORS.slate50 },
        headerTintColor: COLORS.slate800,
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>$</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>&oplus;</Text>
          ),
        }}
      />
    </Tabs>
  );
}
