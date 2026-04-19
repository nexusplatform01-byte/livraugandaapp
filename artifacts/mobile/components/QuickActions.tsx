import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BankIcon, ExchangeIcon, PayIcon } from "./QuickActionIcons";

interface Action {
  key: string;
  label: string;
  bg: string;
  gradient: readonly [string, string, ...string[]];
}

const ACTIONS: Action[] = [
  {
    key: "airtime", label: "Airtime", bg: "#1A3B2F",
    gradient: ["#007AFF", "#5AC8FA", "#34AADC"],
  },
  {
    key: "bank", label: "Bank", bg: "#C0392B",
    gradient: ["#BF5AF2", "#FF2D55", "#FF6B9D"],
  },
  {
    key: "pay", label: "Pay", bg: "#1A6B4A",
    gradient: ["#FF9F0A", "#FF6B00", "#FF375F"],
  },
  {
    key: "exchange", label: "Exchange", bg: "#B8860B",
    gradient: ["#30D158", "#00C7BE", "#34C759"],
  },
];

function ActionIcon({ actionKey }: { actionKey: string }) {
  if (actionKey === "airtime") return <Feather name="phone" size={22} color="#FFFFFF" />;
  if (actionKey === "bank") return <BankIcon color="#FFFFFF" />;
  if (actionKey === "pay") return <PayIcon color="#FFFFFF" />;
  if (actionKey === "exchange") return <ExchangeIcon color="#FFFFFF" />;
  return null;
}

interface QuickActionsProps {
  onAction?: (key: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      {ACTIONS.map((a) => (
        <TouchableOpacity
          key={a.key}
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction?.(a.key);
          }}
        >
          <LinearGradient
            colors={a.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            <View style={[styles.iconBox, { backgroundColor: a.bg }]}>
              <ActionIcon actionKey={a.key} />
            </View>
          </LinearGradient>
          <Text style={styles.label}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },
  item: {
    alignItems: "center",
    gap: 8,
  },
  gradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#1A3B2F",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
