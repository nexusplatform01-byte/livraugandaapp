import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/authContext";
import { createLoan, getLoans, addNotification, type FsLoan } from "@/lib/firestore";

// ─── Dark green theme ──────────────────────────────────────────────────────────
const DG     = "#0D1F17";
const DG2    = "#152C1E";
const DG3    = "#1C3828";
const LIME   = "#C6F135";
const GREEN  = "#22A861";
const RED    = "#FF6B6B";
const MUTED  = "rgba(255,255,255,0.45)";
const BORDER = "rgba(255,255,255,0.08)";

type Screen   = "loanType" | "documents" | "dashboard";
type LoanType = "individual" | "business" | "work_allowance" | null;

const PHONE_NAMES: Record<string, string> = {
  "08012345678": "Adebayo Emmanuel",
  "08098765432": "Chioma Okonkwo",
  "07011223344": "Musa Aliyu Ibrahim",
  "09011223344": "Fatima Bello",
  "08033445566": "Emeka Nwosu",
};

const LOAN_TYPES = [
  {
    key: "individual" as const,
    label: "Individual",
    desc: "Personal loans for salary earners",
    icon: "user",
    color: "#54A0FF",
    gradient: ["#1A2E4A", "#0D1F17"] as [string, string],
    limit: "UGX 500K",
  },
  {
    key: "business" as const,
    label: "Business",
    desc: "Financing for registered companies",
    icon: "briefcase",
    color: "#FF9F43",
    gradient: ["#3A2510", "#0D1F17"] as [string, string],
    limit: "UGX 5M",
  },
  {
    key: "work_allowance" as const,
    label: "Work Allowance",
    desc: "Employer-backed salary loans",
    icon: "award",
    color: LIME,
    gradient: ["#1C3828", "#0D1F17"] as [string, string],
    limit: "UGX 2M",
  },
];

function getRequiredDocs(type: LoanType) {
  const base = [
    { key: "id",         label: "National ID / Passport", icon: "credit-card", note: "Clear photo of valid government ID"       },
    { key: "collateral", label: "Collateral Document",    icon: "package",     note: "Asset pledged if repayment fails"          },
  ];
  if (type === "work_allowance") {
    return [
      ...base,
      { key: "workpermit", label: "Valid Work Permit",    icon: "file-text",   note: "Current employer-issued work permit"       },
      { key: "address",    label: "Proof of Address",     icon: "map-pin",     note: "Utility bill or bank statement (≤3 months)" },
      { key: "product",    label: "Proof of Product",     icon: "box",         note: "Item held as collateral by our company"     },
    ];
  }
  if (type === "business") {
    return [
      ...base,
      { key: "cac",     label: "CAC Certificate",         icon: "award",       note: "Company registration document"             },
      { key: "address", label: "Proof of Address",         icon: "map-pin",    note: "Utility bill or bank statement (≤3 months)" },
    ];
  }
  return [
    ...base,
    { key: "address", label: "Proof of Address",           icon: "map-pin",    note: "Utility bill or bank statement (≤3 months)" },
  ];
}

const LOAN_HISTORY = [
  { id: "1", amount: 150000, type: "Individual",     status: "Paid",   date: "Mar 2025", interest: "5%" },
  { id: "2", amount: 300000, type: "Individual",     status: "Active", date: "Jan 2025", interest: "5%" },
  { id: "3", amount: 80000,  type: "Work Allowance", status: "Paid",   date: "Oct 2024", interest: "3%" },
];

function fmt(n: number) { return "UGX " + n.toLocaleString("en-UG"); }

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === current ? LIME : "rgba(255,255,255,0.2)" }} />
      ))}
    </View>
  );
}

// ─── Step 1: Phone ─────────────────────────────────────────────────────────────
function PhoneStep({ onNext, topPad }: { onNext: (phone: string, name: string) => void; topPad: number }) {
  const [phone,    setPhone]    = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [tried,    setTried]    = useState(false);

  const handleVerify = () => {
    setTried(true);
    setDetected(PHONE_NAMES[phone] ?? null);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: DG }}>
      <ScrollView contentContainerStyle={{ paddingTop: topPad + 28, paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StepDots current={0} total={3} />

        <View style={s.centerIcon}>
          <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.gradIcon}>
            <Feather name="smartphone" size={30} color={LIME} />
          </LinearGradient>
        </View>
        <Text style={s.stepTitle}>Verify Your Phone</Text>
        <Text style={s.stepSub}>Enter your phone number. Your identity will be detected automatically.</Text>

        <Text style={s.label}>Phone Number</Text>
        <View style={s.phoneRow}>
          <View style={s.dialCode}><Text style={s.dialCodeText}>🇳🇬 +234</Text></View>
          <TextInput
            style={s.phoneInput}
            placeholder="080 0000 0000"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => { setPhone(v); setDetected(null); setTried(false); }}
            maxLength={11}
          />
        </View>

        {tried && !detected && (
          <View style={s.alertBox}>
            <Feather name="alert-circle" size={15} color={RED} />
            <Text style={s.alertText}>No account found for this number.</Text>
          </View>
        )}

        {detected && (
          <View style={s.detectedBox}>
            <View style={s.detectedAvatar}><Text style={s.detectedAvatarText}>{detected.charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.detectedSmall}>Account Detected</Text>
              <Text style={s.detectedName}>{detected}</Text>
            </View>
            <Feather name="check-circle" size={20} color={GREEN} />
          </View>
        )}

        {!detected
          ? <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} activeOpacity={0.85}><Text style={s.primaryBtnText}>Verify Number</Text><Feather name="search" size={17} color={DG} /></TouchableOpacity>
          : <TouchableOpacity style={s.primaryBtn} onPress={() => onNext(phone, detected!)} activeOpacity={0.85}><Text style={s.primaryBtnText}>Continue</Text><Feather name="arrow-right" size={17} color={DG} /></TouchableOpacity>
        }

        <Text style={s.hint}>Try: 08012345678 · 08098765432 · 07011223344</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 2: Loan Type (2-col grid) ───────────────────────────────────────────
function LoanTypeStep({ onNext, onBack, topPad }: { onNext: (t: LoanType) => void; onBack: () => void; topPad: number }) {
  const [selected, setSelected] = useState<LoanType>(null);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DG }} contentContainerStyle={{ paddingTop: topPad + 28, paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <StepDots current={1} total={3} />

      <View style={s.centerIcon}>
        <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.gradIcon}>
          <Feather name="layers" size={30} color={LIME} />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>Loan Category</Text>
      <Text style={s.stepSub}>Choose the loan type that best fits your needs.</Text>

      {/* 2-column grid — last card spans full width if odd */}
      <View style={s.typeGrid}>
        {LOAN_TYPES.map((lt) => {
          const active = selected === lt.key;
          return (
            <TouchableOpacity
              key={lt.key}
              style={[s.typeGridCard, active && { borderColor: lt.color, borderWidth: 2 }]}
              onPress={() => setSelected(lt.key)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={lt.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} borderRadius={18} />
              {active && (
                <View style={[s.gridCheck, { backgroundColor: lt.color }]}>
                  <Feather name="check" size={11} color={DG} />
                </View>
              )}
              <View style={[s.gridIconWrap, { backgroundColor: lt.color + "22" }]}>
                <Feather name={lt.icon as any} size={24} color={lt.color} />
              </View>
              <Text style={s.gridLabel}>{lt.label}</Text>
              <Text style={s.gridDesc}>{lt.desc}</Text>
              <View style={[s.gridLimitBadge, { backgroundColor: lt.color + "22" }]}>
                <Text style={[s.gridLimitText, { color: lt.color }]}>Up to {lt.limit}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[s.primaryBtn, !selected && { opacity: 0.38 }]} onPress={() => selected && onNext(selected)} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>Continue</Text>
        <Feather name="arrow-right" size={17} color={DG} />
      </TouchableOpacity>

      <TouchableOpacity style={s.backLink} onPress={onBack}>
        <Feather name="arrow-left" size={14} color={LIME} />
        <Text style={s.backLinkText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 3: Documents ─────────────────────────────────────────────────────────
function DocumentsStep({ loanType, verifiedName, onNext, onBack, topPad }: { loanType: LoanType; verifiedName: string; onNext: () => void; onBack: () => void; topPad: number }) {
  const docs   = getRequiredDocs(loanType);
  const ltInfo = LOAN_TYPES.find((l) => l.key === loanType)!;
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const toggle   = (key: string) => setUploaded((p) => ({ ...p, [key]: !p[key] }));
  const allDone  = docs.every((d) => uploaded[d.key]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DG }} contentContainerStyle={{ paddingTop: topPad + 24, paddingHorizontal: 22, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <StepDots current={2} total={3} />

      <View style={s.centerIcon}>
        <LinearGradient colors={["#1C4A30", "#0D2A1A"]} style={s.gradIcon}>
          <Feather name="file-text" size={30} color={LIME} />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>Upload Documents</Text>
      <Text style={s.stepSub}>
        Required for <Text style={{ color: ltInfo.color, fontFamily: "Inter_600SemiBold" }}>{ltInfo.label}</Text> loan under <Text style={{ color: LIME, fontFamily: "Inter_600SemiBold" }}>{verifiedName}</Text>.
      </Text>

      {loanType === "work_allowance" && (
        <View style={s.noteBox}>
          <Feather name="alert-triangle" size={14} color="#FF9F43" />
          <Text style={s.noteText}>Proof of Product acts as collateral — it may be claimed by our company if repayment fails.</Text>
        </View>
      )}

      {docs.map((doc) => {
        const done = !!uploaded[doc.key];
        return (
          <TouchableOpacity key={doc.key} style={[s.docCard, done && { borderColor: GREEN + "70" }]} onPress={() => toggle(doc.key)} activeOpacity={0.85}>
            <View style={[s.docIconWrap, { backgroundColor: done ? GREEN + "22" : DG3 }]}>
              <Feather name={done ? "check" : (doc.icon as any)} size={18} color={done ? GREEN : MUTED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.docLabel, done && { color: "#FFF" }]}>{doc.label}</Text>
              <Text style={s.docNote}>{done ? "Uploaded successfully" : doc.note}</Text>
            </View>
            {done
              ? <Feather name="check-circle" size={18} color={GREEN} />
              : <View style={s.uploadBtn}><Text style={s.uploadBtnText}>Upload</Text></View>
            }
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={[s.primaryBtn, !allDone && { opacity: 0.38 }]} onPress={() => allDone && onNext()} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>Submit & Access Loan</Text>
        <Feather name="arrow-right" size={17} color={DG} />
      </TouchableOpacity>

      <TouchableOpacity style={s.backLink} onPress={onBack}>
        <Feather name="arrow-left" size={14} color={LIME} />
        <Text style={s.backLinkText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function LoanDashboard({ verifiedName, loanType, topPad, loans = [], onApplyNew }: { verifiedName: string; loanType: LoanType; topPad: number; loans?: FsLoan[]; onApplyNew?: () => void }) {
  const ltInfo      = LOAN_TYPES.find((l) => l.key === loanType) ?? LOAN_TYPES[0];
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const activeLoan  = loans.find((l) => l.status === "active") || loans[0];
  const loanLimit   = activeLoan?.amount ?? (loanType === "individual" ? 500000 : loanType === "business" ? 5000000 : 2000000);
  const outstanding = activeLoan?.outstanding ?? loanLimit;
  const nextPayment = activeLoan?.nextPayment ?? Math.round(loanLimit / 12);
  const dueDate     = activeLoan?.dueDate ?? "—";
  const paidPct     = loanLimit > 0 ? Math.round(((loanLimit - outstanding) / loanLimit) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DG }} contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#1A4A2C", "#0D2A1A"]} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroGreet}>Hello, {verifiedName.split(" ")[0]}</Text>
            <View style={[s.badge, { backgroundColor: ltInfo.color + "33", borderColor: ltInfo.color + "55" }]}>
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
            { label: "Loan Limit",   val: fmt(loanLimit)   },
            { label: "Next Payment", val: fmt(nextPayment)  },
            { label: "Due Date",     val: dueDate           },
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

      <View style={s.actionsRow}>
        {[
          { icon: "plus-circle", label: "Get Loan",  color: LIME      },
          { icon: "credit-card", label: "Pay Loan",  color: "#54A0FF" },
          { icon: "clock",       label: "History",   color: "#FF9F43" },
          { icon: "settings",    label: "Manage",    color: RED        },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={s.actionBtn} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: a.color + "22" }]}>
              <Feather name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Repayment Progress</Text>
          <Text style={[s.cardTag, { color: LIME }]}>{paidPct}% paid</Text>
        </View>
        <View style={s.progBg}>
          <View style={[s.progFill, { width: `${paidPct}%` as any }]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={s.progLabel}>Paid: {fmt(loanLimit - outstanding)}</Text>
          <Text style={s.progLabel}>Remaining: {fmt(outstanding)}</Text>
        </View>
      </View>

      <View style={s.tabBar}>
        {(["overview", "history"] as const).map((t) => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t === "overview" ? "Loan Overview" : "Loan History"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "overview" ? (
        <View style={s.card}>
          {[
            { label: "Loan Type",     value: ltInfo.label,   icon: ltInfo.icon,      color: ltInfo.color },
            { label: "Interest Rate", value: "5% p.a.",      icon: "percent",         color: "#54A0FF"    },
            { label: "Tenure",        value: "12 Months",    icon: "calendar",        color: "#FF9F43"    },
            { label: "Status",        value: "Active",       icon: "activity",        color: GREEN        },
            { label: "Disbursed",     value: fmt(loanLimit), icon: "arrow-down-left", color: LIME         },
          ].map((row) => (
            <View key={row.label} style={s.overviewRow}>
              <View style={[s.overviewIcon, { backgroundColor: row.color + "22" }]}>
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
              <View style={[s.histIcon, { backgroundColor: h.status === "Paid" ? GREEN + "22" : "#54A0FF22" }]}>
                <Feather name={h.status === "Paid" ? "check" : "clock"} size={14} color={h.status === "Paid" ? GREEN : "#54A0FF"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.histAmt}>{fmt(h.amount)}</Text>
                <Text style={s.histMeta}>{h.type} · {h.date} · {h.interest}</Text>
              </View>
              <View style={[s.histBadge, { backgroundColor: h.status === "Paid" ? GREEN + "22" : "#54A0FF22" }]}>
                <Text style={[s.histBadgeText, { color: h.status === "Paid" ? GREEN : "#54A0FF" }]}>{h.status}</Text>
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
  const { phone: authPhone, customerName } = useAuth();

  const [screen,    setScreen]    = useState<Screen>("loanType");
  const [loanType,  setLoanType]  = useState<LoanType>(null);
  const [loans,     setLoans]     = useState<FsLoan[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadLoans = useCallback(async () => {
    if (!authPhone) return;
    const data = await getLoans(authPhone);
    if (data.length > 0) {
      setLoanType(data[0].type as LoanType);
      setScreen("dashboard");
    }
    setLoans(data);
  }, [authPhone]);

  useFocusEffect(useCallback(() => { loadLoans(); }, [loadLoans]));

  const handleDocumentsSubmit = async () => {
    if (!loanType || submitting) return;
    setSubmitting(true);
    try {
      const loanLimit = loanType === "individual" ? 500000 : loanType === "business" ? 5000000 : 2000000;
      await createLoan(authPhone, {
        type: loanType,
        amount: loanLimit,
        outstanding: loanLimit,
        nextPayment: Math.round(loanLimit / 12),
        interestRate: loanType === "work_allowance" ? 3 : 5,
        dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-UG", { month: "short", day: "numeric", year: "numeric" }),
        status: "active",
      });
      await addNotification(authPhone, {
        title: "Loan Application Submitted",
        body: `Your ${loanType.replace("_", " ")} loan application is under review. We'll notify you shortly.`,
        type: "loan",
        read: false,
      });
      Alert.alert("Application Submitted!", "Your loan application has been received. We'll review and notify you within 24 hours.");
      await loadLoans();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not submit loan application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (screen === "loanType") {
    return (
      <LoanTypeStep
        topPad={topPad}
        onNext={(t) => { setLoanType(t); setScreen("documents"); }}
        onBack={() => { if (loans.length > 0) setScreen("dashboard"); }}
      />
    );
  }
  if (screen === "documents") {
    return (
      <DocumentsStep
        topPad={topPad}
        loanType={loanType}
        verifiedName={customerName}
        onNext={handleDocumentsSubmit}
        onBack={() => setScreen("loanType")}
      />
    );
  }
  return (
    <LoanDashboard
      topPad={topPad}
      verifiedName={customerName}
      loanType={loanType}
      loans={loans}
      onApplyNew={() => setScreen("loanType")}
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  centerIcon: { alignItems: "center", marginBottom: 20 },
  gradIcon:   { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  stepTitle:  { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  stepSub:    { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 28 },

  label:        { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  phoneRow:     { flexDirection: "row", gap: 10, marginBottom: 14 },
  dialCode:     { backgroundColor: DG3, borderRadius: 14, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: BORDER },
  dialCodeText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_500Medium" },
  phoneInput:   { flex: 1, backgroundColor: DG3, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#FFF", fontSize: 16, fontFamily: "Inter_500Medium", borderWidth: 1, borderColor: BORDER },

  alertBox:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: RED + "18", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: RED + "40" },
  alertText: { color: RED, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

  detectedBox:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: GREEN + "18", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: GREEN + "40" },
  detectedAvatar:   { width: 42, height: 42, borderRadius: 21, backgroundColor: DG3, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: LIME + "55" },
  detectedAvatarText:{ color: LIME, fontSize: 18, fontFamily: "Inter_700Bold" },
  detectedSmall:    { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },
  detectedName:     { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },

  hint: { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16 },

  primaryBtn:     { backgroundColor: LIME, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  primaryBtnText: { color: DG, fontSize: 15, fontFamily: "Inter_700Bold" },

  backLink:     { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", marginTop: 16 },
  backLinkText: { color: LIME, fontSize: 13, fontFamily: "Inter_500Medium" },

  // 2-col grid
  typeGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  typeGridCard:  {
    width: "47.5%", backgroundColor: DG2, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: BORDER, overflow: "hidden", position: "relative",
    minHeight: 170,
  },
  gridCheck:    { position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  gridIconWrap: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  gridLabel:    { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  gridDesc:     { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14, marginBottom: 10, flex: 1 },
  gridLimitBadge:{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  gridLimitText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  noteBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FF9F4318", borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: "#FF9F4330" },
  noteText: { color: "#FF9F43", fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },

  docCard:    { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: DG2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: BORDER },
  docIconWrap:{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  docLabel:   { color: MUTED, fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  docNote:    { color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "Inter_400Regular" },
  uploadBtn:  { backgroundColor: LIME, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  uploadBtnText:{ color: DG, fontSize: 11, fontFamily: "Inter_700Bold" },

  hero:         { marginHorizontal: 18, borderRadius: 24, padding: 22, marginBottom: 18 },
  heroTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  heroGreet:    { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  badge:        { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText:    { fontSize: 11, fontFamily: "Inter_500Medium" },
  verifiedPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(198,241,53,0.2)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  verifiedPillText: { color: LIME, fontSize: 11, fontFamily: "Inter_500Medium" },
  heroSub:      { color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  heroBalance:  { color: "#FFF", fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 18 },
  heroDivider:  { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 16 },
  heroStats:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroStatLabel:{ color: MUTED, fontSize: 9, fontFamily: "Inter_400Regular", marginBottom: 3, textAlign: "center" },
  heroStatVal:  { color: "#FFF", fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  heroVDiv:     { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, marginBottom: 16 },
  actionBtn:  { alignItems: "center", gap: 7 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  actionLabel:{ color: MUTED, fontSize: 11, fontFamily: "Inter_500Medium" },

  card:       { backgroundColor: DG2, marginHorizontal: 18, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle:  { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardTag:    { fontSize: 12, fontFamily: "Inter_500Medium" },
  progBg:     { height: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" },
  progFill:   { height: 8, backgroundColor: LIME, borderRadius: 4 },
  progLabel:  { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular" },

  tabBar:          { flexDirection: "row", marginHorizontal: 18, marginBottom: 4, backgroundColor: DG2, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: BORDER },
  tabBtn:          { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 11 },
  tabBtnActive:    { backgroundColor: DG3 },
  tabBtnText:      { color: MUTED, fontSize: 12, fontFamily: "Inter_500Medium" },
  tabBtnTextActive:{ color: LIME, fontFamily: "Inter_600SemiBold" },

  overviewRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  overviewIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  overviewLabel:{ color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  overviewVal:  { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  histRow:        { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  histIcon:       { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  histAmt:        { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  histMeta:       { color: MUTED, fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  histBadge:      { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  histBadgeText:  { fontSize: 11, fontFamily: "Inter_500Medium" },
});
