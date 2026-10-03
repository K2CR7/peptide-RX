import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from "@expo-google-fonts/barlow";
import {
  BarlowSemiCondensed_300Light,
  BarlowSemiCondensed_500Medium,
} from "@expo-google-fonts/barlow-semi-condensed";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainTabs } from "./src/navigation/MainTabs";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { useAuthStore } from "./src/store/authStore";
import { BORDER, colors, mode, setThemeMode, type ThemeMode } from "./src/theme";
import { ThemeToggleContext } from "./src/lib/themeToggle";
import { secureStorage } from "./src/lib/secureStorage";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, hydrated, hydrate } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.signal} />
      </View>
    );
  }

  if (!user) {
    return showSignUp ? (
      <SignUpScreen onNavigateSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignInScreen onNavigateSignUp={() => setShowSignUp(true)} />
    );
  }

  return <MainTabs />;
}

// The web build is for local iteration, not a real target platform — without
// this it stretches edge-to-edge across a desktop browser window instead of
// looking like the phone app it actually is. At phone-width viewports the
// decorative frame is dropped: there is nothing to letterbox, and forcing it
// only introduces overflow. Native builds are untouched.
function WebPhoneFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== "web") return <>{children}</>;
  if (width < 520 || height < 700) return <>{children}</>;
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg === "#000000" ? "#2A2A2A" : "#C9C9C4",
      }}
    >
      <View
        style={{
          width: 430,
          height: "92vh" as unknown as number,
          maxHeight: 932,
          borderRadius: 0,
          overflow: "hidden",
          borderWidth: BORDER,
          borderColor: colors.ink,
        }}
      >
        {children}
      </View>
    </View>
  );
}

const THEME_KEY = "peptiderx.themeMode";

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowSemiCondensed_300Light,
    BarlowSemiCondensed_500Medium,
  });

  const [themeMode, setMode] = useState<ThemeMode>(mode);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    secureStorage
      .getItem(THEME_KEY)
      .then((stored) => {
        if (cancelled) return;
        const next: ThemeMode = stored === "light" ? "light" : "dark";
        setThemeMode(next);
        setMode(next);
      })
      .finally(() => {
        if (!cancelled) setThemeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mutating the palette here (an event handler, never render) and then
  // remounting via the key below is what makes every screen re-read it.
  const toggleTheme = useCallback(() => {
    const next: ThemeMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    setMode(next);
    secureStorage.setItem(THEME_KEY, next).catch(() => {});
  }, [themeMode]);

  if (!fontsLoaded || !themeReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <ThemeToggleContext.Provider value={toggleTheme}>
      <WebPhoneFrame key={themeMode}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <NavigationContainer>
              <AuthGate />
            </NavigationContainer>
          </SafeAreaProvider>
        </QueryClientProvider>
      </WebPhoneFrame>
    </ThemeToggleContext.Provider>
  );
}
