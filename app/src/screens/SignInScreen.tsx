import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { Button, ErrorText } from "../components/primitives";
import { HIT, colors, font, radii, space, type } from "../theme";

export function SignInScreen({ onNavigateSignUp }: { onNavigateSignUp: () => void }) {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={type.label}>PEPTIDE RX</Text>
      <Text style={{ fontFamily: font.numeral, fontSize: 38, color: colors.ink, letterSpacing: -0.5, marginBottom: 12 }}>
        Welcome back
      </Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.ink3}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={inputStyle}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={colors.ink3}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={inputStyle}
      />
      <ErrorText>{error}</ErrorText>
      <Button
        label="Sign in"
        loadingLabel="Signing in…"
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: space.sm }}
      />
      {/* The only route between the two unauthenticated screens — it was the
          smallest target in the app at roughly one line of text tall. */}
      <Pressable
        onPress={onNavigateSignUp}
        accessibilityRole="button"
        accessibilityLabel="Go to sign up"
        style={({ pressed }) => ({
          minHeight: HIT,
          alignItems: "center",
          justifyContent: "center",
          marginTop: space.xs,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={type.body}>
          Don't have an account?{" "}
          <Text style={{ fontFamily: font.bold, color: colors.signal }}>Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  backgroundColor: colors.panel,
  borderWidth: 1,
  borderColor: colors.hairline2,
  borderRadius: radii.md,
  padding: 16,
  fontFamily: font.regular,
  fontSize: 15,
  color: colors.ink,
};
