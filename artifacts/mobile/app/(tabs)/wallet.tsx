import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

interface WalletCardProps {
  currency: string;
  symbol: string;
  balance: number;
  flag: string;
}

function WalletCard({ currency, symbol, balance, flag }: WalletCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flagRow}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.currency}>{currency}</Text>
        </View>
        <Feather name="more-horizontal" size={20} color="#8FA88F" />
      </View>
      <Text style={styles.cardBalance}>
        {symbol}{balance.toLocaleString("en", { minimumFractionDigits: 2 })}
      </Text>
      <Text style={styles.cardLabel}>Available Balance</Text>
    </View>
  );
}

const WALLETS = [
  { currency: "NGN", symbol: "₦", balance: 209891.21, flag: "🇳🇬" },
  { currency: "USD", symbol: "$", balance: 128.43, flag: "🇺🇸" },
  { currency: "EUR", symbol: "€", balance: 119.87, flag: "🇪🇺" },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>My Wallets</Text>
      {WALLETS.map((w) => (
        <WalletCard key={w.currency} {...w} />
      ))}
      <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
        <Feather name="plus" size={20} color="#1A3B2F" />
        <Text style={styles.addBtnText}>Add New Wallet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F7F5",
  },
  content: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    color: "#1A3B2F",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1A3B2F",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flag: {
    fontSize: 22,
  },
  currency: {
    color: "#C6F135",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardBalance: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  cardLabel: {
    color: "#8FA88F",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C6F135",
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 8,
  },
  addBtnText: {
    color: "#1A3B2F",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
