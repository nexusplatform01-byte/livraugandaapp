import React, { useState } from "react";
import {
  Alert,
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
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";

const BG       = "#F2F4F2";
const GREEN    = "#1A3B2F";
const GREEN2   = "#22503E";
const LIME     = "#C6F135";
const MUTED    = "rgba(255,255,255,0.5)";
const BORDER   = "rgba(255,255,255,0.1)";
const CARD_BG  = "#243D30";

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, color = LIME, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[s.rowIcon, { backgroundColor: (danger ? "#EF4444" : color) + "22" }]}>
        <Feather
          name={icon as any}
          size={18}
          color={danger ? "#EF4444" : color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: "#EF4444" }]}>{label}</Text>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
      </View>
      {onPress && !danger && (
        <Feather name="chevron-right" size={16} color={MUTED} />
      )}
    </TouchableOpacity>
  );
}

function EditNameModal({
  visible, currentName, onSave, onClose,
}: {
  visible: boolean; currentName: string;
  onSave: (name: string) => void; onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Edit Full Name</Text>
          <Text style={m.subtitle}>This name is displayed on your profile.</Text>
          <TextInput
            style={m.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor="#7A9A7A"
            autoFocus
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[m.saveBtn, !name.trim() && m.saveBtnOff]}
            onPress={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            activeOpacity={0.85}
          >
            <Text style={m.saveBtnTxt}>Save Name</Text>
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={m.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ChangePinModal({
  visible, onClose, onChangePin,
}: {
  visible: boolean; onClose: () => void;
  onChangePin: (current: string, next: string) => Promise<boolean>;
}) {
  const [step, setStep]       = useState<"current" | "new" | "confirm">("current");
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);

  function reset() {
    setStep("current"); setCurrent(""); setNext(""); setConfirm(""); setError("");
  }

  function close() { reset(); onClose(); }

  async function handleNext() {
    if (step === "current") {
      if (current.length !== 4) { setError("PIN must be 4 digits."); return; }
      setError(""); setStep("new");
    } else if (step === "new") {
      if (next.length !== 4) { setError("New PIN must be 4 digits."); return; }
      setError(""); setStep("confirm");
    } else {
      if (confirm !== next) { setError("PINs do not match."); return; }
      setSaving(true);
      const ok = await onChangePin(current, next);
      setSaving(false);
      if (ok) {
        Alert.alert("PIN Changed", "Your PIN has been updated successfully.");
        close();
      } else {
        setError("Current PIN is incorrect.");
        setStep("current"); setCurrent(""); setNext(""); setConfirm("");
      }
    }
  }

  const pinVal   = step === "current" ? current : step === "new" ? next : confirm;
  const setPinVal = step === "current" ? setCurrent : step === "new" ? setNext : setConfirm;
  const stepLabel = step === "current" ? "Enter current PIN" : step === "new" ? "Enter new PIN" : "Confirm new PIN";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={m.overlay}>
        <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={close} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Change PIN</Text>
          <Text style={m.subtitle}>{stepLabel}</Text>
          <TextInput
            style={[m.input, { letterSpacing: 12, fontSize: 20, textAlign: "center" }]}
            value={pinVal}
            onChangeText={(t) => { setPinVal(t.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            placeholder="••••"
            placeholderTextColor="#7A9A7A"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            autoFocus
          />
          {!!error && <Text style={m.errorTxt}>{error}</Text>}
          <TouchableOpacity
            style={[m.saveBtn, (pinVal.length !== 4 || saving) && m.saveBtnOff]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={pinVal.length !== 4 || saving}
          >
            <Text style={m.saveBtnTxt}>
              {saving ? "Saving…" : step === "confirm" ? "Confirm" : "Next"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={close} activeOpacity={0.7}>
            <Text style={m.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { customerName, phone, balanceUGX, signOut, updateCustomerName, changePin } = useAuth();
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;

  const [editNameVisible, setEditNameVisible] = useState(false);
  const [changePinVisible, setChangePinVisible] = useState(false);

  const initials = customerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You will need to enter your phone number and PIN again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: GREEN }}>
      <View style={[s.headerBar, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.profileName}>{customerName || "User"}</Text>
          <Text style={s.profilePhone}>{phone}</Text>
          <View style={s.balancePill}>
            <Text style={s.balancePillText}>
              UGX {balanceUGX.toLocaleString()} wallet balance
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.section}>
          <SettingRow
            icon="user"
            label="Full Name"
            value={customerName || "—"}
            color={LIME}
            onPress={() => setEditNameVisible(true)}
          />
          <View style={s.sep} />
          <SettingRow
            icon="phone"
            label="Phone Number"
            value={phone}
            color="#54A0FF"
          />
          <View style={s.sep} />
          <SettingRow
            icon="shield"
            label="KYC Status"
            value="Verified via Relworx"
            color="#22C55E"
          />
        </View>

        <Text style={s.sectionTitle}>Security</Text>
        <View style={s.section}>
          <SettingRow
            icon="lock"
            label="Change PIN"
            color={LIME}
            onPress={() => setChangePinVisible(true)}
          />
          <View style={s.sep} />
          <SettingRow
            icon="bell"
            label="Push Notifications"
            color="#C084FC"
            onPress={() => router.push("/notifications")}
          />
        </View>

        <Text style={s.sectionTitle}>Support</Text>
        <View style={s.section}>
          <SettingRow
            icon="help-circle"
            label="Help & FAQ"
            color="#F59E0B"
            onPress={() => Alert.alert("Help", "Support: support@livra.com")}
          />
          <View style={s.sep} />
          <SettingRow
            icon="info"
            label="App Version"
            value="1.0.0"
            color={MUTED}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditNameModal
        visible={editNameVisible}
        currentName={customerName}
        onSave={updateCustomerName}
        onClose={() => setEditNameVisible(false)}
      />
      <ChangePinModal
        visible={changePinVisible}
        onClose={() => setChangePinVisible(false)}
        onChangePin={changePin}
      />
    </View>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: GREEN,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  profileName: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  profilePhone: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  balancePill: {
    backgroundColor: LIME + "22",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: LIME + "44",
  },
  balancePillText: {
    color: LIME,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    color: MUTED,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  section: {
    marginHorizontal: 20,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rowValue: {
    color: MUTED,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  sep: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 64,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: "flex-end" },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:      { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 14 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  title:      { fontFamily: "Inter_700Bold", fontSize: 20, color: GREEN, marginBottom: 4 },
  subtitle:   { fontFamily: "Inter_400Regular", fontSize: 13, color: "#7A9A7A", marginBottom: 20 },
  input:      { backgroundColor: "#F2F4F2", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: "Inter_400Regular", fontSize: 16, color: GREEN, borderWidth: 1.5, borderColor: "#C6F135", marginBottom: 20 },
  saveBtn:    { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 10 },
  saveBtnOff: { backgroundColor: "#C8D8C8" },
  saveBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: LIME },
  cancelBtn:  { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#7A9A7A" },
  errorTxt:   { fontFamily: "Inter_400Regular", fontSize: 12, color: "#EF4444", marginBottom: 12, textAlign: "center" },
});
