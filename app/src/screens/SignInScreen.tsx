import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { colors, radii } from "../theme";

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
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink, marginBottom: 8 }}>
        Welcome back
      </Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={inputStyle}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={inputStyle}
      />
      {error && <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center", marginTop: 8 }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Sign in</Text>}
      </Pressable>
      <Pressable onPress={onNavigateSignUp} style={{ alignItems: "center", marginTop: 12 }}>
        <Text style={{ color: colors.ink2 }}>Don't have an account? <Text style={{ color: colors.teal, fontWeight: "700" }}>Sign up</Text></Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  backgroundColor: colors.white,
  borderWidth: 1.5,
  borderColor: colors.border2,
  borderRadius: radii.md,
  padding: 14,
  fontSize: 15,
  color: colors.ink,
};
