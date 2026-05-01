import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ConfirmationResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./firebase";

const PIN_KEY_PREFIX = "fw:pin:";
const PHONE_KEY      = "fw:lastPhone";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  pinVerified: boolean;
  hasPinSet: boolean;

  sendOtp: (phoneNumber: string, verifierOrContainer?: any) => Promise<void>;
  confirmOtp: (code: string) => Promise<User>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  setPinVerified: (v: boolean) => void;
  signOut: () => Promise<void>;
  lastPhone: string;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

let _confirmationResult: ConfirmationResult | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPinSet, setHasPinSet]     = useState(false);
  const [lastPhone, setLastPhone]     = useState("");

  const checkPin = useCallback(async (uid: string) => {
    try {
      const val = await AsyncStorage.getItem(`${PIN_KEY_PREFIX}${uid}`);
      setHasPinSet(!!val);
    } catch {
      setHasPinSet(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await checkPin(u.uid);
        try {
          const p = await AsyncStorage.getItem(PHONE_KEY);
          setLastPhone(p || u.phoneNumber || "");
        } catch {}
      } else {
        setHasPinSet(false);
        setPinVerified(false);
      }
      setLoading(false);
    });
    return unsub;
  }, [checkPin]);

  const sendOtp = useCallback(
    async (phoneNumber: string, verifierOrContainer?: any) => {
      const { signInWithPhoneNumber, RecaptchaVerifier } = await import("firebase/auth");
      let verifier = verifierOrContainer;
      if (!verifier && typeof document !== "undefined") {
        const containerId = "fw-recaptcha";
        let el = document.getElementById(containerId);
        if (!el) {
          el = document.createElement("div");
          el.id = containerId;
          document.body.appendChild(el);
        }
        verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
        await verifier.render();
      }
      try {
        await AsyncStorage.setItem(PHONE_KEY, phoneNumber);
        setLastPhone(phoneNumber);
      } catch {}
      _confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    },
    [],
  );

  const confirmOtp = useCallback(async (code: string): Promise<User> => {
    if (!_confirmationResult) throw new Error("No OTP request in progress.");
    const cred = await _confirmationResult.confirm(code);
    _confirmationResult = null;
    if (!cred.user) throw new Error("Verification failed.");
    return cred.user;
  }, []);

  const setupPin = useCallback(
    async (pin: string) => {
      if (!user) throw new Error("Not logged in.");
      await AsyncStorage.setItem(`${PIN_KEY_PREFIX}${user.uid}`, pin);
      setHasPinSet(true);
      setPinVerified(true);
    },
    [user],
  );

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!user) return false;
      try {
        const stored = await AsyncStorage.getItem(`${PIN_KEY_PREFIX}${user.uid}`);
        const ok = stored === pin;
        if (ok) setPinVerified(true);
        return ok;
      } catch {
        return false;
      }
    },
    [user],
  );

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setPinVerified(false);
    setHasPinSet(false);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        pinVerified,
        hasPinSet,
        sendOtp,
        confirmOtp,
        setupPin,
        verifyPin,
        setPinVerified,
        signOut,
        lastPhone,
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
