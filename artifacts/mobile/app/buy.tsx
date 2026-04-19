import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
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
import { router, useLocalSearchParams } from "expo-router";
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
type CatKey = "airtime" | "voice" | "data" | "tv" | "utilities";
type ProvKey = "mtn" | "airtel";

interface Plan {
  id: string;
  name: string;
  amount: number;
  validity?: string;
  description?: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────
const CATS: { key: CatKey; label: string; icon: string }[] = [
  { key: "airtime",   label: "Airtime",     icon: "phone" },
  { key: "voice",     label: "Voice",        icon: "mic" },
  { key: "data",      label: "Data Bundle",  icon: "wifi" },
  { key: "tv",        label: "TV",           icon: "tv" },
  { key: "utilities", label: "Utilities",    icon: "zap" },
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
      { id: "a1", name: "UGX 500 Airtime",    amount: 500   },
      { id: "a2", name: "UGX 1,000 Airtime",  amount: 1000  },
      { id: "a3", name: "UGX 2,000 Airtime",  amount: 2000  },
      { id: "a4", name: "UGX 5,000 Airtime",  amount: 5000  },
      { id: "a5", name: "UGX 10,000 Airtime", amount: 10000 },
      { id: "a6", name: "UGX 20,000 Airtime", amount: 20000 },
    ],
    airtel: [
      { id: "a1", name: "UGX 500 Airtime",    amount: 500   },
      { id: "a2", name: "UGX 1,000 Airtime",  amount: 1000  },
      { id: "a3", name: "UGX 2,000 Airtime",  amount: 2000  },
      { id: "a4", name: "UGX 5,000 Airtime",  amount: 5000  },
      { id: "a5", name: "UGX 10,000 Airtime", amount: 10000 },
      { id: "a6", name: "UGX 20,000 Airtime", amount: 20000 },
    ],
  },
  voice: {
    mtn: [
      { id: "v1", name: "MTN Voice 1,000",  amount: 1000,  validity: "7 days",  description: "150 on-net mins + 50MB data" },
      { id: "v2", name: "MTN Voice 3,000",  amount: 3000,  validity: "30 days", description: "500 on-net mins + 200MB data" },
      { id: "v3", name: "MTN Voice 5,000",  amount: 5000,  validity: "30 days", description: "1,000 on-net mins + 500MB data" },
      { id: "v4", name: "MTN Voice 10,000", amount: 10000, validity: "30 days", description: "Unlimited on-net + 1GB data" },
    ],
    airtel: [
      { id: "v1", name: "Airtel TalkMore 1,000",  amount: 1000,  validity: "7 days",  description: "100 on-net + 30 off-net mins" },
      { id: "v2", name: "Airtel TalkMore 3,000",  amount: 3000,  validity: "30 days", description: "400 on-net + 100 off-net mins" },
      { id: "v3", name: "Airtel TalkMore 5,000",  amount: 5000,  validity: "30 days", description: "800 on-net + 200 off-net mins" },
      { id: "v4", name: "Airtel TalkMore 10,000", amount: 10000, validity: "30 days", description: "Unlimited on-net + 300 off-net mins" },
    ],
  },
  data: {
    mtn: [
      { id: "d1", name: "MTN 1GB",   amount: 3000,  validity: "1 day",   description: "Daily plan" },
      { id: "d2", name: "MTN 2GB",   amount: 5000,  validity: "30 days", description: "Monthly plan" },
      { id: "d3", name: "MTN 5GB",   amount: 10000, validity: "30 days", description: "Monthly plan" },
      { id: "d4", name: "MTN 10GB",  amount: 18000, validity: "30 days", description: "Monthly plan" },
      { id: "d5", name: "MTN 20GB",  amount: 30000, validity: "30 days", description: "Monthly plan" },
      { id: "d6", name: "MTN 50GB",  amount: 60000, validity: "30 days", description: "Monthly plan" },
    ],
    airtel: [
      { id: "d1", name: "Airtel 1.5GB",  amount: 3000,  validity: "30 days", description: "Monthly plan" },
      { id: "d2", name: "Airtel 3GB",    amount: 6000,  validity: "30 days", description: "Monthly plan" },
      { id: "d3", name: "Airtel 6GB",    amount: 10000, validity: "30 days", description: "Monthly plan" },
      { id: "d4", name: "Airtel 12GB",   amount: 18000, validity: "30 days", description: "Monthly plan" },
      { id: "d5", name: "Airtel 25GB",   amount: 35000, validity: "30 days", description: "Monthly plan" },
    ],
  },
  tv: {
    mtn: [
      { id: "t1", name: "Padi",     amount: 15000,  validity: "1 month", description: "Local & African channels" },
      { id: "t2", name: "Compact",  amount: 55000,  validity: "1 month", description: "International channels" },
      { id: "t3", name: "Premium",  amount: 150000, validity: "1 month", description: "All channels included" },
    ],
    airtel: [
      { id: "t1", name: "Jinja",   amount: 18000, validity: "1 month", description: "Entertainment channels" },
      { id: "t2", name: "Jolli",   amount: 30000, validity: "1 month", description: "Sports included" },
      { id: "t3", name: "Supa",    amount: 44000, validity: "1 month", description: "Premium channels" },
    ],
  },
  utilities: {
    mtn: [
      { id: "u1", name: "UMEME UGX 5,000",   amount: 5000,  description: "Prepaid electricity token" },
      { id: "u2", name: "UMEME UGX 10,000",  amount: 10000, description: "Prepaid electricity token" },
      { id: "u3", name: "UMEME UGX 20,000",  amount: 20000, description: "Prepaid electricity token" },
      { id: "u4", name: "UMEME UGX 50,000",  amount: 50000, description: "Prepaid electricity token" },
      { id: "u5", name: "UMEME UGX 100,000", amount: 100000, description: "Prepaid electricity token" },
    ],
    airtel: [
      { id: "u1", name: "Water UGX 5,000",   amount: 5000,  description: "NWSC water utility" },
      { id: "u2", name: "Water UGX 10,000",  amount: 10000, description: "NWSC water utility" },
      { id: "u3", name: "Water UGX 20,000",  amount: 20000, description: "NWSC water utility" },
      { id: "u4", name: "Water UGX 50,000",  amount: 50000, description: "NWSC water utility" },
    ],
  },
};

// ─── Confirm Sheet ────────────────────────────────────────────────────────────
function ConfirmSheet({
  visible,
  plan,
  provider,
  accountNo,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  plan: Plan | null;
  provider: ProvKey;
  accountNo: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!plan) return null;
  const prov = PROVIDERS[provider];

  return (
    <View style={[cs.overlay, !visible && cs.hidden]} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={cs.backdrop} onPress={onCancel} />
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
          <Text style={cs.detailLabel}>Phone / Account</Text>
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

export default function BuyScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cat?: string }>();

  const defaultCat = (params.cat as CatKey) ?? "airtime";
  const [activeCat,  setActiveCat]  = useState<CatKey>(defaultCat);
  const [activeProv, setActiveProv] = useState<ProvKey>("mtn");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [accountNo, setAccountNo]       = useState("");
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [balance, setBalance]           = useState(INITIAL_BALANCE);
  const [successPlan, setSuccessPlan]   = useState<Plan | null>(null);

  const plans = PLANS[activeCat][activeProv];

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
    setSelectedPlan(null);
    setSheetOpen(false);
    setAccountNo("");
  }

  return (
    <View style={s.root}>
      {/* ── Balance Header (same as send/receive) ── */}
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

      {/* ── Category Filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={s.catScroll}
      >
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
      </ScrollView>

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

      {/* ── Account Input ── */}
      <View style={s.inputWrap}>
        <Text style={s.inputLabel}>
          {activeCat === "tv" ? "Smart Card / IUC Number" :
           activeCat === "utilities" ? "Meter Number" : "Phone Number"}
        </Text>
        <TextInput
          style={s.input}
          placeholder={
            activeCat === "tv" ? "Enter card number" :
            activeCat === "utilities" ? "Enter meter number" : "e.g. 0772 000 000"
          }
          placeholderTextColor={MUTED}
          value={accountNo}
          onChangeText={setAccountNo}
          keyboardType={activeCat === "tv" || activeCat === "utilities" ? "number-pad" : "phone-pad"}
          contextMenuHidden
          selectionColor={LIME}
        />
      </View>

      {/* ── Success Banner ── */}
      {successPlan && (
        <View style={s.successBanner}>
          <Feather name="check-circle" size={16} color={DARK_GREEN} />
          <Text style={s.successTxt}>
            {successPlan.name} purchased! UGX {successPlan.amount.toLocaleString()} deducted.
          </Text>
          <TouchableOpacity onPress={() => setSuccessPlan(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
        <Text style={s.sectionLabel}>{plans.length} Plans Available</Text>
        {plans.map((plan, i) => {
          const isLast = i === plans.length - 1;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[s.planRow, !isLast && s.planRowBorder]}
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
                <View style={s.buyChip}>
                  <Text style={s.buyChipTxt}>Buy</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Confirm Sheet ── */}
      <ConfirmSheet
        visible={sheetOpen}
        plan={selectedPlan}
        provider={activeProv}
        accountNo={accountNo}
        onConfirm={handleConfirm}
        onCancel={() => setSheetOpen(false)}
      />

      {/* ── Bottom Tab Bar ── */}
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

  summaryCard:  { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: BG, borderRadius: 16, padding: 16, marginBottom: 16 },
  provBadge:    { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  provBadgeTxt: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  summaryInfo:  { flex: 1 },
  summaryName:  { fontFamily: "Inter_600SemiBold", fontSize: 15, color: TEXT, marginBottom: 2 },
  summaryDesc:  { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED },
  summaryValidity: { fontFamily: "Inter_500Medium", fontSize: 11, color: DARK_GREEN, marginTop: 2 },

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
  root: { flex: 1, backgroundColor: BG },

  // Top bar
  topBar:       { backgroundColor: DARK_GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 3 },
  topBarBalance:{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.5 },

  // Category scroll
  catScroll: { flexGrow: 0, marginBottom: 14 },
  catRow:    { paddingHorizontal: 16, gap: 8, flexDirection: "row" },
  catPill:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER },
  catPillActive:  { backgroundColor: LIME, borderColor: LIME },
  catLabel:       { fontFamily: "Inter_500Medium", fontSize: 12, color: MUTED },
  catLabelActive: { color: DARK_GREEN, fontFamily: "Inter_600SemiBold" },

  // Provider switcher
  provSwitcher:    { flexDirection: "row", marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  provTab:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 11, borderRadius: 11 },
  provTabActive:   { backgroundColor: DARK_GREEN },
  provDot:         { width: 10, height: 10, borderRadius: 5 },
  provDotDim:      { opacity: 0.5 },
  provTabTxt:      { fontFamily: "Inter_500Medium", fontSize: 13, color: MUTED },
  provTabTxtActive:{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },

  // Account input
  inputWrap:  { marginHorizontal: 16, marginBottom: 12 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:      { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14 },

  // Success banner
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCF8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  successTxt:    { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },

  // Plans
  sectionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, marginBottom: 0, paddingHorizontal: 16, paddingVertical: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  planList:     { flex: 1, backgroundColor: CARD, marginHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: BORDER },
  planRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  planRowBorder:{ borderBottomWidth: 1, borderBottomColor: SEP },
  planLeft:     { flex: 1, gap: 3 },
  planName:     { fontFamily: "Inter_600SemiBold", fontSize: 14, color: TEXT },
  planDesc:     { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED },
  validityChip: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  validityTxt:  { fontFamily: "Inter_400Regular", fontSize: 10, color: MUTED },
  planRight:    { alignItems: "flex-end", gap: 6 },
  planAmt:      { fontFamily: "Inter_700Bold", fontSize: 14, color: TEXT },
  buyChip:      { backgroundColor: LIME, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  buyChipTxt:   { fontFamily: "Inter_600SemiBold", fontSize: 11, color: DARK_GREEN },
});
