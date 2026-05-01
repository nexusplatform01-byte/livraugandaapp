import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import {
  formatMsisdn,
  pollRequestStatus,
  relworxApi,
  type ProductSummary,
} from "@/lib/relworx";
import { ApiError } from "@/lib/api";
import { setUserPhone } from "@/lib/userSession";
import { useAuth } from "@/lib/authContext";

const DARK_GREEN = "#1A3B2F";
const LIME       = "#C6F135";
const BG         = "#F5F7F5";
const CARD       = "#FFFFFF";
const BORDER     = "#E2EAE2";
const TEXT       = "#1A3B2F";
const MUTED      = "#7A9A7A";
const SEP        = "#F0F4F0";

/** Turn a code like STANBIC_BANK_UGANDA_TRANSFER into initials STB */
function codeToInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .filter((w) => w.length > 2 && !["BANK","UGANDA","LTD","LIMITED","AND","OF","FOR"].includes(w.toUpperCase()))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

const BANK_COLORS = [
  "#003A7A","#CC0000","#005500","#FF6600","#003366","#CC6600",
  "#006633","#1A1A1A","#993300","#006699","#CC0033","#1A4D8C",
  "#0061A1","#CC9900","#0033CC","#FF6600","#003399","#003A7A",
  "#660099","#1A6B4A","#CC4400","#0099CC","#33AA66","#8833AA",
];
let colorIdx = 0;
function pickColor(): string {
  return BANK_COLORS[colorIdx++ % BANK_COLORS.length];
}

interface BankEntry {
  product_code: string;
  name: string;
  initials: string;
  color: string;
}

function buildBanks(products: ProductSummary[]): BankEntry[] {
  colorIdx = 0;
  return products
    .filter((p) => p.category === "BANK_TRANSFERS")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      product_code: p.code,
      name: p.name
        .replace(" Uganda Ltd Transfer", "")
        .replace(" Uganda Ltd", "")
        .replace(" Uganda", "")
        .replace(" Transfer", "")
        .trim(),
      initials: codeToInitials(p.name),
      color: pickColor(),
    }));
}

function BankSelector({
  visible, banks, loading: banksLoading, selected, onSelect, onClose,
}: {
  visible: boolean; banks: BankEntry[]; loading: boolean;
  selected: BankEntry | null; onSelect: (b: BankEntry) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <View style={bs.overlay}>
      <Pressable style={bs.backdrop} onPress={onClose} />
      <View style={[bs.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={bs.handle} />
        <Text style={bs.title}>Select Bank</Text>
        {banksLoading ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <ActivityIndicator color={DARK_GREEN} />
            <Text style={{ marginTop: 10, color: MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
              Fetching banks from Relworx…
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {banks.map((bank) => {
              const active = selected?.product_code === bank.product_code;
              return (
                <TouchableOpacity
                  key={bank.product_code}
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
        )}
      </View>
    </View>
  );
}

function ConfirmSheet({
  visible, bank, accountNo, depositorName, payerPhone, amount, note,
  loading, statusMessage, onConfirm, onCancel,
}: {
  visible: boolean; bank: BankEntry | null; accountNo: string; depositorName: string;
  payerPhone: string; amount: string; note: string;
  loading: boolean; statusMessage: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!bank || !visible) return null;
  const num = Number(amount.replace(/,/g, ""));
  return (
    <View style={cs.overlay} pointerEvents="auto">
      <Pressable style={cs.backdrop} onPress={loading ? undefined : onCancel} />
      <View style={[cs.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={cs.handle} />
        <Text style={cs.title}>Confirm Transfer</Text>
        <View style={cs.summaryCard}>
          <View style={[cs.bankBadge, { backgroundColor: bank.color }]}>
            <Text style={cs.bankBadgeTxt}>{bank.initials}</Text>
          </View>
          <View style={cs.summaryInfo}>
            <Text style={cs.summaryName}>{depositorName || "Bank Beneficiary"}</Text>
            <Text style={cs.summaryDesc}>{bank.name}</Text>
            <Text style={cs.summaryAcct}>{accountNo}</Text>
          </View>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Pay From (MM)</Text>
          <Text style={cs.detailVal}>{payerPhone || "—"}</Text>
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
        {statusMessage ? (
          <View style={cs.statusBox}>
            {loading && <ActivityIndicator color={DARK_GREEN} size="small" />}
            <Text style={cs.statusTxt}>{statusMessage}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[cs.confirmBtn, loading && cs.confirmBtnDim]}
          onPress={loading ? undefined : onConfirm}
          activeOpacity={loading ? 1 : 0.85}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={DARK_GREEN} /> : (
            <Text style={cs.confirmBtnTxt}>Send UGX {num.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={cs.cancelBtn}
          onPress={loading ? undefined : onCancel}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={cs.cancelBtnTxt}>{loading ? "Please wait…" : "Cancel"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BankScreen() {
  const insets = useSafeAreaInsets();
  const { balanceUGX, deductBalance } = useAuth();
  const [banks, setBanks]           = useState<BankEntry[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [selectedBank,  setSelectedBank]  = useState<BankEntry | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [accountNo,     setAccountNo]     = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [payerPhone,    setPayerPhone]    = useState("");
  const [amount,        setAmount]        = useState("");
  const [note,          setNote]          = useState("");
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [statusMsg,     setStatusMsg]     = useState("");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [successMsg,    setSuccessMsg]    = useState("");

  // Fetch real banks from Relworx
  useEffect(() => {
    (async () => {
      setBanksLoading(true);
      try {
        const res = await relworxApi.products();
        setBanks(buildBanks(res.products));
      } catch {
        setBanks([]);
      } finally {
        setBanksLoading(false);
      }
    })();
  }, []);

  function openConfirm() {
    if (!selectedBank)         { setErrorMsg("Please select a bank."); return; }
    if (accountNo.length < 6)  { setErrorMsg("Enter a valid account number."); return; }
    if (!depositorName.trim()) { setErrorMsg("Enter the beneficiary / depositor name."); return; }
    if (!payerPhone || payerPhone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Enter the mobile-money phone you'll pay with."); return;
    }
    const num = Number(amount.replace(/,/g, ""));
    if (!num || num <= 0)      { setErrorMsg("Enter a valid transfer amount."); return; }
    setErrorMsg("");
    setStatusMsg("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetOpen(true);
  }

  async function handleConfirm() {
    if (!selectedBank || loading) return;
    const num    = Number(amount.replace(/,/g, ""));
    const msisdn = formatMsisdn(payerPhone);
    setUserPhone(msisdn).catch(() => {});
    setLoading(true);
    setStatusMsg("Validating transfer…");
    try {
      const v = await relworxApi.validateProduct({
        msisdn,
        amount: num,
        product_code: selectedBank.product_code,
        contact_phone: msisdn,
        account_number: accountNo,
        depositor_name: depositorName,
        beneficiary_name: depositorName,
        account_name: depositorName,
        description: note || `Bank transfer to ${selectedBank.name}`,
      });
      setStatusMsg("Processing bank transfer from wallet…");
      const p = await relworxApi.purchaseProduct(v.validation_reference);
      setStatusMsg("Confirming transfer…");
      const final = await pollRequestStatus(p.internal_reference, { timeoutMs: 90000 });
      const ok = (final.status ?? "").toLowerCase() === "success";
      if (ok) {
        await deductBalance(
          num,
          `Bank transfer to ${depositorName} — ${selectedBank.name}`,
          "Bank",
          "credit-card",
          "#BF5AF2",
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMsg(`UGX ${num.toLocaleString()} sent to ${depositorName} at ${selectedBank.name}.`);
        setSheetOpen(false);
        setAccountNo(""); setDepositorName(""); setAmount(""); setNote("");
        setStatusMsg("");
      } else {
        setStatusMsg(final.message || "Still processing — check Transactions.");
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Transfer failed. Please try again.";
      setErrorMsg(msg);
      setStatusMsg("");
      setSheetOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const canTransfer = !!selectedBank && accountNo.length >= 6 && !!depositorName && !!payerPhone && Number(amount.replace(/,/g, "")) > 0;

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 10 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <Text style={s.topBarLabel}>Your Wallet Balance</Text>
          <Text style={s.topBarBalance}>UGX {balanceUGX.toLocaleString()}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!!successMsg && (
          <View style={s.successBanner}>
            <Feather name="check-circle" size={16} color={DARK_GREEN} />
            <Text style={s.successTxt}>{successMsg}</Text>
            <TouchableOpacity onPress={() => setSuccessMsg("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color={DARK_GREEN} />
            </TouchableOpacity>
          </View>
        )}
        {!!errorMsg && (
          <View style={s.errorBanner}>
            <Feather name="alert-circle" size={16} color="#7A1A1A" />
            <Text style={s.errorTxt}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => setErrorMsg("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color="#7A1A1A" />
            </TouchableOpacity>
          </View>
        )}

        <View style={s.formCard}>
          <Text style={s.formTitle}>Bank Transfer</Text>
          <Text style={s.formSubtitle}>Send to any Ugandan bank account via mobile-money.</Text>

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
            ) : banksLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <ActivityIndicator color={MUTED} size="small" />
                <Text style={s.bankPickerPlaceholder}>Loading banks from Relworx…</Text>
              </View>
            ) : (
              <Text style={s.bankPickerPlaceholder}>
                {banks.length ? "Choose a bank…" : "Could not load banks"}
              </Text>
            )}
            <Feather name="chevron-down" size={18} color={MUTED} />
          </TouchableOpacity>

          <Text style={s.fieldLabel}>Account Number</Text>
          <TextInput
            style={s.input}
            placeholder="Beneficiary account number"
            placeholderTextColor={MUTED}
            value={accountNo}
            onChangeText={setAccountNo}
            keyboardType="number-pad"
            selectionColor={LIME}
          />

          <Text style={s.fieldLabel}>Beneficiary / Depositor Name</Text>
          <TextInput
            style={s.input}
            placeholder="Full name on the account"
            placeholderTextColor={MUTED}
            value={depositorName}
            onChangeText={setDepositorName}
            selectionColor={LIME}
          />

          <Text style={s.fieldLabel}>Mobile-Money Phone (Payer)</Text>
          <TextInput
            style={s.input}
            placeholder="0701 454 887"
            placeholderTextColor={MUTED}
            value={payerPhone}
            onChangeText={setPayerPhone}
            keyboardType="phone-pad"
            selectionColor={LIME}
          />

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
              selectionColor={LIME}
            />
          </View>

          <View style={s.quickAmts}>
            {["10,000","50,000","100,000","200,000"].map((v) => (
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
      </ScrollView>

      <View style={[s.footer]}>
        <TouchableOpacity
          style={[s.transferBtn, !canTransfer && s.transferBtnDim]}
          onPress={openConfirm}
          activeOpacity={0.85}
        >
          <Feather name="send" size={16} color={DARK_GREEN} style={{ marginRight: 8 }} />
          <Text style={s.transferBtnTxt}>
            {amount ? `Send UGX ${Number((amount||"0").replace(/,/g,"")).toLocaleString()}` : "Send Money"}
          </Text>
        </TouchableOpacity>
      </View>

      <BankSelector
        visible={bankModalOpen}
        banks={banks}
        loading={banksLoading}
        selected={selectedBank}
        onSelect={setSelectedBank}
        onClose={() => setBankModalOpen(false)}
      />
      <ConfirmSheet
        visible={sheetOpen}
        bank={selectedBank}
        accountNo={accountNo}
        depositorName={depositorName}
        payerPhone={payerPhone ? formatMsisdn(payerPhone) : ""}
        amount={amount}
        note={note}
        loading={loading}
        statusMessage={statusMsg}
        onConfirm={handleConfirm}
        onCancel={() => { setSheetOpen(false); setStatusMsg(""); }}
      />
      
    </View>
  );
}

const bs = StyleSheet.create({
  overlay:      { ...StyleSheet.absoluteFillObject, zIndex: 99, justifyContent: "flex-end" },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:        { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14, maxHeight: "78%" },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 16 },
  title:        { fontFamily: "Inter_700Bold", fontSize: 18, color: TEXT, marginBottom: 16, textAlign: "center" },
  bankRow:      { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: SEP },
  bankRowActive:{ backgroundColor: "#F0FAF0", borderRadius: 12, paddingHorizontal: 8, marginHorizontal: -8 },
  bankLogo:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  bankInitials: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  bankName:     { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: TEXT },
  bankNameActive:{ fontFamily: "Inter_600SemiBold", color: DARK_GREEN },
});

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
  confirmBtnDim: { opacity: 0.6 },
  confirmBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  cancelBtn:     { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:  { fontFamily: "Inter_500Medium", fontSize: 14, color: MUTED },
  statusBox:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0F4F0", borderRadius: 12, padding: 12, marginBottom: 12 },
  statusTxt:     { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
});

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
  errorBanner:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FCE8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  errorTxt:      { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: "#7A1A1A" },
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
  amountRow:     { flexDirection: "row", alignItems: "center", backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  amountPrefix:  { backgroundColor: SEP, paddingHorizontal: 14, paddingVertical: 13, borderRightWidth: 1, borderRightColor: BORDER },
  amountPrefixTxt:{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: MUTED },
  amountInput:   { flex: 1, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_700Bold", fontSize: 16 },
  quickAmts:     { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  quickAmt:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER },
  quickAmtActive:{ backgroundColor: LIME, borderColor: LIME },
  quickAmtTxt:   { fontFamily: "Inter_500Medium", fontSize: 12, color: MUTED },
  quickAmtTxtActive:{ color: DARK_GREEN, fontFamily: "Inter_600SemiBold" },
  footer:        { backgroundColor: CARD, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: BORDER },
  transferBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: LIME, borderRadius: 16, paddingVertical: 16 },
  transferBtnDim:{ opacity: 0.5 },
  transferBtnTxt:{ fontFamily: "Inter_700Bold", fontSize: 15, color: DARK_GREEN },
});
