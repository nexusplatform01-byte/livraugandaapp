import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { BalanceCard } from "@/components/BalanceCard";
import { HomeHeader } from "@/components/HomeHeader";
import { QuickActions } from "@/components/QuickActions";
import { WalletTabs } from "@/components/WalletTabs";
import { useAuth } from "@/lib/authContext";
import {
  getTransactions,
  getUnreadNotificationCount,
  type FsTx,
} from "@/lib/firestore";

const NAVY = "#1A3B2F";
const GOLD = "#C9A84C";

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-UG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function TxItem({ tx }: { tx: FsTx }) {
  const isCredit = tx.amount > 0;
  return (
    <View style={tStyles.row}>
      <View
        style={[tStyles.icon, { backgroundColor: (tx.color || "#888") + "22" }]}
      >
        <Feather
          name={(tx.icon as any) || "circle"}
          size={16}
          color={tx.color || "#888"}
        />
      </View>
      <View style={tStyles.info}>
        <Text style={tStyles.title} numberOfLines={1}>
          {tx.description}
        </Text>
        <Text style={tStyles.sub}>
          {tx.category} · {formatTimestamp(tx.createdAt)}
        </Text>
      </View>
      <Text style={[tStyles.amount, { color: isCredit ? "#22C55E" : "#1A3B2F" }]}>
        {isCredit ? "+" : "-"}UGX {Math.abs(tx.amount).toLocaleString()}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { customerName, balanceUGX, phone, refreshBalance } = useAuth();
  const [currency, setCurrency] = useState("UGX");
  const [txs, setTxs]           = useState<FsTx[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [unread, setUnread]     = useState(0);
  const insets = useSafeAreaInsets();

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const loadData = useCallback(async () => {
    if (!phone) return;
    setLoadingTxs(true);
    const [txData, unreadCount] = await Promise.all([
      getTransactions(phone, 10),
      getUnreadNotificationCount(phone),
    ]);
    setTxs(txData);
    setUnread(unreadCount);
    setLoadingTxs(false);
  }, [phone]);

  useFocusEffect(
    useCallback(() => {
      refreshBalance();
      loadData();
    }, [refreshBalance, loadData])
  );

  const displayBalance =
    currency === "UGX"
      ? balanceUGX
      : currency === "USD"
      ? balanceUGX / 3700
      : balanceUGX / 4000;

  const currencySymbol =
    currency === "UGX" ? "UGX " : currency === "USD" ? "$ " : "€ ";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <HomeHeader
          name={customerName || "User"}
          unreadCount={unread}
          onAvatarPress={() => router.push("/settings")}
          onBellPress={() => router.push("/notifications")}
        />
        <BalanceCard
          balance={displayBalance}
          currency={currencySymbol}
          onFund={() => router.push("/receive")}
          onSend={() => router.replace("/send")}
        />
        <WalletTabs
          selected={currency}
          onSelect={setCurrency}
          onAdd={() =>
            Alert.alert(
              "Multi-Currency",
              "Multi-currency wallets coming soon!"
            )
          }
        />
      </View>

      <QuickActions
        onAction={(k) => {
          if (k === "airtime") router.push("/buy");
          else if (k === "bank") router.push("/bank");
          else if (k === "pay") router.push("/pay");
          else Alert.alert(k, `${k} coming soon`);
        }}
      />

      <View style={styles.divider} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={loadData} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={15} color="#1A3B2F" />
          </TouchableOpacity>
        </View>

        {loadingTxs && (
          <View style={styles.emptyBox}>
            <ActivityIndicator color={NAVY} />
          </View>
        )}

        {!loadingTxs && txs.length === 0 && (
          <View style={styles.emptyBox}>
            <Feather name="inbox" size={32} color="#C0D0C0" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>
              Fund your wallet or make a payment to get started.
            </Text>
          </View>
        )}

        {!loadingTxs &&
          txs.map((tx, i) => (
            <View
              key={tx.id || i}
              style={i < txs.length - 1 ? styles.txBorder : undefined}
            >
              <TxItem tx={tx} />
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const tStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1 },
  title: {
    color: "#1A3B2F",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  sub: {
    color: "#8FA88F",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  amount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 0,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7F5" },
  header: { backgroundColor: NAVY },
  scroll: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { backgroundColor: "#FFFFFF" },
  divider: { height: 8, backgroundColor: "#F5F7F5" },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  txTitle: {
    color: "#1A3B2F",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBox: {
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    color: "#8FA88F",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubText: {
    color: "#A8B8A8",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  txBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F0",
  },
});
