import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY   = "finwallet:user_id";
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

/**
 * Returns the current user ID.
 * If Firebase is active, uses the Firebase UID's first 16 chars.
 * Falls back to a random ID stored in AsyncStorage.
 */
export async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  // Try Firebase UID first
  try {
    const { auth } = await import("./firebase");
    if (auth.currentUser?.uid) {
      const uid = auth.currentUser.uid.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 16);
      cachedUserId = uid;
      return uid;
    }
  } catch {}

  // Fall back to stored random ID
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

/** Call this when the Firebase user changes so the next getUserId() picks up the new UID. */
export function clearUserIdCache() {
  cachedUserId = null;
}

export async function getUserRefPrefix(): Promise<string> {
  const id = await getUserId();
  return `FW-${id.slice(0, 8)}-`;
}

export async function makeReference(): Promise<string> {
  const prefix = await getUserRefPrefix();
  const ts   = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `${prefix}${ts}-${rand}`;
}

export async function getUserPhone(): Promise<string | null> {
  try { return await AsyncStorage.getItem(USER_PHONE_KEY); } catch { return null; }
}

export async function setUserPhone(phone: string): Promise<void> {
  try { await AsyncStorage.setItem(USER_PHONE_KEY, phone); } catch {}
}
