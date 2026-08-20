import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { colors, font, radii, type } from "../theme";

export function SignUpScreen({ onNavigateSignIn }: { onNavigateSignIn: () => void }) {
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim() || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={type.label}>PEPTIDE RX</Text>
      <Text style={{ fontFamily: font.numeral, fontSize: 44, color: colors.ink, letterSpacing: -0.5 }}>
        Create account
      </Text>
      <Text style={[type.body, { fontSize: 13, marginBottom: 8 }]}>
        A tracking tool for your own stack — not medical advice.
      </Text>
      <TextInput
        placeholder="Name (optional)"
        placeholderTextColor={colors.ink3}
        value={name}
        onChangeText={setName}
        style={inputStyle}
      />
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
        placeholder="Password (min 8 characters)"
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
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
            Create account
          </Text>
        )}
      </Pressable>
      <Pressable onPress={onNavigateSignIn} style={{ alignItems: "center", marginTop: 12 }}>
        <Text style={[type.body, { fontSize: 14 }]}>
          Already have an account?{" "}
          <Text style={{ fontFamily: font.bold, color: colors.signal }}>Sign in</Text>
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
