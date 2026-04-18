import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface Action {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
}

const ACTIONS: Action[] = [
  { key: "receive", label: "Receive", icon: "download", color: "#FFFFFF", bg: "#1A3B2F" },
  { key: "request", label: "Request", icon: "file-text", color: "#FFFFFF", bg: "#C0392B" },
  { key: "exchange", label: "Exchange", icon: "repeat", color: "#FFFFFF", bg: "#1A6B4A" },
  { key: "withdraw", label: "Withdraw", icon: "monitor", color: "#FFFFFF", bg: "#B8860B" },
];

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
          <View style={[styles.iconBox, { backgroundColor: a.bg }]}>
            <Feather name={a.icon} size={22} color={a.color} />
          </View>
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
