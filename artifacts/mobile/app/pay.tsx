import React, { useState } from "react";
import {
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

// ─── Types ───────────────────────────────────────────────────────────────────
type CatKey = "tv" | "electricity" | "water";

interface Plan {
  id: string;
  name: string;
  amount: number;
  validity?: string;
  description?: string;
}

interface Provider {
  id: string;
  name: string;
  initials: string;
  color: string;
  inputLabel: string;
  inputPlaceholder: string;
  plans: Plan[];
}

// ─── Categories ──────────────────────────────────────────────────────────────
const CATS: { key: CatKey; label: string; icon: string }[] = [
  { key: "tv",          label: "TV / Cable",   icon: "tv"   },
  { key: "electricity", label: "Electricity",  icon: "zap"  },
  { key: "water",       label: "Water",        icon: "droplet" },
];

// ─── Providers Data ───────────────────────────────────────────────────────────
const PROVIDERS: Record<CatKey, Provider[]> = {
  tv: [
    {
      id: "dstv", name: "DStv", initials: "DST", color: "#0055AA",
      inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      plans: [
        { id: "t1", name: "Padi",     amount: 15000,  validity: "1 month", description: "Local & African channels" },
        { id: "t2", name: "Yanga",    amount: 22000,  validity: "1 month", description: "More local content" },
        { id: "t3", name: "Confam",   amount: 31000,  validity: "1 month", description: "African content + news" },
        { id: "t4", name: "Compact",  amount: 55000,  validity: "1 month", description: "International channels" },
        { id: "t5", name: "Compact+", amount: 87000,  validity: "1 month", description: "Sports & premium content" },
        { id: "t6", name: "Premium",  amount: 151000, validity: "1 month", description: "All channels included" },
      ],
    },
    {
      id: "gotv", name: "GOtv", initials: "GOT", color: "#0088DD",
      inputLabel: "IUC Number", inputPlaceholder: "Enter IUC number",
      plans: [
        { id: "t1", name: "Lite",   amount: 5500,  validity: "1 month", description: "Basic channels" },
        { id: "t2", name: "Jinja",  amount: 18000, validity: "1 month", description: "Entertainment channels" },
        { id: "t3", name: "Jolli",  amount: 30000, validity: "1 month", description: "Sports included" },
        { id: "t4", name: "Supa",   amount: 44000, validity: "1 month", description: "Premium channels" },
        { id: "t5", name: "Supa+",  amount: 58500, validity: "1 month", description: "All GOtv channels" },
      ],
    },
    {
      id: "startimes", name: "StarTimes", initials: "STR", color: "#AA0000",
      inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      plans: [
        { id: "t1", name: "Nova",    amount: 5500,  validity: "1 month", description: "Local channels" },
        { id: "t2", name: "Basic",   amount: 10500, validity: "1 month", description: "More channels" },
        { id: "t3", name: "Smart",   amount: 13500, validity: "1 month", description: "Bollywood + local" },
        { id: "t4", name: "Classic", amount: 15500, validity: "1 month", description: "Sports + movies" },
        { id: "t5", name: "Super",   amount: 23500, validity: "1 month", description: "All channels" },
      ],
    },
    {
      id: "showmax", name: "Showmax", initials: "SHO", color: "#7B0000",
      inputLabel: "Email Address", inputPlaceholder: "Enter email address",
      plans: [
        { id: "t1", name: "Mobile",            amount: 7500,  validity: "1 month", description: "Mobile only" },
        { id: "t2", name: "Standard",          amount: 17500, validity: "1 month", description: "Any device" },
        { id: "t3", name: "Standard + Sports", amount: 26500, validity: "1 month", description: "All content + Live sports" },
      ],
    },
  ],
  electricity: [
    {
      id: "umeme", name: "UMEME", initials: "UME", color: "#FF6600",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "e1", name: "UGX 5,000",   amount: 5000,   description: "Prepaid electricity token" },
        { id: "e2", name: "UGX 10,000",  amount: 10000,  description: "Prepaid electricity token" },
        { id: "e3", name: "UGX 20,000",  amount: 20000,  description: "Prepaid electricity token" },
        { id: "e4", name: "UGX 50,000",  amount: 50000,  description: "Prepaid electricity token" },
        { id: "e5", name: "UGX 100,000", amount: 100000, description: "Prepaid electricity token" },
        { id: "e6", name: "UGX 200,000", amount: 200000, description: "Prepaid electricity token" },
      ],
    },
    {
      id: "wenreco", name: "WENRECO", initials: "WEN", color: "#CC5500",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "e1", name: "UGX 5,000",   amount: 5000,   description: "Prepaid electricity token" },
        { id: "e2", name: "UGX 10,000",  amount: 10000,  description: "Prepaid electricity token" },
        { id: "e3", name: "UGX 20,000",  amount: 20000,  description: "Prepaid electricity token" },
        { id: "e4", name: "UGX 50,000",  amount: 50000,  description: "Prepaid electricity token" },
        { id: "e5", name: "UGX 100,000", amount: 100000, description: "Prepaid electricity token" },
      ],
    },
    {
      id: "ferdsult", name: "FERDSULT", initials: "FER", color: "#884400",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "e1", name: "UGX 5,000",  amount: 5000,  description: "Prepaid electricity token" },
        { id: "e2", name: "UGX 10,000", amount: 10000, description: "Prepaid electricity token" },
        { id: "e3", name: "UGX 20,000", amount: 20000, description: "Prepaid electricity token" },
        { id: "e4", name: "UGX 50,000", amount: 50000, description: "Prepaid electricity token" },
      ],
    },
  ],
  water: [
    {
      id: "nwsc", name: "NWSC", initials: "NWS", color: "#0066CC",
      inputLabel: "Account Number", inputPlaceholder: "Enter NWSC account number",
      plans: [
        { id: "w1", name: "UGX 5,000",   amount: 5000,   description: "Prepaid water credit" },
        { id: "w2", name: "UGX 10,000",  amount: 10000,  description: "Prepaid water credit" },
        { id: "w3", name: "UGX 20,000",  amount: 20000,  description: "Prepaid water credit" },
        { id: "w4", name: "UGX 50,000",  amount: 50000,  description: "Prepaid water credit" },
        { id: "w5", name: "UGX 100,000", amount: 100000, description: "Prepaid water credit" },
      ],
    },
    {
      id: "umbrella", name: "Umbrella Water", initials: "UMB", color: "#336699",
      inputLabel: "Account Number", inputPlaceholder: "Enter account number",
      plans: [
        { id: "w1", name: "UGX 5,000",  amount: 5000,  description: "Prepaid water credit" },
        { id: "w2", name: "UGX 10,000", amount: 10000, description: "Prepaid water credit" },
        { id: "w3", name: "UGX 20,000", amount: 20000, description: "Prepaid water credit" },
        { id: "w4", name: "UGX 50,000", amount: 50000, description: "Prepaid water credit" },
      ],
    },
  ],
};

// ─── Confirm Sheet ────────────────────────────────────────────────────────────
function ConfirmSheet({
  visible, plan, provider, accountNo, onConfirm, onCancel,
}: {
  visible: boolean; plan: Plan | null; provider: Provider | null;
  accountNo: string; onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!plan || !provider) return null;
  return (
    <View style={[cs.overlay, !visible && cs.hidden]} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={cs.backdrop} onPress={onCancel} />
      <View style={[cs.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={cs.handle} />
        <Text style={cs.title}>Confirm Payment</Text>
        <View style={cs.summaryCard}>
          <View style={[cs.provBadge, { backgroundColor: provider.color }]}>
            <Text style={cs.provBadgeTxt}>{provider.initials}</Text>
          </View>
          <View style={cs.summaryInfo}>
            <Text style={cs.summaryName}>{provider.name} — {plan.name}</Text>
            {plan.description ? <Text style={cs.summaryDesc}>{plan.description}</Text> : null}
            {plan.validity ? <Text style={cs.summaryValidity}>{plan.validity}</Text> : null}
          </View>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Provider</Text>
          <Text style={cs.detailVal}>{provider.name}</Text>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>{provider.inputLabel}</Text>
          <Text style={cs.detailVal}>{accountNo || "—"}</Text>
        </View>
        <View style={[cs.detailRow, cs.detailRowLast]}>
          <Text style={cs.detailLabel}>Amount</Text>
          <Text style={cs.detailAmt}>UGX {plan.amount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={cs.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
          <Text style={cs.confirmBtnTxt}>Confirm — UGX {plan.amount.toLocaleString()}</Text>
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

export default function PayScreen() {
  const insets = useSafeAreaInsets();
  const [activeCat,      setActiveCat]      = useState<CatKey>("tv");
  const [activeProv,     setActiveProv]     = useState<Provider>(PROVIDERS["tv"][0]);
  const [selectedPlan,   setSelectedPlan]   = useState<Plan | null>(null);
  const [accountNo,      setAccountNo]      = useState("");
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [balance,        setBalance]        = useState(INITIAL_BALANCE);
  const [successPlan,    setSuccessPlan]    = useState<Plan | null>(null);
  const [successProv,    setSuccessProv]    = useState<Provider | null>(null);

  const providerList = PROVIDERS[activeCat];

  function switchCat(cat: CatKey) {
    Haptics.selectionAsync();
    setActiveCat(cat);
    setActiveProv(PROVIDERS[cat][0]);
    setSelectedPlan(null);
    setAccountNo("");
  }

  function switchProv(prov: Provider) {
    Haptics.selectionAsync();
    setActiveProv(prov);
    setSelectedPlan(null);
  }

  function selectPlan(plan: Plan) {
    Haptics.selectionAsync();
    setSelectedPlan(plan);
    setSheetOpen(true);
  }

  function handleConfirm() {
    if (!selectedPlan) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBalance((b) => b - selectedPlan.amount);
    setSuccessPlan(selectedPlan);
    setSuccessProv(activeProv);
    setSelectedPlan(null);
    setSheetOpen(false);
    setAccountNo("");
  }

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

      {/* ── Category Tabs ── */}
      <View style={s.catRow}>
        {CATS.map((cat) => {
          const active = activeCat === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catPill, active && s.catPillActive]}
              onPress={() => switchCat(cat.key)}
              activeOpacity={0.8}
            >
              <Feather name={cat.icon as any} size={12} color={active ? DARK_GREEN : MUTED} style={{ marginRight: 4 }} />
              <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Provider Selector ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.provRow}
        style={{ flexGrow: 0, marginBottom: 14 }}
      >
        {providerList.map((prov) => {
          const active = activeProv.id === prov.id;
          return (
            <TouchableOpacity
              key={prov.id}
              style={[s.provChip, active && s.provChipActive]}
              onPress={() => switchProv(prov)}
              activeOpacity={0.8}
            >
              <View style={[s.provDot, { backgroundColor: prov.color }]} />
              <Text style={[s.provChipTxt, active && s.provChipTxtActive]}>{prov.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Account Input ── */}
      <View style={s.inputWrap}>
        <Text style={s.inputLabel}>{activeProv.inputLabel}</Text>
        <TextInput
          style={s.input}
          placeholder={activeProv.inputPlaceholder}
          placeholderTextColor={MUTED}
          value={accountNo}
          onChangeText={setAccountNo}
          keyboardType={activeProv.inputLabel === "Email Address" ? "email-address" : "number-pad"}
          contextMenuHidden
          selectionColor={LIME}
        />
      </View>

      {/* ── Success Banner ── */}
      {successPlan && successProv && (
        <View style={s.successBanner}>
          <Feather name="check-circle" size={16} color={DARK_GREEN} />
          <Text style={s.successTxt}>{successProv.name} {successPlan.name} paid! UGX {successPlan.amount.toLocaleString()} deducted.</Text>
          <TouchableOpacity onPress={() => { setSuccessPlan(null); setSuccessProv(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={14} color={DARK_GREEN} />
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
        <Text style={s.sectionLabel}>{activeProv.plans.length} Plans Available</Text>
        {activeProv.plans.map((plan, i) => (
          <TouchableOpacity
            key={plan.id}
            style={[s.planRow, i < activeProv.plans.length - 1 && s.planRowBorder]}
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
              <View style={s.payChip}><Text style={s.payChipTxt}>Pay</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ConfirmSheet
        visible={sheetOpen}
        plan={selectedPlan}
        provider={activeProv}
        accountNo={accountNo}
        onConfirm={handleConfirm}
        onCancel={() => setSheetOpen(false)}
      />
      <AppTabBar activeTab="" />
    </View>
  );
}

// ─── Confirm Sheet Styles ─────────────────────────────────────────────────────
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
  summaryName:     { fontFamily: "Inter_600SemiBold", fontSize: 14, color: TEXT, marginBottom: 2 },
  summaryDesc:     { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED },
  summaryValidity: { fontFamily: "Inter_500Medium", fontSize: 11, color: DARK_GREEN, marginTop: 2 },
  detailRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SEP },
  detailRowLast:   { borderBottomWidth: 0, marginBottom: 20 },
  detailLabel:     { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED },
  detailVal:       { fontFamily: "Inter_500Medium", fontSize: 13, color: TEXT },
  detailAmt:       { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  confirmBtn:      { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  confirmBtnTxt:   { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
  cancelBtn:       { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:    { fontFamily: "Inter_500Medium", fontSize: 14, color: MUTED },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  topBar:       { backgroundColor: DARK_GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 3 },
  topBarBalance:{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.5 },
  catRow:    { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  catPill:        { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER },
  catPillActive:  { backgroundColor: LIME, borderColor: LIME },
  catLabel:       { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED },
  catLabelActive: { color: DARK_GREEN, fontFamily: "Inter_600SemiBold" },
  provRow:     { paddingHorizontal: 16, gap: 8, flexDirection: "row" },
  provChip:        { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER },
  provChipActive:  { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  provDot:         { width: 9, height: 9, borderRadius: 5 },
  provChipTxt:     { fontFamily: "Inter_500Medium", fontSize: 12, color: MUTED },
  provChipTxtActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  inputWrap:  { marginHorizontal: 16, marginBottom: 12 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:      { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCF8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  successTxt:    { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
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
  payChip:       { backgroundColor: "#DCF8E6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  payChipTxt:    { fontFamily: "Inter_600SemiBold", fontSize: 11, color: DARK_GREEN },
});
