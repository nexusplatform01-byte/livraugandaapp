import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const { width } = Dimensions.get("window");
const DARK_GREEN = "#1A3B2F";
const LIME       = "#C6F135";
const BG         = "#F5F7F5";
const CARD       = "#FFFFFF";
const BORDER     = "#E2EAE2";
const MUTED      = "#7A9A7A";

const CODE_LEN = 6;

export default function OtpScreen() {
  const { confirmOtp, sendOtp, hasPinSet, lastPhone } = useAuth();
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown() {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleVerify() {
    if (code.length !== CODE_LEN) return;
    Keyboard.dismiss();
    setError("");
    setLoading(true);
    try {
      await confirmOtp(code);
      if (!hasPinSet) {
        router.replace("/auth/pin?mode=setup");
      } else {
        router.replace("/auth/pin?mode=verify");
      }
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!lastPhone || resending || countdown > 0) return;
    setResending(true);
    setError("");
    try {
      await sendOtp(lastPhone);
      startCountdown();
      setCode("");
    } catch (e: any) {
      setError(e?.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  }

  const digits = code.split("");
  while (digits.length < CODE_LEN) digits.push("");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.root}>
        <View style={s.topHalf}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={LIME} />
          </TouchableOpacity>
          <View style={s.iconCircle}>
            <Feather name="message-square" size={32} color={DARK_GREEN} />
          </View>
          <Text style={s.headline}>Enter the code</Text>
          <Text style={s.sub}>
            We sent a 6-digit code to{"\n"}
            <Text style={{ color: LIME }}>{lastPhone || "your phone"}</Text>
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.dotsRow}>
            {digits.map((d, i) => (
              <View
                key={i}
                style={[
                  s.digitBox,
                  d ? s.digitBoxFilled : null,
                  i === code.length ? s.digitBoxActive : null,
                ]}
              >
                <Text style={s.digitTxt}>{d || ""}</Text>
              </View>
            ))}
          </View>

          <TextInput
            ref={inputRef}
            style={s.hiddenInput}
            keyboardType="number-pad"
            maxLength={CODE_LEN}
            value={code}
            onChangeText={(t) => {
              setError("");
              setCode(t.replace(/\D/g, "").slice(0, CODE_LEN));
              if (t.replace(/\D/g, "").length === CODE_LEN) {
                setTimeout(() => handleVerify(), 50);
              }
            }}
            selectionColor="transparent"
          />

          {!!error && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={13} color="#B83232" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.btn, (loading || code.length !== CODE_LEN) && s.btnDim]}
            onPress={handleVerify}
            disabled={loading || code.length !== CODE_LEN}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={DARK_GREEN} />
            ) : (
              <Text style={s.btnTxt}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.resendRow}
            onPress={handleResend}
            disabled={countdown > 0 || resending}
            activeOpacity={0.7}
          >
            {resending ? (
              <ActivityIndicator color={DARK_GREEN} size="small" />
            ) : (
              <Text style={[s.resendTxt, countdown > 0 && s.resendDim]}>
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: DARK_GREEN },
  topHalf: { flex: 0.45, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  backBtn: { position: "absolute", top: Platform.OS === "web" ? 20 : 50, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: LIME, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  headline: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFFFFF", textAlign: "center" },
  sub:      { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22 },
  card:     { backgroundColor: CARD, borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 0.55, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24 },
  dotsRow:  { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 8 },
  digitBox: { width: (width - 48 - 50) / CODE_LEN, height: 56, borderRadius: 14, borderWidth: 2, borderColor: BORDER, backgroundColor: BG, alignItems: "center", justifyContent: "center" },
  digitBoxFilled: { borderColor: DARK_GREEN, backgroundColor: "#F0FAF0" },
  digitBoxActive: { borderColor: LIME, borderWidth: 2.5 },
  digitTxt: { fontFamily: "Inter_700Bold", fontSize: 22, color: DARK_GREEN },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  errorRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 4 },
  errorTxt:  { fontFamily: "Inter_400Regular", fontSize: 12, color: "#B83232", flex: 1 },
  btn:      { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center", marginTop: 20, marginBottom: 12 },
  btnDim:   { opacity: 0.5 },
  btnTxt:   { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  resendRow:{ alignItems: "center", paddingVertical: 8 },
  resendTxt:{ fontFamily: "Inter_500Medium", fontSize: 13, color: DARK_GREEN },
  resendDim:{ color: MUTED },
});
