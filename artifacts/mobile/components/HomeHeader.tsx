import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface HomeHeaderProps {
  name: string;
  avatarSource?: any;
  onBellPress?: () => void;
}

export function HomeHeader({ name, avatarSource, onBellPress }: HomeHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatarWrapper}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.accentGreen, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: colors.headerBg, fontWeight: "700", fontSize: 16 }}>
                {name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.helloText}>Hello,</Text>
          <Text style={styles.nameText}>{name}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bellButton} onPress={onBellPress} activeOpacity={0.8}>
        <Feather name="bell" size={20} color="#22A861" />
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
  },
  avatarWrapper: {
    borderRadius: 22,
    overflow: "hidden",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  helloText: {
    color: "#A8C4A8",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(198,241,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
