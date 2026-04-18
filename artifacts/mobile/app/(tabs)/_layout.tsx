import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BG = "#1A3B2F";
const ACTIVE = "#C6F135";
const INACTIVE = "rgba(255,255,255,0.55)";
const NOTCH_GAP = 80;
const NOTCH_RADIUS = 40;
const NOTCH_HEIGHT = 44;

function NotchedBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Top strip with arch cut out only at the top */}
      <View style={{ height: NOTCH_HEIGHT, flexDirection: "row" }}>
        <View style={{ flex: 1, backgroundColor: TAB_BG, borderTopRightRadius: NOTCH_RADIUS }} />
        <View style={{ width: NOTCH_GAP }} />
        <View style={{ flex: 1, backgroundColor: TAB_BG, borderTopLeftRadius: NOTCH_RADIUS }} />
      </View>
      {/* Bottom solid — no gap */}
      <View style={{ flex: 1, backgroundColor: TAB_BG }} />
    </View>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet">
        <Icon sf={{ default: "wallet.pass", selected: "wallet.pass.fill" }} />
        <Label>Wallet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="send">
        <Icon sf={{ default: "paperplane", selected: "paperplane.fill" }} />
        <Label>Send</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analytics">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Analytics</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="card">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Card</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const tabHeight = isWeb ? 84 : 65 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: tabHeight,
          paddingBottom: isWeb ? 0 : insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          marginTop: -4,
        },
        tabBarBackground: () => <NotchedBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="wallet.pass" tintColor={color} size={22} />
            ) : (
              <Feather name="credit-card" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={sendOuterStyle}>
              <View style={sendBtnStyle}>
                <Feather name="navigation" size={22} color="#1A3B2F" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar" tintColor={color} size={22} />
            ) : (
              <Feather name="bar-chart-2" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: "Card",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="creditcard" tintColor={color} size={22} />
            ) : (
              <Feather name="credit-card" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const sendOuterStyle = {
  width: 76,
  height: 76,
  borderRadius: 38,
  backgroundColor: "#F5F7F5",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginBottom: 20,
};

const sendBtnStyle = {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#C6F135",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 5,
};

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
