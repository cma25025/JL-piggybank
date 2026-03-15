import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../src/lib/constants";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.slate50 },
          headerTintColor: COLORS.slate800,
          headerTitleStyle: { fontWeight: "800" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.slate50 },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="create-account"
          options={{
            title: "New Account",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="account/[id]"
          options={{ title: "Account" }}
        />
      </Stack>
    </>
  );
}
