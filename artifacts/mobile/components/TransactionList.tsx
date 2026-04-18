import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: string;
  date: string;
  iconLetter: string;
  iconBg: string;
  iconColor: string;
  isDebit: boolean;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    title: "Spotify Subscription",
    description: "You recently paid for spotify 1 month subscription",
    amount: "$100.00",
    date: "10th April, 2025",
    iconLetter: "S",
    iconBg: "#1DB954",
    iconColor: "#FFFFFF",
    isDebit: true,
  },
  {
    id: "2",
    title: "Online Purchase",
    description: "Bought a new domain and hosting from GoDaddy",
    amount: "$120.50",
    date: "April 17, 2026",
    iconLetter: "G",
    iconBg: "#00A859",
    iconColor: "#FFFFFF",
    isDebit: true,
  },
  {
    id: "3",
    title: "Mobile Top-Up",
    description: "Recharged MTN line for Mama",
    amount: "₦5,000.00",
    date: "April 16, 2026",
    iconLetter: "M",
    iconBg: "#FFCC00",
    iconColor: "#1A3B2F",
    isDebit: true,
  },
  {
    id: "4",
    title: "Salary Payment",
    description: "Monthly salary from Acme Corp",
    amount: "₦450,000.00",
    date: "April 1, 2026",
    iconLetter: "A",
    iconBg: "#1A3B2F",
    iconColor: "#22A861",
    isDebit: false,
  },
  {
    id: "5",
    title: "Netflix Subscription",
    description: "Monthly Netflix plan payment",
    amount: "$18.00",
    date: "March 30, 2026",
    iconLetter: "N",
    iconBg: "#E50914",
    iconColor: "#FFFFFF",
    isDebit: true,
  },
];

interface TransactionListProps {
  onSeeAll?: () => void;
}

export function TransactionList({ onSeeAll }: TransactionListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.8}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {TRANSACTIONS.map((tx, i) => (
        <View key={tx.id} style={[styles.item, i < TRANSACTIONS.length - 1 && styles.itemBorder]}>
          <View style={[styles.iconCircle, { backgroundColor: tx.iconBg }]}>
            <Text style={[styles.iconLetter, { color: tx.iconColor }]}>{tx.iconLetter}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
            <Text style={styles.txDesc} numberOfLines={2}>{tx.description}</Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: tx.isDebit ? "#1A3B2F" : "#1A9A5F" }]}>
              {tx.isDebit ? "" : "+"}{tx.amount}
            </Text>
            <Text style={styles.date}>{tx.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    color: "#1A3B2F",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  seeAll: {
    color: "#1A9A5F",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F0",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconLetter: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
  },
  txTitle: {
    color: "#1A3B2F",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  txDesc: {
    color: "#8FA88F",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  right: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  amount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  date: {
    color: "#8FA88F",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
