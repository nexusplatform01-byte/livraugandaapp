import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BankIcon } from "@/components/QuickActionIcons";

const DARK_GREEN = "#1A3B2F";
const LIME = "#C6F135";
const BG = "#F2F4F2";

type SendType = "mobile" | "livra" | "bank" | "online" | null;

const OPTIONS = [
  { key: "mobile" as SendType, label: "Mobile Money", gradient: ["#007AFF", "#5AC8FA"] as const },
  { key: "livra"  as SendType, label: "Livra User",   gradient: ["#30D158", "#00C7BE"] as const },
  { key: "bank"   as SendType, label: "Bank",         gradient: ["#BF5AF2", "#FF2D55"] as const },
  { key: "online" as SendType, label: "Online",       gradient: ["#FF9F0A", "#FF375F"] as const },
];

function OptionIcon({ k }: { k: SendType }) {
  if (k === "mobile") return <Feather name="smartphone" size={22} color="#FFF" />;
  if (k === "livra")  return <Feather name="zap"        size={22} color="#FFF" />;
  if (k === "bank")   return <BankIcon color="#FFF" />;
  if (k === "online") return <Feather name="globe"      size={22} color="#FFF" />;
  return null;
}

const NETWORKS = ["MTN", "Airtel", "Glo", "9Mobile"];
const BANKS    = ["Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA"];

function Field({ label, placeholder, keyboardType = "default", value, onChangeText }: {
  label: string; placeholder: string;
  keyboardType?: "default" | "phone-pad" | "numeric";
  value: string; onChangeText: (t: string) => void;
}) {
  return (
    <View style={fs.wrap}>
      <Text style={fs.label}>{label}</Text>
      <TextInput
        style={fs.input} placeholder={placeholder} placeholderTextColor="#A0B0A0"
        keyboardType={keyboardType} value={value} onChangeText={onChangeText}
      />
    </View>
  );
}

function ChipRow({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {items.map((n) => (
          <TouchableOpacity key={n} style={[fs.chip, selected === n && fs.chipActive]} onPress={() => onSelect(n)}>
            <Text style={[fs.chipText, selected === n && fs.chipTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function FormFields({ type }: { type: SendType }) {
  const [phone, setPhone]     = useState("");
  const [network, setNetwork] = useState("");
  const [bank, setBank]       = useState("");
  const [accNum, setAccNum]   = useState("");
  const [tag, setTag]         = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount]   = useState("");
  const [note, setNote]       = useState("");

  if (!type) return null;
  return (
    <View style={styles.formCard}>
      {type === "mobile" && <>
        <Field label="Phone Number" placeholder="0801 234 5678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Text style={fs.label}>Network</Text>
        <ChipRow items={NETWORKS} selected={network} onSelect={setNetwork} />
      </>}
      {type === "livra" && <Field label="Livra Username" placeholder="@username" value={tag} onChangeText={setTag} />}
      {type === "bank" && <>
        <Text style={fs.label}>Bank</Text>
        <ChipRow items={BANKS} selected={bank} onSelect={setBank} />
        <Field label="Account Number" placeholder="10-digit number" keyboardType="numeric" value={accNum} onChangeText={setAccNum} />
      </>}
      {type === "online" && <Field label="Merchant" placeholder="e.g. Amazon, Paystack" value={merchant} onChangeText={setMerchant} />}
      <Field label="Amount (₦)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <Field label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />
    </View>
  );
}

export default function SendMoneyScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<SendType>(null);
  const label = OPTIONS.find((o) => o.key === selected)?.label ?? "";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>

        {/* Back button only — no heading */}
        <TouchableOpacity style={[styles.backBtn, { marginHorizontal: 16, marginBottom: 12 }]} onPress={() => router.back()}>
          <Feather name="chevron-left" size={20} color={DARK_GREEN} />
        </TouchableOpacity>

        {/* 2×2 compact grid */}
        <View style={styles.grid}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key!}
                style={[styles.cell, active && styles.cellActive]}
                activeOpacity={0.82}
                onPress={() => setSelected(active ? null : opt.key)}
              >
                {active && (
                  <View style={styles.check}>
                    <Feather name="check" size={10} color="#FFF" />
                  </View>
                )}
                <LinearGradient colors={opt.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cellIcon}>
                  <OptionIcon k={opt.key} />
                </LinearGradient>
                <Text style={[styles.cellLabel, active && styles.cellLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic form — scrollable only if needed */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormFields type={selected} />
        </ScrollView>

        {/* Confirm button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, !selected && styles.confirmBtnOff]}
            activeOpacity={selected ? 0.85 : 1}
            onPress={() => selected && Alert.alert("Confirm", `Confirm ${label} transfer?`)}
          >
            <Text style={[styles.confirmText, !selected && styles.confirmTextOff]}>
              {selected ? `Confirm ${label}` : "Select a method to continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#D0D5D0",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFF",
  },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 10, paddingHorizontal: 16, marginBottom: 12,
  },
  cell: {
    width: "47.5%", backgroundColor: "#FFF",
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 14,
    alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cellActive: { borderColor: DARK_GREEN, backgroundColor: "#F0FAF3" },
  check: {
    position: "absolute", top: 9, right: 9,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: DARK_GREEN,
    alignItems: "center", justifyContent: "center",
  },
  cellIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  cellLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#555" },
  cellLabelActive: { color: DARK_GREEN },
  formScroll: { flex: 1 },
  formCard: {
    backgroundColor: "#FFF", borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 10, backgroundColor: BG,
  },
  confirmBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  confirmBtnOff: { backgroundColor: "#C8D8C8" },
  confirmText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: LIME },
  confirmTextOff: { color: "#8AA88A" },
});

const fs = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontFamily: "Inter_500Medium", fontSize: 11, color: "#6B7B6E",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: "#F2F4F2", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Inter_400Regular", fontSize: 14, color: "#1A1A1A",
    borderWidth: 1, borderColor: "#E0E8E0",
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#D0D8D0", backgroundColor: "#FFF",
  },
  chipActive: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
  chipTextActive: { color: "#FFF" },
});
