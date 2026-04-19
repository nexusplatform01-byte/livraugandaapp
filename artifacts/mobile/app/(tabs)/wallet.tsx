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

// ─── Colours (light / white theme) ────────────────────────────────────────────
const BG     = "#F5F7F5";
const CARD   = "#FFFFFF";
const DEEP   = "#1A3B2F";
const MID    = "#22A861";
const LIME   = "#C6F135";
const RED    = "#E74C3C";
const MUTED  = "#8FA88F";
const BORDER = "#E0EBE0";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen   = "phone" | "loanType" | "documents" | "dashboard";
type LoanType = "individual" | "business" | "work_allowance" | null;

// ─── Mock phone-to-name lookup ─────────────────────────────────────────────────
const PHONE_NAMES: Record<string, string> = {
  "08012345678": "Adebayo Emmanuel",
  "08098765432": "Chioma Okonkwo",
  "07011223344": "Musa Aliyu Ibrahim",
  "09011223344": "Fatima Bello",
  "08033445566": "Emeka Nwosu",
};

// ─── Loan type config ──────────────────────────────────────────────────────────
const LOAN_TYPES = [
  {
    key: "individual" as const,
    label: "Individual",
    desc: "Personal loans for salary earners & individuals",
    icon: "user",
    color: "#3498DB",
    limit: "₦500,000",
  },
  {
    key: "business" as const,
    label: "Business",
    desc: "Financing for registered companies & enterprises",
    icon: "briefcase",
    color: "#E67E22",
    limit: "₦5,000,000",
  },
  {
    key: "work_allowance" as const,
    label: "Work Allowance",
    desc: "Employer-backed loans tied to your monthly salary",
    icon: "award",
    color: MID,
    limit: "₦2,000,000",
  },
];

// Documents required (same core for all; work_allowance adds extras)
function getRequiredDocs(type: LoanType) {
  const base = [
    { key: "id",          label: "National ID / Passport",   icon: "credit-card",  note: "Clear photo of valid government ID"         },
    { key: "collateral",  label: "Collateral Document",      icon: "package",      note: "Asset pledged if repayment fails"            },
  ];
  if (type === "work_allowance") {
    return [
      ...base,
      { key: "workpermit", label: "Valid Work Permit",        icon: "file-text",    note: "Current employer-issued work permit"         },
      { key: "address",    label: "Proof of Address",         icon: "map-pin",      note: "Utility bill or bank statement (≤3 months)"  },
      { key: "product",    label: "Proof of Product",         icon: "box",          note: "Item/property held as collateral by us"      },
    ];
  }
  if (type === "business") {
    return [
      ...base,
      { key: "cac",     label: "CAC Certificate",            icon: "award",        note: "Company registration document"              },
      { key: "address", label: "Proof of Address",           icon: "map-pin",      note: "Utility bill or bank statement (≤3 months)"  },
    ];
  }
  return [
    ...base,
    { key: "address", label: "Proof of Address",             icon: "map-pin",      note: "Utility bill or bank statement (≤3 months)"  },
  ];
}

const LOAN_HISTORY = [
  { id: "1", amount: 150000, type: "Individual",     status: "Paid",   date: "Mar 2025", interest: "5%" },
  { id: "2", amount: 300000, type: "Individual",     status: "Active", date: "Jan 2025", interest: "5%" },
  { id: "3", amount: 80000,  type: "Work Allowance", status: "Paid",   date: "Oct 2024", interest: "3%" },
];

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 22 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === current ? DEEP : BORDER,
          }}
        />
      ))}
    </View>
  );
}

// ─── Step 1: Phone (auto-verify) ───────────────────────────────────────────────
function PhoneStep({
  onNext,
  topPad,
}: {
  onNext: (phone: string, name: string) => void;
  topPad: number;
}) {
  const [phone, setPhone] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const handleChange = (val: string) => {
    setPhone(val);
    setDetected(null);
    setTried(false);
  };

  const handleVerify = () => {
    setTried(true);
    const name = PHONE_NAMES[phone] ?? null;
    setDetected(name);
  };

  const handleContinue = () => {
    if (!detected) return;
    onNext(phone, detected);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 28, paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <StepDots current={0} total={3} />

        <View style={s.centerIcon}>
          <View style={s.iconCircle}>
            <Feather name="smartphone" size={30} color={DEEP} />
          </View>
        </View>
        <Text style={s.stepTitle}>Verify Your Phone</Text>
        <Text style={s.stepSub}>Enter your phone number. Your identity will be detected automatically.</Text>

        <Text style={s.label}>Phone Number</Text>
        <View style={s.phoneRow}>
          <View style={s.dialCode}>
            <Text style={s.dialCodeText}>🇳🇬 +234</Text>
          </View>
          <TextInput
            style={s.phoneInput}
            placeholder="080 0000 0000"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handleChange}
            maxLength={11}
          />
        </View>

        {!detected && tried && (
          <View style={s.alertBox}>
            <Feather name="alert-circle" size={15} color={RED} />
            <Text style={s.alertText}>No account found for this number. Try a different number.</Text>
          </View>
        )}

        {detected && (
          <View style={s.detectedBox}>
            <View style={s.detectedAvatarWrap}>
              <Text style={s.detectedAvatar}>{detected.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.detectedSmall}>Account Detected</Text>
              <Text style={s.detectedName}>{detected}</Text>
            </View>
            <Feather name="check-circle" size={20} color={MID} />
          </View>
        )}

        {!detected ? (
          <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Verify Number</Text>
            <Feather name="search" size={17} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Continue</Text>
            <Feather name="arrow-right" size={17} color="#FFF" />
          </TouchableOpacity>
        )}

        <Text style={s.hint}>Try: 08012345678 · 08098765432 · 07011223344</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 2: Loan Type ─────────────────────────────────────────────────────────
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
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingTop: topPad + 28, paddingHorizontal: 24, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <StepDots current={1} total={3} />

      <View style={s.centerIcon}>
        <View style={s.iconCircle}>
          <Feather name="layers" size={30} color={DEEP} />
        </View>
      </View>
      <Text style={s.stepTitle}>Loan Category</Text>
      <Text style={s.stepSub}>Choose the loan type that best fits your needs.</Text>

      {LOAN_TYPES.map((lt) => {
        const active = selected === lt.key;
        return (
          <TouchableOpacity
            key={lt.key}
            style={[s.typeCard, active && { borderColor: lt.color, backgroundColor: lt.color + "08" }]}
            onPress={() => setSelected(lt.key)}
            activeOpacity={0.85}
          >
            <View style={[s.typeIconBg, { backgroundColor: lt.color + "18" }]}>
              <Feather name={lt.icon as any} size={20} color={lt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={s.typeLabel}>{lt.label}</Text>
                <Text style={[s.typeLimit, { color: lt.color }]}>{lt.limit}</Text>
              </View>
              <Text style={s.typeDesc}>{lt.desc}</Text>
            </View>
            {active && (
              <View style={[s.checkCircle, { backgroundColor: lt.color }]}>
                <Feather name="check" size={12} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[s.primaryBtn, !selected && { opacity: 0.4 }]}
        onPress={() => selected && onNext(selected)}
        activeOpacity={0.85}
      >
        <Text style={s.primaryBtnText}>Continue</Text>
        <Feather name="arrow-right" size={17} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={s.backLink} onPress={onBack}>
        <Feather name="arrow-left" size={14} color={DEEP} />
        <Text style={s.backLinkText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 3: Documents ─────────────────────────────────────────────────────────
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
  const docs = getRequiredDocs(loanType);
  const ltInfo = LOAN_TYPES.find((l) => l.key === loanType)!;
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setUploaded((p) => ({ ...p, [key]: !p[key] }));
  const allDone = docs.every((d) => uploaded[d.key]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingTop: topPad + 24, paddingHorizontal: 24, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <StepDots current={2} total={3} />

      <View style={s.centerIcon}>
        <View style={s.iconCircle}>
          <Feather name="file-text" size={30} color={DEEP} />
        </View>
      </View>
      <Text style={s.stepTitle}>Upload Documents</Text>
      <Text style={s.stepSub}>
        Submit the required documents for{" "}
        <Text style={{ color: ltInfo.color, fontFamily: "Inter_600SemiBold" }}>{ltInfo.label}</Text> loan under{" "}
        <Text style={{ color: DEEP, fontFamily: "Inter_600SemiBold" }}>{verifiedName}</Text>.
      </Text>

      {loanType === "work_allowance" && (
        <View style={s.noteBox}>
          <Feather name="alert-triangle" size={14} color="#E67E22" />
          <Text style={s.noteText}>
            The Proof of Product you submit becomes collateral — it may be claimed by our company if you fail to repay.
          </Text>
        </View>
      )}

      {docs.map((doc) => {
        const done = !!uploaded[doc.key];
        return (
          <TouchableOpacity
            key={doc.key}
            style={[s.docCard, done && { borderColor: MID + "80", backgroundColor: MID + "06" }]}
            onPress={() => toggle(doc.key)}
            activeOpacity={0.85}
          >
            <View style={[s.docIconWrap, { backgroundColor: done ? MID + "18" : "#F0F4F0" }]}>
              <Feather name={done ? "check" : (doc.icon as any)} size={18} color={done ? MID : MUTED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.docLabel, done && { color: DEEP }]}>{doc.label}</Text>
              <Text style={s.docNote}>{done ? "Uploaded successfully" : doc.note}</Text>
            </View>
            {done
              ? <Feather name="check-circle" size={18} color={MID} />
              : <View style={s.uploadBtn}><Text style={s.uploadBtnText}>Upload</Text></View>
            }
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[s.primaryBtn, !allDone && { opacity: 0.4 }]}
        onPress={() => allDone && onNext()}
        activeOpacity={0.85}
      >
        <Text style={s.primaryBtnText}>Submit & Access Loan</Text>
        <Feather name="arrow-right" size={17} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={s.backLink} onPress={onBack}>
        <Feather name="arrow-left" size={14} color={DEEP} />
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
  const [tab, setTab] = useState<"overview" | "history">("overview");

  const loanLimit   = loanType === "individual" ? 500000 : loanType === "business" ? 5000000 : 2000000;
  const outstanding = 300000;
  const nextPayment = 25000;
  const dueDate     = "May 15, 2025";
  const paidPct     = Math.round(((loanLimit - outstanding) / loanLimit) * 100);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient colors={[DEEP, "#22603F"]} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroGreet}>Hello, {verifiedName.split(" ")[0]}</Text>
            <View style={[s.badge, { backgroundColor: ltInfo.color + "33", borderColor: ltInfo.color + "66" }]}>
              <Feather name={ltInfo.icon as any} size={11} color={ltInfo.color} />
              <Text style={[s.badgeText, { color: ltInfo.color }]}>{ltInfo.label} Loan</Text>
            </View>
          </View>
          <View style={s.verifiedPill}>
            <Feather name="shield" size={11} color={LIME} />
            <Text style={s.verifiedPillText}>Verified</Text>
          </View>
        </View>

        <Text style={s.heroSub}>Outstanding Balance</Text>
        <Text style={s.heroBalance}>{fmt(outstanding)}</Text>

        <View style={s.heroDivider} />

        <View style={s.heroStats}>
          {[
            { label: "Loan Limit",    val: fmt(loanLimit)  },
            { label: "Next Payment",  val: fmt(nextPayment) },
            { label: "Due Date",      val: dueDate          },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <View style={{ alignItems: "center" }}>
                <Text style={s.heroStatLabel}>{item.label}</Text>
                <Text style={s.heroStatVal}>{item.val}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.heroVDiv} />}
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {/* Actions */}
      <View style={s.actionsRow}>
        {[
          { icon: "plus-circle", label: "Get Loan",  color: DEEP    },
          { icon: "credit-card", label: "Pay Loan",  color: "#3498DB" },
          { icon: "clock",       label: "History",   color: "#E67E22" },
          { icon: "settings",    label: "Manage",    color: RED       },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={s.actionBtn} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: a.color + "15" }]}>
              <Feather name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Repayment Progress</Text>
          <Text style={[s.cardTag, { color: MID }]}>{paidPct}% paid</Text>
        </View>
        <View style={s.progBg}>
          <View style={[s.progFill, { width: `${paidPct}%` as any }]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={s.progLabel}>Paid: {fmt(loanLimit - outstanding)}</Text>
          <Text style={s.progLabel}>Remaining: {fmt(outstanding)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {(["overview", "history"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
              {t === "overview" ? "Loan Overview" : "Loan History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "overview" ? (
        <View style={s.card}>
          {[
            { label: "Loan Type",     value: ltInfo.label,   icon: ltInfo.icon,         color: ltInfo.color },
            { label: "Interest Rate", value: "5% p.a.",      icon: "percent",            color: "#3498DB"   },
            { label: "Tenure",        value: "12 Months",    icon: "calendar",           color: "#E67E22"   },
            { label: "Status",        value: "Active",       icon: "activity",           color: MID         },
            { label: "Disbursed",     value: fmt(loanLimit), icon: "arrow-down-left",    color: DEEP        },
          ].map((row) => (
            <View key={row.label} style={s.overviewRow}>
              <View style={[s.overviewIcon, { backgroundColor: row.color + "15" }]}>
                <Feather name={row.icon as any} size={14} color={row.color} />
              </View>
              <Text style={s.overviewLabel}>{row.label}</Text>
              <Text style={s.overviewVal}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.card}>
          {LOAN_HISTORY.map((h) => (
            <View key={h.id} style={s.histRow}>
              <View style={[s.histIcon, { backgroundColor: h.status === "Paid" ? MID + "18" : "#3498DB18" }]}>
                <Feather name={h.status === "Paid" ? "check" : "clock"} size={14} color={h.status === "Paid" ? MID : "#3498DB"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.histAmt}>{fmt(h.amount)}</Text>
                <Text style={s.histMeta}>{h.type} · {h.date} · {h.interest}</Text>
              </View>
              <View style={[s.histBadge, { backgroundColor: h.status === "Paid" ? MID + "18" : "#3498DB18" }]}>
                <Text style={[s.histBadgeText, { color: h.status === "Paid" ? MID : "#3498DB" }]}>{h.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [screen,       setScreen]       = useState<Screen>("phone");
  const [phone,        setPhone]        = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [loanType,     setLoanType]     = useState<LoanType>(null);

  if (screen === "phone") {
    return (
      <PhoneStep
        topPad={topPad}
        onNext={(p, name) => { setPhone(p); setVerifiedName(name); setScreen("loanType"); }}
      />
    );
  }
  if (screen === "loanType") {
    return (
      <LoanTypeStep
        topPad={topPad}
        onNext={(t) => { setLoanType(t); setScreen("documents"); }}
        onBack={() => setScreen("phone")}
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
  return <LoanDashboard topPad={topPad} verifiedName={verifiedName} loanType={loanType} />;
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  centerIcon:  { alignItems: "center", marginBottom: 20 },
  iconCircle:  { width: 72, height: 72, borderRadius: 36, backgroundColor: "#E8F5E0", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: BORDER },
  stepTitle:   { color: DEEP, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  stepSub:     { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 28 },

  label:       { color: DEEP, fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  phoneRow:    { flexDirection: "row", gap: 10, marginBottom: 14 },
  dialCode:    { backgroundColor: "#E8F5E0", borderRadius: 14, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: BORDER },
  dialCodeText:{ color: DEEP, fontSize: 13, fontFamily: "Inter_500Medium" },
  phoneInput:  { flex: 1, backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: DEEP, fontSize: 16, fontFamily: "Inter_500Medium", borderWidth: 1.5, borderColor: BORDER },

  alertBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FDECEA", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#F5C6C6" },
  alertText: { color: RED, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },

  detectedBox:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#E8F5E0", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: MID + "40" },
  detectedAvatarWrap:{ width: 42, height: 42, borderRadius: 21, backgroundColor: DEEP, alignItems: "center", justifyContent: "center" },
  detectedAvatar:    { color: LIME, fontSize: 18, fontFamily: "Inter_700Bold" },
  detectedSmall:     { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },
  detectedName:      { color: DEEP, fontSize: 15, fontFamily: "Inter_700Bold" },

  hint: { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16 },

  primaryBtn:     { backgroundColor: DEEP, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  primaryBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },

  backLink:     { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", marginTop: 16 },
  backLinkText: { color: DEEP, fontSize: 13, fontFamily: "Inter_500Medium" },

  typeCard:    { flexDirection: "row", gap: 14, backgroundColor: CARD, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: BORDER, alignItems: "center" },
  typeIconBg:  { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  typeLabel:   { color: DEEP, fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  typeLimit:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  typeDesc:    { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  noteBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FEF3E2", borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: "#F5CBA7" },
  noteText: { color: "#935116", fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },

  docCard:    { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: BORDER },
  docIconWrap:{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  docLabel:   { color: MUTED, fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  docNote:    { color: "#B0C4B0", fontSize: 10, fontFamily: "Inter_400Regular" },
  uploadBtn:  { backgroundColor: DEEP, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  uploadBtnText:{ color: LIME, fontSize: 11, fontFamily: "Inter_600SemiBold" },

  hero:        { marginHorizontal: 18, borderRadius: 24, padding: 22, marginBottom: 18 },
  heroTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  heroGreet:   { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  badge:       { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText:   { fontSize: 11, fontFamily: "Inter_500Medium" },
  verifiedPill:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(198,241,53,0.2)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  verifiedPillText:{ color: LIME, fontSize: 11, fontFamily: "Inter_500Medium" },
  heroSub:     { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  heroBalance: { color: "#FFF", fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 18 },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 16 },
  heroStats:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroStatLabel:{ color: "rgba(255,255,255,0.55)", fontSize: 9, fontFamily: "Inter_400Regular", marginBottom: 3, textAlign: "center" },
  heroStatVal: { color: "#FFF", fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  heroVDiv:    { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, marginBottom: 16 },
  actionBtn:  { alignItems: "center", gap: 7 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  actionLabel:{ color: MUTED, fontSize: 11, fontFamily: "Inter_500Medium" },

  card:       { backgroundColor: CARD, marginHorizontal: 18, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle:  { color: DEEP, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardTag:    { fontSize: 12, fontFamily: "Inter_500Medium" },
  progBg:     { height: 8, backgroundColor: "#E8F5E0", borderRadius: 4, overflow: "hidden" },
  progFill:   { height: 8, backgroundColor: MID, borderRadius: 4 },
  progLabel:  { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },

  tabBar:        { flexDirection: "row", marginHorizontal: 18, marginBottom: 4, backgroundColor: CARD, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  tabBtn:        { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 11 },
  tabBtnActive:  { backgroundColor: DEEP },
  tabBtnText:    { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  tabBtnTextActive:{ color: LIME, fontFamily: "Inter_600SemiBold" },

  overviewRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  overviewIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  overviewLabel:{ color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  overviewVal:  { color: DEEP, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  histRow:       { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  histIcon:      { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  histAmt:       { color: DEEP, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  histMeta:      { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  histBadge:     { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  histBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
