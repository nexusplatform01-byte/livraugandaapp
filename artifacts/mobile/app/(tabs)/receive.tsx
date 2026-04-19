import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CopyLinkIcon, GmailIcon, MessengerIcon, MoreIcon, WhatsAppIcon } from "@/components/ShareIcons";

const DEEP  = "#1A3B2F";
const LIME  = "#C6F135";
const GREEN = "#22A861";
const BG    = "#F2F4F2";
const MUTED = "#6B7B6E";
const CARD  = "#FFFFFF";
const BORDER= "#E0EBE0";

const LIVRA_ID   = "PC-NG-005291";
const USER_NAME  = "Darlington O.";
const ACCOUNT_NO = "3300 5291 7812";


const SHARE_OPTIONS = [
  { key: "copy",      label: "Copy",      bg: "#2C2C2C" },
  { key: "whatsapp",  label: "WhatsApp",  bg: "#25D366" },
  { key: "gmail",     label: "Gmail",     bg: "#EA4335" },
  { key: "messenger", label: "Messenger", bg: "#0084FF" },
  { key: "more",      label: "More",      bg: "#8E8E93" },
];

function ShareIcon({ id }: { id: string }) {
  if (id === "copy")      return <CopyLinkIcon />;
  if (id === "whatsapp")  return <WhatsAppIcon />;
  if (id === "gmail")     return <GmailIcon />;
  if (id === "messenger") return <MessengerIcon />;
  return <MoreIcon />;
}

// ─── Mobile Money Tab ──────────────────────────────────────────────────────────
function MobileMoneyTab() {
  const [amount, setAmount] = useState("");
  const [phone,  setPhone]  = useState("");
  const [amountFocused, setAmountFocused] = useState(false);
  const [phoneFocused,  setPhoneFocused]  = useState(false);

  const handleDeposit = () => {
    if (!amount || isNaN(Number(amount))) { Alert.alert("Invalid Amount", "Please enter a valid amount."); return; }
    if (!phone || phone.length < 10)      { Alert.alert("Invalid Number", "Please enter a valid phone number."); return; }
    Alert.alert("Deposit Initiated", `₦${Number(amount).toLocaleString()} deposit has been initiated from +234${phone}.`);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={s.infoBanner}>
        <Feather name="info" size={14} color={DEEP} />
        <Text style={s.infoBannerText}>Enter your mobile money details to fund your Livra wallet instantly. The network is detected automatically.</Text>
      </View>

      {/* Amount */}
      <Text style={s.fieldLabel}>Amount (₦)</Text>
      <View style={[s.fieldBox, amountFocused && s.fieldBoxFocused]}>
        <View style={s.fieldPrefix}><Text style={s.fieldPrefixText}>₦</Text></View>
        <TextInput
          style={s.fieldInput}
          placeholder="0.00"
          placeholderTextColor="#AABFAA"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          onFocus={() => setAmountFocused(true)}
          onBlur={() => setAmountFocused(false)}
          selectionColor={DEEP}
          contextMenuHidden
        />
      </View>

      {/* Phone */}
      <Text style={s.fieldLabel}>Mobile Money Number</Text>
      <View style={[s.fieldBox, phoneFocused && s.fieldBoxFocused]}>
        <View style={s.dialCode}><Text style={s.dialCodeText}>🇳🇬 +234</Text></View>
        <TextInput
          style={s.fieldInput}
          placeholder="080 0000 0000"
          placeholderTextColor="#AABFAA"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          onFocus={() => setPhoneFocused(true)}
          onBlur={() => setPhoneFocused(false)}
          maxLength={11}
          selectionColor={DEEP}
          contextMenuHidden
        />
      </View>

      <TouchableOpacity style={s.primaryBtn} onPress={handleDeposit} activeOpacity={0.85}>
        <Feather name="arrow-down-circle" size={18} color={LIME} />
        <Text style={s.primaryBtnText}>Deposit via Mobile Money</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── From Livra User Tab ───────────────────────────────────────────────────────
function LiveraUserTab() {
  const qrValue = `livra://pay?id=${LIVRA_ID}&name=${encodeURIComponent(USER_NAME)}&account=${ACCOUNT_NO}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Pay me on Livra!\nName: ${USER_NAME}\nLivra ID: ${LIVRA_ID}\nAccount: ${ACCOUNT_NO}`,
        title: "My Livra Payment Details",
      });
    } catch {
      Alert.alert("Error", "Could not share details.");
    }
  };

  const handleCopy = (text: string, label: string) => {
    Alert.alert("Copied", `${label} copied to clipboard.`);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* QR Card */}
      <View style={s.qrCard}>
        <LinearGradient colors={[DEEP, "#22603F"]} style={s.qrGradHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.qrAvatarWrap}>
            <Text style={s.qrAvatar}>{USER_NAME.charAt(0)}</Text>
          </View>
          <Text style={s.qrName}>{USER_NAME}</Text>
          <Text style={s.qrSubLabel}>Scan to pay</Text>
        </LinearGradient>

        <View style={s.qrCodeWrap}>
          <View style={s.qrInner}>
            <QRCode
              value={qrValue}
              size={180}
              color={DEEP}
              backgroundColor="#FFFFFF"
            />
          </View>
          <View style={s.qrCorner} />
        </View>

        <Text style={s.qrScanHint}>Point your camera at this QR code to send money</Text>
      </View>

      {/* Account Details */}
      <View style={s.detailsCard}>
        <Text style={s.sectionLabel}>Account Details</Text>

        {[
          { label: "Livra ID",       value: LIVRA_ID,    icon: "credit-card" },
          { label: "Account Number", value: ACCOUNT_NO,  icon: "hash"        },
          { label: "Account Name",   value: USER_NAME,   icon: "user"        },
        ].map((item) => (
          <View key={item.label} style={s.detailRow}>
            <View style={s.detailIconWrap}>
              <Feather name={item.icon as any} size={14} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.detailLabel}>{item.label}</Text>
              <Text style={s.detailValue}>{item.value}</Text>
            </View>
            <TouchableOpacity style={s.copyBtn} onPress={() => handleCopy(item.value, item.label)} activeOpacity={0.75}>
              <Feather name="copy" size={13} color={DEEP} />
              <Text style={s.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Share row */}
      <View style={s.detailsCard}>
        <Text style={s.sectionLabel}>Share via</Text>
        <View style={s.shareRow}>
          {SHARE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={s.shareItem}
              activeOpacity={0.75}
              onPress={() => opt.key === "more" || opt.key === "copy" ? handleShare() : Alert.alert(opt.label, `Share via ${opt.label}`)}
            >
              <View style={[s.shareIcon, { backgroundColor: opt.bg }]}>
                <ShareIcon id={opt.key} />
              </View>
              <Text style={s.shareLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.primaryBtn} onPress={handleShare} activeOpacity={0.85}>
        <Feather name="share-2" size={18} color={LIME} />
        <Text style={s.primaryBtnText}>Share My Payment Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"mobile" | "livra">("mobile");

  return (
    <View style={s.root}>
      {/* Exact same balance header as send page */}
      <View style={[s.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 10 }]}>
        <View style={s.topBarCenter}>
          <Text style={s.topBarLabel}>Your Wallet Balance</Text>
          <Text style={s.topBarBalance}>₦209,891.21</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, tab === "mobile" && s.tabBtnActive]} onPress={() => setTab("mobile")} activeOpacity={0.85}>
          <Feather name="smartphone" size={14} color={tab === "mobile" ? LIME : MUTED} />
          <Text style={[s.tabBtnText, tab === "mobile" && s.tabBtnTextActive]}>Mobile Money</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === "livra" && s.tabBtnActive]} onPress={() => setTab("livra")} activeOpacity={0.85}>
          <Feather name="users" size={14} color={tab === "livra" ? LIME : MUTED} />
          <Text style={[s.tabBtnText, tab === "livra" && s.tabBtnTextActive]}>From Livra User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "mobile" ? <MobileMoneyTab /> : <LiveraUserTab />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  topBar:       { backgroundColor: DEEP, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 3 },
  topBarBalance:{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF", letterSpacing: -0.5 },

  tabBar:          { flexDirection: "row", marginHorizontal: 18, marginBottom: 16, backgroundColor: CARD, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  tabBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 11 },
  tabBtnActive:    { backgroundColor: DEEP },
  tabBtnText:      { color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium" },
  tabBtnTextActive:{ color: LIME, fontFamily: "Inter_600SemiBold" },

  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },

  infoBanner:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#E8F5E0", borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#C8E6C9" },
  infoBannerText: { color: DEEP, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },

  sectionLabel: { color: DEEP, fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 10 },

  fieldLabel:      { color: DEEP, fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 8, marginTop: 4 },
  fieldBox:        {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 14, borderWidth: 2, borderColor: "#C8D8C8",
    paddingHorizontal: 14, height: 58, marginBottom: 20,
  },
  fieldBoxFocused: { borderColor: DEEP, borderWidth: 2.5 },
  fieldPrefix:     { marginRight: 8 },
  fieldPrefixText: { color: DEEP, fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldInput:      { flex: 1, color: DEEP, fontSize: 16, fontFamily: "Inter_600SemiBold" },

  dialCode:    { backgroundColor: "#DCF0DC", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginRight: 12, borderWidth: 1.5, borderColor: "#B8D4B8" },
  dialCodeText:{ color: DEEP, fontSize: 13, fontFamily: "Inter_700Bold" },

  primaryBtn:     { backgroundColor: DEEP, borderRadius: 16, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6 },
  primaryBtnText: { color: LIME, fontSize: 15, fontFamily: "Inter_700Bold" },

  // QR tab
  qrCard:       { backgroundColor: CARD, borderRadius: 20, overflow: "hidden", marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  qrGradHeader: { padding: 22, alignItems: "center" },
  qrAvatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(198,241,53,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 2, borderColor: LIME },
  qrAvatar:     { color: LIME, fontSize: 24, fontFamily: "Inter_700Bold" },
  qrName:       { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  qrSubLabel:   { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" },
  qrCodeWrap:   { alignItems: "center", paddingVertical: 24, backgroundColor: CARD },
  qrInner:      { padding: 16, backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  qrCorner:     { position: "absolute", top: 0, right: 0, width: 0, height: 0 },
  qrScanHint:   { textAlign: "center", color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", paddingBottom: 18, paddingHorizontal: 20 },

  detailsCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  detailRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  detailIconWrap:{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#E8F5E0", alignItems: "center", justifyContent: "center" },
  detailLabel: { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },
  detailValue: { color: DEEP, fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  copyBtn:     { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  copyBtnText: { color: DEEP, fontSize: 11, fontFamily: "Inter_500Medium" },

  shareRow:  { flexDirection: "row", justifyContent: "space-between" },
  shareItem: { alignItems: "center", gap: 6 },
  shareIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  shareLabel:{ fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED, textAlign: "center" },
});
