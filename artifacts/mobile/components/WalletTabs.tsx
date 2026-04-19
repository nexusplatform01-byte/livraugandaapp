import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const CURRENCIES = ["UGX", "USD", "EUR"];

interface WalletTabsProps {
  selected: string;
  onSelect: (c: string) => void;
  onAdd?: () => void;
}

export function WalletTabs({ selected, onSelect, onAdd }: WalletTabsProps) {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Text style={styles.label}>Your Wallet</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {CURRENCIES.map((c) => {
            const active = c === selected;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(c);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.addTab} onPress={onAdd} activeOpacity={0.8}>
            <Feather name="plus-circle" size={14} color="#1A3B2F" />
            <Text style={styles.addText}>Add Wallet</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: "#1A3B2F",
    paddingBottom: 0,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  label: {
    color: "#1A3B2F",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tab: {
    borderWidth: 1.5,
    borderColor: "#C8D8C8",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  tabActive: {
    backgroundColor: "#22A861",
    borderColor: "#22A861",
  },
  tabText: {
    color: "#4A6A4A",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  tabTextActive: {
    color: "#1A3B2F",
    fontFamily: "Inter_600SemiBold",
  },
  addTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "#C8D8C8",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  addText: {
    color: "#1A3B2F",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
