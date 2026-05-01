import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";

const DARK_NAVY  = "#0A1628";
const GOLD       = "#C9A84C";
const GOLD_LIGHT = "#E8C97A";
const BG         = "#F7F8FA";
const CARD       = "#FFFFFF";
const BORDER     = "#E4E8EF";
const MUTED      = "#8A95A3";
const WHITE      = "#FFFFFF";

const COUNTRY_CODE = "+256";

const logo = require("@/assets/logo.avif");

export default function PhoneScreen() {
  const { validatePhone, phone: sessionPhone } = useAuth();
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (sessionPhone) router.replace("/(tabs)");
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [sessionPhone]);

  function formatDisplay(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  async function handleContinue() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Enter a valid 9–10 digit Uganda number.");
      return;
    }
    Keyboard.dismiss();
    setError("");
    setLoading(true);
    try {
      const msisdn = `${COUNTRY_CODE}${digits.replace(/^0/, "")}`;
      const { hasPinSet } = await validatePhone(msisdn);
      if (hasPinSet) {
        router.replace("/auth/pin?mode=verify");
      } else {
        router.replace("/auth/pin?mode=setup");
      }
    } catch (e: any) {
      setError(e?.message || "Could not verify this number. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = phone.replace(/\D/g, "").length >= 9 && !loading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.root}>
        <View style={s.topHalf}>
          <View style={s.logoWrap}>
            <Image source={logo} style={s.logoImg} resizeMode="contain" />
          </View>
          <Text style={s.brand}>LIVRA</Text>
          <Text style={s.tagline}>Payment</Text>
          <View style={s.divider} />
          <Text style={s.sub}>Secure · Fast · Reliable</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>
          <Text style={s.cardSub}>Enter your Uganda mobile number to continue</Text>

          <Text style={s.fieldLabel}>Mobile Number</Text>
          <View style={s.inputRow}>
            <View style={s.dialBox}>
              <Text style={s.flag}>🇺🇬</Text>
              <Text style={s.dialCode}>{COUNTRY_CODE}</Text>
              <Feather name="chevron-down" size={12} color={MUTED} />
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
              onSubmitEditing={handleContinue}
              selectionColor={GOLD}
            />
          </View>

          {!!error && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={13} color="#C0392B" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.btn, !canSubmit && s.btnDim]}
            onPress={handleContinue}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={DARK_NAVY} />
            ) : (
              <>
                <Text style={s.btnTxt}>Continue</Text>
                <Feather name="arrow-right" size={18} color={DARK_NAVY} />
              </>
            )}
          </TouchableOpacity>

          <View style={s.secureRow}>
            <Feather name="lock" size={12} color={MUTED} />
            <Text style={s.secureTxt}>256-bit encrypted · Your data is protected</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: DARK_NAVY },
  topHalf: { flex: 0.46, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 4 },
  logoWrap:{ width: 88, height: 88, borderRadius: 22, overflow: "hidden", backgroundColor: WHITE, marginBottom: 12, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  logoImg: { width: 88, height: 88 },
  brand:   { fontFamily: "Inter_700Bold", fontSize: 32, color: WHITE, letterSpacing: 6, marginTop: 4 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 13, color: GOLD, letterSpacing: 4, textTransform: "uppercase", marginTop: -2 },
  divider: { width: 40, height: 1, backgroundColor: GOLD, opacity: 0.4, marginVertical: 8 },
  sub:     { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase" },

  card:      { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 0.54, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: DARK_NAVY, marginBottom: 4 },
  cardSub:   { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED, marginBottom: 24, lineHeight: 19 },

  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  inputRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dialBox:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 13 },
  flag:       { fontSize: 16 },
  dialCode:   { fontFamily: "Inter_700Bold", fontSize: 13, color: DARK_NAVY },
  input:      { flex: 1, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: "Inter_500Medium", fontSize: 17, color: DARK_NAVY, letterSpacing: 1.5 },

  errorRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 2 },
  errorTxt:  { fontFamily: "Inter_400Regular", fontSize: 12, color: "#C0392B", flex: 1 },

  btn:    { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, marginBottom: 14, shadowColor: GOLD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnDim: { opacity: 0.45 },
  btnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_NAVY },

  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  secureTxt: { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED },
});
