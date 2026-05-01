import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
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
const LIME  = "#C6F135";
const GREEN = "#22C55E";
const RED   = "#EF4444";
const MUTED = "rgba(255,255,255,0.45)";

type Period = "7D" | "1M" | "3M" | "6M" | "1Y";

const PERIODS: { label: Period; days: number }[] = [
  { label: "7D",  days: 7   },
  { label: "1M",  days: 30  },
  { label: "3M",  days: 90  },
  { label: "6M",  days: 180 },
  { label: "1Y",  days: 365 },
];

function fmt(n: number) {
  return "UGX " + Math.abs(n).toLocaleString("en-UG", { minimumFractionDigits: 0 });
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000)    return "Just now";
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-UG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function toDate(ts: any): Date | null {
  if (!ts) return null;
  try { return ts.toDate ? ts.toDate() : new Date(ts); } catch { return null; }
}

function buildMonthlyData(txs: FsTx[], buckets: number) {
  const months: Record<string, { inflow: number; outflow: number }> = {};
  const now = new Date();
  for (let i = buckets - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-UG", { month: "short" });
    months[key] = { inflow: 0, outflow: 0 };
  }
  txs.forEach((tx) => {
    const d = toDate(tx.createdAt);
    if (!d) return;
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < buckets) {
      const key = d.toLocaleString("en-UG", { month: "short" });
      if (months[key]) {
        if (tx.amount > 0) months[key].inflow += tx.amount;
        else months[key].outflow += Math.abs(tx.amount);
      }
    }
  });
  return months;
}

function buildWeeklyData(txs: FsTx[]) {
  const days: Record<string, { inflow: number; outflow: number }> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toLocaleString("en-UG", { weekday: "short" });
    days[key] = { inflow: 0, outflow: 0 };
  }
  txs.forEach((tx) => {
    const d = toDate(tx.createdAt);
    if (!d) return;
    const key = d.toLocaleString("en-UG", { weekday: "short" });
    if (days[key]) {
      if (tx.amount > 0) days[key].inflow += tx.amount;
      else days[key].outflow += Math.abs(tx.amount);
    }
  });
  return days;
}

function buildCategories(txs: FsTx[]) {
  const colorMap: Record<string, string> = {
    "Airtime":   "#FF9F43",
    "Utilities": "#5F27CD",
    "Savings":   "#54A0FF",
    "Transfer":  "#22C55E",
    "Bank":      "#BF5AF2",
    "Other":     LIME,
  };
  const iconMap: Record<string, string> = {
    "Airtime":   "phone",
    "Utilities": "zap",
    "Savings":   "layers",
    "Transfer":  "send",
    "Bank":      "credit-card",
    "Other":     "circle",
  };
  const cats: Record<string, { amount: number; color: string; icon: string }> = {};
  txs.filter((tx) => tx.amount < 0).forEach((tx) => {
    const cat = tx.category || "Other";
    if (!cats[cat]) cats[cat] = { amount: 0, color: colorMap[cat] || LIME, icon: iconMap[cat] || "circle" };
    cats[cat].amount += Math.abs(tx.amount);
  });
  const total = Object.values(cats).reduce((s, c) => s + c.amount, 0);
  return Object.entries(cats)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([label, v]) => ({ label, ...v, pct: total > 0 ? Math.round((v.amount / total) * 100) : 0 }));
}

export default function AnalyticsScreen() {
  const { phone }   = useAuth();
  const insets      = useSafeAreaInsets();
  const topPad      = Platform.OS === "web" ? 67 : insets.top;

  const [allTxs, setAllTxs]   = useState<FsTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<Period>("1M");
  const [activeBar, setActiveBar] = useState<number>(-1);

  useFocusEffect(
    useCallback(() => {
      if (!phone) return;
      setLoading(true);
      getTransactions(phone, 500).then((data) => {
        setAllTxs(data);
        setLoading(false);
      });
    }, [phone])
  );

  const { txs, cutoff } = useMemo(() => {
    const days = PERIODS.find((p) => p.label === period)?.days ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = allTxs.filter((tx) => {
      const d = toDate(tx.createdAt);
      return d && d >= cutoff;
    });
    return { txs: filtered, cutoff };
  }, [allTxs, period]);

  const totalIn  = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount,  0);
  const totalOut = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net      = totalIn - totalOut;
  const netPct   = totalIn > 0 ? Math.round((net / totalIn) * 100) : 0;

  const chartData   = period === "7D" ? buildWeeklyData(txs)   : buildMonthlyData(txs, period === "1M" ? 4 : period === "3M" ? 3 : period === "6M" ? 6 : 12);
  const chartLabels = Object.keys(chartData);
  const maxVal      = Math.max(...Object.values(chartData).map((m) => Math.max(m.inflow, m.outflow)), 1);
  const categories  = buildCategories(txs);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Analytics</Text>
        <View style={s.txCountPill}>
          <Text style={s.txCountText}>{txs.length} txns</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {PERIODS.map((p) => {
          const active = p.label === period;
          return (
            <TouchableOpacity
              key={p.label}
              onPress={() => { setPeriod(p.label); setActiveBar(-1); }}
              style={[s.filterChip, active && s.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={LIME} />
          <Text style={{ color: MUTED, marginTop: 10, fontFamily: "Inter_400Regular" }}>
            Loading your data...
          </Text>
        </View>
      ) : allTxs.length === 0 ? (
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
          {txs.length === 0 && (
            <View style={[s.emptyCard, { marginBottom: 14 }]}>
              <Text style={{ color: MUTED, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>
                No transactions in the selected period.
              </Text>
            </View>
          )}

          <View style={s.statsRow}>
            <LinearGradient colors={["#22503E", NAVY]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.statIconWrap}>
                <Feather name="arrow-down-left" size={14} color={LIME} />
              </View>
              <Text style={s.statLabel}>Income</Text>
              <Text style={s.statValue}>{fmtShort(totalIn)}</Text>
            </LinearGradient>

            <LinearGradient colors={["#3D1A1A", "#1A0A0A"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[s.statIconWrap, { backgroundColor: "rgba(239,68,68,0.18)" }]}>
                <Feather name="arrow-up-right" size={14} color={RED} />
              </View>
              <Text style={[s.statLabel, { color: RED }]}>Spent</Text>
              <Text style={[s.statValue, { color: RED }]}>{fmtShort(totalOut)}</Text>
            </LinearGradient>

            <LinearGradient colors={["#22503E", "#0A1C12"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[s.statIconWrap, { backgroundColor: "rgba(198,241,53,0.15)" }]}>
                <Feather name={net >= 0 ? "trending-up" : "trending-down"} size={14} color={net >= 0 ? LIME : RED} />
              </View>
              <Text style={[s.statLabel, { color: LIME }]}>Net</Text>
              <Text style={[s.statValue, { color: net >= 0 ? LIME : RED }]}>{netPct}%</Text>
            </LinearGradient>
          </View>

          <View style={s.chartCard}>
            <View style={s.chartHeaderRow}>
              <Text style={s.chartTitle}>
                {period === "7D" ? "Daily Flow" : period === "1Y" ? "Yearly Flow" : "Monthly Flow"}
              </Text>
              <Text style={s.chartSubtitle}>
                {period === "7D" ? "Last 7 days" : period === "1M" ? "Last 30 days" : period === "3M" ? "Last 3 months" : period === "6M" ? "Last 6 months" : "Last 12 months"}
              </Text>
            </View>
            <View style={s.chart}>
              {chartLabels.map((m, i) => {
                const d    = chartData[m];
                const inH  = Math.max(6, (d.inflow  / maxVal) * 100);
                const outH = Math.max(6, (d.outflow / maxVal) * 100);
                const active = activeBar === i;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setActiveBar(active ? -1 : i)}
                    activeOpacity={0.8}
                    style={[s.barCol, { flex: 1 }]}
                  >
                    {active && <View style={s.barHighlight} />}
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 100 }}>
                      <View style={{ width: 9, height: inH,  backgroundColor: active ? LIME : LIME + "55", borderRadius: 5 }} />
                      <View style={{ width: 9, height: outH, backgroundColor: active ? RED  : RED  + "44", borderRadius: 5 }} />
                    </View>
                    <Text style={[s.monthLabel, active && { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {activeBar >= 0 && chartLabels[activeBar] && (
              <View style={s.barDetail}>
                <Text style={s.barDetailLabel}>{chartLabels[activeBar]}</Text>
                <Text style={[s.barDetailValue, { color: LIME }]}>+{fmt(chartData[chartLabels[activeBar]].inflow)}</Text>
                <Text style={[s.barDetailValue, { color: RED }]}>-{fmt(chartData[chartLabels[activeBar]].outflow)}</Text>
              </View>
            )}
            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: LIME }]} />
                <Text style={s.legendText}>Income</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: RED }]} />
                <Text style={s.legendText}>Expenses</Text>
              </View>
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
              <Text style={s.sectionTitle}>Transactions</Text>
              <Text style={s.txCount}>{txs.length} total</Text>
            </View>
            {txs.slice(0, 20).map((tx, i) => {
              const isCredit = tx.amount > 0;
              return (
                <View
                  key={tx.id || i}
                  style={[
                    s.txRow,
                    i < Math.min(txs.length, 20) - 1 && { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
                  ]}
                >
                  <View style={[s.txIcon, { backgroundColor: (tx.color || LIME) + "22" }]}>
                    <Feather name={(tx.icon as any) || "circle"} size={16} color={tx.color || LIME} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txName} numberOfLines={1}>{tx.description}</Text>
                    <Text style={s.txCat}>{tx.category} · {formatTimestamp(tx.createdAt)}</Text>
                  </View>
                  <Text style={[s.txAmt, { color: isCredit ? GREEN : "rgba(255,255,255,0.85)" }]}>
                    {isCredit ? "+" : "-"}{fmt(tx.amount)}
                  </Text>
                </View>
              );
            })}
            {txs.length > 20 && (
              <Text style={{ color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingTop: 12 }}>
                + {txs.length - 20} more transactions
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: NAVY },
  content: { paddingHorizontal: 18 },

  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  pageTitle:    { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold" },
  txCountPill:  { backgroundColor: LIME + "22", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: LIME + "44" },
  txCountText:  { color: LIME, fontSize: 11, fontFamily: "Inter_600SemiBold" },

  filterRow:          { flexDirection: "row", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: NAVY3, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  filterChipActive:   { backgroundColor: LIME, borderColor: LIME },
  filterChipText:     { color: MUTED, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filterChipTextActive: { color: NAVY },

  emptyCard:   { backgroundColor: NAVY2, borderRadius: 20, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },

  statsRow:     { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:     { flex: 1, borderRadius: 16, padding: 12, gap: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  statIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(198,241,53,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statLabel:    { color: MUTED, fontSize: 10, fontFamily: "Inter_500Medium" },
  statValue:    { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold" },

  chartCard:     { backgroundColor: NAVY2, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  chartHeaderRow:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartTitle:    { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  chartSubtitle: { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },
  chart:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, position: "relative" },
  barCol:        { alignItems: "center", gap: 6, position: "relative" },
  barHighlight:  { position: "absolute", top: -6, left: 0, right: 0, bottom: -6, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10 },
  monthLabel:    { color: MUTED, fontSize: 9, fontFamily: "Inter_400Regular" },
  barDetail:     { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, marginBottom: 10, flexDirection: "row", gap: 12, alignItems: "center" },
  barDetailLabel:{ color: "#FFF", fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  barDetailValue:{ fontSize: 11, fontFamily: "Inter_500Medium" },
  legend:        { flexDirection: "row", alignItems: "center", gap: 14 },
  legendItem:    { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendText:    { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },

  section:      { backgroundColor: NAVY2, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  sectionTitle: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txHeaderRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  txCount:      { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },
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
