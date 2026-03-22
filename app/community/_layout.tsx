import { Stack } from "expo-router";

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="username" />
      <Stack.Screen name="rooms" />
      <Stack.Screen name="room/[id]" />
    </Stack>
  );
}
