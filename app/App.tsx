import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
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
        <ActivityIndicator color={colors.teal} />
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthGate />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
