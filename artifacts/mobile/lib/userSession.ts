import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "finwallet:user_id";
const USER_PHONE_KEY = "finwallet:user_phone";

let cachedUserId: string | null = null;

function makeUserId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
    (crypto as any).getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  try {
    const existing = await AsyncStorage.getItem(USER_ID_KEY);
    if (existing) {
      cachedUserId = existing;
      return existing;
    }
  } catch {}
  const fresh = makeUserId();
  cachedUserId = fresh;
  try { await AsyncStorage.setItem(USER_ID_KEY, fresh); } catch {}
  return fresh;
}

export async function getUserRefPrefix(): Promise<string> {
  const id = await getUserId();
  return `FW-${id.slice(0, 8)}-`;
}

export async function makeReference(): Promise<string> {
  const prefix = await getUserRefPrefix();
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `${prefix}${ts}-${rand}`;
}

export async function getUserPhone(): Promise<string | null> {
  try { return await AsyncStorage.getItem(USER_PHONE_KEY); } catch { return null; }
}

export async function setUserPhone(phone: string): Promise<void> {
  try { await AsyncStorage.setItem(USER_PHONE_KEY, phone); } catch {}
}
