import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { CopyLinkIcon, GmailIcon, MessengerIcon, MoreIcon, WhatsAppIcon } from "@/components/ShareIcons";
import { AppTabBar } from "@/components/AppTabBar";

const DARK_GREEN = "#1A3B2F";
const LIME = "#C6F135";
const BG = "#F2F4F2";
const WALLET_ADDRESS = "PC-NG-005291";

const CURRENCIES = ["NGN", "USD", "EUR"];

const SHARE_OPTIONS = [
  { key: "copy",      label: "Copy link",  bg: "#2C2C2C" },
  { key: "whatsapp",  label: "WhatsApp",   bg: "#25D366" },
  { key: "gmail",     label: "Gmail",      bg: "#EA4335" },
  { key: "messenger", label: "Messenger",  bg: "#0084FF" },
  { key: "more",      label: "More",       bg: "#8E8E93" },
];

function ShareIcon({ id }: { id: string }) {
  if (id === "copy")      return <CopyLinkIcon />;
  if (id === "whatsapp")  return <WhatsAppIcon />;
  if (id === "gmail")     return <GmailIcon />;
  if (id === "messenger") return <MessengerIcon />;
  return <MoreIcon />;
}

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState("NGN");
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const handleCopy = () => {
    Alert.alert("Copied", `${WALLET_ADDRESS} copied to clipboard`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send money to my FinWallet: ${WALLET_ADDRESS}`,
        title: "My FinWallet Address",
      });
    } catch {
      Alert.alert("Error", "Could not share wallet info");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={20} color={DARK_GREEN} />
        </TouchableOpacity>
        <Text style={styles.title}>Receive Money</Text>
        <Text style={styles.subtitle}>
          Share your wallet details or QR code to get paid.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>{WALLET_ADDRESS}</Text>
            <TouchableOpacity style={styles.outlineBtn} onPress={handleCopy}>
              <Text style={styles.outlineBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>Currency</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                onPress={() => setCurrency(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* QR Code Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>QR Code</Text>

          <View style={styles.qrRow}>
            <View style={styles.qrBox}>
              <QRCode
                value={`${WALLET_ADDRESS}-${currency}`}
                size={90}
                color={DARK_GREEN}
                backgroundColor="#EDEEED"
              />
            </View>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => Alert.alert("Copied", "QR code copied")}
            >
              <Text style={styles.outlineBtnText}>Copy QR code</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.shareToLabel}>Share to:</Text>
          <View style={styles.shareRow}>
            {SHARE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.shareItem}
                activeOpacity={0.75}
                onPress={() =>
                  opt.key === "more"
                    ? handleShare()
                    : Alert.alert(opt.label, `Share via ${opt.label}`)
                }
              >
                <View style={[styles.shareIcon, { backgroundColor: opt.bg }]}>
                  <ShareIcon id={opt.key} />
                </View>
                <Text style={styles.shareLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Share Wallet Info button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.shareWalletBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareWalletText}>Share Wallet Info</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom navigation bar */}
      <AppTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D0D5D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: DARK_GREEN,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6B7B6E",
    textAlign: "center",
    lineHeight: 20,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  addressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#1A1A1A",
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: DARK_GREEN,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  outlineBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: DARK_GREEN,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EDE8",
    marginVertical: 14,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  currencyBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#C8D4C8",
    backgroundColor: "#FFFFFF",
  },
  currencyBtnActive: {
    backgroundColor: DARK_GREEN,
    borderColor: DARK_GREEN,
  },
  currencyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: DARK_GREEN,
  },
  currencyTextActive: {
    color: "#FFFFFF",
  },
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  qrBox: {
    backgroundColor: "#EDEEED",
    borderRadius: 12,
    padding: 10,
  },
  shareToLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 14,
  },
  shareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shareItem: {
    alignItems: "center",
    gap: 6,
  },
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  shareLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#4A5A4A",
    textAlign: "center",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: BG,
  },
  shareWalletBtn: {
    backgroundColor: DARK_GREEN,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  shareWalletText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: LIME,
  },
});
