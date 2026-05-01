import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/authContext";

const { width, height } = Dimensions.get("window");
const DARK_GREEN = "#1A3B2F";
const MID_GREEN  = "#22603F";
const LIME       = "#C6F135";

export default function SplashScreen() {
  const { user, loading, hasPinSet, pinVerified } = useAuth();

  const logoScale   = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const ripple1     = useRef(new Animated.Value(0)).current;
  const ripple2     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ripple1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(ripple1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(ripple2, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(ripple2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (!user) {
        router.replace("/auth");
      } else if (!hasPinSet) {
        router.replace("/auth/pin?mode=setup");
      } else if (!pinVerified) {
        router.replace("/auth/pin?mode=verify");
      } else {
        router.replace("/(tabs)");
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [user, loading, hasPinSet, pinVerified]);

  const rippleStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.35, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] }) }],
  });

  return (
    <View style={s.root}>
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />
      <View style={s.bgCircle3} />

      <View style={s.center}>
        <View style={s.logoWrap}>
          <Animated.View style={[s.ripple, rippleStyle(ripple1)]} />
          <Animated.View style={[s.ripple, rippleStyle(ripple2)]} />
          <Animated.View
            style={[s.logoCircle, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}
          >
            <Text style={s.logoLetter}>F</Text>
            <View style={s.logoDot} />
          </Animated.View>
        </View>

        <Animated.Text style={[s.appName, { opacity: textOpacity }]}>
          FinWallet
        </Animated.Text>
        <Animated.Text style={[s.tagline, { opacity: tagOpacity }]}>
          Send · Pay · Invest
        </Animated.Text>
      </View>

      <Animated.View style={[s.bottom, { opacity: tagOpacity }]}>
        <View style={s.dotsRow}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>
        <Text style={s.poweredBy}>Powered by Relworx</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle1: {
    position: "absolute", top: -height * 0.15, right: -width * 0.25,
    width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4,
    backgroundColor: MID_GREEN, opacity: 0.4,
  },
  bgCircle2: {
    position: "absolute", bottom: -height * 0.1, left: -width * 0.3,
    width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45,
    backgroundColor: MID_GREEN, opacity: 0.25,
  },
  bgCircle3: {
    position: "absolute", top: height * 0.3, left: -width * 0.05,
    width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15,
    backgroundColor: LIME, opacity: 0.08,
  },
  center: { alignItems: "center" },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 28 },
  ripple: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: LIME,
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LIME,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  logoLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    color: DARK_GREEN,
    lineHeight: 54,
    marginTop: -4,
  },
  logoDot: {
    position: "absolute",
    bottom: 18, right: 20,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: DARK_GREEN, opacity: 0.6,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: LIME,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  bottom: { position: "absolute", bottom: 60, alignItems: "center", gap: 16 },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { backgroundColor: LIME, width: 20, borderRadius: 3 },
  poweredBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
