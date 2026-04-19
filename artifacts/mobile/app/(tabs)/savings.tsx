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

const DG = "#1A3B2F";
const LIME = "#C6F135";
const BG = "#F2F4F2";
const WHITE = "#FFFFFF";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_INFO = {
  individual: { label: "Individual",         icon: "user",   desc: "Personal savings account for one person",           gradient: ["#007AFF", "#5AC8FA"] as const },
  joint:      { label: "Family / Joint",     icon: "users",  desc: "Shared savings account linked to multiple users",   gradient: ["#30D158", "#00C7BE"] as const },
  company:    { label: "Company Account",    icon: "briefcase", desc: "Business savings account for organisations",     gradient: ["#BF5AF2", "#FF2D55"] as const },
};

const SAVING_MODES: { key: SavingMode; label: string; icon: string; desc: string; color: string }[] = [
  { key: "manual",    label: "Normal / Manual",   icon: "inbox",       desc: "Deposit whenever you want, no rules",              color: "#007AFF" },
  { key: "automatic", label: "Automatic Saving",  icon: "repeat",      desc: "Auto-deduct a fixed amount on a schedule",         color: "#30D158" },
  { key: "goal",      label: "Goal Saving",       icon: "target",      desc: "Set a target amount and track your progress",      color: "#FF9F0A" },
  { key: "fixed",     label: "Fixed Saving",      icon: "lock",        desc: "Lock funds for a fixed period to earn more",       color: "#BF5AF2" },
];

const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function pct(balance: number, target: number) {
  return Math.min(100, Math.round((balance / target) * 100));
}

// ─── Step 1: Account Type Selector ───────────────────────────────────────────

function AccountTypeStep({ onSelect }: { onSelect: (t: AccountType) => void }) {
  return (
    <View style={s.stepWrap}>
      <View style={s.stepHeader}>
        <View style={s.stepIconWrap}>
          <Feather name="layers" size={28} color={DG} />
        </View>
        <Text style={s.stepTitle}>Create Savings Account</Text>
        <Text style={s.stepSub}>Choose the account type that suits you</Text>
      </View>

      {(Object.keys(ACCOUNT_TYPE_INFO) as AccountType[]).map((key) => {
        const info = ACCOUNT_TYPE_INFO[key];
        return (
          <TouchableOpacity key={key} style={s.typeCard} onPress={() => onSelect(key)} activeOpacity={0.82}>
            <LinearGradient colors={info.gradient} style={s.typeIconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Feather name={info.icon as any} size={22} color="#FFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.typeLabel}>{info.label}</Text>
              <Text style={s.typeDesc}>{info.desc}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#B0C4B0" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Step 2: Saving Mode Selector ─────────────────────────────────────────────

function SavingModeStep({
  accountType,
  onBack,
  onCreate,
}: {
  accountType: AccountType;
  onBack: () => void;
  onCreate: (acc: SavingAccount) => void;
}) {
  const [selected, setSelected] = useState<SavingMode | null>(null);
  const [name, setName]         = useState("");
  const [goalAmt, setGoalAmt]   = useState("");
  const [autoAmt, setAutoAmt]   = useState("");
  const [freq, setFreq]         = useState("");
  const [fixedAmt, setFixedAmt] = useState("");
  const [fixedMonths, setFixedMonths] = useState("");

  const handleCreate = () => {
    if (!selected || !name.trim()) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }
    const id = Date.now().toString();
    let acc: SavingAccount = { id, mode: selected, name: name.trim(), balance: 0 };
    if (selected === "goal")      acc.target        = parseFloat(goalAmt) || 0;
    if (selected === "automatic") acc.frequency     = freq || "Monthly";
    if (selected === "fixed")     acc.maturityDate  = `${fixedMonths || "3"} month(s)`;
    onCreate(acc);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepWrap} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Feather name="arrow-left" size={18} color={DG} />
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={s.stepTitle}>Choose Saving Type</Text>
      <Text style={s.stepSub}>{ACCOUNT_TYPE_INFO[accountType].label} Account</Text>

      <View style={s.modeGrid}>
        {SAVING_MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[s.modeCard, selected === m.key && { borderColor: m.color, backgroundColor: "#F8FFF8" }]}
            onPress={() => setSelected(m.key)}
            activeOpacity={0.82}
          >
            {selected === m.key && (
              <View style={[s.modeCheck, { backgroundColor: m.color }]}>
                <Feather name="check" size={9} color="#FFF" />
              </View>
            )}
            <View style={[s.modeIconBox, { backgroundColor: m.color + "22" }]}>
              <Feather name={m.icon as any} size={20} color={m.color} />
            </View>
            <Text style={[s.modeLabel, selected === m.key && { color: m.color }]}>{m.label}</Text>
            <Text style={s.modeDesc}>{m.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>Account Details</Text>

          <Text style={s.fieldLabel}>Account Name</Text>
          <TextInput
            style={s.fieldInput}
            placeholder="e.g. Holiday Fund"
            placeholderTextColor="#A0B0A0"
            value={name}
            onChangeText={setName}
          />

          {selected === "goal" && (
            <>
              <Text style={s.fieldLabel}>Goal Target (₦)</Text>
              <TextInput style={s.fieldInput} placeholder="500,000" placeholderTextColor="#A0B0A0" keyboardType="numeric" value={goalAmt} onChangeText={setGoalAmt} />
            </>
          )}

          {selected === "automatic" && (
            <>
              <Text style={s.fieldLabel}>Auto-Deduct Amount (₦)</Text>
              <TextInput style={s.fieldInput} placeholder="10,000" placeholderTextColor="#A0B0A0" keyboardType="numeric" value={autoAmt} onChangeText={setAutoAmt} />
              <Text style={s.fieldLabel}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {FREQUENCIES.map((f) => (
                    <TouchableOpacity key={f} style={[s.chip, freq === f && s.chipActive]} onPress={() => setFreq(f)}>
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
              <TextInput style={s.fieldInput} placeholder="50,000" placeholderTextColor="#A0B0A0" keyboardType="numeric" value={fixedAmt} onChangeText={setFixedAmt} />
              <Text style={s.fieldLabel}>Lock Duration (months)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["3", "6", "12", "24"].map((m) => (
                    <TouchableOpacity key={m} style={[s.chip, fixedMonths === m && s.chipActive]} onPress={() => setFixedMonths(m)}>
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

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function SavingCard({ acc, onDeposit }: { acc: SavingAccount; onDeposit: () => void }) {
  const mode = SAVING_MODES.find((m) => m.key === acc.mode)!;
  const progress = acc.target ? pct(acc.balance, acc.target) : null;

  return (
    <View style={s.savingCard}>
      <View style={s.savingCardTop}>
        <View style={[s.savingModeIcon, { backgroundColor: mode.color + "22" }]}>
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

      {acc.frequency && <Text style={s.savingMeta}>Auto: {acc.frequency}</Text>}
      {acc.maturityDate && <Text style={s.savingMeta}>Locked for: {acc.maturityDate}</Text>}

      <TouchableOpacity style={[s.depositBtn, { borderColor: mode.color }]} onPress={onDeposit} activeOpacity={0.8}>
        <Feather name="plus" size={14} color={mode.color} />
        <Text style={[s.depositBtnText, { color: mode.color }]}>Deposit</Text>
      </TouchableOpacity>
    </View>
  );
}

function JointUsersSection({ users, onAdd }: { users: LinkedUser[]; onAdd: () => void }) {
  return (
    <View style={s.sectionBox}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Linked Members</Text>
        <TouchableOpacity style={s.addUserBtn} onPress={onAdd} activeOpacity={0.8}>
          <Feather name="user-plus" size={13} color={DG} />
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
          <View style={[s.permBadge, { backgroundColor: u.canWithdraw ? "#E8F5E3" : "#FFF0F0" }]}>
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

function Dashboard({
  state,
  onAddAccount,
  onAddUser,
}: {
  state: SavingsState;
  onAddAccount: () => void;
  onAddUser: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const totalBalance = state.accounts.reduce((sum, a) => sum + a.balance, 0);
  const info = ACCOUNT_TYPE_INFO[state.accountType];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header banner */}
      <LinearGradient colors={info.gradient} style={s.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.bannerTop}>
          <View>
            <Text style={s.bannerType}>{info.label} Savings</Text>
            <Text style={s.bannerLabel}>Total Savings Balance</Text>
            <Text style={s.bannerBalance}>{fmt(totalBalance)}</Text>
          </View>
          <View style={s.bannerIcon}>
            <Feather name={info.icon as any} size={26} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
        <View style={s.bannerActions}>
          <TouchableOpacity
            style={s.bannerActionBtn}
            onPress={() => Alert.alert("Deposit", "Choose an account to deposit into")}
            activeOpacity={0.85}
          >
            <Feather name="arrow-down-circle" size={16} color={DG} />
            <Text style={s.bannerActionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.bannerActionBtn}
            onPress={() => Alert.alert("Withdraw", "Choose an account to withdraw from")}
            activeOpacity={0.85}
          >
            <Feather name="arrow-up-circle" size={16} color={DG} />
            <Text style={s.bannerActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.bannerActionBtn} onPress={onAddAccount} activeOpacity={0.85}>
            <Feather name="plus-circle" size={16} color={DG} />
            <Text style={s.bannerActionText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{state.accounts.length}</Text>
          <Text style={s.statLabel}>Active Pots</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statValue}>{state.accounts.filter((a) => a.mode === "goal").length}</Text>
          <Text style={s.statLabel}>Goals</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statValue}>{state.accounts.filter((a) => a.mode === "automatic").length}</Text>
          <Text style={s.statLabel}>Auto</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statValue}>{state.accounts.filter((a) => a.mode === "fixed").length}</Text>
          <Text style={s.statLabel}>Fixed</Text>
        </View>
      </View>

      {/* Savings pots */}
      <View style={s.sectionBox}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Savings Pots</Text>
        </View>
        {state.accounts.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="inbox" size={32} color="#B0C4B0" />
            <Text style={s.emptyText}>No savings pots yet</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={onAddAccount}>
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

      {/* Joint users section */}
      {state.accountType === "joint" && (
        <JointUsersSection users={state.linkedUsers} onAdd={onAddUser} />
      )}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Screen = "type" | "mode" | "dashboard";

export default function SavingsScreen() {
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;

  const [screen, setScreen]           = useState<Screen>("type");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [savingsState, setSavingsState] = useState<SavingsState | null>(null);

  const handleTypeSelect = (t: AccountType) => {
    setAccountType(t);
    setScreen("mode");
  };

  const handleCreate = (acc: SavingAccount) => {
    const defaultUsers: LinkedUser[] =
      accountType === "joint"
        ? [
            { id: "1", name: "Darlington O.", initials: "DO", color: DG,       canWithdraw: true },
            { id: "2", name: "Amaka Eze",     initials: "AE", color: "#C0392B", canWithdraw: true },
          ]
        : [];

    setSavingsState({ accountType, accounts: [acc], linkedUsers: defaultUsers });
    setScreen("dashboard");
  };

  const handleAddAccount = () => setScreen("mode");

  const handleAddUser = () => {
    Alert.alert(
      "Add Member",
      "Enter the Livra account (e.g. AC24561) of the person to add to this savings account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: () => {
            if (!savingsState) return;
            const newUser: LinkedUser = {
              id: Date.now().toString(),
              name: "New Member",
              initials: "NM",
              color: "#8B5CF6",
              canWithdraw: true,
            };
            setSavingsState({ ...savingsState, linkedUsers: [...savingsState.linkedUsers, newUser] });
          },
        },
      ]
    );
  };

  const handleModeCreate = (acc: SavingAccount) => {
    if (!savingsState) {
      handleCreate(acc);
      return;
    }
    setSavingsState({ ...savingsState, accounts: [...savingsState.accounts, acc] });
    setScreen("dashboard");
  };

  if (screen === "type") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <AccountTypeStep onSelect={handleTypeSelect} />
      </ScrollView>
    );
  }

  if (screen === "mode") {
    return (
      <View style={{ flex: 1, backgroundColor: BG, paddingTop: topPad }}>
        <SavingModeStep
          accountType={accountType}
          onBack={() => setScreen(savingsState ? "dashboard" : "type")}
          onCreate={handleModeCreate}
        />
      </View>
    );
  }

  if (screen === "dashboard" && savingsState) {
    return (
      <Dashboard
        state={savingsState}
        onAddAccount={handleAddAccount}
        onAddUser={handleAddUser}
      />
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stepWrap: { padding: 20 },
  stepHeader: { alignItems: "center", marginBottom: 28 },
  stepIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E8F5E3", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: DG, textAlign: "center", marginBottom: 6 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#6B7B6E", textAlign: "center" },

  typeCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  typeIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: DG, marginBottom: 3 },
  typeDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#6B7B6E" },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: DG },

  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  modeCard: {
    width: "47.5%", backgroundColor: WHITE, borderRadius: 16, padding: 14,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  modeCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  modeIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: DG, marginBottom: 4 },
  modeDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#8A9A8A", lineHeight: 16 },

  formCard: { backgroundColor: WHITE, borderRadius: 18, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  formTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: DG, marginBottom: 16 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#6B7B6E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: "#F8FAF8", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 14, color: "#1A1A1A", borderWidth: 1.5, borderColor: "#C6F135", marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: "#D0D8D0", backgroundColor: WHITE },
  chipActive: { backgroundColor: DG, borderColor: DG },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: DG },
  chipTextActive: { color: "#FFF" },
  createBtn: { backgroundColor: DG, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 6 },
  createBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: LIME },

  banner: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 14 },
  bannerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  bannerType: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  bannerLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  bannerBalance: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFF", letterSpacing: -0.5 },
  bannerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  bannerActions: { flexDirection: "row", gap: 10 },
  bannerActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 12, paddingVertical: 9 },
  bannerActionText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: DG },

  statsRow: { flexDirection: "row", backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 16, paddingVertical: 14, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "#E8EDE8" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: DG },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#8A9A8A", marginTop: 2 },

  sectionBox: { backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: DG },
  sectionNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#FF9F0A", marginBottom: 14, lineHeight: 16 },

  savingCard: { backgroundColor: BG, borderRadius: 14, padding: 14, marginBottom: 10 },
  savingCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  savingModeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  savingName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: DG },
  savingModeName: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  savingBalance: { fontFamily: "Inter_700Bold", fontSize: 15, color: DG },
  progressWrap: { marginBottom: 8 },
  progressBg: { height: 6, backgroundColor: "#E0EAE0", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#6B7B6E" },
  savingMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#8A9A8A", marginBottom: 6 },
  depositBtn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  depositBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },

  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#8A9A8A" },
  emptyBtn: { marginTop: 4 },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: DG, textDecorationLine: "underline" },

  addUserBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderColor: DG, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  addUserText: { fontFamily: "Inter_500Medium", fontSize: 12, color: DG },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F0F4F0" },
  userAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  userInitials: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFF" },
  userName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: DG },
  permBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  permText: { fontFamily: "Inter_500Medium", fontSize: 11 },
});
