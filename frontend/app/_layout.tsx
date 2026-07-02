import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { setLang } from "@/src/i18n";
import { storage } from "@/src/utils/storage";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [langReady, setLangReady] = useState(false);

  // Restore saved language BEFORE first render of screens so RTL is applied.
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<'en' | 'ar'>('spp.lang', 'en');
      setLang(saved ?? 'en');
      setLangReady(true);
    })();
  }, []);

  useEffect(() => {
    if ((loaded || error) && langReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, langReady]);

  if ((!loaded && !error) || !langReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#060B14' },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
