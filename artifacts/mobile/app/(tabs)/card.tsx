import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

function VirtualCard({ hidden }: { hidden: boolean }) {
  return (
    <View style={styles.virtualCard}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardBankName}>FinWallet</Text>
        <Feather name="wifi" size={22} color="rgba(198,241,53,0.7)" style={{ transform: [{ rotate: "90deg" }] }} />
      </View>
      <Text style={styles.cardNumber}>
        {hidden ? "•••• •••• •••• ••••" : "4521  8834  6712  9043"}
      </Text>
      <View style={styles.cardBottomRow}>
        <View>
          <Text style={styles.cardSmallLabel}>Card Holder</Text>
          <Text style={styles.cardSmallValue}>Darlington O.</Text>
        </View>
        <View>
          <Text style={styles.cardSmallLabel}>Expires</Text>
          <Text style={styles.cardSmallValue}>04/28</Text>
        </View>
        <View style={styles.visaLogo}>
          <Text style={styles.visaText}>VISA</Text>
        </View>
      </View>
    </View>
  );
}

const CARD_ACTIONS = [
  { key: "freeze", label: "Freeze Card", icon: "pause-circle" as const, color: "#1A6B4A" },
  { key: "limit", label: "Set Limit", icon: "sliders" as const, color: "#8B5CF6" },
  { key: "block", label: "Block Card", icon: "slash" as const, color: "#C0392B" },
  { key: "replace", label: "Replace", icon: "refresh-cw" as const, color: "#B8860B" },
];

export default function CardScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;
  const [hidden, setHidden] = useState(true);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>My Card</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setHidden((h) => !h);
          }}
          activeOpacity={0.8}
          style={styles.eyeBtn}
        >
          <Feather name={hidden ? "eye" : "eye-off"} size={18} color="#1A3B2F" />
        </TouchableOpacity>
      </View>

      <VirtualCard hidden={hidden} />

      <View style={styles.actionsGrid}>
        {CARD_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(a.label, `${a.label} feature coming soon`);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
              <Feather name={a.icon} size={20} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.spendingCard}>
        <Text style={styles.spendingTitle}>Card Spending Limit</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: "62%" }]} />
        </View>
        <View style={styles.spendingRow}>
          <Text style={styles.spendingUsed}>₦62,000 used</Text>
          <Text style={styles.spendingTotal}>₦100,000 limit</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7F5" },
  content: { paddingHorizontal: 20 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pageTitle: {
    color: "#1A3B2F",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  eyeBtn: {
    padding: 8,
    backgroundColor: "#E8F5E0",
    borderRadius: 20,
  },
  virtualCard: {
    backgroundColor: "#1A3B2F",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    minHeight: 180,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardBankName: {
    color: "#C6F135",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardSmallLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  cardSmallValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  visaLogo: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  visaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontStyle: "italic",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    gap: 10,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "#1A3B2F",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  spendingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  spendingTitle: {
    color: "#1A3B2F",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 14,
  },
  progressBg: {
    height: 8,
    backgroundColor: "#E0E8E0",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#C6F135",
    borderRadius: 4,
  },
  spendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  spendingUsed: {
    color: "#1A3B2F",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  spendingTotal: {
    color: "#8FA88F",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
