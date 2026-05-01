import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";
import { HomeIcon, SendIcon, LoanIcon, AnalyticsIcon, SavingsIcon } from "@/components/TabIcons";

const TAB_BG   = "#1A3B2F";
const ACTIVE   = "#C6F135";
const INACTIVE = "rgba(255,255,255,0.45)";
const NOTCH_R  = 42;

function NotchedBackground({ height }: { height: number }) {
  const width = Dimensions.get("window").width;
  const cx = width / 2;
  const d = [
    `M 0,0`,
    `L ${cx - NOTCH_R},0`,
    `A ${NOTCH_R},${NOTCH_R},0,0,1,${cx + NOTCH_R},0`,
    `L ${width},0`,
    `L ${width},${height}`,
    `L 0,${height}`,
    `Z`,
  ].join(" ");

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path d={d} fill={TAB_BG} />
    </Svg>
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
        <Icon sf={{ default: "banknote", selected: "banknote.fill" }} />
        <Label>Loan</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="send">
        <Icon sf={{ default: "paperplane", selected: "paperplane.fill" }} />
        <Label>Send</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analytics">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Analytics</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="savings">
        <Icon sf={{ default: "banknote", selected: "banknote.fill" }} />
        <Label>Savings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="receive" style={{ display: "none" }}>
        <Label>Receive</Label>
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
        tabBarBackground: () => <NotchedBackground height={tabHeight} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={23} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Loan",
          tabBarIcon: ({ color }) => <LoanIcon color={color} size={23} />,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={sendOuterStyle}>
              <View style={sendBtnStyle}>
                <SendIcon color={TAB_BG} size={22} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <AnalyticsIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: "Savings",
          tabBarIcon: ({ color }) => <SavingsIcon color={color} size={23} />,
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="buy"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="pay"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="bank"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const sendOuterStyle = {
  width: 76,
  height: 76,
  borderRadius: 38,
  backgroundColor: "#1A3B2F",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginBottom: 20,
};

const sendBtnStyle = {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: ACTIVE,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  shadowColor: "#C6F135",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.4,
  shadowRadius: 8,
  elevation: 6,
};

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
