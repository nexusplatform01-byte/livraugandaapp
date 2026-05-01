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
  type ChoiceListItem,
  type PriceListItem,
} from "@/lib/relworx";
import { ApiError } from "@/lib/api";
import { TV_CODES, UTILITY_CODES, requiresLocation } from "@/lib/productCodes";
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

type CatKey = "tv" | "electricity" | "water";

interface Provider {
  id: string;
  name: string;
  initials: string;
  color: string;
  productCode: string;
  inputLabel: string;
  inputPlaceholder: string;
  /** Field name for the customer reference passed to /api/products/validate */
  refField: "account_no" | "meter_number";
  hasPriceList: boolean;
}

const CATS: { key: CatKey; label: string; icon: string }[] = [
  { key: "tv",          label: "TV / Cable",  icon: "tv" },
  { key: "electricity", label: "Electricity", icon: "zap" },
  { key: "water",       label: "Water",       icon: "droplet" },
];

const PROVIDERS: Record<CatKey, Provider[]> = {
  tv: [
    { id: "dstv",        name: "DStv",        initials: "DST", color: "#0055AA",
      productCode: TV_CODES.dstv,        inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      refField: "account_no", hasPriceList: true },
    { id: "gotv",        name: "GOtv",        initials: "GOT", color: "#0088DD",
      productCode: TV_CODES.gotv,        inputLabel: "IUC Number",        inputPlaceholder: "Enter IUC number",
      refField: "account_no", hasPriceList: true },
    { id: "startimes",   name: "StarTimes",   initials: "STR", color: "#AA0000",
      productCode: TV_CODES.startimes,   inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      refField: "account_no", hasPriceList: true },
    { id: "azam",        name: "Azam TV",     initials: "AZM", color: "#005588",
      productCode: TV_CODES.azam,        inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      refField: "account_no", hasPriceList: true },
    { id: "multichoice", name: "Multichoice", initials: "MUL", color: "#222222",
      productCode: TV_CODES.multichoice, inputLabel: "Smart Card / IUC",  inputPlaceholder: "Enter card / IUC number",
      refField: "account_no", hasPriceList: true },
  ],
  electricity: [
    { id: "umeme_prepaid",  name: "UMEME Prepaid (UEDCL)",  initials: "UPP", color: "#FF6600",
      productCode: UTILITY_CODES.umeme_prepaid,  inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      refField: "meter_number", hasPriceList: false },
    { id: "umeme_postpaid", name: "UECDL Postpaid",         initials: "UPO", color: "#CC5500",
      productCode: UTILITY_CODES.umeme_postpaid, inputLabel: "Account Number", inputPlaceholder: "Enter account number",
      refField: "account_no", hasPriceList: false },
  ],
  water: [
    { id: "nwsc", name: "NWSC", initials: "NWS", color: "#0066CC",
      productCode: UTILITY_CODES.nwsc, inputLabel: "Account Number", inputPlaceholder: "Enter NWSC account number",
      refField: "account_no", hasPriceList: false },
  ],
};

const QUICK_AMTS = [5000, 10000, 20000, 50000, 100000, 200000];

function ConfirmSheet({
  visible, provider, accountNo, payerPhone, amount, planName, customerName,
  loading, statusMessage, onConfirm, onCancel,
}: {
  visible: boolean; provider: Provider | null; accountNo: string; payerPhone: string;
  amount: number; planName: string; customerName: string;
  loading: boolean; statusMessage: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!provider) return null;
  return (
    <View style={[cs.overlay, !visible && cs.hidden]} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={cs.backdrop} onPress={loading ? undefined : onCancel} />
      <View style={[cs.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={cs.handle} />
        <Text style={cs.title}>Confirm Payment</Text>
        <View style={cs.summaryCard}>
          <View style={[cs.provBadge, { backgroundColor: provider.color }]}>
            <Text style={cs.provBadgeTxt}>{provider.initials}</Text>
          </View>
          <View style={cs.summaryInfo}>
            <Text style={cs.summaryName}>{provider.name}</Text>
            {planName ? <Text style={cs.summaryDesc}>{planName}</Text> : null}
          </View>
          <Text style={cs.summaryAmt}>UGX {amount.toLocaleString()}</Text>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>{provider.inputLabel}</Text>
          <Text style={cs.detailVal}>{accountNo || "—"}</Text>
        </View>
        <View style={cs.detailRow}>
          <Text style={cs.detailLabel}>Pay From</Text>
          <Text style={cs.detailVal}>{payerPhone || "—"}</Text>
        </View>
        {customerName ? (
          <View style={cs.detailRow}>
            <Text style={cs.detailLabel}>Customer</Text>
            <Text style={cs.detailVal}>{customerName}</Text>
          </View>
        ) : null}
        <View style={[cs.detailRow, cs.detailRowLast]}>
          <Text style={cs.detailLabel}>Amount</Text>
          <Text style={cs.detailAmt}>UGX {amount.toLocaleString()}</Text>
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
            <Text style={cs.confirmBtnTxt}>Confirm — UGX {amount.toLocaleString()}</Text>
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

export default function PayScreen() {
  const insets = useSafeAreaInsets();
  const { balanceUGX, deductBalance } = useAuth();
  const [activeCat,   setActiveCat]   = useState<CatKey>("tv");
  const [activeProv,  setActiveProv]  = useState<Provider>(PROVIDERS["tv"][0]);
  const [accountNo,   setAccountNo]   = useState("");
  const [payerPhone,  setPayerPhone]  = useState("");
  const [customAmt,   setCustomAmt]   = useState("");

  const [bouquets,        setBouquets]        = useState<PriceListItem[]>([]);
  const [bouquetsLoading, setBouquetsLoading] = useState(false);
  const [bouquetsError,   setBouquetsError]   = useState("");

  const [locationList,    setLocationList]    = useState<ChoiceListItem[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationId,      setLocationId]      = useState<string>("");

  const [selected,    setSelected]    = useState<{ amount: number; planCode?: string; planName: string } | null>(null);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [statusMsg,   setStatusMsg]   = useState("");
  const [customerName, setCustomerName] = useState("");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  const needsLocation = requiresLocation(activeProv.productCode);

  // Load bouquets when provider changes (for TV)
  useEffect(() => {
    setBouquets([]);
    setBouquetsError("");
    if (!activeProv.hasPriceList) return;
    let cancelled = false;
    setBouquetsLoading(true);
    relworxApi.priceList(activeProv.productCode)
      .then((res) => {
        if (cancelled) return;
        const list = (res.price_list ?? []).filter((p) => p && p.code && p.price > 0);
        const seen = new Set<string>();
        setBouquets(list.filter((p) => seen.has(p.code) ? false : (seen.add(p.code), true)));
      })
      .catch((e) => { if (!cancelled) setBouquetsError(e instanceof ApiError ? e.message : "Couldn't load bouquets."); })
      .finally(() => { if (!cancelled) setBouquetsLoading(false); });
    return () => { cancelled = true; };
  }, [activeProv]);

  // Load NWSC location list
  useEffect(() => {
    setLocationList([]);
    setLocationId("");
    if (!needsLocation) return;
    let cancelled = false;
    setLocationLoading(true);
    relworxApi.choiceList(activeProv.productCode)
      .then((res) => { if (!cancelled) setLocationList(res.choice_list ?? []); })
      .catch(() => { if (!cancelled) setLocationList([]); })
      .finally(() => { if (!cancelled) setLocationLoading(false); });
    return () => { cancelled = true; };
  }, [activeProv, needsLocation]);

  function switchCat(cat: CatKey) {
    Haptics.selectionAsync();
    setActiveCat(cat);
    setActiveProv(PROVIDERS[cat][0]);
    setAccountNo("");
    setCustomAmt("");
  }

  function switchProv(prov: Provider) {
    Haptics.selectionAsync();
    setActiveProv(prov);
    setLocationId("");
    setCustomAmt("");
  }

  function preflight(): boolean {
    if (!accountNo) {
      setErrorMsg(`Enter your ${activeProv.inputLabel.toLowerCase()} first.`);
      return false;
    }
    if (!payerPhone || payerPhone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Enter the mobile-money phone you'll pay with.");
      return false;
    }
    if (needsLocation && !locationId) {
      setErrorMsg("Pick your service area.");
      return false;
    }
    return true;
  }

  function pickBouquet(p: PriceListItem) {
    if (!preflight()) return;
    setErrorMsg("");
    setStatusMsg("");
    setCustomerName("");
    setSelected({ amount: p.price, planCode: p.code, planName: p.name });
    setSheetOpen(true);
  }

  function pickQuickAmount(amt: number) {
    if (!preflight()) return;
    setErrorMsg("");
    setStatusMsg("");
    setCustomerName("");
    setSelected({ amount: amt, planName: `${activeProv.name} — UGX ${amt.toLocaleString()}` });
    setSheetOpen(true);
  }

  function tryCustomAmount() {
    const n = Number((customAmt || "").replace(/[^0-9.]/g, ""));
    if (!n || n < 100) { setErrorMsg("Enter at least UGX 100."); return; }
    pickQuickAmount(Math.round(n));
  }

  async function handleConfirm() {
    if (!selected || loading) return;
    if (selected.amount > balanceUGX) {
      setErrorMsg(`Insufficient wallet balance. You need UGX ${selected.amount.toLocaleString()} but have UGX ${balanceUGX.toLocaleString()}.`);
      setSheetOpen(false);
      return;
    }
    const msisdn = formatMsisdn(payerPhone);
    setUserPhone(msisdn).catch(() => {});
    setLoading(true);
    setStatusMsg("Processing from wallet…");
    try {
      const productCode = selected.planCode ?? activeProv.productCode;
      const extra: Record<string, unknown> = {};
      if (activeProv.refField === "meter_number") {
        extra.meter_number = accountNo;
      } else {
        extra.account_no = accountNo;
      }
      if (needsLocation && locationId) extra.location_id = locationId;

      const v = await relworxApi.validateProduct({
        msisdn,
        amount: selected.amount,
        product_code: productCode,
        contact_phone: msisdn,
        ...extra,
      });
      if (v.customer_name) setCustomerName(v.customer_name);
      setStatusMsg("Fulfilling payment…");
      const p = await relworxApi.purchaseProduct(v.validation_reference);
      setStatusMsg("Confirming…");
      const final = await pollRequestStatus(p.internal_reference, { timeoutMs: 75000 });
      const ok = (final.status ?? "").toLowerCase() === "success";
      if (ok) {
        await deductBalance(
          selected.amount,
          `${activeProv.name} — ${activeCat.toUpperCase()} payment`,
          "Utilities",
          "zap",
          "#5F27CD",
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMsg(`${activeProv.name} payment of UGX ${selected.amount.toLocaleString()} successful.`);
        setSheetOpen(false);
        setSelected(null);
        setAccountNo("");
        setCustomAmt("");
        setStatusMsg("");
      } else {
        setStatusMsg(final.message || "Still processing — check Transactions.");
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Payment failed. Please try again.";
      setErrorMsg(msg);
      setStatusMsg("");
      setSheetOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
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
          {PROVIDERS[activeCat].map((prov) => {
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

        {/* Service account input */}
        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>{activeProv.inputLabel}</Text>
          <TextInput
            style={s.input}
            placeholder={activeProv.inputPlaceholder}
            placeholderTextColor={MUTED}
            value={accountNo}
            onChangeText={setAccountNo}
            keyboardType="number-pad"
            selectionColor={LIME}
          />
        </View>

        {/* NWSC location selector */}
        {needsLocation && (
          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>Service Area</Text>
            {locationLoading ? (
              <View style={[s.input, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
                <ActivityIndicator size="small" color={DARK_GREEN} />
                <Text style={{ color: MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>Loading service areas…</Text>
              </View>
            ) : locationList.length === 0 ? (
              <View style={s.input}><Text style={{ color: MUTED }}>No service areas available right now.</Text></View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                {locationList.map((loc) => {
                  const active = locationId === loc.id;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      onPress={() => setLocationId(loc.id)}
                      style={[s.provChip, active && s.provChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.provChipTxt, active && s.provChipTxtActive]}>{loc.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Mobile money payer phone */}
        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>Mobile-Money Phone (Payer)</Text>
          <TextInput
            style={s.input}
            placeholder="0701 454 887"
            placeholderTextColor={MUTED}
            value={payerPhone}
            onChangeText={setPayerPhone}
            keyboardType="phone-pad"
            selectionColor={LIME}
          />
        </View>

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

        {/* TV bouquet list */}
        {activeProv.hasPriceList && (
          <View style={s.planList}>
            <Text style={s.sectionLabel}>
              {bouquetsLoading ? "Loading bouquets…" : `${bouquets.length} bouquet${bouquets.length === 1 ? "" : "s"}`}
            </Text>
            {bouquetsLoading && (
              <View style={{ padding: 24, alignItems: "center" }}><ActivityIndicator color={DARK_GREEN} /></View>
            )}
            {bouquetsError && !bouquetsLoading ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: "#7A1A1A", fontFamily: "Inter_500Medium", fontSize: 12 }}>{bouquetsError}</Text>
              </View>
            ) : null}
            {!bouquetsLoading && !bouquetsError && bouquets.length === 0 && (
              <View style={{ padding: 16 }}>
                <Text style={{ color: MUTED, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  No bouquets available for {activeProv.name} right now.
                </Text>
              </View>
            )}
            {bouquets.map((p, i) => (
              <TouchableOpacity
                key={`${p.code}-${i}`}
                style={[s.planRow, i < bouquets.length - 1 && s.planRowBorder]}
                onPress={() => pickBouquet(p)}
                activeOpacity={0.7}
              >
                <View style={s.planLeft}>
                  <Text style={s.planName} numberOfLines={2}>{p.name}</Text>
                </View>
                <View style={s.planRight}>
                  <Text style={s.planAmt}>UGX {p.price.toLocaleString()}</Text>
                  <View style={s.payChip}><Text style={s.payChipTxt}>Pay</Text></View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Utilities: quick amounts + custom */}
        {!activeProv.hasPriceList && (
          <View style={s.planList}>
            <Text style={s.sectionLabel}>Quick Amount</Text>
            <View style={s.amtGrid}>
              {QUICK_AMTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={s.amtPill}
                  onPress={() => pickQuickAmount(amt)}
                  activeOpacity={0.85}
                >
                  <Text style={s.amtPillTxt}>{amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.inputLabel, { paddingHorizontal: 16, marginTop: 14 }]}>Custom Amount</Text>
            <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter amount in UGX"
                placeholderTextColor={MUTED}
                value={customAmt}
                onChangeText={setCustomAmt}
                keyboardType="numeric"
                selectionColor={LIME}
              />
              <TouchableOpacity style={s.smallBtn} onPress={tryCustomAmount} activeOpacity={0.85}>
                <Text style={s.smallBtnTxt}>Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={sheetOpen}
        provider={activeProv}
        accountNo={accountNo}
        payerPhone={payerPhone ? formatMsisdn(payerPhone) : ""}
        amount={selected?.amount ?? 0}
        planName={selected?.planName ?? ""}
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
  summaryDesc:     { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED, lineHeight: 15 },
  summaryAmt:      { fontFamily: "Inter_700Bold", fontSize: 14, color: DARK_GREEN },
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
  input:      { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14 },
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
  amtPill:       { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, minWidth: 100, alignItems: "center" },
  amtPillTxt:    { fontFamily: "Inter_600SemiBold", fontSize: 13, color: TEXT },
  smallBtn:      { backgroundColor: DARK_GREEN, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  smallBtnTxt:   { fontFamily: "Inter_700Bold", fontSize: 13, color: LIME },
});
