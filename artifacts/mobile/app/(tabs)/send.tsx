import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { BankIcon } from "@/components/QuickActionIcons";
import { formatMsisdn, pollRequestStatus, relworxApi } from "@/lib/relworx";
import { ApiError } from "@/lib/api";
import { setUserPhone } from "@/lib/userSession";

const DARK_GREEN = "#1A3B2F";
const LIME = "#C6F135";
const BG = "#F2F4F2";

const LOCAL_BALANCE = 209891;

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

const NETWORKS = ["MTN", "Airtel"];
const BANKS    = ["Stanbic", "Centenary", "Equity", "DFCU", "KCB"];

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

const MOCK_LIVRA_USERS: Record<string, { name: string; initials: string; color: string }> = {
  "AC24561": { name: "Chidi Okeke",   initials: "CO", color: "#1A3B2F" },
  "BK19832": { name: "Amaka Eze",     initials: "AE", color: "#C0392B" },
  "ZT55021": { name: "Bolu Adeyemi",  initials: "BA", color: "#1A6B4A" },
};

function LivraField({
  onHideGlobalPayment,
}: {
  onHideGlobalPayment: (hide: boolean) => void;
}) {
  const [mode, setMode]           = useState<"enter" | "scan">("enter");
  const [account, setAccount]     = useState("");
  const [scanned, setScanned]     = useState(false);
  const [detectedUser, setDetectedUser] = useState<{ name: string; initials: string; color: string; account: string } | null>(null);
  const [scanAmount, setScanAmount] = useState("");
  const [scanNote, setScanNote]   = useState("");

  const handleModeSwitch = (m: "enter" | "scan") => {
    setMode(m);
    setScanned(false);
    setDetectedUser(null);
    onHideGlobalPayment(m === "scan");
  };

  const handleAccountChange = (text: string) => {
    const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (upper.length <= 7) setAccount(upper);
  };

  const isValid = /^[A-Z]{2}\d{5}$/.test(account);

  const handleScanTap = () => {
    const keys = Object.keys(MOCK_LIVRA_USERS);
    const key  = keys[Math.floor(Math.random() * keys.length)];
    const user = MOCK_LIVRA_USERS[key];
    setScanned(true);
    setDetectedUser({ ...user, account: key });
  };

  const handleRescan = () => {
    setScanned(false);
    setDetectedUser(null);
    setScanAmount("");
    setScanNote("");
  };

  return (
    <View style={fs.wrap}>
      <Text style={fs.label}>Livra Account</Text>

      <View style={fs.livraToggleRow}>
        <TouchableOpacity
          style={[fs.livraToggleBtn, mode === "enter" && fs.livraToggleActive]}
          onPress={() => handleModeSwitch("enter")}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={14} color={mode === "enter" ? "#FFF" : DARK_GREEN} />
          <Text style={[fs.livraToggleText, mode === "enter" && fs.livraToggleTextActive]}>Enter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[fs.livraToggleBtn, mode === "scan" && fs.livraToggleActive]}
          onPress={() => handleModeSwitch("scan")}
          activeOpacity={0.8}
        >
          <Feather name="camera" size={14} color={mode === "scan" ? "#FFF" : DARK_GREEN} />
          <Text style={[fs.livraToggleText, mode === "scan" && fs.livraToggleTextActive]}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {mode === "enter" && (
        <View>
          <TextInput
            style={[fs.input, account.length > 0 && !isValid && fs.inputError, isValid && fs.inputValid]}
            placeholder="AC24561"
            placeholderTextColor="#A0B0A0"
            value={account}
            onChangeText={handleAccountChange}
            autoCapitalize="characters"
            maxLength={7}
          />
          {account.length > 0 && (
            <Text style={[fs.hint, isValid ? fs.hintValid : fs.hintError]}>
              {isValid ? "✓ Valid Livra account" : "Format: 2 letters + 5 digits (e.g. AC24561)"}
            </Text>
          )}
        </View>
      )}

      {mode === "scan" && !scanned && (
        <TouchableOpacity style={fs.scanBox} activeOpacity={0.8} onPress={handleScanTap}>
          <View style={fs.scanIconRing}>
            <Feather name="camera" size={28} color={DARK_GREEN} />
          </View>
          <Text style={fs.scanText}>Tap to scan QR code</Text>
          <Text style={fs.scanSub}>Point at the recipient's Livra QR code</Text>
        </TouchableOpacity>
      )}

      {mode === "scan" && scanned && detectedUser && (
        <View>
          <View style={fs.detectedCard}>
            <View style={[fs.detectedAvatar, { backgroundColor: detectedUser.color }]}>
              <Text style={fs.detectedInitials}>{detectedUser.initials}</Text>
            </View>
            <View style={fs.detectedInfo}>
              <Text style={fs.detectedName}>{detectedUser.name}</Text>
              <Text style={fs.detectedAccount}>{detectedUser.account}</Text>
            </View>
            <View style={fs.detectedBadge}>
              <Feather name="check-circle" size={18} color="#30D158" />
            </View>
          </View>

          <Field label="Amount (UGX)" placeholder="0.00" keyboardType="numeric" value={scanAmount} onChangeText={setScanAmount} />
          <Field label="Note (optional)" placeholder="What's this for?" value={scanNote} onChangeText={setScanNote} />

          <TouchableOpacity style={fs.rescanBtn} onPress={handleRescan} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={13} color="#6B7B6E" />
            <Text style={fs.rescanText}>Scan a different user</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function FormFields({
  type, phone, setPhone, network, setNetwork,
  bank, setBank, accNum, setAccNum,
  merchant, setMerchant, amount, setAmount, note, setNote,
  hidePayment, setHidePayment,
  recipientName, lookupBusy,
}: {
  type: SendType;
  phone: string; setPhone: (v: string) => void;
  network: string; setNetwork: (v: string) => void;
  bank: string; setBank: (v: string) => void;
  accNum: string; setAccNum: (v: string) => void;
  merchant: string; setMerchant: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  note: string; setNote: (v: string) => void;
  hidePayment: boolean; setHidePayment: (v: boolean) => void;
  recipientName: string; lookupBusy: boolean;
}) {
  if (!type) return null;
  return (
    <View style={styles.formCard}>
      {type === "mobile" && <>
        <Field label="Recipient Phone" placeholder="0701 454 887" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        {(lookupBusy || recipientName) ? (
          <View style={fs.benRow}>
            <Feather name={lookupBusy ? "loader" : "user-check"} size={14} color={lookupBusy ? "#6B7B6E" : DARK_GREEN} />
            <Text style={[fs.benTxt, lookupBusy && { color: "#6B7B6E" }]}>
              {lookupBusy ? "Verifying recipient…" : recipientName}
            </Text>
          </View>
        ) : null}
        <Text style={fs.label}>Network</Text>
        <ChipRow items={NETWORKS} selected={network} onSelect={setNetwork} />
      </>}
      {type === "livra" && (
        <LivraField onHideGlobalPayment={setHidePayment} />
      )}
      {type === "bank" && <>
        <Text style={fs.label}>Bank</Text>
        <ChipRow items={BANKS} selected={bank} onSelect={setBank} />
        <Field label="Account Number" placeholder="Beneficiary account" keyboardType="numeric" value={accNum} onChangeText={setAccNum} />
      </>}
      {type === "online" && <Field label="Merchant" placeholder="e.g. Amazon, Paystack" value={merchant} onChangeText={setMerchant} />}
      {(type !== "livra" || !hidePayment) && <>
        <Field label="Amount (UGX)" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <Field label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />
      </>}
    </View>
  );
}

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<SendType>(null);
  const label = OPTIONS.find((o) => o.key === selected)?.label ?? "";

  const [phone, setPhone]       = useState("");
  const [network, setNetwork]   = useState("");
  const [bank, setBank]         = useState("");
  const [accNum, setAccNum]     = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount]     = useState("");
  const [note, setNote]         = useState("");
  const [hidePayment, setHidePayment] = useState(false);

  const [sending, setSending]               = useState(false);
  const [recipientName, setRecipientName]   = useState("");
  const [lookupBusy,   setLookupBusy]       = useState(false);
  const [lastValidated, setLastValidated]   = useState("");

  function resetForm() {
    setPhone(""); setNetwork(""); setBank(""); setAccNum("");
    setMerchant(""); setAmount(""); setNote(""); setSelected(null);
    setRecipientName(""); setLastValidated("");
  }

  async function maybeValidatePhone(raw: string) {
    const msisdn = formatMsisdn(raw);
    if (!msisdn || msisdn.replace(/\D/g, "").length < 12) return;
    if (msisdn === lastValidated) return;
    setLookupBusy(true);
    try {
      const r = await relworxApi.validatePhone(msisdn);
      if (r.success) {
        setRecipientName(r.customer_name || "Account verified");
        setLastValidated(msisdn);
      } else {
        setRecipientName("");
      }
    } catch {
      setRecipientName("");
    } finally {
      setLookupBusy(false);
    }
  }

  function handlePhoneChange(v: string) {
    setPhone(v);
    setRecipientName("");
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 9) {
      maybeValidatePhone(v);
    }
  }

  async function handleConfirm() {
    if (!selected || sending) return;

    if (selected !== "mobile") {
      Alert.alert(
        "Use the right screen",
        selected === "bank"
          ? "Tap Bank Transfer on the home screen for direct bank payouts."
          : `${label} transfers aren't wired yet.`,
      );
      return;
    }

    if (!phone || phone.replace(/\D/g, "").length < 9) {
      Alert.alert("Phone Number", "Enter a valid recipient phone number.");
      return;
    }
    const amt = Number((amount || "").replace(/[^0-9.]/g, ""));
    if (!amt || amt <= 0) {
      Alert.alert("Amount", "Enter a valid amount in UGX.");
      return;
    }

    setSending(true);
    try {
      const msisdn = formatMsisdn(phone);
      setUserPhone(msisdn).catch(() => {});
      const res = await relworxApi.withdraw({
        msisdn,
        amount: amt,
        currency: "UGX",
        ...(note ? { description: note } : {}),
      });
      const final = await pollRequestStatus(res.internal_reference, { timeoutMs: 75000 });
      const ok = (final.status ?? "").toLowerCase() === "success";
      Alert.alert(
        ok ? "Sent" : "Pending",
        ok
          ? `UGX ${amt.toLocaleString()} sent to ${msisdn}.`
          : final.message || "Transfer is still processing — check Transactions.",
      );
      if (ok) resetForm();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Transfer failed. Please try again.";
      Alert.alert("Transfer Failed", msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.root}>

        <View style={[styles.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 10 }]}>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarLabel}>Your Wallet Balance</Text>
            <Text style={styles.topBarBalance}>UGX {LOCAL_BALANCE.toLocaleString()}</Text>
          </View>
        </View>

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

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormFields
            type={selected}
            phone={phone} setPhone={handlePhoneChange}
            network={network} setNetwork={setNetwork}
            bank={bank} setBank={setBank}
            accNum={accNum} setAccNum={setAccNum}
            merchant={merchant} setMerchant={setMerchant}
            amount={amount} setAmount={setAmount}
            note={note} setNote={setNote}
            hidePayment={hidePayment} setHidePayment={setHidePayment}
            recipientName={recipientName}
            lookupBusy={lookupBusy}
          />
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.confirmBtn, (!selected || sending) && styles.confirmBtnOff]}
              activeOpacity={selected && !sending ? 0.85 : 1}
              onPress={handleConfirm}
              disabled={!selected || sending}
            >
              {sending ? (
                <ActivityIndicator color={LIME} />
              ) : (
                <Text style={[styles.confirmText, !selected && styles.confirmTextOff]}>
                  Confirm Payment
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  topBar: {
    backgroundColor: DARK_GREEN,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 3 },
  topBarBalance: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF", letterSpacing: -0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
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
  cellIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cellLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#555" },
  cellLabelActive: { color: DARK_GREEN },
  formScroll: { flex: 1 },
  formCard: {
    backgroundColor: "#FFF", borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  bottomBar: { paddingHorizontal: 40, paddingTop: 10, paddingBottom: 12, backgroundColor: BG, alignItems: "center" },
  confirmBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 36,
    alignItems: "center", minWidth: 180,
  },
  confirmBtnOff: { backgroundColor: "#C8D8C8" },
  confirmText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: LIME },
  confirmTextOff: { color: "#8AA88A" },
});

const fs = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#6B7B6E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: "Inter_400Regular", fontSize: 14, color: "#1A1A1A",
    borderWidth: 1.5, borderColor: "#C6F135",
  },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: "#D0D8D0", backgroundColor: "#FFF" },
  chipActive: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
  chipTextActive: { color: "#FFF" },
  inputError: { borderColor: "#FF3B30" },
  inputValid: { borderColor: "#30D158" },
  hint: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  hintError: { color: "#FF3B30" },
  hintValid: { color: "#30D158" },
  benRow:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0FAF0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: -8, marginBottom: 14 },
  benTxt:    { fontFamily: "Inter_600SemiBold", fontSize: 13, color: DARK_GREEN },
  livraToggleRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  livraToggleBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: DARK_GREEN, backgroundColor: "#FFF" },
  livraToggleActive: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  livraToggleText: { fontFamily: "Inter_500Medium", fontSize: 13, color: DARK_GREEN },
  livraToggleTextActive: { color: "#FFF" },
  scanBox: { borderWidth: 1.5, borderColor: "#C6F135", borderRadius: 16, borderStyle: "dashed", backgroundColor: "#F8FCF0", alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 10 },
  scanIconRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E8F5E3", alignItems: "center", justifyContent: "center" },
  scanText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: DARK_GREEN },
  scanSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#6B7B6E" },
  detectedCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FAF3", borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "#30D158", marginBottom: 14, gap: 12 },
  detectedAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  detectedInitials: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  detectedInfo: { flex: 1 },
  detectedName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: DARK_GREEN },
  detectedAccount: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#6B7B6E", marginTop: 2 },
  detectedBadge: { alignItems: "center", justifyContent: "center" },
  rescanBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", marginTop: 4, paddingVertical: 6 },
  rescanText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#6B7B6E" },
});
