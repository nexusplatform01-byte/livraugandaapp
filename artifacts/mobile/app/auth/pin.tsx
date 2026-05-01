import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";

const { width } = Dimensions.get("window");

const DARK_NAVY  = "#0A1628";
const GOLD       = "#C9A84C";
const CARD       = "#FFFFFF";
const BORDER     = "#E4E8EF";
const MUTED      = "#8A95A3";
const ERROR_RED  = "#C0392B";
const BG         = "#F7F8FA";

const PIN_LEN = 4;
const KEYS    = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

const logo = require("@/assets/logo.avif");

export default function PinScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { setupPin, verifyPin, signOut, customerName } = useAuth();
  const isSetup  = mode === "setup";
  const isVerify = mode === "verify";

  const [pin, setPin]         = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep]       = useState<"enter" | "confirm">("enter");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const shakeAnim             = useRef(new Animated.Value(0)).current;

  const displayName = customerName
    ? customerName.split(" ")[0]
    : "";

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 40,  useNativeDriver: true }),
    ]).start();
  }

  function handleKey(key: string) {
    if (loading) return;
    const target = isSetup && step === "confirm" ? confirm : pin;
    const setter = isSetup && step === "confirm" ? setConfirm : setPin;

    if (key === "⌫") {
      setter(target.slice(0, -1));
      setError("");
      return;
    }
    if (!key.trim()) return;
    if (target.length >= PIN_LEN) return;
    const next = target + key;
    setter(next);
    setError("");

    if (next.length === PIN_LEN) {
      setTimeout(() => handleComplete(next), 80);
    }
  }

  async function handleComplete(val: string) {
    setLoading(true);
    try {
      if (isSetup) {
        if (step === "enter") {
          setStep("confirm");
          setLoading(false);
          return;
        }
        if (val !== pin) {
          shake();
          setError("PINs don't match. Try again.");
          setConfirm("");
          setLoading(false);
          return;
        }
        await setupPin(pin);
        router.replace("/(tabs)");
      } else {
        const ok = await verifyPin(val);
        if (!ok) {
          shake();
          setError("Incorrect PIN. Try again.");
          setPin("");
          setLoading(false);
          return;
        }
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  const activePin = isSetup && step === "confirm" ? confirm : pin;

  const isConfirmStep = isSetup && step === "confirm";

  return (
    <View style={s.root}>
      <View style={s.topHalf}>
        {isVerify && (
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={async () => { await signOut(); router.replace("/auth"); }}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={15} color={GOLD} />
            <Text style={s.signOutTxt}>Sign out</Text>
          </TouchableOpacity>
        )}

        <View style={s.logoWrap}>
          <Image source={logo} style={s.logoImg} resizeMode="contain" />
        </View>

        {!isConfirmStep && displayName ? (
          <Text style={s.nameText}>
            {isVerify ? `Welcome back, ${displayName}` : `Welcome, ${displayName}`}
          </Text>
        ) : null}

        <Text style={s.appName}>Livra Payment</Text>

        {isConfirmStep ? (
          <Text style={s.headline}>Confirm your PIN</Text>
        ) : isSetup ? (
          <Text style={s.headline}>Create your 4-digit PIN</Text>
        ) : (
          <Text style={s.headline}>Enter your PIN</Text>
        )}

        {isConfirmStep ? (
          <Text style={s.sub}>Re-enter the same 4-digit PIN</Text>
        ) : isSetup ? (
          <Text style={s.sub}>Choose a secure PIN to protect your account</Text>
        ) : (
          <Text style={s.sub}>Enter your PIN to access your wallet</Text>
        )}

        <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <View
              key={i}
              style={[
                s.pinDot,
                i < activePin.length ? s.pinDotFilled : null,
                error && i < activePin.length ? s.pinDotError : null,
              ]}
            />
          ))}
        </Animated.View>
        {!!error && <Text style={s.errorTxt}>{error}</Text>}
      </View>

      <View style={s.card}>
        <View style={s.numpad}>
          {KEYS.map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[
                s.key,
                !k.trim() && { opacity: 0, pointerEvents: "none" },
                k === "⌫" && s.keyDelete,
              ]}
              onPress={() => handleKey(k)}
              activeOpacity={0.7}
              disabled={!k.trim()}
            >
              {k === "⌫" ? (
                <Feather name="delete" size={22} color={DARK_NAVY} />
              ) : (
                <Text style={s.keyTxt}>{k}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isConfirmStep && (
          <TouchableOpacity
            style={s.backRow}
            onPress={() => { setStep("enter"); setConfirm(""); setError(""); }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={14} color={MUTED} />
            <Text style={s.backTxt}>Back to create PIN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const DOT_SIZE = 18;
const KEY_SIZE = (width - 64 - 32) / 3;

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: DARK_NAVY },
  topHalf: { flex: 0.5, alignItems: "center", justifyContent: "flex-end", paddingBottom: 28, paddingHorizontal: 24, gap: 6 },

  signOutBtn: { position: "absolute", top: Platform.OS === "web" ? 16 : 52, right: 20, flexDirection: "row", alignItems: "center", gap: 5 },
  signOutTxt: { fontFamily: "Inter_500Medium", fontSize: 13, color: GOLD },

  logoWrap:   { width: 64, height: 64, borderRadius: 16, overflow: "hidden", backgroundColor: "#FFFFFF", marginBottom: 4, shadowColor: GOLD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  logoImg:    { width: 64, height: 64 },

  nameText:   { fontFamily: "Inter_600SemiBold", fontSize: 15, color: GOLD, textAlign: "center", letterSpacing: 0.3 },
  appName:    { fontFamily: "Inter_700Bold", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 3, textTransform: "uppercase", marginTop: -2 },
  headline:   { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF", textAlign: "center", marginTop: 4 },
  sub:        { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 19 },

  dotsRow:    { flexDirection: "row", gap: 20, marginTop: 10 },
  pinDot:     { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, borderWidth: 2.5, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "transparent" },
  pinDotFilled:{ backgroundColor: GOLD, borderColor: GOLD },
  pinDotError: { backgroundColor: ERROR_RED, borderColor: ERROR_RED },
  errorTxt:   { fontFamily: "Inter_500Medium", fontSize: 12, color: "#FF8A8A", textAlign: "center" },

  card:    { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 0.5, paddingHorizontal: 32, paddingTop: 28, paddingBottom: 20, alignItems: "center" },
  numpad:  { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", width: "100%" },
  key:     { width: KEY_SIZE, height: KEY_SIZE * 0.68, borderRadius: 14, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  keyDelete:{ backgroundColor: "#FEF0F0", borderColor: "#F5CACA" },
  keyTxt:  { fontFamily: "Inter_700Bold", fontSize: 24, color: DARK_NAVY },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  backTxt: { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED },
});
