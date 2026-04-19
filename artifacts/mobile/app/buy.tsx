import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Theme ──────────────────────────────────────────────────────────────────
const BG      = "#0D1F17";
const DEEP    = "#152C1E";
const CARD    = "#1C3828";
const LIME    = "#C6F135";
const BORDER  = "#2A4A35";
const MUTED   = "rgba(255,255,255,0.55)";

// ─── Types ───────────────────────────────────────────────────────────────────
type CatKey = "airtime" | "voice" | "data" | "tv" | "utilities";

interface Plan {
  id: string;
  name: string;
  amount: number;
  validity?: string;
  description?: string;
}

interface Provider {
  id: string;
  name: string;
  initials: string;
  color: string;
  plans: Plan[];
  inputLabel: string;
  inputPlaceholder: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────
const CATS: { key: CatKey; label: string; icon: string }[] = [
  { key: "airtime",   label: "Airtime",      icon: "phone" },
  { key: "voice",     label: "Voice",         icon: "mic" },
  { key: "data",      label: "Data Bundle",   icon: "wifi" },
  { key: "tv",        label: "TV",            icon: "tv" },
  { key: "utilities", label: "Utilities",     icon: "zap" },
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
const PROVIDERS: Record<CatKey, Provider[]> = {
  airtime: [
    { id: "mtn",    name: "MTN",    initials: "MTN", color: "#C8960A",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "a50",   name: "₦50 Airtime",    amount: 50   },
        { id: "a100",  name: "₦100 Airtime",   amount: 100  },
        { id: "a200",  name: "₦200 Airtime",   amount: 200  },
        { id: "a500",  name: "₦500 Airtime",   amount: 500  },
        { id: "a1000", name: "₦1,000 Airtime", amount: 1000 },
        { id: "a2000", name: "₦2,000 Airtime", amount: 2000 },
      ] },
    { id: "airtel", name: "Airtel", initials: "AIR", color: "#C0392B",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "a50",   name: "₦50 Airtime",    amount: 50   },
        { id: "a100",  name: "₦100 Airtime",   amount: 100  },
        { id: "a200",  name: "₦200 Airtime",   amount: 200  },
        { id: "a500",  name: "₦500 Airtime",   amount: 500  },
        { id: "a1000", name: "₦1,000 Airtime", amount: 1000 },
        { id: "a2000", name: "₦2,000 Airtime", amount: 2000 },
      ] },
    { id: "glo",    name: "Glo",    initials: "GLO", color: "#1A7A3F",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "a50",   name: "₦50 Airtime",    amount: 50   },
        { id: "a100",  name: "₦100 Airtime",   amount: 100  },
        { id: "a200",  name: "₦200 Airtime",   amount: 200  },
        { id: "a500",  name: "₦500 Airtime",   amount: 500  },
        { id: "a1000", name: "₦1,000 Airtime", amount: 1000 },
        { id: "a2000", name: "₦2,000 Airtime", amount: 2000 },
      ] },
    { id: "9mb",    name: "9mobile", initials: "9MB", color: "#1D6340",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "a50",   name: "₦50 Airtime",    amount: 50   },
        { id: "a100",  name: "₦100 Airtime",   amount: 100  },
        { id: "a200",  name: "₦200 Airtime",   amount: 200  },
        { id: "a500",  name: "₦500 Airtime",   amount: 500  },
        { id: "a1000", name: "₦1,000 Airtime", amount: 1000 },
      ] },
  ],
  voice: [
    { id: "mtn-v", name: "MTN Voice", initials: "MTN", color: "#C8960A",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "v1", name: "Talk Time 200",  amount: 200,  validity: "7 days",  description: "50MB Data + 50 on-net mins" },
        { id: "v2", name: "Talk Time 500",  amount: 500,  validity: "30 days", description: "150MB Data + 150 on-net mins" },
        { id: "v3", name: "Talk Time 1000", amount: 1000, validity: "30 days", description: "300MB Data + 350 on-net mins" },
        { id: "v4", name: "Talk Time 2000", amount: 2000, validity: "30 days", description: "1GB Data + 1000 on-net mins" },
      ] },
    { id: "air-v", name: "Airtel Voice", initials: "AIR", color: "#C0392B",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "v1", name: "TalkMore 200",  amount: 200,  validity: "7 days",  description: "60 on-net + 20 off-net mins" },
        { id: "v2", name: "TalkMore 500",  amount: 500,  validity: "30 days", description: "200 on-net + 50 off-net mins" },
        { id: "v3", name: "TalkMore 1000", amount: 1000, validity: "30 days", description: "500 on-net + 100 off-net mins" },
      ] },
    { id: "glo-v", name: "Glo Voice", initials: "GLO", color: "#1A7A3F",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "v1", name: "Berekete 200",  amount: 200,  validity: "7 days",  description: "Unlimited on-net calls" },
        { id: "v2", name: "Berekete 500",  amount: 500,  validity: "30 days", description: "Unlimited on-net + 100MB" },
        { id: "v3", name: "Berekete 1500", amount: 1500, validity: "30 days", description: "Unlimited on-net + 500MB" },
      ] },
    { id: "9mb-v", name: "9mobile Voice", initials: "9MB", color: "#1D6340",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "v1", name: "Talk & Text 200", amount: 200, validity: "7 days",  description: "50 on-net mins + 50 SMS" },
        { id: "v2", name: "Talk & Text 500", amount: 500, validity: "30 days", description: "200 on-net mins + 100 SMS" },
      ] },
  ],
  data: [
    { id: "mtn-d", name: "MTN Data", initials: "MTN", color: "#C8960A",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "d1", name: "1GB",  amount: 300,  validity: "1 day",   description: "Daily plan" },
        { id: "d2", name: "2GB",  amount: 500,  validity: "30 days", description: "Monthly plan" },
        { id: "d3", name: "5GB",  amount: 1500, validity: "30 days", description: "Monthly plan" },
        { id: "d4", name: "10GB", amount: 3000, validity: "30 days", description: "Monthly plan" },
        { id: "d5", name: "20GB", amount: 5000, validity: "30 days", description: "Monthly plan" },
      ] },
    { id: "air-d", name: "Airtel Data", initials: "AIR", color: "#C0392B",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "d1", name: "1.5GB", amount: 500,  validity: "30 days", description: "Monthly plan" },
        { id: "d2", name: "3GB",   amount: 1000, validity: "30 days", description: "Monthly plan" },
        { id: "d3", name: "6GB",   amount: 1500, validity: "30 days", description: "Monthly plan" },
        { id: "d4", name: "11GB",  amount: 2500, validity: "30 days", description: "Monthly plan" },
      ] },
    { id: "glo-d", name: "Glo Data", initials: "GLO", color: "#1A7A3F",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "d1", name: "1.8GB", amount: 500,  validity: "30 days", description: "Monthly plan" },
        { id: "d2", name: "4.2GB", amount: 1000, validity: "30 days", description: "Monthly plan" },
        { id: "d3", name: "7.7GB", amount: 2000, validity: "30 days", description: "Monthly plan" },
        { id: "d4", name: "15GB",  amount: 3000, validity: "30 days", description: "Monthly plan" },
      ] },
    { id: "9mb-d", name: "9mobile Data", initials: "9MB", color: "#1D6340",
      inputLabel: "Phone Number", inputPlaceholder: "e.g. 08012345678",
      plans: [
        { id: "d1", name: "1GB",   amount: 200,  validity: "30 days", description: "Monthly plan" },
        { id: "d2", name: "2.5GB", amount: 500,  validity: "30 days", description: "Monthly plan" },
        { id: "d3", name: "5GB",   amount: 1000, validity: "30 days", description: "Monthly plan" },
      ] },
  ],
  tv: [
    { id: "dstv", name: "DStv", initials: "DST", color: "#0055AA",
      inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      plans: [
        { id: "t1", name: "Padi",     amount: 2500,  validity: "1 month", description: "Local & African channels" },
        { id: "t2", name: "Yanga",    amount: 3500,  validity: "1 month", description: "More local content" },
        { id: "t3", name: "Confam",   amount: 5000,  validity: "1 month", description: "African content + news" },
        { id: "t4", name: "Compact",  amount: 9000,  validity: "1 month", description: "International channels" },
        { id: "t5", name: "Compact+", amount: 14250, validity: "1 month", description: "Sports & premium content" },
        { id: "t6", name: "Premium",  amount: 24750, validity: "1 month", description: "All channels included" },
      ] },
    { id: "gotv", name: "GOtv", initials: "GOT", color: "#0088DD",
      inputLabel: "IUC Number", inputPlaceholder: "Enter IUC number",
      plans: [
        { id: "t1", name: "Lite",   amount: 900,  validity: "1 month", description: "Basic channels" },
        { id: "t2", name: "Jinja",  amount: 3000, validity: "1 month", description: "Entertainment channels" },
        { id: "t3", name: "Jolli",  amount: 4850, validity: "1 month", description: "Sports included" },
        { id: "t4", name: "Supa",   amount: 7200, validity: "1 month", description: "Premium channels" },
        { id: "t5", name: "Supa+",  amount: 9600, validity: "1 month", description: "All GOtv channels" },
      ] },
    { id: "startimes", name: "StarTimes", initials: "STR", color: "#AA0000",
      inputLabel: "Smart Card Number", inputPlaceholder: "Enter smart card number",
      plans: [
        { id: "t1", name: "Nova",    amount: 900,  validity: "1 month", description: "Local channels" },
        { id: "t2", name: "Basic",   amount: 1700, validity: "1 month", description: "More channels" },
        { id: "t3", name: "Smart",   amount: 2200, validity: "1 month", description: "Bollywood + local" },
        { id: "t4", name: "Classic", amount: 2500, validity: "1 month", description: "Sports + movies" },
        { id: "t5", name: "Super",   amount: 3800, validity: "1 month", description: "All channels" },
      ] },
    { id: "showmax", name: "Showmax", initials: "SHO", color: "#7B0000",
      inputLabel: "Email Address", inputPlaceholder: "Enter email address",
      plans: [
        { id: "t1", name: "Mobile",             amount: 1200, validity: "1 month", description: "Mobile only" },
        { id: "t2", name: "Standard",           amount: 2900, validity: "1 month", description: "Any device" },
        { id: "t3", name: "Standard + Sports",  amount: 4350, validity: "1 month", description: "All content + Live sports" },
      ] },
  ],
  utilities: [
    { id: "ikedc", name: "Ikeja Electric", initials: "IKE", color: "#CC5500",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "u1", name: "₦500",    amount: 500,   description: "Prepaid token" },
        { id: "u2", name: "₦1,000",  amount: 1000,  description: "Prepaid token" },
        { id: "u3", name: "₦2,000",  amount: 2000,  description: "Prepaid token" },
        { id: "u4", name: "₦5,000",  amount: 5000,  description: "Prepaid token" },
        { id: "u5", name: "₦10,000", amount: 10000, description: "Prepaid token" },
      ] },
    { id: "ekedc", name: "Eko Electric", initials: "EKO", color: "#006622",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "u1", name: "₦500",    amount: 500,   description: "Prepaid token" },
        { id: "u2", name: "₦1,000",  amount: 1000,  description: "Prepaid token" },
        { id: "u3", name: "₦2,000",  amount: 2000,  description: "Prepaid token" },
        { id: "u4", name: "₦5,000",  amount: 5000,  description: "Prepaid token" },
        { id: "u5", name: "₦10,000", amount: 10000, description: "Prepaid token" },
      ] },
    { id: "aedc", name: "Abuja Electric", initials: "ABJ", color: "#003388",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "u1", name: "₦500",    amount: 500,   description: "Prepaid token" },
        { id: "u2", name: "₦1,000",  amount: 1000,  description: "Prepaid token" },
        { id: "u3", name: "₦2,000",  amount: 2000,  description: "Prepaid token" },
        { id: "u4", name: "₦5,000",  amount: 5000,  description: "Prepaid token" },
        { id: "u5", name: "₦10,000", amount: 10000, description: "Prepaid token" },
      ] },
    { id: "jed", name: "Jos Electric", initials: "JED", color: "#550055",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "u1", name: "₦500",    amount: 500,   description: "Prepaid token" },
        { id: "u2", name: "₦1,000",  amount: 1000,  description: "Prepaid token" },
        { id: "u3", name: "₦2,000",  amount: 2000,  description: "Prepaid token" },
        { id: "u4", name: "₦5,000",  amount: 5000,  description: "Prepaid token" },
        { id: "u5", name: "₦10,000", amount: 10000, description: "Prepaid token" },
      ] },
    { id: "phed", name: "PH Electric", initials: "PHE", color: "#884400",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "u1", name: "₦500",    amount: 500,   description: "Prepaid token" },
        { id: "u2", name: "₦1,000",  amount: 1000,  description: "Prepaid token" },
        { id: "u3", name: "₦2,000",  amount: 2000,  description: "Prepaid token" },
        { id: "u4", name: "₦5,000",  amount: 5000,  description: "Prepaid token" },
        { id: "u5", name: "₦10,000", amount: 10000, description: "Prepaid token" },
      ] },
    { id: "bedc", name: "Benin Electric", initials: "BEN", color: "#336600",
      inputLabel: "Meter Number", inputPlaceholder: "Enter meter number",
      plans: [
        { id: "u1", name: "₦500",    amount: 500,   description: "Prepaid token" },
        { id: "u2", name: "₦1,000",  amount: 1000,  description: "Prepaid token" },
        { id: "u3", name: "₦2,000",  amount: 2000,  description: "Prepaid token" },
        { id: "u4", name: "₦5,000",  amount: 5000,  description: "Prepaid token" },
        { id: "u5", name: "₦10,000", amount: 10000, description: "Prepaid token" },
      ] },
  ],
};

// ─── Provider Card ───────────────────────────────────────────────────────────
function ProviderCard({
  provider,
  onPress,
}: {
  provider: Provider;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.provCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.provLogo, { backgroundColor: provider.color }]}>
        <Text style={s.provInitials}>{provider.initials}</Text>
      </View>
      <Text style={s.provName}>{provider.name}</Text>
      <Text style={s.provCount}>{provider.plans.length} plans</Text>
    </TouchableOpacity>
  );
}

// ─── Buy Modal ───────────────────────────────────────────────────────────────
function BuyModal({
  visible,
  provider,
  onClose,
}: {
  visible: boolean;
  provider: Provider | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [accountNo, setAccountNo]       = useState("");
  const [success, setSuccess]           = useState(false);

  function reset() {
    setSelectedPlan(null);
    setAccountNo("");
    setSuccess(false);
    onClose();
  }

  function handlePay() {
    if (!accountNo.trim()) {
      Alert.alert("Required", `Please enter ${provider?.inputLabel}`);
      return;
    }
    if (!selectedPlan) {
      Alert.alert("Required", "Please select a plan");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccess(true);
  }

  if (!provider) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <Pressable style={s.overlay} onPress={reset} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.sheet}
      >
        <View style={[s.sheetInner, { paddingBottom: insets.bottom + 20 }]}>
          {/* Handle */}
          <View style={s.handle} />

          {success ? (
            /* ── Success State ── */
            <View style={s.successWrap}>
              <View style={s.successCircle}>
                <Feather name="check" size={36} color={LIME} />
              </View>
              <Text style={s.successTitle}>Payment Successful!</Text>
              <Text style={s.successSub}>
                {selectedPlan?.name} for {accountNo} via {provider.name}
              </Text>
              <Text style={s.successAmt}>
                ₦{selectedPlan?.amount.toLocaleString()}
              </Text>
              <TouchableOpacity style={s.doneBtn} onPress={reset}>
                <Text style={s.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Provider header */}
              <View style={s.sheetHeader}>
                <View style={[s.sheetLogo, { backgroundColor: provider.color }]}>
                  <Text style={s.sheetInitials}>{provider.initials}</Text>
                </View>
                <View>
                  <Text style={s.sheetProvName}>{provider.name}</Text>
                  <Text style={s.sheetProvSub}>Select a plan below</Text>
                </View>
              </View>

              {/* Account input */}
              <Text style={s.fieldLabel}>{provider.inputLabel}</Text>
              <TextInput
                style={s.input}
                placeholder={provider.inputPlaceholder}
                placeholderTextColor={MUTED}
                value={accountNo}
                onChangeText={setAccountNo}
                keyboardType={provider.inputLabel === "Email Address" ? "email-address" : "phone-pad"}
                contextMenuHidden
                selectionColor={LIME}
              />

              {/* Plans list */}
              <Text style={s.fieldLabel}>Choose Plan</Text>
              <ScrollView
                style={s.planScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {provider.plans.map((plan) => {
                  const active = selectedPlan?.id === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[s.planRow, active && s.planRowActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedPlan(plan);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={s.planLeft}>
                        <Text style={[s.planName, active && { color: LIME }]}>{plan.name}</Text>
                        {plan.description ? (
                          <Text style={s.planDesc}>{plan.description}</Text>
                        ) : null}
                        {plan.validity ? (
                          <Text style={s.planValidity}>{plan.validity}</Text>
                        ) : null}
                      </View>
                      <View style={s.planRight}>
                        <Text style={[s.planAmt, active && { color: LIME }]}>
                          ₦{plan.amount.toLocaleString()}
                        </Text>
                        <View style={[s.radioOuter, active && s.radioOuterActive]}>
                          {active && <View style={s.radioInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Pay button */}
              <TouchableOpacity
                style={[s.payBtn, (!accountNo || !selectedPlan) && s.payBtnDim]}
                onPress={handlePay}
                activeOpacity={0.85}
              >
                <Text style={s.payBtnTxt}>
                  {selectedPlan
                    ? `Pay ₦${selectedPlan.amount.toLocaleString()}`
                    : "Pay"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function BuyScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cat?: string }>();

  const defaultCat = (params.cat as CatKey) ?? "airtime";
  const [activeCat, setActiveCat] = useState<CatKey>(defaultCat);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [modalVisible, setModalVisible]         = useState(false);

  const providers = PROVIDERS[activeCat];

  function openProvider(p: Provider) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(p);
    setModalVisible(true);
  }

  return (
    <View style={s.root}>
      {/* ── Top Bar ── */}
      <View style={[s.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 10 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <Text style={s.topBarLabel}>Quick Buy</Text>
          <Text style={s.topBarTitle}>
            {CATS.find((c) => c.key === activeCat)?.label ?? "Services"}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Category Filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={s.catScroll}
      >
        {CATS.map((cat) => {
          const active = activeCat === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catPill, active && s.catPillActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveCat(cat.key);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name={cat.icon as any}
                size={13}
                color={active ? DEEP : MUTED}
                style={{ marginRight: 5 }}
              />
              <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Provider Grid ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionLabel}>Available Providers</Text>
        <View style={s.gridRow}>
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} onPress={() => openProvider(p)} />
          ))}
        </View>
      </ScrollView>

      {/* ── Buy Modal ── */}
      <BuyModal
        visible={modalVisible}
        provider={selectedProvider}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: BG },

  // Top bar
  topBar:       { backgroundColor: DEEP, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarLabel:  { fontFamily: "Inter_500Medium", fontSize: 11, color: LIME, marginBottom: 2 },
  topBarTitle:  { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },

  // Category scroll
  catScroll: { flexGrow: 0, marginBottom: 16 },
  catRow:    { paddingHorizontal: 16, gap: 8, flexDirection: "row" },
  catPill:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER },
  catPillActive: { backgroundColor: LIME, borderColor: LIME },
  catLabel:      { fontFamily: "Inter_500Medium", fontSize: 13, color: MUTED },
  catLabelActive:{ color: DEEP, fontFamily: "Inter_600SemiBold" },

  // Grid
  scroll:       { flex: 1 },
  grid:         { paddingHorizontal: 16 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: MUTED, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  gridRow:      { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  // Provider card
  provCard:     { width: "47%", backgroundColor: CARD, borderRadius: 18, padding: 18, alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: BORDER },
  provLogo:     { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  provInitials: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  provName:     { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff", textAlign: "center" },
  provCount:    { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED },

  // Modal overlay
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:      { justifyContent: "flex-end" },
  sheetInner: { backgroundColor: DEEP, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "85%" },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },

  // Sheet header
  sheetHeader:   { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  sheetLogo:     { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  sheetInitials: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  sheetProvName: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  sheetProvSub:  { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED, marginTop: 2 },

  // Input
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input:      { backgroundColor: CARD, borderWidth: 2, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#fff", fontFamily: "Inter_400Regular", fontSize: 15, marginBottom: 18 },

  // Plans
  planScroll:     { maxHeight: 220, marginBottom: 16 },
  planRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: BORDER },
  planRowActive:  { borderColor: LIME, backgroundColor: "rgba(198,241,53,0.08)" },
  planLeft:       { flex: 1, gap: 3 },
  planName:       { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  planDesc:       { fontFamily: "Inter_400Regular", fontSize: 11, color: MUTED },
  planValidity:   { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(198,241,53,0.7)" },
  planRight:      { alignItems: "flex-end", gap: 6 },
  planAmt:        { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  radioOuter:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  radioOuterActive: { borderColor: LIME },
  radioInner:     { width: 9, height: 9, borderRadius: 5, backgroundColor: LIME },

  // Pay button
  payBtn:    { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  payBtnDim: { opacity: 0.5 },
  payBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: DEEP },

  // Success
  successWrap:   { alignItems: "center", paddingVertical: 30, gap: 12 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(198,241,53,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: LIME, marginBottom: 8 },
  successTitle:  { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  successSub:    { fontFamily: "Inter_400Regular", fontSize: 13, color: MUTED, textAlign: "center", paddingHorizontal: 20 },
  successAmt:    { fontFamily: "Inter_700Bold", fontSize: 28, color: LIME, marginTop: 4 },
  doneBtn:       { marginTop: 16, backgroundColor: LIME, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48 },
  doneBtnTxt:    { fontFamily: "Inter_700Bold", fontSize: 15, color: DEEP },
});
