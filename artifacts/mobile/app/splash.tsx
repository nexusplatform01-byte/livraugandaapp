import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/authContext";

const { width, height } = Dimensions.get("window");
const DARK_NAVY = "#0A1628";
const NAVY_MID  = "#132040";
const GOLD      = "#C9A84C";
const GOLD_DIM  = "#7A5E25";

const logo = require("@/assets/logo.avif");

export default function SplashScreen() {
  const { phone, loading, hasPinSet, pinVerified } = useAuth();

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
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(ripple1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(ripple2, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(ripple2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (!phone) {
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
  }, [phone, loading, hasPinSet, pinVerified]);

  const rippleStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.2, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.8] }) }],
  });

  return (
    <View style={s.root}>
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      <View style={s.center}>
        <View style={s.logoWrap}>
          <Animated.View style={[s.ripple, rippleStyle(ripple1)]} />
          <Animated.View style={[s.ripple, rippleStyle(ripple2)]} />
          <Animated.View
            style={[s.logoCircle, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}
          >
            <Image source={logo} style={s.logoImg} resizeMode="contain" />
          </Animated.View>
        </View>

        <Animated.Text style={[s.appName, { opacity: textOpacity }]}>
          LIVRA
        </Animated.Text>
        <Animated.Text style={[s.tagline, { opacity: tagOpacity }]}>
          Payment
        </Animated.Text>
      </View>

      <Animated.View style={[s.bottom, { opacity: tagOpacity }]}>
        <View style={s.divider} />
        <Text style={s.poweredBy}>Powered by Relworx</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle1: {
    position: "absolute", top: -height * 0.12, right: -width * 0.2,
    width: width * 0.75, height: width * 0.75, borderRadius: width * 0.375,
    backgroundColor: NAVY_MID, opacity: 0.6,
  },
  bgCircle2: {
    position: "absolute", bottom: -height * 0.1, left: -width * 0.28,
    width: width * 0.85, height: width * 0.85, borderRadius: width * 0.425,
    backgroundColor: NAVY_MID, opacity: 0.4,
  },
  center: { alignItems: "center" },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 24 },
  ripple: {
    position: "absolute",
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: GOLD,
  },
  logoCircle: {
    width: 110, height: 110, borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    overflow: "hidden",
  },
  logoImg: { width: 110, height: 110 },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: "#FFFFFF",
    letterSpacing: 8,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: GOLD,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  bottom: { position: "absolute", bottom: 56, alignItems: "center", gap: 12 },
  divider: { width: 32, height: 1, backgroundColor: GOLD_DIM },
  poweredBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
