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
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainTabs } from "./src/navigation/MainTabs";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { useAuthStore } from "./src/store/authStore";
import { colors } from "./src/theme";

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
// looking like the phone app it actually is. Native builds are untouched.
function WebPhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#07090B" }}>
      <View
        style={{
          width: 430,
          height: "95vh" as unknown as number,
          maxHeight: 932,
          borderRadius: 40,
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
          <NavigationContainer>
            <AuthGate />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </WebPhoneFrame>
  );
}
