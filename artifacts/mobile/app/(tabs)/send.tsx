import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const RECENT_CONTACTS = [
  { id: "1", name: "Chidi Okeke", initial: "C", color: "#1A3B2F" },
  { id: "2", name: "Amaka Eze", initial: "A", color: "#C0392B" },
  { id: "3", name: "Bolu Adeyemi", initial: "B", color: "#1A6B4A" },
  { id: "4", name: "Funke Ajayi", initial: "F", color: "#8B5CF6" },
];

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleSend = () => {
    if (!amount || !recipient) {
      Alert.alert("Error", "Please enter amount and recipient");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", `Sending ₦${amount} to ${recipient}`);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Send Money</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Amount</Text>
        <View style={styles.amountBox}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#B0C4B0"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recipient</Text>
        <View style={styles.inputRow}>
          <Feather name="search" size={18} color="#8FA88F" style={styles.searchIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Name, account number, or tag"
            placeholderTextColor="#B0C4B0"
            value={recipient}
            onChangeText={setRecipient}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recent</Text>
        <View style={styles.contactsRow}>
          {RECENT_CONTACTS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.contact}
              activeOpacity={0.8}
              onPress={() => setRecipient(c.name)}
            >
              <View style={[styles.contactAvatar, { backgroundColor: c.color }]}>
                <Text style={styles.contactInitial}>{c.initial}</Text>
              </View>
              <Text style={styles.contactName} numberOfLines={1}>{c.name.split(" ")[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
        <Text style={styles.sendBtnText}>Send Money</Text>
        <Feather name="arrow-right" size={20} color="#1A3B2F" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7F5" },
  content: { paddingHorizontal: 20 },
  pageTitle: {
    color: "#1A3B2F",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
  },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: "#1A3B2F",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#22A861",
  },
  currencySymbol: {
    color: "#1A3B2F",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: "#1A3B2F",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E0E8E0",
  },
  searchIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    color: "#1A3B2F",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 14,
  },
  contactsRow: {
    flexDirection: "row",
    gap: 16,
  },
  contact: { alignItems: "center", gap: 6 },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  contactName: {
    color: "#1A3B2F",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    maxWidth: 52,
    textAlign: "center",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#22A861",
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 8,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
