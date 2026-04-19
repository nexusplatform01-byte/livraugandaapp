import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BalanceCard } from "@/components/BalanceCard";
import { HomeHeader } from "@/components/HomeHeader";
import { QuickActions } from "@/components/QuickActions";
import { TransactionList } from "@/components/TransactionList";
import { WalletTabs } from "@/components/WalletTabs";

const BALANCES: Record<string, number> = {
  NGN: 209891.21,
  USD: 128.43,
  EUR: 119.87,
};

export default function HomeScreen() {
  const [currency, setCurrency] = useState("NGN");
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const currencySymbol =
    currency === "NGN" ? "₦" : currency === "USD" ? "$" : "€";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <HomeHeader
          name="Darlington"
          avatarSource={require("@/assets/images/avatar.png")}
        />
        <BalanceCard
          balance={BALANCES[currency]}
          currency={currencySymbol}
          onFund={() => router.push("/receive")}
          onSend={() => router.push("/send-money")}
        />
        <WalletTabs
          selected={currency}
          onSelect={setCurrency}
          onAdd={() => Alert.alert("Add Wallet", "Add new wallet feature coming soon")}
        />
      </View>
      <QuickActions onAction={(k) => Alert.alert(k, `${k} feature coming soon`)} />
      <View style={styles.divider} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <TransactionList onSeeAll={() => Alert.alert("Transactions", "See all transactions")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F7F5",
  },
  header: {
    backgroundColor: "#1A3B2F",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    backgroundColor: "#FFFFFF",
  },
  divider: {
    height: 8,
    backgroundColor: "#F5F7F5",
  },
});
