import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  const TAB_BG = "#1A3B2F";
  const ACTIVE = "#C6F135";
  const INACTIVE = "rgba(255,255,255,0.5)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: TAB_BG,
          borderTopWidth: 0,
          elevation: 0,
          height: isWeb ? 84 : 65 + insets.bottom,
          paddingBottom: isWeb ? 0 : insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          marginTop: -4,
        },
        tabBarBackground: () => null,
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
  width: 62,
  height: 62,
  borderRadius: 31,
  backgroundColor: "#F5F7F5",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginBottom: 14,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 6,
};

const sendBtnStyle = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#C6F135",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
