import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/authContext";
import { getTransactions, type FsTx } from "@/lib/firestore";

const NAVY  = "#1A3B2F";
const NAVY2 = "#243D30";
const NAVY3 = "#22503E";
const GOLD  = "#C9A84C";
const GREEN = "#22C55E";
const RED   = "#EF4444";
const MUTED = "rgba(255,255,255,0.45)";

function fmt(n: number) {
  return "UGX " + Math.abs(n).toLocaleString("en-UG", { minimumFractionDigits: 0 });
}

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

function buildMonthlyData(txs: FsTx[]) {
  const months: Record<string, { inflow: number; outflow: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-UG", { month: "short" });
    months[key] = { inflow: 0, outflow: 0 };
  }
  txs.forEach((tx) => {
    if (!tx.createdAt) return;
    try {
      const d = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt as any);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthsAgo >= 0 && monthsAgo < 6) {
        const key = d.toLocaleString("en-UG", { month: "short" });
        if (months[key]) {
          if (tx.amount > 0) months[key].inflow += tx.amount;
          else months[key].outflow += Math.abs(tx.amount);
        }
      }
    } catch {}
  });
  return months;
}

function buildCategories(txs: FsTx[]) {
  const cats: Record<string, { amount: number; color: string; icon: string }> = {};
  const colorMap: Record<string, string> = {
    "Airtime":   "#FF9F43",
    "Utilities": "#5F27CD",
    "Savings":   "#54A0FF",
    "Transfer":  "#22C55E",
    "Bank":      "#BF5AF2",
    "Other":     GOLD,
  };
  const iconMap: Record<string, string> = {
    "Airtime":   "phone",
    "Utilities": "zap",
    "Savings":   "layers",
    "Transfer":  "send",
    "Bank":      "credit-card",
    "Other":     "circle",
  };
  txs.filter((tx) => tx.amount < 0).forEach((tx) => {
    const cat = tx.category || "Other";
    if (!cats[cat]) cats[cat] = { amount: 0, color: colorMap[cat] || GOLD, icon: iconMap[cat] || "circle" };
    cats[cat].amount += Math.abs(tx.amount);
  });
  const total = Object.values(cats).reduce((s, c) => s + c.amount, 0);
  return Object.entries(cats)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([label, v]) => ({ label, ...v, pct: total > 0 ? Math.round((v.amount / total) * 100) : 0 }));
}

export default function AnalyticsScreen() {
  const { phone } = useAuth();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;

  const [txs, setTxs]         = useState<FsTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBar, setActiveBar] = useState(5);

  useFocusEffect(
    useCallback(() => {
      if (!phone) return;
      setLoading(true);
      getTransactions(phone, 100).then((data) => {
        setTxs(data);
        setLoading(false);
      });
    }, [phone])
  );

  const totalIn  = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net      = totalIn - totalOut;
  const savingsPct = totalIn > 0 ? Math.round((net / totalIn) * 100) : 0;

  const monthlyData = buildMonthlyData(txs);
  const monthLabels = Object.keys(monthlyData);
  const maxVal      = Math.max(
    ...Object.values(monthlyData).map((m) => Math.max(m.inflow, m.outflow)),
    1
  );
  const categories  = buildCategories(txs);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Analytics</Text>
        <View style={s.filterBtn}>
          <Feather name="sliders" size={16} color={GOLD} />
        </View>
      </View>

      {loading ? (
        <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={GOLD} />
          <Text style={{ color: MUTED, marginTop: 10, fontFamily: "Inter_400Regular" }}>
            Loading your data...
          </Text>
        </View>
      ) : txs.length === 0 ? (
        <View style={s.emptyCard}>
          <Feather name="bar-chart-2" size={40} color={MUTED} />
          <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 12 }}>
            No transactions yet
          </Text>
          <Text style={{ color: MUTED, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 6 }}>
            Make a payment or fund your wallet to see analytics here.
          </Text>
        </View>
      ) : (
        <>
          <View style={s.statsRow}>
            <LinearGradient colors={["#22503E", "#1A3B2F"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.statIconWrap}>
                <Feather name="arrow-down-left" size={14} color={GOLD} />
              </View>
              <Text style={s.statLabel}>Income</Text>
              <Text style={s.statValue}>
                {totalIn >= 1000000 ? `UGX ${(totalIn / 1000000).toFixed(1)}M` : `UGX ${(totalIn / 1000).toFixed(0)}K`}
              </Text>
            </LinearGradient>

            <LinearGradient colors={["#2D1515", "#1A0A0A"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[s.statIconWrap, { backgroundColor: "rgba(239,68,68,0.18)" }]}>
                <Feather name="arrow-up-right" size={14} color={RED} />
              </View>
              <Text style={[s.statLabel, { color: RED }]}>Spent</Text>
              <Text style={[s.statValue, { color: RED }]}>
                {totalOut >= 1000000 ? `UGX ${(totalOut / 1000000).toFixed(1)}M` : `UGX ${(totalOut / 1000).toFixed(0)}K`}
              </Text>
            </LinearGradient>

            <LinearGradient colors={["#22503E", "#0A1C12"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[s.statIconWrap, { backgroundColor: "rgba(201,168,76,0.15)" }]}>
                <Feather name="trending-up" size={14} color={GOLD} />
              </View>
              <Text style={[s.statLabel, { color: GOLD }]}>Net</Text>
              <Text style={[s.statValue, { color: net >= 0 ? GOLD : RED }]}>
                {savingsPct}%
              </Text>
            </LinearGradient>
          </View>

          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Monthly Flow</Text>
            <View style={s.chart}>
              {monthLabels.map((m, i) => {
                const d = monthlyData[m];
                const inH  = Math.max(6, (d.inflow  / maxVal) * 100);
                const outH = Math.max(6, (d.outflow / maxVal) * 100);
                const active = activeBar === i;
                return (
                  <TouchableOpacity key={m} onPress={() => setActiveBar(i)} activeOpacity={0.8} style={s.barCol}>
                    {active && <View style={s.barHighlight} />}
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 100 }}>
                      <View style={{ width: 10, height: inH,  backgroundColor: active ? GOLD : GOLD + "50", borderRadius: 5 }} />
                      <View style={{ width: 10, height: outH, backgroundColor: active ? RED  : RED + "40",  borderRadius: 5 }} />
                    </View>
                    <Text style={[s.monthLabel, active && { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: GOLD }]} />
                <Text style={s.legendText}>Income</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: RED }]} />
                <Text style={s.legendText}>Expenses</Text>
              </View>
              {activeBar >= 0 && monthLabels[activeBar] && (
                <Text style={s.activeMonthText}>
                  {monthLabels[activeBar]}: +{fmt(monthlyData[monthLabels[activeBar]].inflow)} / -{fmt(monthlyData[monthLabels[activeBar]].outflow)}
                </Text>
              )}
            </View>
          </View>

          {categories.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Top Spending</Text>
              {categories.map((cat) => (
                <View key={cat.label} style={s.catRow}>
                  <View style={[s.catIcon, { backgroundColor: cat.color + "22" }]}>
                    <Feather name={cat.icon as any} size={15} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.catTopRow}>
                      <Text style={s.catLabel}>{cat.label}</Text>
                      <Text style={[s.catAmt, { color: cat.color }]}>{fmt(cat.amount)}</Text>
                    </View>
                    <View style={s.catBarBg}>
                      <View style={[s.catBarFill, { width: `${cat.pct}%` as any, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                  <Text style={s.catPct}>{cat.pct}%</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.section}>
            <View style={s.txHeaderRow}>
              <Text style={s.sectionTitle}>All Transactions</Text>
            </View>
            {txs.slice(0, 15).map((tx, i) => {
              const isCredit = tx.amount > 0;
              return (
                <View key={tx.id || i} style={[s.txRow, i < Math.min(txs.length, 15) - 1 && { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }]}>
                  <View style={[s.txIcon, { backgroundColor: (tx.color || GOLD) + "22" }]}>
                    <Feather name={(tx.icon as any) || "circle"} size={16} color={tx.color || GOLD} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txName} numberOfLines={1}>{tx.description}</Text>
                    <Text style={s.txCat}>{formatTimestamp(tx.createdAt)}</Text>
                  </View>
                  <Text style={[s.txAmt, { color: isCredit ? GREEN : "rgba(255,255,255,0.85)" }]}>
                    {isCredit ? "+" : "-"}{fmt(tx.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: NAVY },
  content: { paddingHorizontal: 18 },

  headerRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  pageTitle:   { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold" },
  filterBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: NAVY3, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },

  emptyCard: { backgroundColor: NAVY2, borderRadius: 20, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },

  statsRow:  { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:  { flex: 1, borderRadius: 16, padding: 12, gap: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  statIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statLabel: { color: MUTED, fontSize: 10, fontFamily: "Inter_500Medium" },
  statValue: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold" },

  chartCard:   { backgroundColor: NAVY2, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  chartTitle:  { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  chart:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, position: "relative" },
  barCol:      { alignItems: "center", gap: 6, position: "relative", flex: 1 },
  barHighlight:{ position: "absolute", top: -6, left: 0, right: 0, bottom: -6, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10 },
  monthLabel:  { color: MUTED, fontSize: 9, fontFamily: "Inter_400Regular" },
  legend:      { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },
  activeMonthText: { color: GOLD, fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 4 },

  section:      { backgroundColor: NAVY2, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  sectionTitle: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  txHeaderRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  txRow:        { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  txIcon:       { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txName:       { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_500Medium" },
  txCat:        { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmt:        { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  catRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  catIcon:   { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  catLabel:  { color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: "Inter_500Medium" },
  catAmt:    { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  catBarBg:  { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" },
  catBarFill:{ height: 4, borderRadius: 3 },
  catPct:    { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", width: 28, textAlign: "right" },
});
