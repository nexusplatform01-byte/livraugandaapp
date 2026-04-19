import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BankIcon } from "@/components/QuickActionIcons";

const DARK_GREEN = "#1A3B2F";
const LIME = "#C6F135";
const BG = "#F2F4F2";

interface SendOption {
  key: string;
  title: string;
  subtitle: string;
  gradient: readonly [string, string, ...string[]];
  badge?: string;
}

const OPTIONS: SendOption[] = [
  {
    key: "mobile",
    title: "Mobile Money",
    subtitle: "Send directly to any mobile money wallet",
    gradient: ["#007AFF", "#5AC8FA"],
    badge: "Instant",
  },
  {
    key: "livra",
    title: "Livra User",
    subtitle: "Transfer to another Livra user with zero fees",
    gradient: ["#30D158", "#34C759"],
    badge: "Free",
  },
  {
    key: "bank",
    title: "Bank Transfer",
    subtitle: "Transfer to any local or international bank account",
    gradient: ["#BF5AF2", "#FF2D55"],
  },
  {
    key: "online",
    title: "Online Payment",
    subtitle: "Pay merchants, bills, and online services",
    gradient: ["#FF9F0A", "#FF375F"],
  },
];

function OptionIcon({ optKey }: { optKey: string }) {
  if (optKey === "mobile")
    return <Feather name="smartphone" size={24} color="#FFFFFF" />;
  if (optKey === "livra")
    return <Feather name="zap" size={24} color="#FFFFFF" />;
  if (optKey === "bank")
    return <BankIcon color="#FFFFFF" />;
  if (optKey === "online")
    return <Feather name="globe" size={24} color="#FFFFFF" />;
  return null;
}

export default function SendMoneyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={20} color={DARK_GREEN} />
        </TouchableOpacity>
        <Text style={styles.title}>Send Money</Text>
        <Text style={styles.subtitle}>Choose how you'd like to send</Text>
      </View>

      {/* Balance chip */}
      <View style={styles.balanceChip}>
        <Feather name="credit-card" size={14} color={DARK_GREEN} />
        <Text style={styles.balanceChipText}>Available: </Text>
        <Text style={styles.balanceChipAmount}>₦209,891.21</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.82}
            style={styles.card}
            onPress={() => Alert.alert(opt.title, `${opt.title} feature coming soon`)}
          >
            {/* Left: gradient icon */}
            <LinearGradient
              colors={opt.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <OptionIcon optKey={opt.key} />
            </LinearGradient>

            {/* Middle: text */}
            <View style={styles.cardText}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{opt.title}</Text>
                {opt.badge && (
                  <View style={[
                    styles.badge,
                    { backgroundColor: opt.key === "livra" ? "#E8FAE8" : "#EAF4FF" },
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: opt.key === "livra" ? "#1A7A30" : "#007AFF" },
                    ]}>
                      {opt.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
            </View>

            {/* Right: arrow */}
            <View style={styles.arrowBox}>
              <Feather name="chevron-right" size={18} color="#B0BDB0" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent recipients */}
        <Text style={styles.sectionTitle}>Recent Recipients</Text>
        {[
          { name: "Adaeze Okonkwo", tag: "@adaeze", initial: "A", color: "#BF5AF2" },
          { name: "Emeka Chukwu",  tag: "@emeka",  initial: "E", color: "#007AFF" },
          { name: "Fatima Musa",   tag: "@fatima", initial: "F", color: "#FF9F0A" },
        ].map((r) => (
          <TouchableOpacity
            key={r.tag}
            style={styles.recipient}
            activeOpacity={0.8}
            onPress={() => Alert.alert("Send to " + r.name, "Feature coming soon")}
          >
            <View style={[styles.avatar, { backgroundColor: r.color }]}>
              <Text style={styles.avatarText}>{r.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recipientName}>{r.name}</Text>
              <Text style={styles.recipientTag}>{r.tag}</Text>
            </View>
            <TouchableOpacity
              style={styles.sendAgainBtn}
              onPress={() => Alert.alert("Send to " + r.name, "Feature coming soon")}
            >
              <Text style={styles.sendAgainText}>Send</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D0D5D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: DARK_GREEN,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6B7B6E",
  },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: "#DFFCE8",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  balanceChipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: DARK_GREEN,
  },
  balanceChipAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: DARK_GREEN,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1A1A1A",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  cardSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8A9E8A",
    lineHeight: 17,
  },
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F7F5",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1A1A1A",
    marginTop: 10,
    marginBottom: 2,
  },
  recipient: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  recipientName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A1A1A",
  },
  recipientTag: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8A9E8A",
  },
  sendAgainBtn: {
    backgroundColor: DARK_GREEN,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  sendAgainText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: LIME,
  },
});
