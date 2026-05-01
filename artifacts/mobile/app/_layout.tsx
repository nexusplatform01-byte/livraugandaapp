import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/authContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { user, loading, hasPinSet, pinVerified } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth   = segments[0] === "auth";
    const inSplash = segments[0] === "splash";
    const inTabs   = segments[0] === "(tabs)";

    if (inSplash) return;

    if (!user) {
      if (!inAuth) router.replace("/auth");
      return;
    }
    if (!hasPinSet) {
      if (!(inAuth && segments[1] === "pin")) {
        router.replace("/auth/pin?mode=setup");
      }
      return;
    }
    if (!pinVerified) {
      if (!(inAuth && segments[1] === "pin")) {
        router.replace("/auth/pin?mode=verify");
      }
      return;
    }
    if (inAuth) {
      router.replace("/(tabs)");
    }
  }, [user, loading, hasPinSet, pinVerified, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash"   />
        <Stack.Screen name="auth"     />
        <Stack.Screen name="(tabs)"   />
        <Stack.Screen name="buy"      />
        <Stack.Screen name="pay"      />
        <Stack.Screen name="bank"     />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
