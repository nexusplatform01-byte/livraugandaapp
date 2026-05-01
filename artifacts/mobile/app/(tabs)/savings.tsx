import React, { useCallback, useState } from "react";
import {
  Alert,
  ActivityIndicator,
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
  type FsSavingsPot,
} from "@/lib/firestore";
import { addNotification } from "@/lib/firestore";

const NAVY  = "#1A3B2F";
const NAVY2 = "#243D30";
const NAVY3 = "#22503E";
const GOLD  = "#C9A84C";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

type AccountType = "individual" | "joint" | "company";
type SavingMode  = "manual" | "automatic" | "goal" | "fixed";
type Screen      = "dashboard" | "create";

const ACCOUNT_TYPE_INFO = {
  individual: { label: "Individual", icon: "user"      as const, gradient: ["#1A3B40", "#1A3B2F"] as const },
  joint:      { label: "Family / Joint", icon: "users" as const, gradient: ["#1A4A38", "#1A3B2F"] as const },
  company:    { label: "Company", icon: "briefcase"    as const, gradient: ["#2D3A30", "#1A3B2F"] as const },
};

const SAVING_MODES: { key: SavingMode; label: string; icon: string; desc: string; color: string }[] = [
  { key: "manual",    label: "Manual",    icon: "inbox",   desc: "Deposit whenever you want",       color: "#54A0FF" },
  { key: "automatic", label: "Automatic", icon: "repeat",  desc: "Auto-deduct on a schedule",       color: GOLD      },
  { key: "goal",      label: "Goal",      icon: "target",  desc: "Set a target and track progress",  color: "#FF9F0A" },
  { key: "fixed",     label: "Fixed",     icon: "lock",    desc: "Lock funds to earn more interest", color: "#C084FC" },
];

function fmt(n: number) {
  return "UGX " + n.toLocaleString("en-UG", { minimumFractionDigits: 0 });
}
function pct(balance: number, target: number) {
  return Math.min(100, Math.round((balance / target) * 100));
}

function PotCard({
  pot,
  onDeposit,
}: {
  pot: FsSavingsPot;
  onDeposit: (pot: FsSavingsPot) => void;
}) {
  const mode     = SAVING_MODES.find((m) => m.key === pot.mode) || SAVING_MODES[0];
  const progress = pot.target ? pct(pot.balance, pot.target) : null;

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
        <Text style={s.potBalance}>{fmt(pot.balance)}</Text>
      </View>
      {progress !== null && (
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progress}%` as any, backgroundColor: mode.color }]} />
          </View>
          <Text style={s.progressText}>{progress}% of {fmt(pot.target!)}</Text>
        </View>
      )}
      {pot.frequency    && <Text style={s.potMeta}>Auto: {pot.frequency}</Text>}
      {pot.maturityDate && <Text style={s.potMeta}>Locked for: {pot.maturityDate}</Text>}
      <TouchableOpacity
        style={[s.depositBtn, { borderColor: mode.color }]}
        onPress={() => onDeposit(pot)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={13} color={mode.color} />
        <Text style={[s.depositBtnText, { color: mode.color }]}>Deposit</Text>
      </TouchableOpacity>
    </View>
  );
}

function CreateForm({
  onBack,
  onCreated,
  topPad,
}: {
  onBack: () => void;
  onCreated: () => void;
  topPad: number;
}) {
  const { phone, balanceUGX } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [mode,        setMode]        = useState<SavingMode | null>(null);
  const [name,        setName]        = useState("");
  const [goalAmt,     setGoalAmt]     = useState("");
  const [freq,        setFreq]        = useState("Monthly");
  const [fixedMonths, setFixedMonths] = useState("3");
  const [saving,      setSaving]      = useState(false);

  const handleCreate = async () => {
    if (!mode || !name.trim()) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
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
        body:  `Your "${name.trim()}" savings pot is ready. Start depositing to reach your goals!`,
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
        <Feather name="arrow-left" size={18} color={GOLD} />
        <Text style={s.backText}>Back to Savings</Text>
      </TouchableOpacity>

      <Text style={s.formTitle}>Create Savings Pot</Text>

      <Text style={s.fieldLabel}>Account Type</Text>
      <View style={s.typeRow}>
        {(Object.keys(ACCOUNT_TYPE_INFO) as AccountType[]).map((key) => {
          const info  = ACCOUNT_TYPE_INFO[key];
          const active = accountType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.typeCard, active && { borderColor: GOLD }]}
              onPress={() => setAccountType(key)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={info.gradient} style={StyleSheet.absoluteFill} borderRadius={12} />
              <Feather name={info.icon} size={18} color={active ? GOLD : MUTED} />
              <Text style={[s.typeCardLabel, active && { color: GOLD }]}>{info.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.fieldLabel}>Saving Mode</Text>
      <View style={s.modeGrid}>
        {SAVING_MODES.map((m) => {
          const active = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[s.modeCard, active && { borderColor: m.color, backgroundColor: NAVY3 }]}
              onPress={() => setMode(m.key)}
              activeOpacity={0.82}
            >
              <View style={[s.modeIcon, { backgroundColor: m.color + "22" }]}>
                <Feather name={m.icon as any} size={18} color={m.color} />
              </View>
              <Text style={[s.modeName, active && { color: m.color }]}>{m.label}</Text>
              <Text style={s.modeDesc}>{m.desc}</Text>
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
                placeholder="500,000"
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
                  <TouchableOpacity
                    key={f}
                    style={[s.chip, freq === f && s.chipActive]}
                    onPress={() => setFreq(f)}
                  >
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
                {["3", "6", "12", "24"].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[s.chip, fixedMonths === m && s.chipActive]}
                    onPress={() => setFixedMonths(m)}
                  >
                    <Text style={[s.chipText, fixedMonths === m && s.chipTextActive]}>{m}m</Text>
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

  const [screen, setScreen]   = useState<Screen>("dashboard");
  const [pots, setPots]       = useState<FsSavingsPot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPots = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    const data = await getSavingsPots(phone);
    setPots(data);
    setLoading(false);
  }, [phone]);

  useFocusEffect(useCallback(() => { loadPots(); }, [loadPots]));

  const totalSavings = pots.reduce((s, p) => s + p.balance, 0);

  const handleDeposit = (pot: FsSavingsPot) => {
    Alert.prompt(
      "Deposit to Savings",
      `Deposit into "${pot.name}" (Wallet balance: UGX ${balanceUGX.toLocaleString()})`,
      async (raw) => {
        const amount = parseInt(raw || "0", 10);
        if (!amount || amount <= 0) return;
        if (amount > balanceUGX) {
          Alert.alert("Insufficient Balance", "You don't have enough in your wallet.");
          return;
        }
        try {
          await depositToSavings(phone, pot.id!, amount, balanceUGX);
          await refreshBalance();
          await loadPots();
          Alert.alert("Success", `UGX ${amount.toLocaleString()} deposited to "${pot.name}".`);
        } catch (e: any) {
          Alert.alert("Error", e.message);
        }
      },
      "plain-text",
      "",
      "numeric"
    );
  };

  if (screen === "create") {
    return (
      <CreateForm
        topPad={topPad}
        onBack={() => setScreen("dashboard")}
        onCreated={() => {
          loadPots();
          setScreen("dashboard");
        }}
      />
    );
  }

  return (
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
          </View>
          <View style={s.bannerIconWrap}>
            <Feather name="layers" size={26} color={GOLD} />
          </View>
        </View>

        <View style={s.statsRow}>
          {[
            { label: "Pots",   val: pots.length },
            { label: "Goals",  val: pots.filter((p) => p.mode === "goal").length },
            { label: "Auto",   val: pots.filter((p) => p.mode === "automatic").length },
            { label: "Fixed",  val: pots.filter((p) => p.mode === "fixed").length },
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
            <ActivityIndicator color={GOLD} />
          </View>
        ) : pots.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="inbox" size={36} color={MUTED} />
            <Text style={s.emptyText}>No savings pots yet</Text>
            <TouchableOpacity onPress={() => setScreen("create")}>
              <Text style={s.emptyBtnText}>Create your first pot</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pots.map((pot) => (
            <PotCard key={pot.id} pot={pot} onDeposit={handleDeposit} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  banner: { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 4, borderWidth: 1, borderColor: BORDER },
  bannerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  bannerLabel:  { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  bannerBalance:{ color: WHITE, fontSize: 28, fontFamily: "Inter_700Bold" },
  bannerIconWrap:{ width: 52, height: 52, borderRadius: 26, backgroundColor: GOLD + "22", alignItems: "center", justifyContent: "center" },

  statsRow:    { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  statBox:     { alignItems: "center" },
  statValue:   { color: WHITE, fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel:   { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: BORDER, alignSelf: "stretch" },

  newBtn:     { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  newBtnText: { color: NAVY, fontSize: 14, fontFamily: "Inter_700Bold" },

  potsSection:     { padding: 20 },
  potsSectionTitle:{ color: WHITE, fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 16 },

  potCard:   { backgroundColor: NAVY2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  potTop:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  potIcon:   { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  potName:   { color: WHITE, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  potMode:   { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  potBalance:{ color: WHITE, fontSize: 15, fontFamily: "Inter_700Bold" },
  potMeta:   { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 8 },
  progressWrap: { marginBottom: 8 },
  progressBg:   { height: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: 5, borderRadius: 3 },
  progressText: { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },
  depositBtn:   { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" },
  depositBtnText:{ fontSize: 12, fontFamily: "Inter_600SemiBold" },

  emptyBox:    { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText:   { color: MUTED, fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyBtnText:{ color: GOLD, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { color: GOLD, fontSize: 14, fontFamily: "Inter_500Medium" },
  formTitle: { color: WHITE, fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 20 },

  fieldLabel: { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: NAVY2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: WHITE, fontSize: 14, fontFamily: "Inter_400Regular",
    borderWidth: 1, borderColor: BORDER, marginBottom: 14,
  },
  typeRow:  { flexDirection: "row", gap: 10, marginBottom: 16 },
  typeCard: {
    flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: BORDER, overflow: "hidden",
  },
  typeCardLabel: { color: MUTED, fontSize: 11, fontFamily: "Inter_500Medium" },

  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  modeCard: {
    width: "47%", backgroundColor: NAVY2, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: BORDER, gap: 6,
  },
  modeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  modeName: { color: WHITE, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modeDesc: { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },

  formCard: { backgroundColor: NAVY2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  chip:      { backgroundColor: NAVY3, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  chipActive:{ backgroundColor: GOLD + "22", borderColor: GOLD },
  chipText:  { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  chipTextActive:{ color: GOLD },

  createBtn:     { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText: { color: NAVY, fontSize: 15, fontFamily: "Inter_700Bold" },
});
