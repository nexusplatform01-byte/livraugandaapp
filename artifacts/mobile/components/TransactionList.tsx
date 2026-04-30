import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { relworxApi, type TransactionRecord } from "@/lib/relworx";
import { getUserRefPrefix } from "@/lib/userSession";

interface TransactionListProps {
  onSeeAll?: () => void;
  /** If true, show all pages instead of just the recent slice. */
  fullList?: boolean;
}

interface DisplayTx {
  id: string;
  title: string;
  description: string;
  amount: string;
  date: string;
  iconLetter: string;
  iconBg: string;
  iconColor: string;
  isDebit: boolean;
}

function statusColor(s: string) {
  const v = s.toLowerCase();
  if (v === "success") return { bg: "#1A9A5F", color: "#FFFFFF" };
  if (v === "failed")  return { bg: "#E04A4A", color: "#FFFFFF" };
  return { bg: "#FFCC00", color: "#1A3B2F" };
}

function describe(tx: TransactionRecord): { title: string; description: string; isDebit: boolean } {
  const isDebit = (tx.transaction_type ?? "").toLowerCase() !== "collection";
  const ref = tx.customer_reference ?? "";
  const provider = tx.provider ? tx.provider.replace(/_/g, " ") : (tx.transaction_method ?? "Mobile Money");
  let title = isDebit ? "Sent / Paid" : "Received";
  if (ref.startsWith("FW-")) {
    if (ref.includes("-")) title = isDebit ? "Mobile Money Transfer" : "Wallet Top-Up";
  }
  const description = `${provider}${tx.msisdn ? ` · ${tx.msisdn}` : ""}`;
  return { title, description, isDebit };
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-UG", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function transformAll(records: TransactionRecord[]): DisplayTx[] {
  return records.map((tx, i) => {
    const { title, description, isDebit } = describe(tx);
    const sc = statusColor(tx.status);
    const letter = (description.trim().charAt(0) || "T").toUpperCase();
    const amount = `${tx.currency ?? "UGX"} ${Number(tx.amount).toLocaleString()}`;
    return {
      id: tx.customer_reference || String(i),
      title,
      description,
      amount,
      date: formatDate(tx.created_at),
      iconLetter: letter,
      iconBg: sc.bg,
      iconColor: sc.color,
      isDebit,
    };
  });
}

export function TransactionList({ onSeeAll, fullList = false }: TransactionListProps) {
  const [items, setItems]     = useState<DisplayTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const prefix = await getUserRefPrefix();
        const collected: TransactionRecord[] = [];
        const maxPages = fullList ? 12 : 6;
        const target   = fullList ? 200 : 8;
        for (let page = 1; page <= maxPages; page++) {
          const res = await relworxApi.transactions(page);
          for (const t of res.transactions ?? []) {
            if ((t.customer_reference ?? "").startsWith(prefix)) collected.push(t);
          }
          if (collected.length >= target) break;
          if (!res.next_page) break;
        }
        if (!cancelled) {
          setItems(transformAll(collected).slice(0, fullList ? 200 : 8));
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Couldn't load transactions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fullList]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.8}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading && (
        <View style={{ padding: 28, alignItems: "center" }}>
          <ActivityIndicator color="#1A3B2F" />
          <Text style={{ marginTop: 8, color: "#8FA88F", fontSize: 12, fontFamily: "Inter_400Regular" }}>
            Loading your transactions…
          </Text>
        </View>
      )}
      {!loading && err && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#7A1A1A", fontFamily: "Inter_500Medium", fontSize: 12 }}>{err}</Text>
        </View>
      )}
      {!loading && !err && items.length === 0 && (
        <View style={{ padding: 24, alignItems: "center", gap: 6 }}>
          <Feather name="inbox" size={28} color="#8FA88F" />
          <Text style={{ color: "#8FA88F", fontSize: 13, fontFamily: "Inter_500Medium" }}>
            No transactions yet.
          </Text>
          <Text style={{ color: "#A8B8A8", fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" }}>
            Top-ups, payments and transfers you make will show up here.
          </Text>
        </View>
      )}
      {!loading && !err && items.map((tx, i) => (
        <View key={tx.id} style={[styles.item, i < items.length - 1 && styles.itemBorder]}>
          <View style={[styles.iconCircle, { backgroundColor: tx.iconBg }]}>
            <Text style={[styles.iconLetter, { color: tx.iconColor }]}>{tx.iconLetter}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
            <Text style={styles.txDesc} numberOfLines={2}>{tx.description}</Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: tx.isDebit ? "#1A3B2F" : "#1A9A5F" }]}>
              {tx.isDebit ? "-" : "+"}{tx.amount}
            </Text>
            <Text style={styles.date}>{tx.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingBottom: 20 },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 20, paddingBottom: 12 },
  title:      { color: "#1A3B2F", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  seeAll:     { color: "#1A9A5F", fontSize: 13, fontFamily: "Inter_500Medium" },
  item:       { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, gap: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F4F0" },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconLetter: { fontSize: 16, fontFamily: "Inter_700Bold" },
  info:       { flex: 1 },
  txTitle:    { color: "#1A3B2F", fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  txDesc:     { color: "#8FA88F", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  right:      { alignItems: "flex-end", flexShrink: 0 },
  amount:     { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  date:       { color: "#8FA88F", fontSize: 11, fontFamily: "Inter_400Regular" },
});
