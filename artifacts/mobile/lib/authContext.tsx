import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";

const PIN_KEY_PREFIX      = "lp:pin:";
const SESSION_PHONE_KEY   = "lp:session:phone";
const SESSION_NAME_KEY    = "lp:session:name";

interface AuthContextValue {
  phone: string;
  customerName: string;
  loading: boolean;
  pinVerified: boolean;
  hasPinSet: boolean;

  validatePhone: (msisdn: string) => Promise<{ customerName: string; hasPinSet: boolean }>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  setPinVerified: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone]             = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading]         = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPinSet, setHasPinSet]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedPhone = await AsyncStorage.getItem(SESSION_PHONE_KEY);
        const storedName  = await AsyncStorage.getItem(SESSION_NAME_KEY);
        if (storedPhone) {
          setPhone(storedPhone);
          setCustomerName(storedName || "");
          const pinExists = await AsyncStorage.getItem(`${PIN_KEY_PREFIX}${storedPhone}`);
          setHasPinSet(!!pinExists);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const validatePhone = useCallback(async (msisdn: string) => {
    const res = await apiFetch<{ success: boolean; customer_name?: string; message?: string }>(
      "/api/validate-phone",
      { method: "POST", body: { msisdn } },
    );
    const name = res.customer_name || "";
    await AsyncStorage.setItem(SESSION_PHONE_KEY, msisdn);
    await AsyncStorage.setItem(SESSION_NAME_KEY, name);
    setPhone(msisdn);
    setCustomerName(name);
    const pinExists = await AsyncStorage.getItem(`${PIN_KEY_PREFIX}${msisdn}`);
    const has = !!pinExists;
    setHasPinSet(has);
    return { customerName: name, hasPinSet: has };
  }, []);

  const setupPin = useCallback(
    async (pin: string) => {
      if (!phone) throw new Error("No phone session.");
      await AsyncStorage.setItem(`${PIN_KEY_PREFIX}${phone}`, pin);
      setHasPinSet(true);
      setPinVerified(true);
    },
    [phone],
  );

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!phone) return false;
      try {
        const stored = await AsyncStorage.getItem(`${PIN_KEY_PREFIX}${phone}`);
        const ok = stored === pin;
        if (ok) setPinVerified(true);
        return ok;
      } catch {
        return false;
      }
    },
    [phone],
  );

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_PHONE_KEY);
      await AsyncStorage.removeItem(SESSION_NAME_KEY);
    } catch {}
    setPhone("");
    setCustomerName("");
    setPinVerified(false);
    setHasPinSet(false);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        phone,
        customerName,
        loading,
        pinVerified,
        hasPinSet,
        validatePhone,
        setupPin,
        verifyPin,
        setPinVerified,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
