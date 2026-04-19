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

interface Option {
  key: SendType;
  label: string;
  gradient: readonly [string, string, ...string[]];
}

const OPTIONS: Option[] = [
  { key: "mobile", label: "Mobile Money", gradient: ["#007AFF", "#5AC8FA"] },
  { key: "livra",  label: "Livra User",   gradient: ["#30D158", "#00C7BE"] },
  { key: "bank",   label: "Bank",         gradient: ["#BF5AF2", "#FF2D55"] },
  { key: "online", label: "Online",       gradient: ["#FF9F0A", "#FF375F"] },
];

function OptionIcon({ k }: { k: SendType }) {
  if (k === "mobile") return <Feather name="smartphone" size={26} color="#FFF" />;
  if (k === "livra")  return <Feather name="zap"        size={26} color="#FFF" />;
  if (k === "bank")   return <BankIcon color="#FFF" />;
  if (k === "online") return <Feather name="globe"      size={26} color="#FFF" />;
  return null;
}

function Field({
  label, placeholder, keyboardType = "default", value, onChangeText,
}: {
  label: string;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "numeric" | "email-address";
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        placeholder={placeholder}
        placeholderTextColor="#A0B0A0"
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const NETWORKS = ["MTN", "Airtel", "Glo", "9Mobile"];
const BANKS    = ["Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA", "Stanbic IBTC"];

function NetworkPicker({ selected, onSelect }: { selected: string; onSelect: (n: string) => void }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>Network</Text>
      <View style={fieldStyles.chipRow}>
        {NETWORKS.map((n) => (
          <TouchableOpacity
            key={n}
            style={[fieldStyles.chip, selected === n && fieldStyles.chipActive]}
            onPress={() => onSelect(n)}
          >
            <Text style={[fieldStyles.chipText, selected === n && fieldStyles.chipTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function BankPicker({ selected, onSelect }: { selected: string; onSelect: (b: string) => void }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>Bank</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {BANKS.map((b) => (
            <TouchableOpacity
              key={b}
              style={[fieldStyles.chip, selected === b && fieldStyles.chipActive]}
              onPress={() => onSelect(b)}
            >
              <Text style={[fieldStyles.chipText, selected === b && fieldStyles.chipTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FormSection({ type }: { type: SendType }) {
  const [phone, setPhone]   = useState("");
  const [network, setNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [tag, setTag]       = useState("");
  const [bank, setBank]     = useState("");
  const [accNum, setAccNum] = useState("");
  const [merchant, setMerchant] = useState("");
  const [ref, setRef]       = useState("");

  if (!type) return null;

  return (
    <View style={styles.formCard}>
      {type === "mobile" && (
        <>
          <Field label="Phone Number" placeholder="e.g. 0801 234 5678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <NetworkPicker selected={network} onSelect={setNetwork} />
          <Field label="Amount (₦)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Field label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />
        </>
      )}

      {type === "livra" && (
        <>
          <Field label="Livra Username" placeholder="@username" value={tag} onChangeText={setTag} />
          <Field label="Amount (₦)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Field label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />
        </>
      )}

      {type === "bank" && (
        <>
          <BankPicker selected={bank} onSelect={setBank} />
          <Field label="Account Number" placeholder="10-digit account number" keyboardType="numeric" value={accNum} onChangeText={setAccNum} />
          <Field label="Amount (₦)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Field label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />
        </>
      )}

      {type === "online" && (
        <>
          <Field label="Merchant / Website" placeholder="e.g. Amazon, Paystack" value={merchant} onChangeText={setMerchant} />
          <Field label="Amount (₦)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Field label="Reference" placeholder="Order / invoice reference" value={ref} onChangeText={setRef} />
          <Field label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />
        </>
      )}
    </View>
  );
}

export default function SendMoneyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const [selected, setSelected] = useState<SendType>(null);

  const label = OPTIONS.find((o) => o.key === selected)?.label ?? "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { paddingTop: topPad }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color={DARK_GREEN} />
          </TouchableOpacity>
          <Text style={styles.title}>Send Money</Text>
          <Text style={styles.subtitle}>Select a transfer method</Text>
        </View>

        {/* Balance pill */}
        <View style={styles.balancePill}>
          <Feather name="credit-card" size={13} color={DARK_GREEN} />
          <Text style={styles.balancePillText}>Available: </Text>
          <Text style={styles.balancePillAmount}>₦209,891.21</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        >
          {/* 2×2 Grid */}
          <View style={styles.grid}>
            {OPTIONS.map((opt) => {
              const active = selected === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key!}
                  style={[styles.gridCell, active && styles.gridCellActive]}
                  activeOpacity={0.82}
                  onPress={() => setSelected(active ? null : opt.key)}
                >
                  {active && (
                    <View style={styles.checkBadge}>
                      <Feather name="check" size={11} color="#FFF" />
                    </View>
                  )}
                  <LinearGradient
                    colors={opt.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gridIcon, active && styles.gridIconActive]}
                  >
                    <OptionIcon k={opt.key} />
                  </LinearGradient>
                  <Text style={[styles.gridLabel, active && styles.gridLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic form */}
          <FormSection type={selected} />
        </ScrollView>

        {/* Confirm button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
            activeOpacity={selected ? 0.85 : 1}
            onPress={() =>
              selected
                ? Alert.alert("Confirm", `Confirm ${label} transfer?`)
                : null
            }
          >
            <Text style={[styles.confirmText, !selected && styles.confirmTextDisabled]}>
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
  header: { paddingHorizontal: 20, paddingBottom: 4, paddingTop: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#D0D5D0",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14, backgroundColor: "#FFF",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: DARK_GREEN, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#6B7B6E" },
  balancePill: {
    flexDirection: "row", alignItems: "center",
    alignSelf: "flex-start",
    marginHorizontal: 20, marginTop: 10, marginBottom: 16,
    backgroundColor: "#DFFCE8", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 5,
  },
  balancePillText: { fontFamily: "Inter_400Regular", fontSize: 13, color: DARK_GREEN },
  balancePillAmount: { fontFamily: "Inter_700Bold", fontSize: 13, color: DARK_GREEN },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  gridCell: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  gridCellActive: {
    borderColor: DARK_GREEN,
    backgroundColor: "#F0FAF3",
  },
  checkBadge: {
    position: "absolute",
    top: 10, right: 10,
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: DARK_GREEN,
    alignItems: "center", justifyContent: "center",
  },
  gridIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
  },
  gridIconActive: {
    shadowColor: DARK_GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gridLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14, color: "#444", textAlign: "center",
  },
  gridLabelActive: { color: DARK_GREEN },

  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: BG,
  },
  confirmBtn: {
    backgroundColor: DARK_GREEN,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: "#C8D8C8" },
  confirmText: {
    fontFamily: "Inter_600SemiBold", fontSize: 16, color: LIME,
  },
  confirmTextDisabled: { color: "#8AA88A" },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontFamily: "Inter_500Medium", fontSize: 12,
    color: "#6B7B6E", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F2F4F2",
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: "Inter_400Regular", fontSize: 15,
    color: "#1A1A1A",
    borderWidth: 1, borderColor: "#E0E8E0",
  },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#D0D8D0",
    backgroundColor: "#FFF",
  },
  chipActive: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: DARK_GREEN },
  chipTextActive: { color: "#FFF" },
});
