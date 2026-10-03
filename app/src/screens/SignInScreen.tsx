import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { colors, font, radii, type } from "../theme";

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
      <Text style={{ fontFamily: font.numeral, fontSize: 44, color: colors.ink, letterSpacing: -0.5, marginBottom: 12 }}>
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
      {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13 }}>{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={({ pressed }) => ({
          backgroundColor: colors.signal,
          borderRadius: radii.md,
          padding: 15,
          alignItems: "center",
          marginTop: 8,
          opacity: loading || pressed ? 0.7 : 1,
        })}
      >
        {loading ? (
          <ActivityIndicator color={colors.onSignal} />
        ) : (
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>Sign in</Text>
        )}
      </Pressable>
      <Pressable onPress={onNavigateSignUp} style={{ alignItems: "center", marginTop: 12 }}>
        <Text style={[type.body, { fontSize: 14 }]}>
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
  padding: 14,
  fontFamily: font.regular,
  fontSize: 15,
  color: colors.ink,
};
