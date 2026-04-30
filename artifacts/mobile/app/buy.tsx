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
import { AppTabBar } from "@/components/AppTabBar";
import {
  formatMsisdn,
  pollRequestStatus,
  relworxApi,
} from "@/lib/relworx";
import { ApiError } from "@/lib/api";
import { BUY_PRODUCT_CODES } from "@/lib/productCodes";

// ─── Theme ──────────────────────────────────────────────────────────────────
const DARK_GREEN = "#1A3B2F";
const LIME       = "#C6F135";
const BG         = "#F5F7F5";
const CARD       = "#FFFFFF";
const BORDER     = "#E2EAE2";
const TEXT       = "#1A3B2F";
const MUTED      = "#7A9A7A";
const SEP        = "#F0F4F0";

// ─── Types ───────────────────────────────────────────────────────────────────
type CatKey  = "airtime" | "voice" | "data";
type ProvKey = "mtn" | "airtel";

interface Plan {
  id: string;
  name: string;
  amount: number;
  validity?: string;
  description?: string;
}

// ─── Sub-categories ───────────────────────────────────────────────────────────
const CATS: { key: CatKey; label: string; icon: string }[] = [
  { key: "airtime", label: "Airtime",     icon: "phone" },
  { key: "voice",   label: "Voice",       icon: "mic"   },
  { key: "data",    label: "Data Bundle", icon: "wifi"  },
];

// ─── Provider Meta ────────────────────────────────────────────────────────────
const PROVIDERS: Record<ProvKey, { name: string; color: string; initials: string }> = {
  mtn:    { name: "MTN Uganda",    color: "#C8960A", initials: "MTN" },
  airtel: { name: "Airtel Uganda", color: "#C0392B", initials: "AIR" },
};

// ─── Plans Data ───────────────────────────────────────────────────────────────
const PLANS: Record<CatKey, Record<ProvKey, Plan[]>> = {
  airtime: {
    mtn: [
      { id: "a1", name: "UGX 500",    amount: 500   },
      { id: "a2", name: "UGX 1,000",  amount: 1000  },
      { id: "a3", name: "UGX 2,000",  amount: 2000  },
      { id: "a4", name: "UGX 5,000",  amount: 5000  },
      { id: "a5", name: "UGX 10,000", amount: 10000 },
      { id: "a6", name: "UGX 20,000", amount: 20000 },
    ],
    airtel: [
      { id: "a1", name: "UGX 500",    amount: 500   },
      { id: "a2", name: "UGX 1,000",  amount: 1000  },
      { id: "a3", name: "UGX 2,000",  amount: 2000  },
      { id: "a4", name: "UGX 5,000",  amount: 5000  },
      { id: "a5", name: "UGX 10,000", amount: 10000 },
      { id: "a6", name: "UGX 20,000", amount: 20000 },
    ],
  },
  voice: {
    mtn: [
      { id: "v1", name: "Voice 1,000",  amount: 1000,  validity: "7 days",  description: "150 on-net mins + 50MB" },
      { id: "v2", name: "Voice 3,000",  amount: 3000,  validity: "30 days", description: "500 on-net mins + 200MB" },
      { id: "v3", name: "Voice 5,000",  amount: 5000,  validity: "30 days", description: "1,000 on-net mins + 500MB" },
      { id: "v4", name: "Voice 10,000", amount: 10000, validity: "30 days", description: "Unlimited on-net + 1GB" },
    ],
    airtel: [
      { id: "v1", name: "TalkMore 1,000",  amount: 1000,  validity: "7 days",  description: "100 on-net + 30 off-net mins" },
      { id: "v2", name: "TalkMore 3,000",  amount: 3000,  validity: "30 days", description: "400 on-net + 100 off-net mins" },
      { id: "v3", name: "TalkMore 5,000",  amount: 5000,  validity: "30 days", description: "800 on-net + 200 off-net mins" },
      { id: "v4", name: "TalkMore 10,000", amount: 10000, validity: "30 days", description: "Unlimited on-net + 300 off-net mins" },
    ],
  },
  data: {
    mtn: [
      { id: "d1", name: "1GB Daily",  amount: 3000,  validity: "1 day",   description: "Daily plan" },
      { id: "d2", name: "2GB",        amount: 5000,  validity: "30 days", description: "Monthly plan" },
      { id: "d3", name: "5GB",        amount: 10000, validity: "30 days", description: "Monthly plan" },
      { id: "d4", name: "10GB",       amount: 18000, validity: "30 days", description: "Monthly plan" },
      { id: "d5", name: "20GB",       amount: 30000, validity: "30 days", description: "Monthly plan" },
      { id: "d6", name: "50GB",       amount: 60000, validity: "30 days", description: "Monthly plan" },
    ],
    airtel: [
      { id: "d1", name: "1.5GB",  amount: 3000,  validity: "30 days", description: "Monthly plan" },
      { id: "d2", name: "3GB",    amount: 6000,  validity: "30 days", description: "Monthly plan" },
      { id: "d3", name: "6GB",    amount: 10000, validity: "30 days", description: "Monthly plan" },
      { id: "d4", name: "12GB",   amount: 18000, validity: "30 days", description: "Monthly plan" },
      { id: "d5", name: "25GB",   amount: 35000, validity: "30 days", description: "Monthly plan" },
    ],
  },
};

// ─── Confirm Sheet ────────────────────────────────────────────────────────────
function ConfirmSheet({
  visible, plan, provider, accountNo, customerName,
  loading, statusMessage, onConfirm, onCancel,
}: {
  visible: boolean; plan: Plan | null; provider: ProvKey;
  accountNo: string; customerName: string;
  loading: boolean; statusMessage: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!plan) return null;
  const prov = PROVIDERS[provider];
  return (
    <View style={[cs.overlay, !visible && cs.hidden]} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={cs.backdrop} onPress={loading ? undefined : onCancel} />
      <View style={[cs.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={cs.handle} />
        <Text style={cs.title}>Confirm Purchase</Text>
        <View style={cs.summaryCard}>
          <View style={[cs.provBadge, { backgroundColor: prov.color }]}>
            <Text style={cs.provBadgeTxt}>{prov.initials}</Text>
          </View>
          <View style={cs.summaryInfo}>
            <Text style={cs.summaryName}>{plan.name}</Text>
            {plan.description ? <Text style={cs.summaryDesc}>{plan.description}</Text> : null}
            {plan.validity ? <Text style={cs.summaryValidity}>{plan.validity}</Text> : null}
          </View>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Provider</Text>
          <Text style={cs.detailVal}>{prov.name}</Text>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Phone Number</Text>
          <Text style={cs.detailVal}>{accountNo || "—"}</Text>
        </View>
        {customerName ? (
          <View style={cs.detailRow}>
            <Text style={cs.detailLabel}>Recipient</Text>
            <Text style={cs.detailVal}>{customerName}</Text>
          </View>
        ) : null}
        <View style={[cs.detailRow, cs.detailRowLast]}>
          <Text style={cs.detailLabel}>Amount</Text>
          <Text style={cs.detailAmt}>UGX {plan.amount.toLocaleString()}</Text>
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
          {loading ? (
            <ActivityIndicator color={DARK_GREEN} />
          ) : (
            <Text style={cs.confirmBtnTxt}>Confirm — UGX {plan.amount.toLocaleString()}</Text>
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function BuyScreen() {
  const insets = useSafeAreaInsets();
  const [activeCat,    setActiveCat]    = useState<CatKey>("airtime");
  const [activeProv,   setActiveProv]   = useState<ProvKey>("mtn");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [accountNo,    setAccountNo]    = useState("");
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [balance,      setBalance]      = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [successPlan,  setSuccessPlan]  = useState<Plan | null>(null);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [statusMsg,    setStatusMsg]    = useState("");
  const [customerName, setCustomerName] = useState("");

  const plans = PLANS[activeCat][activeProv];

  async function refreshBalance() {
    setBalanceLoading(true);
    try {
      const res = await relworxApi.walletBalance("UGX");
      setBalance(res.balance);
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }

  useEffect(() => {
    refreshBalance();
  }, []);

  function selectPlan(plan: Plan) {
    if (!accountNo || accountNo.replace(/\D/g, "").length < 9) {
      setErrorMsg("Enter a phone number first.");
      return;
    }
    Haptics.selectionAsync();
    setErrorMsg("");
    setStatusMsg("");
    setCustomerName("");
    setSelectedPlan(plan);
    setSheetOpen(true);
  }

  async function handleConfirm() {
    if (!selectedPlan || loading) return;
    const productCode = BUY_PRODUCT_CODES[activeCat][activeProv];
    if (!productCode) {
      setErrorMsg("This provider isn't supported yet.");
      setSheetOpen(false);
      return;
    }
    const msisdn = formatMsisdn(accountNo);
    setLoading(true);
    setStatusMsg("Validating…");
    try {
      const v = await relworxApi.validateProduct({
        msisdn,
        amount: selectedPlan.amount,
        product_code: productCode,
        contact_phone: msisdn,
      });
      if (v.customer_name) setCustomerName(v.customer_name);
      setStatusMsg("Processing payment…");
      const p = await relworxApi.purchaseProduct(v.validation_reference);
      setStatusMsg("Confirming with the network…");
      const final = await pollRequestStatus(p.internal_reference, {
        timeoutMs: 45000,
      });
      const ok = (final.status ?? "").toLowerCase() === "success";
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessPlan(selectedPlan);
        setSelectedPlan(null);
        setSheetOpen(false);
        setAccountNo("");
        setStatusMsg("");
        refreshBalance();
      } else {
        setStatusMsg(final.message || "Still processing — check Transactions.");
        // leave the sheet open so the user sees the status
      }
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Purchase failed. Please try again.";
      setErrorMsg(msg);
      setStatusMsg("");
      setSheetOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const catLabel = CATS.find((c) => c.key === activeCat)?.label ?? "Airtime";

  return (
    <View style={s.root}>
      {/* ── Balance Header ── */}
      <View style={[s.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 10 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <Text style={s.topBarLabel}>Wallet Balance (Relworx)</Text>
          {balanceLoading ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginTop: 4 }} />
          ) : (
            <Text style={s.topBarBalance}>
              {balance == null ? "UGX —" : `UGX ${balance.toLocaleString()}`}
            </Text>
          )}
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Sub-category Filter (Airtime / Voice / Data) ── */}
      <View style={s.catRow}>
        {CATS.map((cat) => {
          const active = activeCat === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catPill, active && s.catPillActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveCat(cat.key); setSelectedPlan(null); }}
              activeOpacity={0.8}
            >
              <Feather name={cat.icon as any} size={12} color={active ? DARK_GREEN : MUTED} style={{ marginRight: 4 }} />
              <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Provider Switcher ── */}
      <View style={s.provSwitcher}>
        {(["mtn", "airtel"] as ProvKey[]).map((prov) => {
          const active = activeProv === prov;
          const meta = PROVIDERS[prov];
          return (
            <TouchableOpacity
              key={prov}
              style={[s.provTab, active && s.provTabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveProv(prov); setSelectedPlan(null); }}
              activeOpacity={0.8}
            >
              <View style={[s.provDot, { backgroundColor: meta.color }, !active && s.provDotDim]} />
              <Text style={[s.provTabTxt, active && s.provTabTxtActive]}>{meta.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Phone Input ── */}
      <View style={s.inputWrap}>
        <Text style={s.inputLabel}>Phone Number</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. 0772 000 000"
          placeholderTextColor={MUTED}
          value={accountNo}
          onChangeText={setAccountNo}
          keyboardType="phone-pad"
          contextMenuHidden
          selectionColor={LIME}
        />
      </View>

      {/* ── Success Banner ── */}
      {successPlan && (
        <View style={s.successBanner}>
          <Feather name="check-circle" size={16} color={DARK_GREEN} />
          <Text style={s.successTxt}>{successPlan.name} purchased! UGX {successPlan.amount.toLocaleString()} deducted.</Text>
          <TouchableOpacity onPress={() => setSuccessPlan(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={14} color={DARK_GREEN} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Error Banner ── */}
      {!!errorMsg && (
        <View style={s.errorBanner}>
          <Feather name="alert-circle" size={16} color="#7A1A1A" />
          <Text style={s.errorTxt}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => setErrorMsg("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={14} color="#7A1A1A" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Plans List ── */}
      <ScrollView
        style={s.planList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.sectionLabel}>{plans.length} {catLabel} Plans</Text>
        {plans.map((plan, i) => (
          <TouchableOpacity
            key={plan.id}
            style={[s.planRow, i < plans.length - 1 && s.planRowBorder]}
            onPress={() => selectPlan(plan)}
            activeOpacity={0.7}
          >
            <View style={s.planLeft}>
              <Text style={s.planName}>{plan.name}</Text>
              {plan.description ? <Text style={s.planDesc}>{plan.description}</Text> : null}
              {plan.validity ? (
                <View style={s.validityChip}>
                  <Feather name="clock" size={10} color={MUTED} style={{ marginRight: 3 }} />
                  <Text style={s.validityTxt}>{plan.validity}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.planRight}>
              <Text style={s.planAmt}>UGX {plan.amount.toLocaleString()}</Text>
              <View style={s.buyChip}><Text style={s.buyChipTxt}>Buy</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ConfirmSheet
        visible={sheetOpen}
        plan={selectedPlan}
        provider={activeProv}
        accountNo={accountNo}
        customerName={customerName}
        loading={loading}
        statusMessage={statusMsg}
        onConfirm={handleConfirm}
        onCancel={() => { setSheetOpen(false); setStatusMsg(""); }}
      />
      <AppTabBar activeTab="" />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  hidden:    { display: "none" },
  overlay:   { ...StyleSheet.absoluteFillObject, zIndex: 99, justifyContent: "flex-end" },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:     { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  title:     { fontFamily: "Inter_700Bold", fontSize: 18, color: TEXT, marginBottom: 18, textAlign: "center" },
  summaryCard:     { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: BG, borderRadius: 16, padding: 16, marginBottom: 16 },
  provBadge:       { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  provBadgeTxt:    { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  summaryInfo:     { flex: 1 },
  summaryName:     { fontFamily: "Inter_600SemiBold", fontSize: 15, color: TEXT, marginBottom: 2 },
  summaryDesc:     { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED },
  summaryValidity: { fontFamily: "Inter_500Medium", fontSize: 11, color: DARK_GREEN, marginTop: 2 },
  detailRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SEP },
  detailRowLast:   { borderBottomWidth: 0, marginBottom: 20 },
  detailLabel:     { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED },
  detailVal:       { fontFamily: "Inter_500Medium", fontSize: 13, color: TEXT },
  detailAmt:       { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  confirmBtn:      { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  confirmBtnDim:   { opacity: 0.6 },
  confirmBtnTxt:   { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  cancelBtn:       { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:    { fontFamily: "Inter_500Medium", fontSize: 14, color: MUTED },
  statusBox:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0F4F0", borderRadius: 12, padding: 12, marginBottom: 12 },
  statusTxt:       { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
});

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  topBar:       { backgroundColor: DARK_GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 3 },
  topBarBalance:{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.5 },
  catRow:    { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  catPill:        { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 10, paddingVertical: 9, borderRadius: 12, backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER },
  catPillActive:  { backgroundColor: LIME, borderColor: LIME },
  catLabel:       { fontFamily: "Inter_500Medium", fontSize: 12, color: MUTED },
  catLabelActive: { color: DARK_GREEN, fontFamily: "Inter_600SemiBold" },
  provSwitcher:    { flexDirection: "row", marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  provTab:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 11, borderRadius: 11 },
  provTabActive:   { backgroundColor: DARK_GREEN },
  provDot:         { width: 10, height: 10, borderRadius: 5 },
  provDotDim:      { opacity: 0.5 },
  provTabTxt:      { fontFamily: "Inter_500Medium", fontSize: 13, color: MUTED },
  provTabTxtActive:{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  inputWrap:  { marginHorizontal: 16, marginBottom: 12 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:      { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCF8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  successTxt:    { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
  errorBanner:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FCE8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  errorTxt:      { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: "#7A1A1A" },
  sectionLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, paddingHorizontal: 16, paddingVertical: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  planList:      { flex: 1, backgroundColor: CARD, marginHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: BORDER },
  planRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  planRowBorder: { borderBottomWidth: 1, borderBottomColor: SEP },
  planLeft:      { flex: 1, gap: 3 },
  planName:      { fontFamily: "Inter_600SemiBold", fontSize: 14, color: TEXT },
  planDesc:      { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED },
  validityChip:  { flexDirection: "row", alignItems: "center", marginTop: 2 },
  validityTxt:   { fontFamily: "Inter_400Regular", fontSize: 10, color: MUTED },
  planRight:     { alignItems: "flex-end", gap: 6 },
  planAmt:       { fontFamily: "Inter_700Bold", fontSize: 14, color: TEXT },
  buyChip:       { backgroundColor: LIME, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  buyChipTxt:    { fontFamily: "Inter_600SemiBold", fontSize: 11, color: DARK_GREEN },
});
