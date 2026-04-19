import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

const MOBILE_PROVIDERS = [
  { key: "mtn",    label: "MTN MoMo",     color: "#FFC300", icon: "phone",   ussd: "*556#"   },
  { key: "airtel", label: "Airtel Money",  color: "#E8001A", icon: "phone",   ussd: "*778#"   },
  { key: "glo",    label: "Glo Money",     color: "#007A3D", icon: "phone",   ussd: "*777#"   },
  { key: "9mobile",label: "9Mobile",       color: "#7EC242", icon: "phone",   ussd: "*789#"   },
];

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
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount]     = useState("");
  const [phone, setPhone]       = useState("");

  const provider = MOBILE_PROVIDERS.find((p) => p.key === selected);

  const handleDeposit = () => {
    if (!selected) { Alert.alert("Select Provider", "Please choose a mobile money provider."); return; }
    if (!amount || isNaN(Number(amount))) { Alert.alert("Invalid Amount", "Please enter a valid amount."); return; }
    if (!phone || phone.length < 10) { Alert.alert("Invalid Number", "Please enter a valid phone number."); return; }
    Alert.alert("Deposit Initiated", `₦${Number(amount).toLocaleString()} deposit via ${provider?.label} has been initiated.\n\nDial ${provider?.ussd} to confirm on your phone.`);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Info banner */}
      <View style={s.infoBanner}>
        <Feather name="info" size={14} color={DEEP} />
        <Text style={s.infoBannerText}>Select your mobile money provider and enter the amount to fund your Livra wallet.</Text>
      </View>

      {/* Provider grid */}
      <Text style={s.sectionLabel}>Choose Provider</Text>
      <View style={s.providerGrid}>
        {MOBILE_PROVIDERS.map((p) => {
          const active = selected === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.providerCard, active && { borderColor: p.color, backgroundColor: p.color + "0E" }]}
              onPress={() => setSelected(p.key)}
              activeOpacity={0.85}
            >
              <View style={[s.providerDot, { backgroundColor: p.color }]} />
              <Text style={[s.providerLabel, active && { color: DEEP, fontFamily: "Inter_700Bold" }]}>{p.label}</Text>
              <Text style={s.providerUssd}>{p.ussd}</Text>
              {active && (
                <View style={[s.providerCheck, { backgroundColor: p.color }]}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Amount + Phone */}
      <Text style={s.sectionLabel}>Deposit Details</Text>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Amount (₦)</Text>
        <TextInput
          style={s.input}
          placeholder="0.00"
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Mobile Money Phone Number</Text>
        <View style={s.phoneRow}>
          <View style={s.dialCode}><Text style={s.dialCodeText}>🇳🇬 +234</Text></View>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="080 0000 0000"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={11}
          />
        </View>
      </View>

      {provider && (
        <View style={[s.ussdNote, { borderColor: provider.color + "55", backgroundColor: provider.color + "0A" }]}>
          <Feather name="terminal" size={13} color={provider.color} />
          <Text style={[s.ussdNoteText, { color: provider.color }]}>
            After submitting, dial <Text style={{ fontFamily: "Inter_700Bold" }}>{provider.ussd}</Text> on your {provider.label} line to authorize the payment.
          </Text>
        </View>
      )}

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
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const [tab, setTab] = useState<"mobile" | "livra">("mobile");

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={20} color={DEEP} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Fund Account</Text>
          <Text style={s.subtitle}>Choose how you'd like to deposit money</Text>
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
  root:    { flex: 1, backgroundColor: BG },
  header:  { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 16, paddingTop: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: BORDER, alignItems: "center", justifyContent: "center", backgroundColor: CARD },
  title:   { fontFamily: "Inter_700Bold", fontSize: 20, color: DEEP },
  subtitle:{ fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED, marginTop: 2 },

  tabBar:          { flexDirection: "row", marginHorizontal: 18, marginBottom: 16, backgroundColor: CARD, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  tabBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 11 },
  tabBtnActive:    { backgroundColor: DEEP },
  tabBtnText:      { color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium" },
  tabBtnTextActive:{ color: LIME, fontFamily: "Inter_600SemiBold" },

  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },

  infoBanner:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#E8F5E0", borderRadius: 12, padding: 12, marginBottom: 18, borderWidth: 1, borderColor: "#C8E6C9" },
  infoBannerText: { color: DEEP, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },

  sectionLabel: { color: DEEP, fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 10 },

  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  providerCard: {
    width: "47.5%", backgroundColor: CARD, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: BORDER, position: "relative",
  },
  providerDot:   { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  providerLabel: { color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 3 },
  providerUssd:  { color: "#AAB8AA", fontSize: 11, fontFamily: "Inter_400Regular" },
  providerCheck: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  inputCard:  { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  inputLabel: { color: MUTED, fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 8 },
  input:      { color: DEEP, fontSize: 16, fontFamily: "Inter_500Medium", paddingVertical: 4 },
  phoneRow:   { flexDirection: "row", gap: 10, alignItems: "center" },
  dialCode:   { backgroundColor: BG, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  dialCodeText:{ color: DEEP, fontSize: 13, fontFamily: "Inter_500Medium" },

  ussdNote:     { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1 },
  ussdNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },

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
