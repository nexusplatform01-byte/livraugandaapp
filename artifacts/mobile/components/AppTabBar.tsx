import React from "react";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";

const TAB_BG = "#1A3B2F";
const LIME = "#C6F135";
const INACTIVE = "rgba(255,255,255,0.55)";
const NOTCH_R = 42;

function TabBtn({
  icon, label, active, onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const color = active ? LIME : INACTIVE;
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress} activeOpacity={0.7}>
      <Feather name={icon} size={21} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AppTabBar({ activeTab = "" }: { activeTab?: string }) {
  const insets = useSafeAreaInsets();
  const width = Dimensions.get("window").width;
  const tabH = 65;
  const totalH = tabH + (Platform.OS === "web" ? 0 : insets.bottom);
  const cx = width / 2;

  const d = [
    `M 0,0`,
    `L ${cx - NOTCH_R},0`,
    `A ${NOTCH_R},${NOTCH_R},0,0,1,${cx + NOTCH_R},0`,
    `L ${width},0`,
    `L ${width},${totalH}`,
    `L 0,${totalH}`,
    `Z`,
  ].join(" ");

  return (
    <View style={{ height: totalH }}>
      <Svg width={width} height={totalH} style={StyleSheet.absoluteFill}>
        <Path d={d} fill={TAB_BG} />
      </Svg>

      <View style={[styles.row, { overflow: "visible" }]}>
        <TabBtn icon="home"        label="Home"      active={activeTab === "home"}      onPress={() => router.replace("/")}          />
        <TabBtn icon="credit-card" label="Wallet"    active={activeTab === "wallet"}    onPress={() => router.replace("/wallet")}    />

        {/* Center notch gap with floating Send button */}
        <View style={[styles.centerGap, { overflow: "visible" }]}>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => router.push("/send-money")}
            activeOpacity={0.85}
          >
            <Feather name="send" size={21} color={TAB_BG} />
          </TouchableOpacity>
        </View>

        <TabBtn icon="bar-chart-2" label="Analytics" active={activeTab === "analytics"} onPress={() => router.replace("/analytics")} />
        <TabBtn icon="layers"      label="Card"      active={activeTab === "card"}      onPress={() => router.replace("/card")}      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    height: 65,
    alignItems: "center",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  centerGap: {
    width: NOTCH_R * 2 + 8,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  sendBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: -22,
  },
});
