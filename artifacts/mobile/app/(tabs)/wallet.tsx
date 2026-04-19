import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DG   = "#0D1F17";
const DG2  = "#152C1E";
const DG3  = "#1C3828";
const LIME = "#C6F135";
const GREEN = "#22A861";
const RED   = "#FF6B6B";
const MUTED = "rgba(255,255,255,0.45)";
const BORDER = "rgba(255,255,255,0.08)";

type Screen = "phone" | "otp" | "loanType" | "documents" | "dashboard";
type LoanType = "individual" | "business" | "work_allowance" | null;

const VERIFIED_NAMES: Record<string, string> = {
  "08012345678": "Adebayo Emmanuel",
  "08098765432": "Chioma Okonkwo",
  "07011223344": "Musa Aliyu Ibrahim",
};

const LOAN_TYPES = [
  {
    key: "individual" as const,
    label: "Individual",
    desc: "Personal loans for salary earners & individuals",
    icon: "user",
    color: "#54A0FF",
    limit: "₦500,000",
    docs: ["National ID / Passport", "Proof of Address"],
  },
  {
    key: "business" as const,
    label: "Business",
    desc: "Business financing for registered companies",
    icon: "briefcase",
    color: "#FF9F43",
    limit: "₦5,000,000",
    docs: ["CAC Certificate", "National ID / Passport", "Proof of Address", "Business Bank Statement"],
  },
  {
    key: "work_allowance" as const,
    label: "Work Allowance",
    desc: "Employer-backed loans tied to your salary",
    icon: "award",
    color: LIME,
    limit: "₦2,000,000",
    docs: ["Valid Work Permit", "Proof of Address", "Employment Letter", "Proof of Product / Collateral"],
  },
];

const LOAN_HISTORY = [
  { id: "1", amount: 150000, type: "Individual",     status: "Paid",    date: "Mar 2025", interest: "5%" },
  { id: "2", amount: 300000, type: "Individual",     status: "Active",  date: "Jan 2025", interest: "5%" },
  { id: "3", amount: 80000,  type: "Work Allowance", status: "Paid",    date: "Oct 2024", interest: "3%" },
];

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === current ? LIME : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </View>
  );
}

// ─── Step 1: Phone Number ──────────────────────────────────────────────────────
function PhoneStep({
  onNext,
  topPad,
}: {
  onNext: (phone: string, name: string) => void;
  topPad: number;
}) {
  const [phone, setPhone] = useState("");

  const handleVerify = () => {
    if (phone.length < 10) {
      Alert.alert("Invalid Number", "Please enter a valid 11-digit phone number.");
      return;
    }
    const name = VERIFIED_NAMES[phone] ?? "Verified User";
    onNext(phone, name);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: DG }}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingHorizontal: 22, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <StepDots current={0} total={4} />

        <View style={s.stepIconWrap}>
          <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.stepGradIcon}>
            <Feather name="smartphone" size={30} color={LIME} />
          </LinearGradient>
        </View>
        <Text style={s.stepTitle}>Verify Your Phone</Text>
        <Text style={s.stepSub}>Enter your registered phone number to get started with your loan application.</Text>

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Phone Number</Text>
          <View style={s.inputRow}>
            <View style={s.countryCode}>
              <Text style={s.countryCodeText}>🇳🇬 +234</Text>
            </View>
            <TextInput
              style={s.input}
              placeholder="080 0000 0000"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>
        </View>

        <Text style={s.hintText}>An OTP will be sent to verify your number</Text>

        <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Send OTP</Text>
          <Feather name="arrow-right" size={18} color={DG} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 2: OTP + Verified Name ──────────────────────────────────────────────
function OTPStep({
  phone,
  verifiedName,
  onNext,
  onBack,
  topPad,
}: {
  phone: string;
  verifiedName: string;
  onNext: () => void;
  onBack: () => void;
  topPad: number;
}) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [verified, setVerified] = useState(false);

  const handleChange = (val: string, i: number) => {
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 3) {
      setVerified(false);
    }
  };

  const handleVerify = () => {
    setVerified(true);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: DG }}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingHorizontal: 22, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <StepDots current={1} total={4} />

        <View style={s.stepIconWrap}>
          <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.stepGradIcon}>
            <Feather name="shield" size={30} color={LIME} />
          </LinearGradient>
        </View>
        <Text style={s.stepTitle}>Enter OTP</Text>
        <Text style={s.stepSub}>
          A 4-digit code was sent to{"\n"}
          <Text style={{ color: LIME }}>+234 {phone.slice(1)}</Text>
        </Text>

        <View style={s.otpRow}>
          {otp.map((v, i) => (
            <TextInput
              key={i}
              style={[s.otpBox, v ? s.otpBoxFilled : null]}
              value={v}
              onChangeText={(val) => handleChange(val, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        {!verified ? (
          <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Verify OTP</Text>
            <Feather name="check" size={18} color={DG} />
          </TouchableOpacity>
        ) : (
          <>
            <View style={s.verifiedBanner}>
              <View style={s.verifiedIconWrap}>
                <Feather name="check-circle" size={20} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.verifiedLabel}>Identity Verified</Text>
                <Text style={s.verifiedName}>{verifiedName}</Text>
              </View>
              <Feather name="shield" size={18} color={GREEN} />
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Continue</Text>
              <Feather name="arrow-right" size={18} color={DG} />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={s.backLink} onPress={onBack}>
          <Feather name="arrow-left" size={15} color={LIME} />
          <Text style={s.backLinkText}>Change number</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 3: Loan Type ─────────────────────────────────────────────────────────
function LoanTypeStep({
  onNext,
  onBack,
  topPad,
}: {
  onNext: (type: LoanType) => void;
  onBack: () => void;
  topPad: number;
}) {
  const [selected, setSelected] = useState<LoanType>(null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DG }}
      contentContainerStyle={{ paddingTop: topPad + 24, paddingHorizontal: 22, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <StepDots current={2} total={4} />

      <View style={s.stepIconWrap}>
        <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.stepGradIcon}>
          <Feather name="layers" size={30} color={LIME} />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>Loan Category</Text>
      <Text style={s.stepSub}>Choose the loan type that matches your needs.</Text>

      {LOAN_TYPES.map((lt) => {
        const active = selected === lt.key;
        return (
          <TouchableOpacity
            key={lt.key}
            style={[s.typeCard, active && { borderColor: lt.color, backgroundColor: lt.color + "12" }]}
            onPress={() => setSelected(lt.key)}
            activeOpacity={0.85}
          >
            <View style={[s.typeIconWrap, { backgroundColor: lt.color + "22" }]}>
              <Feather name={lt.icon as any} size={20} color={lt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={s.typeLabel}>{lt.label}</Text>
                <Text style={[s.typeLimit, { color: lt.color }]}>Up to {lt.limit}</Text>
              </View>
              <Text style={s.typeDesc}>{lt.desc}</Text>
              {active && (
                <View style={s.reqRow}>
                  {lt.docs.map((doc) => (
                    <View key={doc} style={s.reqChip}>
                      <Feather name="file-text" size={10} color={lt.color} />
                      <Text style={[s.reqChipText, { color: lt.color }]}>{doc}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {active && (
              <View style={[s.checkCircle, { backgroundColor: lt.color }]}>
                <Feather name="check" size={12} color={DG} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[s.primaryBtn, !selected && s.primaryBtnDisabled]}
        onPress={() => selected && onNext(selected)}
        activeOpacity={0.85}
      >
        <Text style={s.primaryBtnText}>Continue</Text>
        <Feather name="arrow-right" size={18} color={DG} />
      </TouchableOpacity>

      <TouchableOpacity style={s.backLink} onPress={onBack}>
        <Feather name="arrow-left" size={15} color={LIME} />
        <Text style={s.backLinkText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 4: Documents ─────────────────────────────────────────────────────────
function DocumentsStep({
  loanType,
  verifiedName,
  onNext,
  onBack,
  topPad,
}: {
  loanType: LoanType;
  verifiedName: string;
  onNext: () => void;
  onBack: () => void;
  topPad: number;
}) {
  const ltInfo = LOAN_TYPES.find((l) => l.key === loanType)!;
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  const toggle = (doc: string) => {
    setUploaded((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  const allUploaded = ltInfo.docs.every((d) => uploaded[d]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DG }}
      contentContainerStyle={{ paddingTop: topPad + 24, paddingHorizontal: 22, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <StepDots current={3} total={4} />

      <View style={s.stepIconWrap}>
        <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.stepGradIcon}>
          <Feather name="file-text" size={30} color={LIME} />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>Upload Documents</Text>
      <Text style={s.stepSub}>
        Documents required for <Text style={{ color: ltInfo.color }}>{ltInfo.label}</Text> loan under{" "}
        <Text style={{ color: LIME }}>{verifiedName}</Text>
      </Text>

      {ltInfo.key === "work_allowance" && (
        <View style={s.collateralNote}>
          <Feather name="alert-circle" size={14} color="#FF9F43" />
          <Text style={s.collateralNoteText}>
            Proof of Product will serve as collateral — property taken by our company if repayment fails.
          </Text>
        </View>
      )}

      {ltInfo.docs.map((doc) => {
        const done = !!uploaded[doc];
        return (
          <TouchableOpacity
            key={doc}
            style={[s.docCard, done && { borderColor: ltInfo.color + "80" }]}
            onPress={() => toggle(doc)}
            activeOpacity={0.85}
          >
            <View style={[s.docIconWrap, { backgroundColor: done ? ltInfo.color + "22" : DG3 }]}>
              <Feather name={done ? "check" : "upload"} size={18} color={done ? ltInfo.color : MUTED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.docLabel, done && { color: "#FFF" }]}>{doc}</Text>
              <Text style={s.docSub}>{done ? "Document uploaded successfully" : "Tap to upload · JPG, PNG or PDF"}</Text>
            </View>
            {done && <Feather name="check-circle" size={18} color={ltInfo.color} />}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[s.primaryBtn, !allUploaded && s.primaryBtnDisabled]}
        onPress={() => allUploaded && onNext()}
        activeOpacity={0.85}
      >
        <Text style={s.primaryBtnText}>Submit & Access Loan</Text>
        <Feather name="arrow-right" size={18} color={DG} />
      </TouchableOpacity>

      <TouchableOpacity style={s.backLink} onPress={onBack}>
        <Feather name="arrow-left" size={15} color={LIME} />
        <Text style={s.backLinkText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function LoanDashboard({
  verifiedName,
  loanType,
  topPad,
}: {
  verifiedName: string;
  loanType: LoanType;
  topPad: number;
}) {
  const ltInfo = LOAN_TYPES.find((l) => l.key === loanType)!;
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const loanLimit = loanType === "individual" ? 500000 : loanType === "business" ? 5000000 : 2000000;
  const outstanding = 300000;
  const nextPayment = 25000;
  const dueDate = "May 15, 2025";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DG }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <LinearGradient colors={["#1A4A2C", "#0D2A1A"]} style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroGreet}>Hello, {verifiedName.split(" ")[0]}</Text>
            <View style={[s.loanTypeBadge, { backgroundColor: ltInfo.color + "22", borderColor: ltInfo.color + "55" }]}>
              <Feather name={ltInfo.icon as any} size={11} color={ltInfo.color} />
              <Text style={[s.loanTypeBadgeText, { color: ltInfo.color }]}>{ltInfo.label} Loan</Text>
            </View>
          </View>
          <View style={s.verifiedTag}>
            <Feather name="shield" size={12} color={GREEN} />
            <Text style={s.verifiedTagText}>Verified</Text>
          </View>
        </View>

        <Text style={s.heroLabel}>Outstanding Balance</Text>
        <Text style={s.heroBalance}>{fmt(outstanding)}</Text>

        <View style={s.heroDivider} />

        <View style={s.heroRow}>
          <View>
            <Text style={s.heroSubLabel}>Loan Limit</Text>
            <Text style={s.heroSubVal}>{fmt(loanLimit)}</Text>
          </View>
          <View style={s.heroVDivider} />
          <View>
            <Text style={s.heroSubLabel}>Next Payment</Text>
            <Text style={s.heroSubVal}>{fmt(nextPayment)}</Text>
          </View>
          <View style={s.heroVDivider} />
          <View>
            <Text style={s.heroSubLabel}>Due Date</Text>
            <Text style={s.heroSubVal}>{dueDate}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={s.actionRow}>
        {[
          { icon: "plus-circle", label: "Get Loan",  color: LIME   },
          { icon: "credit-card", label: "Pay Loan",  color: "#54A0FF" },
          { icon: "clock",       label: "History",   color: "#FF9F43" },
          { icon: "settings",    label: "Manage",    color: "#FF6B6B" },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={s.actionBtn} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: a.color + "22" }]}>
              <Feather name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Repayment Progress</Text>
          <Text style={s.sectionTag}>{Math.round(((loanLimit - outstanding) / loanLimit) * 100)}% paid</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${((loanLimit - outstanding) / loanLimit) * 100}%` as any }]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={s.progressLabel}>Paid: {fmt(loanLimit - outstanding)}</Text>
          <Text style={s.progressLabel}>Remaining: {fmt(outstanding)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["overview", "history"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, activeTab === t && s.tabActive]}
            onPress={() => setActiveTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>
              {t === "overview" ? "Loan Overview" : "Loan History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "overview" ? (
        <View style={s.section}>
          {[
            { label: "Loan Type",       value: ltInfo.label,     icon: ltInfo.icon, color: ltInfo.color },
            { label: "Interest Rate",   value: "5% p.a.",        icon: "percent",   color: "#54A0FF"   },
            { label: "Tenure",          value: "12 Months",      icon: "calendar",  color: "#FF9F43"   },
            { label: "Status",          value: "Active",         icon: "activity",  color: GREEN       },
            { label: "Disbursed",       value: fmt(loanLimit),   icon: "arrow-down-left", color: LIME  },
          ].map((item) => (
            <View key={item.label} style={s.overviewRow}>
              <View style={[s.overviewIcon, { backgroundColor: item.color + "22" }]}>
                <Feather name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={s.overviewLabel}>{item.label}</Text>
              <Text style={s.overviewVal}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.section}>
          {LOAN_HISTORY.map((h) => (
            <View key={h.id} style={s.historyRow}>
              <View style={[s.historyIcon, { backgroundColor: h.status === "Paid" ? GREEN + "22" : "#54A0FF22" }]}>
                <Feather name={h.status === "Paid" ? "check" : "clock"} size={14} color={h.status === "Paid" ? GREEN : "#54A0FF"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.historyAmt}>{fmt(h.amount)}</Text>
                <Text style={s.historySub}>{h.type} · {h.date} · {h.interest} interest</Text>
              </View>
              <View style={[s.historyBadge, { backgroundColor: h.status === "Paid" ? GREEN + "22" : "#54A0FF22" }]}>
                <Text style={[s.historyBadgeText, { color: h.status === "Paid" ? GREEN : "#54A0FF" }]}>{h.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [screen, setScreen] = useState<Screen>("phone");
  const [phone, setPhone] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [loanType, setLoanType] = useState<LoanType>(null);

  if (screen === "phone") {
    return (
      <PhoneStep
        topPad={topPad}
        onNext={(p, name) => { setPhone(p); setVerifiedName(name); setScreen("otp"); }}
      />
    );
  }
  if (screen === "otp") {
    return (
      <OTPStep
        topPad={topPad}
        phone={phone}
        verifiedName={verifiedName}
        onNext={() => setScreen("loanType")}
        onBack={() => setScreen("phone")}
      />
    );
  }
  if (screen === "loanType") {
    return (
      <LoanTypeStep
        topPad={topPad}
        onNext={(t) => { setLoanType(t); setScreen("documents"); }}
        onBack={() => setScreen("otp")}
      />
    );
  }
  if (screen === "documents") {
    return (
      <DocumentsStep
        topPad={topPad}
        loanType={loanType}
        verifiedName={verifiedName}
        onNext={() => setScreen("dashboard")}
        onBack={() => setScreen("loanType")}
      />
    );
  }
  return (
    <LoanDashboard
      topPad={topPad}
      verifiedName={verifiedName}
      loanType={loanType}
    />
  );
}

const s = StyleSheet.create({
  stepIconWrap:    { alignItems: "center", marginBottom: 20 },
  stepGradIcon:    { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  stepTitle:       { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  stepSub:         { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 30 },

  inputGroup:  { marginBottom: 10 },
  inputLabel:  { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  inputRow:    { flexDirection: "row", gap: 10 },
  countryCode: { backgroundColor: DG3, borderRadius: 14, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: BORDER },
  countryCodeText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    flex: 1, backgroundColor: DG3, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: "#FFF", fontSize: 16, fontFamily: "Inter_500Medium", borderWidth: 1, borderColor: BORDER,
  },
  hintText:    { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24 },

  primaryBtn:         { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText:     { color: DG, fontSize: 15, fontFamily: "Inter_700Bold" },

  backLink:     { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 18 },
  backLinkText: { color: LIME, fontSize: 13, fontFamily: "Inter_500Medium" },

  otpRow:    { flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 30 },
  otpBox:    { width: 62, height: 62, borderRadius: 16, backgroundColor: DG3, borderWidth: 1.5, borderColor: BORDER, color: "#FFF", fontSize: 24, fontFamily: "Inter_700Bold" },
  otpBoxFilled: { borderColor: LIME },

  verifiedBanner:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: GREEN + "15", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: GREEN + "30" },
  verifiedIconWrap:{ width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN + "22", alignItems: "center", justifyContent: "center" },
  verifiedLabel:   { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },
  verifiedName:    { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },

  typeCard:      { flexDirection: "row", gap: 14, backgroundColor: DG2, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: BORDER, alignItems: "flex-start" },
  typeIconWrap:  { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  typeLabel:     { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  typeLimit:     { fontSize: 12, fontFamily: "Inter_500Medium" },
  typeDesc:      { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  reqRow:        { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  reqChip:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: DG, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: BORDER },
  reqChipText:   { fontSize: 9, fontFamily: "Inter_500Medium" },
  checkCircle:   { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

  collateralNote:     { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FF9F4318", borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: "#FF9F4330" },
  collateralNoteText: { color: "#FF9F43", fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },

  docCard:     { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: DG2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: BORDER },
  docIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  docLabel:    { color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 3 },
  docSub:      { color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Inter_400Regular" },

  heroCard:      { marginHorizontal: 18, borderRadius: 24, padding: 22, marginBottom: 16 },
  heroTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  heroGreet:     { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  loanTypeBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  loanTypeBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  verifiedTag:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GREEN + "22", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  verifiedTagText:{ color: GREEN, fontSize: 11, fontFamily: "Inter_500Medium" },
  heroLabel:     { color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  heroBalance:   { color: "#FFF", fontSize: 32, fontFamily: "Inter_700Bold", marginBottom: 16 },
  heroDivider:   { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 16 },
  heroRow:       { flexDirection: "row", justifyContent: "space-between" },
  heroVDivider:  { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  heroSubLabel:  { color: MUTED, fontSize: 9, fontFamily: "Inter_400Regular", marginBottom: 3 },
  heroSubVal:    { color: "#FFF", fontSize: 11, fontFamily: "Inter_600SemiBold" },

  actionRow:    { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, marginBottom: 16 },
  actionBtn:    { alignItems: "center", gap: 7 },
  actionIcon:   { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  actionLabel:  { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Inter_500Medium" },

  section:       { backgroundColor: DG2, marginHorizontal: 18, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:  { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTag:    { color: LIME, fontSize: 11, fontFamily: "Inter_500Medium" },
  progressBg:    { height: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" },
  progressFill:  { height: 8, backgroundColor: LIME, borderRadius: 4 },
  progressLabel: { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },

  tabRow:       { flexDirection: "row", marginHorizontal: 18, marginBottom: 2, backgroundColor: DG2, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  tab:          { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabActive:    { backgroundColor: DG3 },
  tabText:      { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  tabTextActive:{ color: LIME, fontFamily: "Inter_600SemiBold" },

  overviewRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  overviewIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  overviewLabel: { color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  overviewVal:   { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  historyRow:        { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  historyIcon:       { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  historyAmt:        { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  historySub:        { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  historyBadge:      { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  historyBadgeText:  { fontSize: 11, fontFamily: "Inter_500Medium" },
});
