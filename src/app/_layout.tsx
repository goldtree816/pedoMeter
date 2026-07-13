import { Stack } from "expo-router";
import { SettingsProvider } from "../context/SettingsContext";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="settings/new-record" 
          options={{ 
            presentation: 'modal', 
            animation: 'slide_from_bottom' 
          }} 
        />
      </Stack>
    </SettingsProvider>
  );
}
