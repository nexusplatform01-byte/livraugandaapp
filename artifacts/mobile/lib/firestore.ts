import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserData {
  phone: string;
  name: string;
  balanceUGX: number;
  pushToken?: string;
  createdAt?: Timestamp;
}

export interface FsTx {
  id?: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  icon: string;
  color: string;
  status: "success" | "pending" | "failed";
  createdAt?: Timestamp;
}

export interface FsSavingsPot {
  id?: string;
  name: string;
  mode: string;
  balance: number;
  accountType: string;
  target?: number;
  frequency?: string;
  maturityDate?: string;
  createdAt?: Timestamp;
}

export interface FsLoan {
  id?: string;
  type: string;
  amount: number;
  outstanding: number;
  nextPayment: number;
  interestRate: number;
  dueDate: string;
  status: "pending" | "active" | "paid";
  createdAt?: Timestamp;
}

export interface FsNotification {
  id?: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt?: Timestamp;
}

export async function createOrGetUser(
  phone: string,
  name: string
): Promise<UserData> {
  const ref = doc(db, "users", phone);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data: UserData = { phone, name, balanceUGX: 0 };
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    await addNotification(phone, {
      title: "Welcome to Livra!",
      body: `Hi ${name.split(" ")[0]}, your wallet is ready. Fund it to get started.`,
      type: "welcome",
      read: false,
    });
    return data;
  }
  return snap.data() as UserData;
}

export async function getUserData(phone: string): Promise<UserData | null> {
  if (!phone) return null;
  try {
    const ref = doc(db, "users", phone);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserData;
  } catch {
    return null;
  }
}

export async function updateUserBalance(
  phone: string,
  delta: number
): Promise<void> {
  const ref = doc(db, "users", phone);
  await updateDoc(ref, { balanceUGX: increment(delta) });
}

export async function updatePushToken(
  phone: string,
  pushToken: string
): Promise<void> {
  try {
    const ref = doc(db, "users", phone);
    await updateDoc(ref, { pushToken });
  } catch {}
}

export async function addTransaction(
  phone: string,
  tx: Omit<FsTx, "id" | "createdAt">
): Promise<string> {
  const ref = collection(db, "users", phone, "transactions");
  const docRef = await addDoc(ref, { ...tx, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getTransactions(
  phone: string,
  limitCount = 30
): Promise<FsTx[]> {
  if (!phone) return [];
  try {
    const ref = collection(db, "users", phone, "transactions");
    const q = query(ref, orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FsTx));
  } catch {
    return [];
  }
}

export async function createSavingsPot(
  phone: string,
  pot: Omit<FsSavingsPot, "id" | "createdAt">
): Promise<string> {
  const ref = collection(db, "users", phone, "savings");
  const docRef = await addDoc(ref, { ...pot, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getSavingsPots(phone: string): Promise<FsSavingsPot[]> {
  if (!phone) return [];
  try {
    const ref = collection(db, "users", phone, "savings");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FsSavingsPot));
  } catch {
    return [];
  }
}

export async function depositToSavings(
  phone: string,
  potId: string,
  amount: number,
  currentBalance: number
): Promise<void> {
  if (currentBalance < amount) throw new Error("Insufficient balance");
  await updateUserBalance(phone, -amount);
  const potRef = doc(db, "users", phone, "savings", potId);
  await updateDoc(potRef, { balance: increment(amount) });
  await addTransaction(phone, {
    type: "savings_deposit",
    amount: -amount,
    description: "Savings deposit",
    category: "Savings",
    icon: "layers",
    color: "#54A0FF",
    status: "success",
  });
}

export async function withdrawFromSavings(
  phone: string,
  potId: string,
  amount: number,
  potBalance: number
): Promise<void> {
  if (potBalance < amount) throw new Error("Insufficient savings balance");
  const potRef = doc(db, "users", phone, "savings", potId);
  await updateDoc(potRef, { balance: increment(-amount) });
  await updateUserBalance(phone, amount);
  await addTransaction(phone, {
    type: "savings_withdrawal",
    amount: amount,
    description: "Savings withdrawal",
    category: "Savings",
    icon: "layers",
    color: "#54A0FF",
    status: "success",
  });
}

export async function deleteSavingsPot(
  phone: string,
  potId: string,
  potBalance: number
): Promise<void> {
  if (potBalance > 0) {
    await updateUserBalance(phone, potBalance);
    await addTransaction(phone, {
      type: "savings_withdrawal",
      amount: potBalance,
      description: "Savings pot closed",
      category: "Savings",
      icon: "layers",
      color: "#54A0FF",
      status: "success",
    });
  }
  const potRef = doc(db, "users", phone, "savings", potId);
  await deleteDoc(potRef);
}

export async function disburseLoan(
  phone: string,
  loanId: string,
  amount: number
): Promise<void> {
  await updateUserBalance(phone, amount);
  const loanRef = doc(db, "users", phone, "loans", loanId);
  await updateDoc(loanRef, { status: "active" });
  await addTransaction(phone, {
    type: "loan_disbursement",
    amount: amount,
    description: "Loan disbursed to wallet",
    category: "Loan",
    icon: "credit-card",
    color: "#C6F135",
    status: "success",
  });
}

export async function createLoan(
  phone: string,
  loan: Omit<FsLoan, "id" | "createdAt">
): Promise<string> {
  const ref = collection(db, "users", phone, "loans");
  const docRef = await addDoc(ref, { ...loan, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getLoans(phone: string): Promise<FsLoan[]> {
  if (!phone) return [];
  try {
    const ref = collection(db, "users", phone, "loans");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FsLoan));
  } catch {
    return [];
  }
}

export async function addNotification(
  phone: string,
  notif: Omit<FsNotification, "id" | "createdAt">
): Promise<void> {
  try {
    const ref = collection(db, "users", phone, "notifications");
    await addDoc(ref, { ...notif, createdAt: serverTimestamp() });
  } catch {}
}

export async function getNotifications(
  phone: string
): Promise<FsNotification[]> {
  if (!phone) return [];
  try {
    const ref = collection(db, "users", phone, "notifications");
    const q = query(ref, orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as FsNotification)
    );
  } catch {
    return [];
  }
}

export async function markNotificationRead(
  phone: string,
  notifId: string
): Promise<void> {
  try {
    const ref = doc(db, "users", phone, "notifications", notifId);
    await updateDoc(ref, { read: true });
  } catch {}
}

export async function getUnreadNotificationCount(
  phone: string
): Promise<number> {
  if (!phone) return 0;
  try {
    const notifs = await getNotifications(phone);
    return notifs.filter((n) => !n.read).length;
  } catch {
    return 0;
  }
}
