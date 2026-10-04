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
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainTabs } from "./src/navigation/MainTabs";
import { navRef } from "./src/navigation/navRef";
import { FirstRun } from "./src/screens/FirstRun";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { useAuthStore } from "./src/store/authStore";
import { Button } from "./src/components/primitives";
import { colors, type } from "./src/theme";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, hydrated, hydrate, serverUnreachable } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function retry() {
    setRetrying(true);
    try {
      await hydrate();
    } finally {
      setRetrying(false);
    }
  }

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.signal} />
      </View>
    );
  }

  // We still hold a refresh token, we just couldn't reach the backend to use
  // it. Showing the sign-in form here would be a lie: the session is intact
  // and re-entering a password wouldn't help.
  if (!user && serverUnreachable) {
    return <ServerUnreachable onRetry={retry} retrying={retrying} />;
  }

  if (!user) {
    return showSignUp ? (
      <SignUpScreen onNavigateSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignInScreen onNavigateSignUp={() => setShowSignUp(true)} />
    );
  }

  // A new account goes through the survey, the quote beat and the tour before
  // reaching the app. Both flags must be set to skip it, so finishing the
  // survey and abandoning the tour resumes at the tour rather than the start.
  if (!user.onboardedAt || !user.tourCompletedAt) {
    return <FirstRun />;
  }

  return <MainTabs />;
}

function ServerUnreachable({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={type.title}>Can't reach the server</Text>
      <Text style={type.body}>
        You're still signed in — the app just couldn't connect. Check that the backend is
        running, then try again.
      </Text>
      <Button label="Try again" loadingLabel="Connecting…" onPress={onRetry} loading={retrying} />
    </View>
  );
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
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#07090B" }}>
      <View
        style={{
          width: 430,
          height: "92vh" as unknown as number,
          maxHeight: 932,
          borderRadius: 34,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#1E242B",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowSemiCondensed_300Light,
    BarlowSemiCondensed_500Medium,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <WebPhoneFrame>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer ref={navRef}>
            <AuthGate />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </WebPhoneFrame>
  );
}
