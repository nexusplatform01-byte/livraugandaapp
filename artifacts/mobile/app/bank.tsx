import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppTabBar } from "@/components/AppTabBar";

// ─── Theme ──────────────────────────────────────────────────────────────────
const DARK_GREEN = "#1A3B2F";
const LIME       = "#C6F135";
const BG         = "#F5F7F5";
const CARD       = "#FFFFFF";
const BORDER     = "#E2EAE2";
const TEXT       = "#1A3B2F";
const MUTED      = "#7A9A7A";
const SEP        = "#F0F4F0";

// ─── Ugandan Banks ────────────────────────────────────────────────────────────
interface Bank {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const BANKS: Bank[] = [
  { id: "stanbic",    name: "Stanbic Bank",       initials: "STB", color: "#003A7A" },
  { id: "absa",       name: "Absa Bank",           initials: "ABS", color: "#CC0000" },
  { id: "centenary",  name: "Centenary Bank",      initials: "CEN", color: "#005500" },
  { id: "dfcu",       name: "DFCU Bank",           initials: "DFC", color: "#FF6600" },
  { id: "equity",     name: "Equity Bank",         initials: "EQB", color: "#CC0000" },
  { id: "housing",    name: "Housing Finance",     initials: "HFB", color: "#003366" },
  { id: "kcb",        name: "KCB Bank",            initials: "KCB", color: "#006633" },
  { id: "ncba",       name: "NCBA Bank",           initials: "NCB", color: "#1A1A1A" },
  { id: "postbank",   name: "PostBank Uganda",     initials: "PBU", color: "#CC6600" },
  { id: "pride",      name: "Pride Microfinance",  initials: "PMF", color: "#660099" },
  { id: "tropical",   name: "Tropical Bank",       initials: "TRB", color: "#006699" },
  { id: "uba",        name: "UBA Uganda",          initials: "UBA", color: "#CC0033" },
  { id: "oci",        name: "Orient Bank",         initials: "ORI", color: "#993300" },
];

// ─── Mock beneficiary lookup ──────────────────────────────────────────────────
const MOCK_LOOKUP: Record<string, string> = {
  "1234567890": "Darlington Emeka",
  "0987654321": "Amina Nakato",
  "1122334455": "Joseph Ssebuwufu",
  "9876543210": "Grace Auma",
};

// ─── Bank Selector Modal ──────────────────────────────────────────────────────
function BankSelector({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean; selected: Bank | null;
  onSelect: (b: Bank) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <View style={bs.overlay}>
      <Pressable style={bs.backdrop} onPress={onClose} />
      <View style={[bs.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={bs.handle} />
        <Text style={bs.title}>Select Bank</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {BANKS.map((bank) => {
            const active = selected?.id === bank.id;
            return (
              <TouchableOpacity
                key={bank.id}
                style={[bs.bankRow, active && bs.bankRowActive]}
                onPress={() => { Haptics.selectionAsync(); onSelect(bank); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={[bs.bankLogo, { backgroundColor: bank.color }]}>
                  <Text style={bs.bankInitials}>{bank.initials}</Text>
                </View>
                <Text style={[bs.bankName, active && bs.bankNameActive]}>{bank.name}</Text>
                {active && <Feather name="check-circle" size={18} color={DARK_GREEN} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Confirm Sheet ────────────────────────────────────────────────────────────
function ConfirmSheet({
  visible, bank, accountNo, beneficiary, amount, note, onConfirm, onCancel,
}: {
  visible: boolean; bank: Bank | null; accountNo: string;
  beneficiary: string; amount: string; note: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!bank || !visible) return null;
  const num = Number(amount.replace(/,/g, ""));
  return (
    <View style={[cs.overlay]} pointerEvents="auto">
      <Pressable style={cs.backdrop} onPress={onCancel} />
      <View style={[cs.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={cs.handle} />
        <Text style={cs.title}>Confirm Transfer</Text>
        <View style={cs.summaryCard}>
          <View style={[cs.bankBadge, { backgroundColor: bank.color }]}>
            <Text style={cs.bankBadgeTxt}>{bank.initials}</Text>
          </View>
          <View style={cs.summaryInfo}>
            <Text style={cs.summaryName}>{beneficiary || "Account Holder"}</Text>
            <Text style={cs.summaryDesc}>{bank.name}</Text>
            <Text style={cs.summaryAcct}>{accountNo}</Text>
          </View>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Bank</Text>
          <Text style={cs.detailVal}>{bank.name}</Text>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Account Number</Text>
          <Text style={cs.detailVal}>{accountNo}</Text>
        </View>
        {note ? (
          <View style={cs.detailRow}>
            <Text style={cs.detailLabel}>Note</Text>
            <Text style={cs.detailVal}>{note}</Text>
          </View>
        ) : null}
        <View style={[cs.detailRow, cs.detailRowLast]}>
          <Text style={cs.detailLabel}>Amount</Text>
          <Text style={cs.detailAmt}>UGX {num.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={cs.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
          <Text style={cs.confirmBtnTxt}>Send UGX {num.toLocaleString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cs.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={cs.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
const INITIAL_BALANCE = 209891;

export default function BankScreen() {
  const insets = useSafeAreaInsets();
  const [balance,       setBalance]       = useState(INITIAL_BALANCE);
  const [selectedBank,  setSelectedBank]  = useState<Bank | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [accountNo,     setAccountNo]     = useState("");
  const [beneficiary,   setBeneficiary]   = useState("");
  const [lookingUp,     setLookingUp]     = useState(false);
  const [amount,        setAmount]        = useState("");
  const [note,          setNote]          = useState("");
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");

  function handleAccountNoBlur() {
    if (accountNo.length >= 10) {
      setLookingUp(true);
      setTimeout(() => {
        setBeneficiary(MOCK_LOOKUP[accountNo] ?? "Account Verified");
        setLookingUp(false);
      }, 800);
    } else {
      setBeneficiary("");
    }
  }

  function handleTransfer() {
    if (!selectedBank)             { Alert.alert("Select Bank", "Please select a bank"); return; }
    if (accountNo.length < 10)     { Alert.alert("Invalid Account", "Enter a valid 10-digit account number"); return; }
    if (!amount || Number(amount.replace(/,/g, "")) <= 0) { Alert.alert("Invalid Amount", "Enter a valid transfer amount"); return; }
    const num = Number(amount.replace(/,/g, ""));
    if (num > balance)             { Alert.alert("Insufficient Funds", "You don't have enough balance for this transfer"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetOpen(true);
  }

  function handleConfirm() {
    const num = Number(amount.replace(/,/g, ""));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBalance((b) => b - num);
    setSuccessMsg(`UGX ${num.toLocaleString()} sent to ${beneficiary || accountNo} at ${selectedBank?.name}`);
    setSheetOpen(false);
    setAccountNo("");
    setBeneficiary("");
    setAmount("");
    setNote("");
    setSelectedBank(null);
  }

  const canTransfer = !!selectedBank && accountNo.length >= 10 && Number(amount.replace(/,/g, "")) > 0;

  return (
    <View style={s.root}>
      {/* ── Balance Header ── */}
      <View style={[s.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 10 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <Text style={s.topBarLabel}>Your Wallet Balance</Text>
          <Text style={s.topBarBalance}>UGX {balance.toLocaleString()}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Success Banner ── */}
        {!!successMsg && (
          <View style={s.successBanner}>
            <Feather name="check-circle" size={16} color={DARK_GREEN} />
            <Text style={s.successTxt}>{successMsg}</Text>
            <TouchableOpacity onPress={() => setSuccessMsg("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color={DARK_GREEN} />
            </TouchableOpacity>
          </View>
        )}

        <View style={s.formCard}>
          <Text style={s.formTitle}>Bank Transfer</Text>
          <Text style={s.formSubtitle}>Transfer funds directly to any Ugandan bank account</Text>

          {/* ── Bank Selection ── */}
          <Text style={s.fieldLabel}>Select Bank</Text>
          <TouchableOpacity
            style={[s.bankPickerBtn, selectedBank && s.bankPickerBtnSelected]}
            onPress={() => setBankModalOpen(true)}
            activeOpacity={0.8}
          >
            {selectedBank ? (
              <View style={s.bankPickerSelected}>
                <View style={[s.bankPickerLogo, { backgroundColor: selectedBank.color }]}>
                  <Text style={s.bankPickerInitials}>{selectedBank.initials}</Text>
                </View>
                <Text style={s.bankPickerName}>{selectedBank.name}</Text>
              </View>
            ) : (
              <Text style={s.bankPickerPlaceholder}>Choose a bank...</Text>
            )}
            <Feather name="chevron-down" size={18} color={MUTED} />
          </TouchableOpacity>

          {/* ── Account Number ── */}
          <Text style={s.fieldLabel}>Account Number</Text>
          <TextInput
            style={s.input}
            placeholder="10-digit account number"
            placeholderTextColor={MUTED}
            value={accountNo}
            onChangeText={(t) => { setAccountNo(t); setBeneficiary(""); }}
            onBlur={handleAccountNoBlur}
            keyboardType="number-pad"
            maxLength={10}
            contextMenuHidden
            selectionColor={LIME}
          />

          {/* ── Beneficiary Name ── */}
          {(lookingUp || beneficiary) ? (
            <View style={s.beneficiaryRow}>
              <Feather name={lookingUp ? "loader" : "user-check"} size={14} color={lookingUp ? MUTED : DARK_GREEN} />
              <Text style={[s.beneficiaryTxt, lookingUp && { color: MUTED }]}>
                {lookingUp ? "Verifying account..." : beneficiary}
              </Text>
            </View>
          ) : null}

          {/* ── Amount ── */}
          <Text style={s.fieldLabel}>Amount (UGX)</Text>
          <View style={s.amountRow}>
            <View style={s.amountPrefix}>
              <Text style={s.amountPrefixTxt}>UGX</Text>
            </View>
            <TextInput
              style={s.amountInput}
              placeholder="0"
              placeholderTextColor={MUTED}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              contextMenuHidden
              selectionColor={LIME}
            />
          </View>

          {/* ── Quick Amount Pills ── */}
          <View style={s.quickAmts}>
            {["10,000", "50,000", "100,000", "200,000"].map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.quickAmt, amount === v && s.quickAmtActive]}
                onPress={() => { Haptics.selectionAsync(); setAmount(v); }}
                activeOpacity={0.8}
              >
                <Text style={[s.quickAmtTxt, amount === v && s.quickAmtTxtActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Note ── */}
          <Text style={s.fieldLabel}>Note (optional)</Text>
          <TextInput
            style={s.input}
            placeholder="What's this transfer for?"
            placeholderTextColor={MUTED}
            value={note}
            onChangeText={setNote}
            selectionColor={LIME}
          />
        </View>

        {/* ── Recent Recipients ── */}
        <View style={s.recentCard}>
          <Text style={s.recentTitle}>Recent Recipients</Text>
          {[
            { name: "Amina Nakato",      bank: "Stanbic Bank",   acct: "•••• 4321", color: "#003A7A", initials: "STB" },
            { name: "Joseph Ssebuwufu", bank: "Centenary Bank", acct: "•••• 3344", color: "#005500", initials: "CEN" },
            { name: "Grace Auma",        bank: "Equity Bank",    acct: "•••• 3210", color: "#CC0000", initials: "EQB" },
          ].map((r, i) => (
            <TouchableOpacity
              key={i}
              style={[s.recentRow, i < 2 && s.recentRowBorder]}
              onPress={() => { Haptics.selectionAsync(); setAccountNo(r.acct.replace("•••• ", "")); setBeneficiary(r.name); }}
              activeOpacity={0.7}
            >
              <View style={[s.recentLogo, { backgroundColor: r.color }]}>
                <Text style={s.recentInitials}>{r.initials}</Text>
              </View>
              <View style={s.recentInfo}>
                <Text style={s.recentName}>{r.name}</Text>
                <Text style={s.recentBank}>{r.bank} · {r.acct}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={MUTED} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Transfer Button ── */}
      <View style={[s.footer, { paddingBottom: 0 }]}>
        <TouchableOpacity
          style={[s.transferBtn, !canTransfer && s.transferBtnDim]}
          onPress={handleTransfer}
          activeOpacity={0.85}
        >
          <Feather name="send" size={16} color={DARK_GREEN} style={{ marginRight: 8 }} />
          <Text style={s.transferBtnTxt}>
            {amount ? `Send UGX ${Number(amount.replace(/,/g, "")).toLocaleString()}` : "Send Money"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <BankSelector
        visible={bankModalOpen}
        selected={selectedBank}
        onSelect={setSelectedBank}
        onClose={() => setBankModalOpen(false)}
      />
      {sheetOpen && (
        <ConfirmSheet
          visible={sheetOpen}
          bank={selectedBank}
          accountNo={accountNo}
          beneficiary={beneficiary}
          amount={amount}
          note={note}
          onConfirm={handleConfirm}
          onCancel={() => setSheetOpen(false)}
        />
      )}
      <AppTabBar activeTab="" />
    </View>
  );
}

// ─── Bank Selector Styles ─────────────────────────────────────────────────────
const bs = StyleSheet.create({
  overlay:      { ...StyleSheet.absoluteFillObject, zIndex: 99, justifyContent: "flex-end" },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:        { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14, maxHeight: "75%" },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 16 },
  title:        { fontFamily: "Inter_700Bold", fontSize: 18, color: TEXT, marginBottom: 16, textAlign: "center" },
  bankRow:      { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: SEP },
  bankRowActive:{ backgroundColor: "#F0FAF0", borderRadius: 12, paddingHorizontal: 8, marginHorizontal: -8 },
  bankLogo:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  bankInitials: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  bankName:     { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: TEXT },
  bankNameActive:{ fontFamily: "Inter_600SemiBold", color: DARK_GREEN },
});

// ─── Confirm Sheet Styles ─────────────────────────────────────────────────────
const cs = StyleSheet.create({
  overlay:   { ...StyleSheet.absoluteFillObject, zIndex: 99, justifyContent: "flex-end" },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:     { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  title:     { fontFamily: "Inter_700Bold", fontSize: 18, color: TEXT, marginBottom: 18, textAlign: "center" },
  summaryCard:   { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: BG, borderRadius: 16, padding: 16, marginBottom: 16 },
  bankBadge:     { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  bankBadgeTxt:  { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  summaryInfo:   { flex: 1 },
  summaryName:   { fontFamily: "Inter_700Bold", fontSize: 15, color: TEXT },
  summaryDesc:   { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED, marginTop: 1 },
  summaryAcct:   { fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN, marginTop: 2 },
  detailRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SEP },
  detailRowLast: { borderBottomWidth: 0, marginBottom: 20 },
  detailLabel:   { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED },
  detailVal:     { fontFamily: "Inter_500Medium", fontSize: 13, color: TEXT },
  detailAmt:     { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  confirmBtn:    { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  confirmBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  cancelBtn:     { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:  { fontFamily: "Inter_500Medium", fontSize: 14, color: MUTED },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  topBar:       { backgroundColor: DARK_GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 3 },
  topBarBalance:{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.5 },
  scroll:        { flex: 1 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCF8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  successTxt:    { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
  formCard:      { backgroundColor: CARD, borderRadius: 20, marginHorizontal: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  formTitle:     { fontFamily: "Inter_700Bold", fontSize: 18, color: TEXT, marginBottom: 4 },
  formSubtitle:  { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED, marginBottom: 20 },
  fieldLabel:    { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  input:         { backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 16 },
  bankPickerBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  bankPickerBtnSelected: { borderColor: DARK_GREEN, backgroundColor: "#F0FAF0" },
  bankPickerSelected:    { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  bankPickerLogo:        { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  bankPickerInitials:    { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  bankPickerName:        { fontFamily: "Inter_600SemiBold", fontSize: 14, color: TEXT },
  bankPickerPlaceholder: { fontFamily: "Inter_400Regular", fontSize: 14, color: MUTED, flex: 1 },
  beneficiaryRow:{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0FAF0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: -8, marginBottom: 14 },
  beneficiaryTxt:{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: DARK_GREEN },
  amountRow:     { flexDirection: "row", alignItems: "center", backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  amountPrefix:  { backgroundColor: SEP, paddingHorizontal: 14, paddingVertical: 13, borderRightWidth: 1, borderRightColor: BORDER },
  amountPrefixTxt:{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: MUTED },
  amountInput:   { flex: 1, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_700Bold", fontSize: 16 },
  quickAmts:     { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  quickAmt:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER },
  quickAmtActive:{ backgroundColor: LIME, borderColor: LIME },
  quickAmtTxt:   { fontFamily: "Inter_500Medium", fontSize: 12, color: MUTED },
  quickAmtTxtActive:{ color: DARK_GREEN, fontFamily: "Inter_600SemiBold" },
  recentCard:    { backgroundColor: CARD, borderRadius: 20, marginHorizontal: 16, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  recentTitle:   { fontFamily: "Inter_600SemiBold", fontSize: 14, color: TEXT, marginBottom: 12 },
  recentRow:     { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  recentRowBorder:{ borderBottomWidth: 1, borderBottomColor: SEP },
  recentLogo:    { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  recentInitials:{ fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  recentInfo:    { flex: 1 },
  recentName:    { fontFamily: "Inter_600SemiBold", fontSize: 13, color: TEXT },
  recentBank:    { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED, marginTop: 2 },
  footer:        { paddingHorizontal: 16, paddingTop: 12, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  transferBtn:    { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  transferBtnDim: { opacity: 0.5 },
  transferBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
});
