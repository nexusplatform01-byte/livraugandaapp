import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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
const DARK_GREEN = "#1A3B2F";
const LIME       = "#C6F135";
const CARD       = "#FFFFFF";
const BORDER     = "#E2EAE2";
const MUTED      = "#7A9A7A";
const ERROR_RED  = "#B83232";

const PIN_LEN = 4;
const KEYS    = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function PinScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { setupPin, verifyPin, signOut, user } = useAuth();
  const isSetup   = mode === "setup";
  const isVerify  = mode === "verify";

  const [pin, setPin]         = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep]       = useState<"enter"|"confirm">("enter");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const shakeAnim             = useRef(new Animated.Value(0)).current;

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

  const titles = {
    enter_setup:    "Create your PIN",
    confirm_setup:  "Confirm your PIN",
    enter_verify:   "Enter your PIN",
  };
  const subtitle = isSetup && step === "confirm"
    ? "Enter the same 4-digit PIN again"
    : isSetup
    ? "Choose a 4-digit PIN to protect your wallet"
    : `Welcome back, ${user?.phoneNumber || ""}`;

  const titleKey = isSetup ? (step === "confirm" ? "confirm_setup" : "enter_setup") : "enter_verify";

  return (
    <View style={s.root}>
      <View style={s.topHalf}>
        {isVerify && (
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={async () => { await signOut(); router.replace("/auth"); }}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={16} color={LIME} />
            <Text style={s.signOutTxt}>Sign out</Text>
          </TouchableOpacity>
        )}
        <View style={s.logoCircle}>
          <Feather name="shield" size={32} color={DARK_GREEN} />
        </View>
        <Text style={s.headline}>{titles[titleKey]}</Text>
        <Text style={s.sub}>{subtitle}</Text>

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
              activeOpacity={0.75}
              disabled={!k.trim()}
            >
              {k === "⌫" ? (
                <Feather name="delete" size={22} color={DARK_GREEN} />
              ) : (
                <Text style={s.keyTxt}>{k}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isSetup && step === "confirm" && (
          <TouchableOpacity
            style={s.backRow}
            onPress={() => { setStep("enter"); setConfirm(""); setError(""); }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={14} color={MUTED} />
            <Text style={s.backTxt}>Go back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const DOT_SIZE = 18;
const KEY_SIZE = (width - 64 - 32) / 3;

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: DARK_GREEN },
  topHalf: { flex: 0.45, alignItems: "center", justifyContent: "flex-end", paddingBottom: 32, paddingHorizontal: 24, gap: 10 },
  signOutBtn: { position: "absolute", top: Platform.OS === "web" ? 16 : 50, right: 20, flexDirection: "row", alignItems: "center", gap: 6 },
  signOutTxt: { fontFamily: "Inter_500Medium", fontSize: 13, color: LIME },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: LIME, alignItems: "center", justifyContent: "center" },
  headline:   { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF", textAlign: "center" },
  sub:        { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 20 },
  dotsRow:    { flexDirection: "row", gap: 18, marginTop: 8 },
  pinDot:     { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, borderWidth: 2.5, borderColor: "rgba(255,255,255,0.4)", backgroundColor: "transparent" },
  pinDotFilled:{ backgroundColor: LIME, borderColor: LIME },
  pinDotError: { backgroundColor: ERROR_RED, borderColor: ERROR_RED },
  errorTxt:   { fontFamily: "Inter_500Medium", fontSize: 12, color: "#FF8080", textAlign: "center" },
  card:       { backgroundColor: CARD, borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 0.55, paddingHorizontal: 32, paddingTop: 28, paddingBottom: 24, alignItems: "center" },
  numpad:     { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center", width: "100%" },
  key:        { width: KEY_SIZE, height: KEY_SIZE * 0.7, borderRadius: 16, backgroundColor: "#F5F7F5", borderWidth: 1.5, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  keyDelete:  { backgroundColor: "#FFF0F0", borderColor: "#FFD5D5" },
  keyTxt:     { fontFamily: "Inter_700Bold", fontSize: 24, color: DARK_GREEN },
  backRow:    { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  backTxt:    { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED },
});
