import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const DATA_IN = [120000, 340000, 180000, 450000, 230000, 209891];
const DATA_OUT = [80000, 200000, 140000, 310000, 180000, 156000];

const MAX_VAL = Math.max(...DATA_IN, ...DATA_OUT);

function Bar({ value, color, maxVal }: { value: number; color: string; maxVal: number }) {
  const height = Math.max(8, (value / maxVal) * 120);
  return (
    <View style={{ width: 16, height: 120, justifyContent: "flex-end" }}>
      <View style={{ height, backgroundColor: color, borderRadius: 8 }} />
    </View>
  );
}

const PERIODS = ["1W", "1M", "3M", "6M", "1Y"];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;
  const [period, setPeriod] = useState("6M");

  const totalIn = DATA_IN.reduce((a, b) => a + b, 0);
  const totalOut = DATA_OUT.reduce((a, b) => a + b, 0);
  const net = totalIn - totalOut;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Analytics</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#1A3B2F" }]}>
          <Text style={styles.summaryCardLabel}>Total Income</Text>
          <Text style={styles.summaryCardValue}>₦{totalIn.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#FDECEA" }]}>
          <Text style={[styles.summaryCardLabel, { color: "#C0392B" }]}>Total Spent</Text>
          <Text style={[styles.summaryCardValue, { color: "#C0392B" }]}>₦{totalOut.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.netCard}>
        <Text style={styles.netLabel}>Net Savings</Text>
        <Text style={styles.netValue}>₦{net.toLocaleString()}</Text>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Income vs Expenses</Text>
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.chart}>
          {MONTHS.map((m, i) => (
            <View key={m} style={styles.barGroup}>
              <Bar value={DATA_IN[i]} color="#22A861" maxVal={MAX_VAL} />
              <Bar value={DATA_OUT[i]} color="#1A3B2F" maxVal={MAX_VAL} />
              <Text style={styles.monthLabel}>{m}</Text>
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#22A861" }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#1A3B2F" }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7F5" },
  content: { paddingHorizontal: 20 },
  pageTitle: {
    color: "#1A3B2F",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  summaryCardLabel: {
    color: "#22A861",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  summaryCardValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  netCard: {
    backgroundColor: "#E8F5E0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  netLabel: {
    color: "#1A6B4A",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  netValue: {
    color: "#1A3B2F",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    color: "#1A3B2F",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: "row",
    gap: 6,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#F0F4F0",
  },
  periodBtnActive: {
    backgroundColor: "#1A3B2F",
  },
  periodText: {
    color: "#8FA88F",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  periodTextActive: {
    color: "#22A861",
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  barGroup: {
    alignItems: "center",
    gap: 4,
  },
  monthLabel: {
    color: "#8FA88F",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  legend: {
    flexDirection: "row",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: "#1A3B2F",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
