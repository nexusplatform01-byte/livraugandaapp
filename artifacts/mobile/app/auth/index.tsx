import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";

const { width } = Dimensions.get("window");
const DARK_GREEN = "#1A3B2F";
const LIME       = "#C6F135";
const BG         = "#F5F7F5";
const CARD       = "#FFFFFF";
const BORDER     = "#E2EAE2";
const MUTED      = "#7A9A7A";

const COUNTRY_CODE = "+256";

export default function PhoneScreen() {
  const { sendOtp, user } = useAuth();
  const [phone, setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (user) router.replace("/(tabs)");
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [user]);

  function formatDisplay(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  async function handleSend() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Enter a valid 9–10 digit Uganda number.");
      return;
    }
    Keyboard.dismiss();
    setError("");
    setLoading(true);
    try {
      const full = `${COUNTRY_CODE}${digits.replace(/^0/, "")}`;
      await sendOtp(full);
      router.push("/auth/otp");
    } catch (e: any) {
      setError(e?.message || "Failed to send OTP. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.root}>
        <View style={s.topHalf}>
          <View style={s.logoCircle}>
            <Text style={s.logoLetter}>F</Text>
          </View>
          <Text style={s.headline}>Welcome to FinWallet</Text>
          <Text style={s.sub}>Enter your mobile number to get started.{"\n"}We'll send you a verification code.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.fieldLabel}>Mobile Number</Text>
          <View style={s.inputRow}>
            <View style={s.dialBox}>
              <Text style={s.flag}>🇺🇬</Text>
              <Text style={s.dialCode}>{COUNTRY_CODE}</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder="700 123 456"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              value={formatDisplay(phone)}
              onChangeText={(t) => {
                setError("");
                setPhone(t.replace(/\D/g, "").slice(0, 10));
              }}
              returnKeyType="done"
              onSubmitEditing={handleSend}
              selectionColor={LIME}
            />
          </View>
          {!!error && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={13} color="#B83232" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.btn, (loading || phone.replace(/\D/g, "").length < 9) && s.btnDim]}
            onPress={handleSend}
            disabled={loading || phone.replace(/\D/g, "").length < 9}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={DARK_GREEN} />
            ) : (
              <>
                <Text style={s.btnTxt}>Send Code</Text>
                <Feather name="arrow-right" size={18} color={DARK_GREEN} />
              </>
            )}
          </TouchableOpacity>

          <Text style={s.terms}>
            By continuing you agree to our{" "}
            <Text style={s.link}>Terms of Service</Text> &{" "}
            <Text style={s.link}>Privacy Policy</Text>.
          </Text>
        </View>

        <View style={s.footer}>
          <Feather name="lock" size={14} color={MUTED} />
          <Text style={s.footerTxt}>Your number is encrypted and never shared.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: DARK_GREEN },
  topHalf: { flex: 0.48, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: LIME, alignItems: "center", justifyContent: "center", marginBottom: 4, shadowColor: LIME, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  logoLetter: { fontFamily: "Inter_700Bold", fontSize: 36, color: DARK_GREEN },
  headline:   { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFFFFF", textAlign: "center", letterSpacing: -0.5 },
  sub:        { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 20 },
  card:     { backgroundColor: CARD, borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 0.52, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },
  inputRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  dialBox:   { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 14 },
  flag:      { fontSize: 18 },
  dialCode:  { fontFamily: "Inter_700Bold", fontSize: 14, color: DARK_GREEN },
  input:     { flex: 1, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: "Inter_500Medium", fontSize: 18, color: DARK_GREEN, letterSpacing: 1.5 },
  errorRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 2 },
  errorTxt:  { fontFamily: "Inter_400Regular", fontSize: 12, color: "#B83232", flex: 1 },
  btn:       { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, marginBottom: 16 },
  btnDim:    { opacity: 0.5 },
  btnTxt:    { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  terms:     { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED, textAlign: "center", lineHeight: 16 },
  link:      { color: DARK_GREEN, fontFamily: "Inter_500Medium" },
  footer:    { position: "absolute", bottom: 18, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerTxt: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.35)" },
});
