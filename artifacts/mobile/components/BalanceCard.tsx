import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface BalanceCardProps {
  balance: number;
  currency?: string;
  onFund?: () => void;
  onSend?: () => void;
}

export function BalanceCard({ balance, currency = "UGX ", onFund, onSend }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);


  const formatted = balance.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHidden((h) => !h);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Wallet Balance</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balance}>
          {hidden ? `${currency}••••••••` : `${currency}${formatted}`}
        </Text>
        <TouchableOpacity onPress={toggle} style={styles.eyeBtn} activeOpacity={0.7}>
          <Feather name={hidden ? "eye-off" : "eye"} size={20} color="#C6F135" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onFund} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Fund</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onSend} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  label: {
    color: "#C6F135",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  eyeBtn: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: "#C6F135",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 44,
  },
  primaryBtnText: {
    color: "#1A3B2F",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
