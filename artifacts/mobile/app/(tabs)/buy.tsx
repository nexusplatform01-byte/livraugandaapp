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
  type PriceListItem,
} from "@/lib/relworx";
import { ApiError } from "@/lib/api";
import { AIRTIME_CODES, INTERNET_CODES, VOICE_CODES } from "@/lib/productCodes";
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

type CatKey  = "airtime" | "voice" | "data";
type ProvKey = "mtn" | "airtel" | "utl" | "roke";

interface Plan {
  code: string;
  name: string;
  amount: number;
}

const CATS: { key: CatKey; label: string; icon: string }[] = [
  { key: "airtime", label: "Airtime",     icon: "phone" },
  { key: "voice",   label: "Voice",       icon: "mic"   },
  { key: "data",    label: "Data Bundle", icon: "wifi"  },
];

const PROVIDERS: Record<ProvKey, { name: string; color: string; initials: string }> = {
  mtn:    { name: "MTN Uganda",    color: "#C8960A", initials: "MTN" },
  airtel: { name: "Airtel Uganda", color: "#C0392B", initials: "AIR" },
  utl:    { name: "UTL Uganda",    color: "#3F51B5", initials: "UTL" },
  roke:   { name: "Roke Telecom",  color: "#1B7A3D", initials: "RTU" },
};

function providersFor(cat: CatKey): ProvKey[] {
  if (cat === "airtime") return ["mtn", "airtel", "utl"];
  if (cat === "voice")   return ["mtn", "airtel"];
  return ["mtn", "airtel", "roke"];
}

function productCodeFor(cat: CatKey, prov: ProvKey): string | null {
  if (cat === "airtime") return AIRTIME_CODES[prov] ?? null;
  if (cat === "voice")   return VOICE_CODES[prov] ?? null;
  if (cat === "data")    return INTERNET_CODES[prov] ?? null;
  return null;
}

const AIRTIME_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000, 50000];

function ConfirmSheet({
  visible, plan, providerName, recipient, customerName,
  loading, statusMessage, onConfirm, onCancel,
}: {
  visible: boolean; plan: Plan | null; providerName: string;
  recipient: string; customerName: string;
  loading: boolean; statusMessage: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!plan) return null;
  return (
    <View style={[cs.overlay, !visible && cs.hidden]} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={cs.backdrop} onPress={loading ? undefined : onCancel} />
      <View style={[cs.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={cs.handle} />
        <Text style={cs.title}>Confirm Purchase</Text>
        <View style={cs.summaryCard}>
          <View style={cs.summaryInfo}>
            <Text style={cs.summaryName}>{providerName}</Text>
            <Text style={cs.summaryDesc}>{plan.name}</Text>
          </View>
          <Text style={cs.summaryAmt}>UGX {plan.amount.toLocaleString()}</Text>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Phone</Text>
          <Text style={cs.detailVal}>{recipient || "—"}</Text>
        </View>
        {customerName ? (
          <View style={cs.detailRow}>
            <Text style={cs.detailLabel}>Account</Text>
            <Text style={cs.detailVal}>{customerName}</Text>
          </View>
        ) : null}
        <View style={[cs.detailRow, cs.detailRowLast]}>
          <Text style={cs.detailLabel}>Total</Text>
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

export default function BuyScreen() {
  const insets = useSafeAreaInsets();
  const { balanceUGX, deductBalance } = useAuth();
  const [activeCat,  setActiveCat]  = useState<CatKey>("airtime");
  const [activeProv, setActiveProv] = useState<ProvKey>("mtn");
  const [phone,      setPhone]      = useState("");
  const [airtimeAmt, setAirtimeAmt] = useState<number | null>(null);
  const [airtimeCustom, setAirtimeCustom] = useState<string>("");

  const [plans,        setPlans]        = useState<PriceListItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError,   setPlansError]   = useState<string>("");

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [statusMsg,    setStatusMsg]    = useState("");
  const [customerName, setCustomerName] = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  const productCode = productCodeFor(activeCat, activeProv);
  const providerName = PROVIDERS[activeProv].name;

  // Fetch price list when category/provider changes (voice/data only).
  useEffect(() => {
    setPlans([]);
    setPlansError("");
    if (activeCat === "airtime" || !productCode) return;
    let cancelled = false;
    setPlansLoading(true);
    relworxApi.priceList(productCode)
      .then((res) => {
        if (cancelled) return;
        const list = (res.price_list ?? []).filter((p) => p && p.code && p.price > 0);
        // De-dupe by code
        const seen = new Set<string>();
        setPlans(list.filter((p) => seen.has(p.code) ? false : (seen.add(p.code), true)));
      })
      .catch((e) => {
        if (cancelled) return;
        setPlansError(e instanceof ApiError ? e.message : "Couldn't load bundles.");
      })
      .finally(() => { if (!cancelled) setPlansLoading(false); });
    return () => { cancelled = true; };
  }, [activeCat, productCode]);

  function switchCat(cat: CatKey) {
    Haptics.selectionAsync();
    setActiveCat(cat);
    const list = providersFor(cat);
    if (!list.includes(activeProv)) setActiveProv(list[0]);
    setAirtimeAmt(null);
    setAirtimeCustom("");
  }

  function pickAirtime(amt: number) {
    if (!productCode) {
      setErrorMsg("This network isn't supported.");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Enter the phone number to top up first.");
      return;
    }
    setErrorMsg("");
    setStatusMsg("");
    setCustomerName("");
    setAirtimeAmt(amt);
    setSelectedPlan({ code: productCode, name: `Airtime UGX ${amt.toLocaleString()}`, amount: amt });
    setSheetOpen(true);
  }

  function pickBundle(p: PriceListItem) {
    if (!productCode) return;
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Enter the phone number to top up first.");
      return;
    }
    setErrorMsg("");
    setStatusMsg("");
    setCustomerName("");
    setSelectedPlan({ code: p.code, name: p.name, amount: p.price });
    setSheetOpen(true);
  }

  async function handleConfirm() {
    if (!selectedPlan || loading) return;
    if (selectedPlan.amount > balanceUGX) {
      setErrorMsg(`Insufficient wallet balance. You need UGX ${selectedPlan.amount.toLocaleString()} but have UGX ${balanceUGX.toLocaleString()}.`);
      setSheetOpen(false);
      return;
    }
    const msisdn = formatMsisdn(phone);
    setUserPhone(msisdn).catch(() => {});
    setLoading(true);
    setStatusMsg("Processing from wallet…");
    try {
      const v = await relworxApi.validateProduct({
        msisdn,
        amount: selectedPlan.amount,
        product_code: selectedPlan.code,
        contact_phone: msisdn,
      });
      if (v.customer_name) setCustomerName(v.customer_name);
      setStatusMsg("Fulfilling your order…");
      const p = await relworxApi.purchaseProduct(v.validation_reference);
      setStatusMsg("Confirming…");
      const final = await pollRequestStatus(p.internal_reference, { timeoutMs: 75000 });
      const ok = (final.status ?? "").toLowerCase() === "success";
      if (ok) {
        await deductBalance(
          selectedPlan.amount,
          `${selectedPlan.name} — ${PROVIDERS[activeProv].name}`,
          "Airtime",
          "phone",
          "#FF9F43",
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMsg(`${selectedPlan.name} sent to ${msisdn}.`);
        setSheetOpen(false);
        setSelectedPlan(null);
        setStatusMsg("");
        setAirtimeAmt(null);
        setAirtimeCustom("");
      } else {
        setStatusMsg(final.message || "Still processing — check Transactions.");
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Purchase failed. Please try again.";
      setErrorMsg(msg);
      setStatusMsg("");
      setSheetOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  function tryCustomAirtime() {
    const n = Number((airtimeCustom || "").replace(/[^0-9.]/g, ""));
    if (!n || n < 100) {
      setErrorMsg("Enter at least UGX 100.");
      return;
    }
    pickAirtime(Math.round(n));
  }

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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Category tabs */}
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

        {/* Provider chips */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.provRow}
          style={{ flexGrow: 0, marginBottom: 14 }}
        >
          {providersFor(activeCat).map((pid) => {
            const meta = PROVIDERS[pid];
            const active = activeProv === pid;
            return (
              <TouchableOpacity
                key={pid}
                style={[s.provChip, active && s.provChipActive]}
                onPress={() => { Haptics.selectionAsync(); setActiveProv(pid); }}
                activeOpacity={0.8}
              >
                <View style={[s.provDot, { backgroundColor: meta.color }]} />
                <Text style={[s.provChipTxt, active && s.provChipTxtActive]}>{meta.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Phone field */}
        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>Phone Number to Top Up</Text>
          <TextInput
            style={s.input}
            placeholder="0701 454 887"
            placeholderTextColor={MUTED}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            selectionColor={LIME}
          />
          <Text style={s.helper}>This is also the mobile-money number that will be charged.</Text>
        </View>

        {/* Success / error banners */}
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

        {/* Airtime section */}
        {activeCat === "airtime" && (
          <View style={s.planList}>
            <Text style={s.sectionLabel}>Quick Top-Up</Text>
            <View style={s.amtGrid}>
              {AIRTIME_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[s.amtPill, airtimeAmt === amt && s.amtPillActive]}
                  onPress={() => pickAirtime(amt)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.amtPillTxt, airtimeAmt === amt && s.amtPillTxtActive]}>
                    {amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.inputLabel, { paddingHorizontal: 16, marginTop: 14 }]}>Custom Amount</Text>
            <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter amount in UGX"
                placeholderTextColor={MUTED}
                value={airtimeCustom}
                onChangeText={setAirtimeCustom}
                keyboardType="numeric"
                selectionColor={LIME}
              />
              <TouchableOpacity style={s.smallBtn} onPress={tryCustomAirtime} activeOpacity={0.85}>
                <Text style={s.smallBtnTxt}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice / Data section */}
        {activeCat !== "airtime" && (
          <View style={s.planList}>
            <Text style={s.sectionLabel}>
              {plansLoading ? "Loading bundles…" : `${plans.length} ${activeCat === "voice" ? "Voice" : "Data"} bundle${plans.length === 1 ? "" : "s"}`}
            </Text>
            {plansLoading && (
              <View style={{ padding: 24, alignItems: "center" }}>
                <ActivityIndicator color={DARK_GREEN} />
              </View>
            )}
            {plansError && !plansLoading ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: "#7A1A1A", fontFamily: "Inter_500Medium", fontSize: 12 }}>{plansError}</Text>
              </View>
            ) : null}
            {!plansLoading && !plansError && plans.length === 0 && (
              <View style={{ padding: 16 }}>
                <Text style={{ color: MUTED, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  No bundles available for {providerName} right now.
                </Text>
              </View>
            )}
            {plans.map((p, i) => (
              <TouchableOpacity
                key={`${p.code}-${i}`}
                style={[s.planRow, i < plans.length - 1 && s.planRowBorder]}
                onPress={() => pickBundle(p)}
                activeOpacity={0.7}
              >
                <View style={s.planLeft}>
                  <Text style={s.planName} numberOfLines={2}>{p.name}</Text>
                </View>
                <View style={s.planRight}>
                  <Text style={s.planAmt}>UGX {p.price.toLocaleString()}</Text>
                  <View style={s.payChip}><Text style={s.payChipTxt}>Buy</Text></View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={sheetOpen}
        plan={selectedPlan}
        providerName={providerName}
        recipient={phone ? formatMsisdn(phone) : ""}
        customerName={customerName}
        loading={loading}
        statusMessage={statusMsg}
        onConfirm={handleConfirm}
        onCancel={() => { setSheetOpen(false); setStatusMsg(""); }}
      />
      
    </View>
  );
}

const cs = StyleSheet.create({
  hidden:    { display: "none" },
  overlay:   { ...StyleSheet.absoluteFillObject, zIndex: 99, justifyContent: "flex-end" },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:     { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  title:     { fontFamily: "Inter_700Bold", fontSize: 18, color: TEXT, marginBottom: 18, textAlign: "center" },
  summaryCard:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: BG, borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryInfo:     { flex: 1, paddingRight: 12 },
  summaryName:     { fontFamily: "Inter_600SemiBold", fontSize: 14, color: TEXT, marginBottom: 2 },
  summaryDesc:     { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED },
  summaryAmt:      { fontFamily: "Inter_700Bold", fontSize: 16, color: DARK_GREEN },
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
  input:      { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 4 },
  helper:     { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED, marginTop: 4 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCF8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  successTxt:    { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: DARK_GREEN },
  errorBanner:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FCE8E6", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  errorTxt:      { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, color: "#7A1A1A" },
  sectionLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: MUTED, paddingHorizontal: 16, paddingVertical: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  planList:      { backgroundColor: CARD, marginHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: BORDER },
  planRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  planRowBorder: { borderBottomWidth: 1, borderBottomColor: SEP },
  planLeft:      { flex: 1, gap: 3 },
  planName:      { fontFamily: "Inter_600SemiBold", fontSize: 13, color: TEXT, lineHeight: 18 },
  planRight:     { alignItems: "flex-end", gap: 6 },
  planAmt:       { fontFamily: "Inter_700Bold", fontSize: 14, color: TEXT },
  payChip:       { backgroundColor: "#DCF8E6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  payChipTxt:    { fontFamily: "Inter_600SemiBold", fontSize: 11, color: DARK_GREEN },
  amtGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 },
  amtPill:       { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, minWidth: 90, alignItems: "center" },
  amtPillActive: { backgroundColor: LIME, borderColor: LIME },
  amtPillTxt:    { fontFamily: "Inter_600SemiBold", fontSize: 13, color: TEXT },
  amtPillTxtActive: { color: DARK_GREEN, fontFamily: "Inter_700Bold" },
  smallBtn:      { backgroundColor: DARK_GREEN, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  smallBtnTxt:   { fontFamily: "Inter_700Bold", fontSize: 13, color: LIME },
});
