import React, { useState } from "react";
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
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";

const NAVY = "#0A1628";
const NAVY2 = "#0F1E36";
const NAVY3 = "#162440";
const GOLD = "#C9A84C";
const MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, color = GOLD, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[s.rowIcon, { backgroundColor: (danger ? "#EF4444" : color) + "22" }]}>
        <Feather
          name={icon as any}
          size={18}
          color={danger ? "#EF4444" : color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: "#EF4444" }]}>{label}</Text>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
      </View>
      {onPress && !danger && (
        <Feather name="chevron-right" size={16} color={MUTED} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { customerName, phone, balanceUGX, signOut } = useAuth();
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;

  const initials = customerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You will need to enter your phone number and PIN again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  const handleChangePIN = () => {
    Alert.alert(
      "Change PIN",
      "To change your PIN, sign out and go through the setup flow again.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <View style={[s.headerBar, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.profileName}>{customerName || "User"}</Text>
          <Text style={s.profilePhone}>{phone}</Text>
          <View style={s.balancePill}>
            <Text style={s.balancePillText}>
              UGX {balanceUGX.toLocaleString()} wallet balance
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.section}>
          <SettingRow
            icon="user"
            label="Full Name"
            value={customerName || "—"}
            color={GOLD}
          />
          <View style={s.sep} />
          <SettingRow
            icon="phone"
            label="Phone Number"
            value={phone}
            color="#54A0FF"
          />
          <View style={s.sep} />
          <SettingRow
            icon="shield"
            label="KYC Status"
            value="Verified via Relworx"
            color="#22C55E"
          />
        </View>

        <Text style={s.sectionTitle}>Security</Text>
        <View style={s.section}>
          <SettingRow
            icon="lock"
            label="Change PIN"
            color={GOLD}
            onPress={handleChangePIN}
          />
          <View style={s.sep} />
          <SettingRow
            icon="bell"
            label="Push Notifications"
            color="#C084FC"
            onPress={() => router.push("/notifications")}
          />
        </View>

        <Text style={s.sectionTitle}>Support</Text>
        <View style={s.section}>
          <SettingRow
            icon="help-circle"
            label="Help & FAQ"
            color="#F59E0B"
            onPress={() => Alert.alert("Help", "Support: support@livra.com")}
          />
          <View style={s.sep} />
          <SettingRow
            icon="info"
            label="App Version"
            value="1.0.0"
            color={MUTED}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY3,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },

  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: NAVY2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: NAVY,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  profileName: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  profilePhone: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  balancePill: {
    backgroundColor: GOLD + "22",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: GOLD + "44",
  },
  balancePillText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  sectionTitle: {
    color: MUTED,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  section: {
    marginHorizontal: 20,
    backgroundColor: NAVY2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rowValue: {
    color: MUTED,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  sep: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 64,
  },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
