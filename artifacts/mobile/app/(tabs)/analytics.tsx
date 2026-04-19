import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DG  = "#0D1F17";
const DG2 = "#152C1E";
const DG3 = "#1C3828";
const LIME = "#C6F135";
const GREEN = "#22A861";
const RED   = "#FF6B6B";
const MUTED = "rgba(255,255,255,0.45)";

const PERIODS = ["1W", "1M", "3M", "6M", "1Y"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const DATA_IN  = [120000, 340000, 180000, 450000, 230000, 209891];
const DATA_OUT = [80000,  200000, 140000, 310000, 180000, 156000];
const MAX_VAL  = Math.max(...DATA_IN, ...DATA_OUT);

const CATEGORIES = [
  { label: "Food & Drinks",  icon: "coffee",      amount: 42500,  color: "#FF9F43", pct: 27 },
  { label: "Transport",      icon: "navigation",  amount: 28000,  color: "#54A0FF", pct: 18 },
  { label: "Shopping",       icon: "shopping-bag",amount: 55000,  color: "#FF6B6B", pct: 35 },
  { label: "Utilities",      icon: "zap",         amount: 18000,  color: "#5F27CD", pct: 12 },
  { label: "Entertainment",  icon: "music",       amount: 12500,  color: LIME,      pct: 8  },
];

const TRANSACTIONS = [
  { id: "1", name: "Spotify Premium",    category: "Entertainment", amount: -4500,   icon: "music",       color: LIME,      date: "Today, 9:41 AM" },
  { id: "2", name: "Salary Credit",      category: "Income",        amount: 209891,  icon: "trending-up", color: GREEN,     date: "Today, 8:00 AM" },
  { id: "3", name: "Bolt Ride",          category: "Transport",     amount: -3200,   icon: "navigation",  color: "#54A0FF", date: "Yesterday" },
  { id: "4", name: "Shoprite",           category: "Shopping",      amount: -18500,  icon: "shopping-bag",color: "#FF6B6B", date: "Yesterday" },
  { id: "5", name: "IKEDC Electric",     category: "Utilities",     amount: -12000,  icon: "zap",         color: "#5F27CD", date: "Apr 17" },
  { id: "6", name: "Chicken Republic",   category: "Food & Drinks", amount: -5800,   icon: "coffee",      color: "#FF9F43", date: "Apr 17" },
  { id: "7", name: "Transfer from Taiwo",category: "Income",        amount: 50000,   icon: "arrow-down-left", color: GREEN, date: "Apr 16" },
  { id: "8", name: "Netflix",            category: "Entertainment", amount: -4200,   icon: "play-circle", color: "#E50914", date: "Apr 15" },
];

function fmt(n: number) {
  return "₦" + Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 });
}

function Bar({ inVal, outVal, maxVal, active }: { inVal: number; outVal: number; maxVal: number; active: boolean }) {
  const inH  = Math.max(6, (inVal  / maxVal) * 100);
  const outH = Math.max(6, (outVal / maxVal) * 100);
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 100 }}>
        <View style={{ width: 10, height: inH,  backgroundColor: active ? LIME  : "rgba(198,241,53,0.35)", borderRadius: 5 }} />
        <View style={{ width: 10, height: outH, backgroundColor: active ? RED   : "rgba(255,107,107,0.3)",  borderRadius: 5 }} />
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [period, setPeriod] = useState("6M");
  const [activeBar, setActiveBar] = useState(5);

  const totalIn  = DATA_IN.reduce((a, b)  => a + b, 0);
  const totalOut = DATA_OUT.reduce((a, b) => a + b, 0);
  const net = totalIn - totalOut;
  const savingsPct = Math.round((net / totalIn) * 100);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Analytics</Text>
        <TouchableOpacity style={s.filterBtn} activeOpacity={0.8}>
          <Feather name="sliders" size={16} color={LIME} />
        </TouchableOpacity>
      </View>

      {/* ── Top Stat Cards ── */}
      <View style={s.statsRow}>
        <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.statIconWrap}>
            <Feather name="arrow-down-left" size={14} color={LIME} />
          </View>
          <Text style={s.statLabel}>Income</Text>
          <Text style={s.statValue}>₦{(totalIn / 1000).toFixed(0)}K</Text>
          <Text style={s.statSub}>+12% vs last period</Text>
        </LinearGradient>

        <LinearGradient colors={["#3A1C1C", "#1F0D0D"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[s.statIconWrap, { backgroundColor: "rgba(255,107,107,0.18)" }]}>
            <Feather name="arrow-up-right" size={14} color={RED} />
          </View>
          <Text style={[s.statLabel, { color: RED }]}>Spent</Text>
          <Text style={[s.statValue, { color: RED }]}>₦{(totalOut / 1000).toFixed(0)}K</Text>
          <Text style={s.statSub}>-5% vs last period</Text>
        </LinearGradient>

        <LinearGradient colors={["#1E2B1A", "#101A0D"]} style={s.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[s.statIconWrap, { backgroundColor: "rgba(198,241,53,0.15)" }]}>
            <Feather name="trending-up" size={14} color={LIME} />
          </View>
          <Text style={[s.statLabel, { color: LIME }]}>Saved</Text>
          <Text style={[s.statValue, { color: LIME }]}>{savingsPct}%</Text>
          <Text style={s.statSub}>₦{(net / 1000).toFixed(0)}K net</Text>
        </LinearGradient>
      </View>

      {/* ── Chart Card ── */}
      <View style={s.chartCard}>
        <View style={s.chartHeaderRow}>
          <Text style={s.chartTitle}>Income vs Expenses</Text>
          <View style={s.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.periodBtn, period === p && s.periodBtnActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.8}
              >
                <Text style={[s.periodText, period === p && s.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bars */}
        <View style={s.chart}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity key={m} onPress={() => setActiveBar(i)} activeOpacity={0.8} style={s.barCol}>
              {activeBar === i && <View style={s.barHighlight} />}
              <Bar inVal={DATA_IN[i]} outVal={DATA_OUT[i]} maxVal={MAX_VAL} active={activeBar === i} />
              <Text style={[s.monthLabel, activeBar === i && { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Legend */}
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: LIME }]} />
            <Text style={s.legendText}>Income</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: RED }]} />
            <Text style={s.legendText}>Expenses</Text>
          </View>
          {activeBar >= 0 && (
            <Text style={s.activeMonthText}>
              {MONTHS[activeBar]}: ₦{(DATA_IN[activeBar]/1000).toFixed(0)}K / ₦{(DATA_OUT[activeBar]/1000).toFixed(0)}K
            </Text>
          )}
        </View>
      </View>

      {/* ── Spending Categories ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Top Spending</Text>
        {CATEGORIES.map((cat) => (
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

      {/* ── Transactions ── */}
      <View style={s.section}>
        <View style={s.txHeaderRow}>
          <Text style={s.sectionTitle}>Transactions</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={s.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={s.txRow}>
            <View style={[s.txIcon, { backgroundColor: tx.color + "22" }]}>
              <Feather name={tx.icon as any} size={16} color={tx.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txName}>{tx.name}</Text>
              <Text style={s.txCat}>{tx.date}</Text>
            </View>
            <Text style={[s.txAmt, { color: tx.amount > 0 ? GREEN : "rgba(255,255,255,0.85)" }]}>
              {tx.amount > 0 ? "+" : "-"}{fmt(tx.amount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: DG },
  content: { paddingHorizontal: 18 },

  headerRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  pageTitle:   { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold" },
  filterBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: DG3, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },

  statsRow:  { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:  { flex: 1, borderRadius: 16, padding: 12, gap: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  statIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(198,241,53,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statLabel: { color: MUTED, fontSize: 10, fontFamily: "Inter_500Medium" },
  statValue: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  statSub:   { color: MUTED, fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 2 },

  chartCard:      { backgroundColor: DG2, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  chartHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  chartTitle:     { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  periodRow:      { flexDirection: "row", gap: 4 },
  periodBtn:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: DG3 },
  periodBtnActive:{ backgroundColor: LIME },
  periodText:     { color: MUTED, fontSize: 10, fontFamily: "Inter_500Medium" },
  periodTextActive:{ color: DG },

  chart:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, position: "relative" },
  barCol:     { alignItems: "center", gap: 6, position: "relative", flex: 1 },
  barHighlight:{ position: "absolute", top: -6, left: 0, right: 0, bottom: -6, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10 },
  monthLabel: { color: MUTED, fontSize: 9, fontFamily: "Inter_400Regular" },

  legend:         { flexDirection: "row", alignItems: "center", gap: 14 },
  legendItem:     { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendText:     { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },
  activeMonthText:{ color: LIME, fontSize: 10, fontFamily: "Inter_500Medium", marginLeft: "auto" as any },

  section:      { backgroundColor: DG2, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  sectionTitle: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 14 },

  catRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  catIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catTopRow:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  catLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: "Inter_500Medium" },
  catAmt:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  catBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" },
  catBarFill:{ height: 4, borderRadius: 3 },
  catPct:   { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", width: 28, textAlign: "right" },

  txHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  seeAll:      { color: LIME, fontSize: 12, fontFamily: "Inter_500Medium" },
  txRow:       { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  txIcon:      { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txName:      { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_500Medium" },
  txCat:       { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmt:       { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
