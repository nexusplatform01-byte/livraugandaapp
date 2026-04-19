import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { AppTabBar } from "@/components/AppTabBar";

const ROUTE_TO_TAB: Record<string, string> = {
  index: "home",
  wallet: "wallet",
  analytics: "analytics",
  card: "card",
};

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
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state }) => {
        const activeRoute = state.routes[state.index]?.name ?? "";
        const activeTab = ROUTE_TO_TAB[activeRoute] ?? "";
        return <AppTabBar activeTab={activeTab} />;
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="send" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="card" />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
