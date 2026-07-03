import { Stack, useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { setLang } from "@/src/i18n";
import { storage } from "@/src/utils/storage";
import { SplashIntro } from "@/src/components/SplashIntro";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

/**
 * Root layout — enforces the cold-start ritual:
 *   1. Load fonts + restore language.
 *   2. Show SPP Intro (BrandOrb + Wordmark + tagline) for at least 1.4s.
 *   3. Route the app to `/` (or `/onboarding` for first-launch) — never
 *      the last visited screen.
 *   4. Fade the intro out to reveal Home.
 */
export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [langReady, setLangReady] = useState(false);
  const [minHoldElapsed, setMinHoldElapsed] = useState(false);
  const [routed, setRouted] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Restore language before rendering any screen.
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<'en' | 'ar'>('spp.lang', 'en');
      setLang(saved ?? 'en');
      setLangReady(true);
    })();
  }, []);

  // Enforce a minimum splash hold for brand presence.
  useEffect(() => {
    const t = setTimeout(() => setMinHoldElapsed(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Hide the native splash the moment fonts + i18n are ready.
  useEffect(() => {
    if ((loaded || error) && langReady) SplashScreen.hideAsync();
  }, [loaded, error, langReady]);

  // Cold-start routing: send the user to Home (or first-launch Onboarding),
  // never to whatever pathname the shell restored.
  useEffect(() => {
    if (routed) return;
    if (!langReady || !(loaded || error)) return;
    (async () => {
      const onboarded = await storage.getItem<boolean>('spp.onboarded', false);
      const target = onboarded ? '/' : '/onboarding';
      if (pathname !== target) router.replace(target as any);
      setRouted(true);
    })();
  }, [langReady, loaded, error, routed, pathname, router]);

  // Fade the SPP intro out once everything is ready + min hold has passed.
  const readyForHandoff = langReady && (loaded || error) && minHoldElapsed && routed;
  useEffect(() => {
    if (!readyForHandoff) return;
    const t = setTimeout(() => setIntroDone(true), 60);
    return () => clearTimeout(t);
  }, [readyForHandoff]);

  if ((!loaded && !error) || !langReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#050A12' }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'default',
              animationDuration: 320,
              contentStyle: { backgroundColor: '#050A12' },
            }}
          />
          <SplashIntro visible={!introDone} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
