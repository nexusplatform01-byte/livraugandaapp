import React, { useCallback, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Modal,
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
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/authContext";
import {
  createSavingsPot,
  getSavingsPots,
  depositToSavings,
  withdrawFromSavings,
  deleteSavingsPot,
  addNotification,
  type FsSavingsPot,
} from "@/lib/firestore";

const NAVY   = "#1A3B2F";
const NAVY2  = "#243D30";
const NAVY3  = "#22503E";
const LIME   = "#C6F135";
const WHITE  = "#FFFFFF";
const MUTED  = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

type AccountType = "individual" | "joint" | "company";
type SavingMode  = "manual" | "automatic" | "goal" | "fixed";
type Screen      = "dashboard" | "create";
type TxType      = "deposit" | "withdraw";

const ACCOUNT_TYPE_INFO = {
  individual: { label: "Individual",    icon: "user"      as const, gradient: ["#1A3B40", "#1A3B2F"] as const },
  joint:      { label: "Family / Joint",icon: "users"     as const, gradient: ["#1A4A38", "#1A3B2F"] as const },
  company:    { label: "Company",       icon: "briefcase" as const, gradient: ["#2D3A30", "#1A3B2F"] as const },
};

const SAVING_MODES: { key: SavingMode; label: string; icon: string; desc: string; color: string }[] = [
  { key: "manual",    label: "Manual",    icon: "inbox",  desc: "Deposit whenever you want",       color: "#54A0FF" },
  { key: "automatic", label: "Automatic", icon: "repeat", desc: "Auto-deduct on a schedule",       color: LIME      },
  { key: "goal",      label: "Goal",      icon: "target", desc: "Set a target and track progress",  color: "#FF9F0A" },
  { key: "fixed",     label: "Fixed",     icon: "lock",   desc: "Lock funds to earn more interest", color: "#C084FC" },
];

function fmt(n: number) {
  return "UGX " + n.toLocaleString("en-UG", { minimumFractionDigits: 0 });
}
function pct(balance: number, target: number) {
  return Math.min(100, Math.round((balance / target) * 100));
}

function AmountModal({
  visible, title, subtitle, max, onConfirm, onClose,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  max: number;
  onConfirm: (amount: number) => Promise<void>;
  onClose: () => void;
}) {
  const [raw,    setRaw]    = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState("");

  function reset() { setRaw(""); setBusy(false); setError(""); }
  function close() { reset(); onClose(); }

  const amount = parseInt(raw.replace(/,/g, ""), 10) || 0;

  async function confirm() {
    if (!amount || amount <= 0) { setError("Enter a valid amount."); return; }
    if (amount > max) { setError(`Max available: ${fmt(max)}`); return; }
    setBusy(true);
    setError("");
    try {
      await onConfirm(amount);
      close();
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={m.overlay}>
        <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={close} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>{title}</Text>
          <Text style={m.subtitle}>{subtitle}</Text>
          <Text style={m.maxLabel}>Max: {fmt(max)}</Text>
          <TextInput
            style={m.input}
            value={raw}
            onChangeText={(t) => { setRaw(t.replace(/[^0-9]/g, "")); setError(""); }}
            placeholder="0"
            placeholderTextColor="#7A9A7A"
            keyboardType="number-pad"
            autoFocus
          />
          {!!error && <Text style={m.errorTxt}>{error}</Text>}
          <TouchableOpacity
            style={[m.confirmBtn, (busy || !amount) && m.confirmBtnOff]}
            onPress={confirm}
            activeOpacity={0.85}
            disabled={busy || !amount}
          >
            {busy
              ? <ActivityIndicator color={NAVY} />
              : <Text style={m.confirmBtnTxt}>Confirm</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={close} activeOpacity={0.7}>
            <Text style={m.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PotCard({
  pot, walletBalance, onDeposit, onWithdraw, onDelete,
}: {
  pot: FsSavingsPot;
  walletBalance: number;
  onDeposit:  (pot: FsSavingsPot) => void;
  onWithdraw: (pot: FsSavingsPot) => void;
  onDelete:   (pot: FsSavingsPot) => void;
}) {
  const mode     = SAVING_MODES.find((m) => m.key === pot.mode) || SAVING_MODES[0];
  const progress = pot.target ? pct(pot.balance, pot.target) : null;
  const locked   = pot.mode === "fixed";

  return (
    <View style={s.potCard}>
      <View style={s.potTop}>
        <View style={[s.potIcon, { backgroundColor: mode.color + "22" }]}>
          <Feather name={mode.icon as any} size={16} color={mode.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.potName}>{pot.name}</Text>
          <Text style={[s.potMode, { color: mode.color }]}>{mode.label}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.potBalance}>{fmt(pot.balance)}</Text>
          {ACCOUNT_TYPE_INFO[pot.accountType as AccountType] && (
            <Text style={s.potType}>{ACCOUNT_TYPE_INFO[pot.accountType as AccountType].label}</Text>
          )}
        </View>
      </View>

      {progress !== null && (
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progress}%` as any, backgroundColor: mode.color }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={s.progressText}>{progress}% complete</Text>
            <Text style={s.progressText}>Target: {fmt(pot.target!)}</Text>
          </View>
        </View>
      )}
      {pot.frequency    && <Text style={s.potMeta}><Feather name="repeat" size={10} color={MUTED} /> Auto: {pot.frequency}</Text>}
      {pot.maturityDate && <Text style={s.potMeta}><Feather name="lock" size={10} color={MUTED} /> Locked: {pot.maturityDate}</Text>}

      <View style={s.actionRow}>
        <TouchableOpacity
          style={[s.actionBtn, { borderColor: mode.color }]}
          onPress={() => onDeposit(pot)}
          activeOpacity={0.8}
        >
          <Feather name="arrow-down" size={12} color={mode.color} />
          <Text style={[s.actionBtnText, { color: mode.color }]}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: locked ? MUTED : "#FF9F43", opacity: locked ? 0.4 : 1 }]}
          onPress={() => !locked && onWithdraw(pot)}
          activeOpacity={0.8}
          disabled={locked}
        >
          <Feather name="arrow-up" size={12} color={locked ? MUTED : "#FF9F43"} />
          <Text style={[s.actionBtnText, { color: locked ? MUTED : "#FF9F43" }]}>
            {locked ? "Locked" : "Withdraw"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: "#EF4444" }]}
          onPress={() => onDelete(pot)}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={12} color="#EF4444" />
          <Text style={[s.actionBtnText, { color: "#EF4444" }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CreateForm({
  onBack, onCreated, topPad,
}: {
  onBack: () => void; onCreated: () => void; topPad: number;
}) {
  const { phone }     = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [mode,        setMode]        = useState<SavingMode | null>(null);
  const [name,        setName]        = useState("");
  const [goalAmt,     setGoalAmt]     = useState("");
  const [freq,        setFreq]        = useState("Monthly");
  const [fixedMonths, setFixedMonths] = useState("3");
  const [saving,      setSaving]      = useState(false);

  const handleCreate = async () => {
    if (!mode || !name.trim()) {
      Alert.alert("Missing Info", "Please choose a saving mode and enter a name.");
      return;
    }
    setSaving(true);
    try {
      await createSavingsPot(phone, {
        name: name.trim(),
        mode,
        balance: 0,
        accountType,
        target:       mode === "goal"      ? parseFloat(goalAmt) || 0 : undefined,
        frequency:    mode === "automatic" ? freq : undefined,
        maturityDate: mode === "fixed"     ? `${fixedMonths} month(s)` : undefined,
      });
      await addNotification(phone, {
        title: "Savings Pot Created",
        body:  `Your "${name.trim()}" savings pot is ready. Start depositing!`,
        type:  "savings",
        read:  false,
      });
      onCreated();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not create savings pot.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: NAVY }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={s.backRow} onPress={onBack} activeOpacity={0.8}>
        <Feather name="arrow-left" size={18} color={LIME} />
        <Text style={s.backText}>Back to Savings</Text>
      </TouchableOpacity>

      <Text style={s.formTitle}>Create Savings Pot</Text>

      <Text style={s.fieldLabel}>Account Type</Text>
      <View style={s.typeRow}>
        {(Object.keys(ACCOUNT_TYPE_INFO) as AccountType[]).map((key) => {
          const info   = ACCOUNT_TYPE_INFO[key];
          const active = accountType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.typeCard, active && { borderColor: LIME }]}
              onPress={() => setAccountType(key)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={info.gradient} style={StyleSheet.absoluteFill} borderRadius={12} />
              <Feather name={info.icon} size={18} color={active ? LIME : MUTED} />
              <Text style={[s.typeCardLabel, active && { color: LIME }]}>{info.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.fieldLabel}>Saving Mode</Text>
      <View style={s.modeGrid}>
        {SAVING_MODES.map((md) => {
          const active = mode === md.key;
          return (
            <TouchableOpacity
              key={md.key}
              style={[s.modeCard, active && { borderColor: md.color, backgroundColor: NAVY3 }]}
              onPress={() => setMode(md.key)}
              activeOpacity={0.82}
            >
              <View style={[s.modeIcon, { backgroundColor: md.color + "22" }]}>
                <Feather name={md.icon as any} size={18} color={md.color} />
              </View>
              <Text style={[s.modeName, active && { color: md.color }]}>{md.label}</Text>
              <Text style={s.modeDesc}>{md.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode && (
        <View style={s.formCard}>
          <Text style={s.fieldLabel}>Account Name</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Holiday Fund"
            placeholderTextColor={MUTED}
            value={name}
            onChangeText={setName}
          />

          {mode === "goal" && (
            <>
              <Text style={s.fieldLabel}>Target Amount (UGX)</Text>
              <TextInput
                style={s.input}
                placeholder="500000"
                placeholderTextColor={MUTED}
                keyboardType="numeric"
                value={goalAmt}
                onChangeText={setGoalAmt}
              />
            </>
          )}

          {mode === "automatic" && (
            <>
              <Text style={s.fieldLabel}>Frequency</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                {["Daily", "Weekly", "Monthly"].map((f) => (
                  <TouchableOpacity key={f} style={[s.chip, freq === f && s.chipActive]} onPress={() => setFreq(f)}>
                    <Text style={[s.chipText, freq === f && s.chipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {mode === "fixed" && (
            <>
              <Text style={s.fieldLabel}>Lock Duration</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                {["3", "6", "12", "24"].map((mo) => (
                  <TouchableOpacity key={mo} style={[s.chip, fixedMonths === mo && s.chipActive]} onPress={() => setFixedMonths(mo)}>
                    <Text style={[s.chipText, fixedMonths === mo && s.chipTextActive]}>{mo}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={s.createBtn} onPress={handleCreate} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color={NAVY} />
              : <Text style={s.createBtnText}>Create Savings Pot</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

export default function SavingsScreen() {
  const { phone, balanceUGX, refreshBalance } = useAuth();
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;

  const [screen,  setScreen]  = useState<Screen>("dashboard");
  const [pots,    setPots]    = useState<FsSavingsPot[]>([]);
  const [loading, setLoading] = useState(true);

  const [txModal, setTxModal] = useState<{ pot: FsSavingsPot; type: TxType } | null>(null);

  const loadPots = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    const data = await getSavingsPots(phone);
    setPots(data);
    setLoading(false);
  }, [phone]);

  useFocusEffect(useCallback(() => { loadPots(); }, [loadPots]));

  const totalSavings = pots.reduce((sum, p) => sum + p.balance, 0);

  const handleDeposit = (pot: FsSavingsPot) => setTxModal({ pot, type: "deposit" });
  const handleWithdraw = (pot: FsSavingsPot) => setTxModal({ pot, type: "withdraw" });

  const handleTxConfirm = async (amount: number) => {
    if (!txModal) return;
    const { pot, type } = txModal;
    if (type === "deposit") {
      await depositToSavings(phone, pot.id!, amount, balanceUGX);
      Alert.alert("Deposited!", `UGX ${amount.toLocaleString()} added to "${pot.name}".`);
    } else {
      await withdrawFromSavings(phone, pot.id!, amount, pot.balance);
      Alert.alert("Withdrawn!", `UGX ${amount.toLocaleString()} returned to your wallet.`);
    }
    await refreshBalance();
    await loadPots();
  };

  const handleDelete = (pot: FsSavingsPot) => {
    Alert.alert(
      "Close Pot",
      pot.balance > 0
        ? `Close "${pot.name}"? The remaining ${fmt(pot.balance)} will be returned to your wallet.`
        : `Close "${pot.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Pot",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavingsPot(phone, pot.id!, pot.balance);
              if (pot.balance > 0) await refreshBalance();
              await loadPots();
              Alert.alert("Pot Closed", `"${pot.name}" has been closed.`);
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  if (screen === "create") {
    return (
      <CreateForm
        topPad={topPad}
        onBack={() => setScreen("dashboard")}
        onCreated={() => { loadPots(); setScreen("dashboard"); }}
      />
    );
  }

  const txPot = txModal?.pot;
  const txMax = txModal?.type === "deposit" ? balanceUGX : (txPot?.balance ?? 0);
  const txLocked = txModal?.type === "withdraw" && txPot?.mode === "fixed";

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: NAVY }}
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#22503E", "#1A3B2F"]} style={s.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.bannerTop}>
            <View>
              <Text style={s.bannerLabel}>Total Savings</Text>
              <Text style={s.bannerBalance}>{fmt(totalSavings)}</Text>
              <Text style={s.walletBal}>Wallet: {fmt(balanceUGX)}</Text>
            </View>
            <View style={s.bannerIconWrap}>
              <Feather name="layers" size={26} color={LIME} />
            </View>
          </View>

          <View style={s.statsRow}>
            {[
              { label: "Pots",  val: pots.length },
              { label: "Goals", val: pots.filter((p) => p.mode === "goal").length },
              { label: "Auto",  val: pots.filter((p) => p.mode === "automatic").length },
              { label: "Fixed", val: pots.filter((p) => p.mode === "fixed").length },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{item.val}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity style={s.newBtn} onPress={() => setScreen("create")} activeOpacity={0.85}>
            <Feather name="plus-circle" size={16} color={NAVY} />
            <Text style={s.newBtnText}>New Savings Pot</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={s.potsSection}>
          <Text style={s.potsSectionTitle}>My Savings Pots</Text>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={LIME} />
            </View>
          ) : pots.length === 0 ? (
            <View style={s.emptyBox}>
              <Feather name="inbox" size={36} color={MUTED} />
              <Text style={s.emptyText}>No savings pots yet</Text>
              <TouchableOpacity onPress={() => setScreen("create")}>
                <Text style={s.emptyBtnText}>Create your first pot →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pots.map((pot) => (
              <PotCard
                key={pot.id}
                pot={pot}
                walletBalance={balanceUGX}
                onDeposit={handleDeposit}
                onWithdraw={handleWithdraw}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>
      </ScrollView>

      {txModal && !txLocked && (
        <AmountModal
          visible={!!txModal}
          title={txModal.type === "deposit" ? `Deposit to "${txPot?.name}"` : `Withdraw from "${txPot?.name}"`}
          subtitle={
            txModal.type === "deposit"
              ? `Available wallet balance: ${fmt(balanceUGX)}`
              : `Available in pot: ${fmt(txPot?.balance ?? 0)}`
          }
          max={txMax}
          onConfirm={handleTxConfirm}
          onClose={() => setTxModal(null)}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  banner:        { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 4, borderWidth: 1, borderColor: BORDER },
  bannerTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  bannerLabel:   { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  bannerBalance: { color: WHITE, fontSize: 28, fontFamily: "Inter_700Bold" },
  walletBal:     { color: LIME, fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4, opacity: 0.8 },
  bannerIconWrap:{ width: 52, height: 52, borderRadius: 26, backgroundColor: LIME + "22", alignItems: "center", justifyContent: "center" },

  statsRow:    { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  statBox:     { alignItems: "center" },
  statValue:   { color: WHITE, fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel:   { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: BORDER, alignSelf: "stretch" },

  newBtn:     { backgroundColor: LIME, borderRadius: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  newBtnText: { color: NAVY, fontSize: 14, fontFamily: "Inter_700Bold" },

  potsSection:     { padding: 20 },
  potsSectionTitle:{ color: WHITE, fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 16 },

  potCard:   { backgroundColor: NAVY2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  potTop:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  potIcon:   { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  potName:   { color: WHITE, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  potMode:   { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  potBalance:{ color: WHITE, fontSize: 15, fontFamily: "Inter_700Bold" },
  potType:   { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  potMeta:   { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 },

  progressWrap: { marginBottom: 10 },
  progressBg:   { height: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: 5, borderRadius: 3 },
  progressText: { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },

  actionRow:     { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn:     { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  actionBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  emptyBox:    { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText:   { color: MUTED, fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyBtnText:{ color: LIME, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  backRow:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText:  { color: LIME, fontSize: 14, fontFamily: "Inter_500Medium" },
  formTitle: { color: WHITE, fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 20 },

  fieldLabel: { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: NAVY2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: WHITE, fontSize: 14, fontFamily: "Inter_400Regular",
    borderWidth: 1, borderColor: BORDER, marginBottom: 14,
  },
  typeRow:  { flexDirection: "row", gap: 10, marginBottom: 16 },
  typeCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: BORDER, overflow: "hidden" },
  typeCardLabel: { color: MUTED, fontSize: 11, fontFamily: "Inter_500Medium" },

  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  modeCard: { width: "47%", backgroundColor: NAVY2, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, gap: 6 },
  modeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  modeName: { color: WHITE, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modeDesc: { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },

  formCard: { backgroundColor: NAVY2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  chip:         { backgroundColor: NAVY3, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  chipActive:   { backgroundColor: LIME + "22", borderColor: LIME },
  chipText:     { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  chipTextActive:{ color: LIME },

  createBtn:     { backgroundColor: LIME, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText: { color: NAVY, fontSize: 15, fontFamily: "Inter_700Bold" },
});

const m = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: "flex-end" },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:        { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 14 },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  title:        { fontFamily: "Inter_700Bold", fontSize: 18, color: NAVY, marginBottom: 4 },
  subtitle:     { fontFamily: "Inter_400Regular", fontSize: 13, color: "#7A9A7A", marginBottom: 4 },
  maxLabel:     { fontFamily: "Inter_500Medium", fontSize: 12, color: NAVY, marginBottom: 16, opacity: 0.7 },
  input:        { backgroundColor: "#F2F4F2", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: "Inter_600SemiBold", fontSize: 22, color: NAVY, borderWidth: 1.5, borderColor: LIME, marginBottom: 6, textAlign: "center" },
  errorTxt:     { fontFamily: "Inter_400Regular", fontSize: 12, color: "#EF4444", marginBottom: 12, textAlign: "center" },
  confirmBtn:   { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 10 },
  confirmBtnOff:{ backgroundColor: "#C8D8C8" },
  confirmBtnTxt:{ fontFamily: "Inter_700Bold", fontSize: 15, color: LIME },
  cancelBtn:    { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#7A9A7A" },
});
