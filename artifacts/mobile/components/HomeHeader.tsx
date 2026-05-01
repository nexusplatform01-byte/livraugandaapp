import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

const NAVY = "#0A1628";
const GOLD = "#C9A84C";

interface HomeHeaderProps {
  name: string;
  unreadCount?: number;
  onAvatarPress?: () => void;
  onBellPress?: () => void;
}

export function HomeHeader({
  name,
  unreadCount = 0,
  onAvatarPress,
  onBellPress,
}: HomeHeaderProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.left}
        onPress={onAvatarPress}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials || "?"}</Text>
        </View>
        <View>
          <Text style={styles.helloText}>Hello,</Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {name || "User"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bellButton}
        onPress={onBellPress}
        activeOpacity={0.8}
      >
        <Feather name="bell" size={20} color={GOLD} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(201,168,76,0.4)",
  },
  initials: {
    color: NAVY,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  helloText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 180,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 8,
    fontFamily: "Inter_700Bold",
  },
});
