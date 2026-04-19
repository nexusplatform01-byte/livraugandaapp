import React, { useState } from "react";
import {
  Alert,
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

const DG    = "#1A3B2F";
const DG2   = "#22503F";
const DG3   = "#2B6350";
const LIME  = "#C6F135";
const WHITE = "#FFFFFF";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "individual" | "joint" | "company";
type SavingMode  = "manual" | "automatic" | "goal" | "fixed";

interface SavingAccount {
  id: string;
  mode: SavingMode;
  name: string;
  balance: number;
  target?: number;
  frequency?: string;
  maturityDate?: string;
}

interface LinkedUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  canWithdraw: boolean;
}

interface SavingsState {
  accountType: AccountType;
  accounts: SavingAccount[];
  linkedUsers: LinkedUser[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_INFO = {
  individual: {
    label: "Individual",
    icon: "user" as const,
    desc: "Personal savings for one person",
    gradient: ["#007AFF", "#5AC8FA"] as const,
  },
  joint: {
    label: "Family / Joint",
    icon: "users" as const,
    desc: "Shared savings linked to multiple members",
    gradient: ["#30D158", "#00C7BE"] as const,
  },
  company: {
    label: "Company",
    icon: "briefcase" as const,
    desc: "Business savings for organisations",
    gradient: ["#BF5AF2", "#FF2D55"] as const,
  },
};

const SAVING_MODES: { key: SavingMode; label: string; icon: string; desc: string; color: string }[] = [
  { key: "manual",    label: "Normal / Manual",  icon: "inbox",   desc: "Deposit whenever you want",           color: "#5AC8FA" },
  { key: "automatic", label: "Automatic",        icon: "repeat",  desc: "Auto-deduct on a schedule",           color: LIME      },
  { key: "goal",      label: "Goal Saving",      icon: "target",  desc: "Set a target and track progress",     color: "#FF9F0A" },
  { key: "fixed",     label: "Fixed Saving",     icon: "lock",    desc: "Lock funds to earn more interest",    color: "#BF5AF2" },
];

const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}
function pct(balance: number, target: number) {
  return Math.min(100, Math.round((balance / target) * 100));
}

// ─── Step 1: Account Type Grid ────────────────────────────────────────────────

function AccountTypeStep({ onSelect, topPad }: { onSelect: (t: AccountType) => void; topPad: number }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DG }}
      contentContainerStyle={{ paddingTop: topPad + 20, paddingBottom: 120, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.stepHeader}>
        <View style={s.stepIconWrap}>
          <Feather name="layers" size={28} color={LIME} />
        </View>
        <Text style={s.stepTitle}>Create Savings Account</Text>
        <Text style={s.stepSub}>Choose the account type that suits you</Text>
      </View>

      {/* 2-column grid */}
      <View style={s.typeGrid}>
        {(Object.keys(ACCOUNT_TYPE_INFO) as AccountType[]).map((key) => {
          const info = ACCOUNT_TYPE_INFO[key];
          return (
            <TouchableOpacity
              key={key}
              style={s.typeGridCard}
              onPress={() => onSelect(key)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={info.gradient}
                style={s.typeGridIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name={info.icon} size={26} color="#FFF" />
              </LinearGradient>
              <Text style={s.typeGridLabel}>{info.label}</Text>
              <Text style={s.typeGridDesc}>{info.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Step 2: Saving Mode ──────────────────────────────────────────────────────

function SavingModeStep({
  accountType,
  onBack,
  onCreate,
  topPad,
}: {
  accountType: AccountType;
  onBack: () => void;
  onCreate: (acc: SavingAccount) => void;
  topPad: number;
}) {
  const [selected,    setSelected]    = useState<SavingMode | null>(null);
  const [name,        setName]        = useState("");
  const [goalAmt,     setGoalAmt]     = useState("");
  const [autoAmt,     setAutoAmt]     = useState("");
  const [freq,        setFreq]        = useState("");
  const [fixedAmt,    setFixedAmt]    = useState("");
  const [fixedMonths, setFixedMonths] = useState("");

  const handleCreate = () => {
    if (!selected || !name.trim()) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }
    const id  = Date.now().toString();
    let acc: SavingAccount = { id, mode: selected, name: name.trim(), balance: 0 };
    if (selected === "goal")      acc.target       = parseFloat(goalAmt) || 0;
    if (selected === "automatic") acc.frequency    = freq || "Monthly";
    if (selected === "fixed")     acc.maturityDate = `${fixedMonths || "3"} month(s)`;
    onCreate(acc);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DG }}
      contentContainerStyle={{ paddingTop: topPad + 20, paddingBottom: 120, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.stepTitle}>Choose Saving Type</Text>
      <Text style={[s.stepSub, { marginBottom: 22 }]}>
        {ACCOUNT_TYPE_INFO[accountType].label} Account
      </Text>

      {/* 2-column mode grid */}
      <View style={s.modeGrid}>
        {SAVING_MODES.map((m) => {
          const active = selected === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[s.modeCard, active && { borderColor: m.color, backgroundColor: DG3 }]}
              onPress={() => setSelected(m.key)}
              activeOpacity={0.82}
            >
              {active && (
                <View style={[s.modeCheck, { backgroundColor: m.color }]}>
                  <Feather name="check" size={9} color="#FFF" />
                </View>
              )}
              <View style={[s.modeIconBox, { backgroundColor: m.color + "33" }]}>
                <Feather name={m.icon as any} size={20} color={m.color} />
              </View>
              <Text style={[s.modeLabel, active && { color: m.color }]}>{m.label}</Text>
              <Text style={s.modeDesc}>{m.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Form */}
      {selected && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>Account Details</Text>

          <Text style={s.fieldLabel}>Account Name</Text>
          <TextInput
            style={s.fieldInput}
            placeholder="e.g. Holiday Fund"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={name}
            onChangeText={setName}
          />

          {selected === "goal" && (
            <>
              <Text style={s.fieldLabel}>Goal Target (₦)</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="500,000"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="numeric"
                value={goalAmt}
                onChangeText={setGoalAmt}
              />
            </>
          )}

          {selected === "automatic" && (
            <>
              <Text style={s.fieldLabel}>Auto-Deduct Amount (₦)</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="10,000"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="numeric"
                value={autoAmt}
                onChangeText={setAutoAmt}
              />
              <Text style={s.fieldLabel}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {FREQUENCIES.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[s.chip, freq === f && s.chipActive]}
                      onPress={() => setFreq(f)}
                    >
                      <Text style={[s.chipText, freq === f && s.chipTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {selected === "fixed" && (
            <>
              <Text style={s.fieldLabel}>Opening Amount (₦)</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="50,000"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="numeric"
                value={fixedAmt}
                onChangeText={setFixedAmt}
              />
              <Text style={s.fieldLabel}>Lock Duration (months)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
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
              </ScrollView>
            </>
          )}

          <TouchableOpacity style={s.createBtn} onPress={handleCreate} activeOpacity={0.85}>
            <Text style={s.createBtnText}>Create Savings Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Saving Pot Card ──────────────────────────────────────────────────────────

function SavingCard({ acc, onDeposit }: { acc: SavingAccount; onDeposit: () => void }) {
  const mode     = SAVING_MODES.find((m) => m.key === acc.mode)!;
  const progress = acc.target ? pct(acc.balance, acc.target) : null;

  return (
    <View style={s.savingCard}>
      <View style={s.savingCardTop}>
        <View style={[s.savingModeIcon, { backgroundColor: mode.color + "33" }]}>
          <Feather name={mode.icon as any} size={16} color={mode.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.savingName}>{acc.name}</Text>
          <Text style={[s.savingModeName, { color: mode.color }]}>{mode.label}</Text>
        </View>
        <Text style={s.savingBalance}>{fmt(acc.balance)}</Text>
      </View>

      {progress !== null && (
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progress}%` as any, backgroundColor: mode.color }]} />
          </View>
          <Text style={s.progressText}>{progress}% of {fmt(acc.target!)}</Text>
        </View>
      )}

      {acc.frequency    && <Text style={s.savingMeta}>Auto: {acc.frequency}</Text>}
      {acc.maturityDate && <Text style={s.savingMeta}>Locked for: {acc.maturityDate}</Text>}

      <TouchableOpacity style={[s.depositBtn, { borderColor: mode.color }]} onPress={onDeposit} activeOpacity={0.8}>
        <Feather name="plus" size={13} color={mode.color} />
        <Text style={[s.depositBtnText, { color: mode.color }]}>Deposit</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Joint Members Section ────────────────────────────────────────────────────

function JointUsersSection({ users, onAdd }: { users: LinkedUser[]; onAdd: () => void }) {
  return (
    <View style={s.sectionBox}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Linked Members</Text>
        <TouchableOpacity style={s.addUserBtn} onPress={onAdd} activeOpacity={0.8}>
          <Feather name="user-plus" size={13} color={LIME} />
          <Text style={s.addUserText}>Add</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.sectionNote}>Members cannot be removed — contact support to make changes.</Text>

      {users.map((u) => (
        <View key={u.id} style={s.userRow}>
          <View style={[s.userAvatar, { backgroundColor: u.color }]}>
            <Text style={s.userInitials}>{u.initials}</Text>
          </View>
          <Text style={s.userName}>{u.name}</Text>
          <View style={[s.permBadge, { backgroundColor: u.canWithdraw ? "rgba(48,209,88,0.18)" : "rgba(255,59,48,0.18)" }]}>
            <Feather name={u.canWithdraw ? "check" : "x"} size={11} color={u.canWithdraw ? "#30D158" : "#FF3B30"} />
            <Text style={[s.permText, { color: u.canWithdraw ? "#30D158" : "#FF3B30" }]}>
              {u.canWithdraw ? "Can Withdraw" : "View Only"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({
  state,
  topPad,
  onAddAccount,
  onAddUser,
}: {
  state: SavingsState;
  topPad: number;
  onAddAccount: () => void;
  onAddUser: () => void;
}) {
  const totalBalance = state.accounts.reduce((sum, a) => sum + a.balance, 0);
  const info         = ACCOUNT_TYPE_INFO[state.accountType];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DG }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <LinearGradient colors={info.gradient} style={s.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.bannerTop}>
          <View>
            <Text style={s.bannerType}>{info.label} Savings</Text>
            <Text style={s.bannerLabel}>Total Savings Balance</Text>
            <Text style={s.bannerBalance}>{fmt(totalBalance)}</Text>
          </View>
          <View style={s.bannerIconWrap}>
            <Feather name={info.icon} size={26} color="rgba(255,255,255,0.85)" />
          </View>
        </View>
        <View style={s.bannerActions}>
          <TouchableOpacity style={s.bannerBtn} onPress={() => Alert.alert("Deposit", "Choose an account to deposit into")} activeOpacity={0.85}>
            <Feather name="arrow-down-circle" size={15} color={DG} />
            <Text style={s.bannerBtnText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.bannerBtn} onPress={() => Alert.alert("Withdraw", "Choose an account to withdraw from")} activeOpacity={0.85}>
            <Feather name="arrow-up-circle" size={15} color={DG} />
            <Text style={s.bannerBtnText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.bannerBtn} onPress={onAddAccount} activeOpacity={0.85}>
            <Feather name="plus-circle" size={15} color={DG} />
            <Text style={s.bannerBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label: "Pots",  val: state.accounts.length },
          { label: "Goals", val: state.accounts.filter((a) => a.mode === "goal").length },
          { label: "Auto",  val: state.accounts.filter((a) => a.mode === "automatic").length },
          { label: "Fixed", val: state.accounts.filter((a) => a.mode === "fixed").length },
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

      {/* Savings pots */}
      <View style={s.sectionBox}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Savings Pots</Text>
        </View>
        {state.accounts.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="inbox" size={32} color="rgba(255,255,255,0.25)" />
            <Text style={s.emptyText}>No savings pots yet</Text>
            <TouchableOpacity onPress={onAddAccount}>
              <Text style={s.emptyBtnText}>Create one now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          state.accounts.map((acc) => (
            <SavingCard
              key={acc.id}
              acc={acc}
              onDeposit={() => Alert.alert("Deposit", `Deposit into ${acc.name}`)}
            />
          ))
        )}
      </View>

      {/* Joint members */}
      {state.accountType === "joint" && (
        <JointUsersSection users={state.linkedUsers} onAdd={onAddUser} />
      )}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Screen = "type" | "mode" | "dashboard";

export default function SavingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [screen,       setScreen]       = useState<Screen>("type");
  const [accountType,  setAccountType]  = useState<AccountType>("individual");
  const [savingsState, setSavingsState] = useState<SavingsState | null>(null);

  const handleTypeSelect = (t: AccountType) => {
    setAccountType(t);
    setScreen("mode");
  };

  const buildState = (acc: SavingAccount): SavingsState => ({
    accountType,
    accounts: [acc],
    linkedUsers:
      accountType === "joint"
        ? [
            { id: "1", name: "Darlington O.", initials: "DO", color: "#1A6B4A", canWithdraw: true },
            { id: "2", name: "Amaka Eze",     initials: "AE", color: "#C0392B", canWithdraw: true },
          ]
        : [],
  });

  const handleCreate = (acc: SavingAccount) => {
    setSavingsState(buildState(acc));
    setScreen("dashboard");
  };

  const handleModeCreate = (acc: SavingAccount) => {
    if (!savingsState) {
      handleCreate(acc);
      return;
    }
    setSavingsState({ ...savingsState, accounts: [...savingsState.accounts, acc] });
    setScreen("dashboard");
  };

  const handleAddUser = () => {
    Alert.alert(
      "Add Member",
      "Enter the Livra account (e.g. AC24561) of the person to add.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: () => {
            if (!savingsState) return;
            const u: LinkedUser = {
              id: Date.now().toString(),
              name: "New Member",
              initials: "NM",
              color: "#8B5CF6",
              canWithdraw: true,
            };
            setSavingsState({ ...savingsState, linkedUsers: [...savingsState.linkedUsers, u] });
          },
        },
      ]
    );
  };

  if (screen === "type") {
    return <AccountTypeStep onSelect={handleTypeSelect} topPad={topPad} />;
  }

  if (screen === "mode") {
    return (
      <SavingModeStep
        accountType={accountType}
        topPad={topPad}
        onBack={() => setScreen(savingsState ? "dashboard" : "type")}
        onCreate={handleModeCreate}
      />
    );
  }

  if (screen === "dashboard" && savingsState) {
    return (
      <Dashboard
        state={savingsState}
        topPad={topPad}
        onAddAccount={() => setScreen("mode")}
        onAddUser={handleAddUser}
      />
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stepHeader: { alignItems: "center", marginBottom: 32 },
  stepIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(198,241,53,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: WHITE, textAlign: "center", marginBottom: 6 },
  stepSub:   { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center" },

  // Account type 2-column grid
  typeGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  typeGridCard: {
    width: "47%", backgroundColor: DG2, borderRadius: 18,
    padding: 18, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  typeGridIcon:  { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  typeGridLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: WHITE, textAlign: "center", marginBottom: 6 },
  typeGridDesc:  { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 16 },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: LIME },

  // Saving mode 2-col grid
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  modeCard: {
    width: "47.5%", backgroundColor: DG2, borderRadius: 16, padding: 14,
    borderWidth: 2, borderColor: "transparent",
  },
  modeCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  modeIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: WHITE, marginBottom: 4 },
  modeDesc:  { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16 },

  formCard:   { backgroundColor: DG2, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  formTitle:  { fontFamily: "Inter_700Bold", fontSize: 16, color: WHITE, marginBottom: 16 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  fieldInput: {
    backgroundColor: DG3, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: "Inter_400Regular", fontSize: 14, color: WHITE,
    borderWidth: 1.5, borderColor: LIME, marginBottom: 14,
  },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", backgroundColor: DG3 },
  chipActive:    { backgroundColor: LIME, borderColor: LIME },
  chipText:      { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  chipTextActive:{ color: DG },
  createBtn:     { backgroundColor: LIME, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 6 },
  createBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: DG },

  banner:       { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 12 },
  bannerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  bannerType:   { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  bannerLabel:  { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  bannerBalance:{ fontFamily: "Inter_700Bold", fontSize: 28, color: WHITE, letterSpacing: -0.5 },
  bannerIconWrap:{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  bannerActions: { flexDirection: "row", gap: 8 },
  bannerBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingVertical: 9 },
  bannerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: DG },

  statsRow:    { flexDirection: "row", backgroundColor: DG2, marginHorizontal: 16, borderRadius: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  statBox:     { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  statValue:   { fontFamily: "Inter_700Bold", fontSize: 18, color: LIME },
  statLabel:   { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },

  sectionBox:    { backgroundColor: DG2, marginHorizontal: 16, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sectionTitle:  { fontFamily: "Inter_700Bold", fontSize: 15, color: WHITE },
  sectionNote:   { fontFamily: "Inter_400Regular", fontSize: 11, color: "#FF9F0A", marginBottom: 14, lineHeight: 16 },

  savingCard:     { backgroundColor: DG3, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  savingCardTop:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  savingModeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  savingName:     { fontFamily: "Inter_600SemiBold", fontSize: 14, color: WHITE },
  savingModeName: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  savingBalance:  { fontFamily: "Inter_700Bold", fontSize: 15, color: WHITE },
  progressWrap:   { marginBottom: 8 },
  progressBg:     { height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill:   { height: 6, borderRadius: 3 },
  progressText:   { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.5)" },
  savingMeta:     { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 },
  depositBtn:     { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  depositBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },

  emptyBox:     { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText:    { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.4)" },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: LIME, textDecorationLine: "underline" },

  addUserBtn:  { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderColor: LIME, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  addUserText: { fontFamily: "Inter_500Medium", fontSize: 12, color: LIME },
  userRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  userAvatar:  { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  userInitials:{ fontFamily: "Inter_700Bold", fontSize: 13, color: WHITE },
  userName:    { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: WHITE },
  permBadge:   { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  permText:    { fontFamily: "Inter_500Medium", fontSize: 11 },
});
