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
}

const ACTIONS: Action[] = [
  { key: "airtime", label: "Airtime", bg: "#1A3B2F" },
  { key: "bank", label: "Bank", bg: "#C0392B" },
  { key: "pay", label: "Pay", bg: "#1A6B4A" },
  { key: "exchange", label: "Exchange", bg: "#B8860B" },
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
            colors={["#C6F135", "#22A861", "#1A3B2F"]}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
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
