import { Stack } from "expo-router";
import { SettingsProvider } from "../context/SettingsContext";
import { useSettings } from "../context/SettingsContext";
import { View, ActivityIndicator } from "react-native";

function AppContent() {
  const { isLoaded } = useSettings();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1120', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
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
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
