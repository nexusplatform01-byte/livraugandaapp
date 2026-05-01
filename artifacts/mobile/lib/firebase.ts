import { getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFeYRik9-Xq3BF28MYSWsbyEz2AsK_QGc",
  authDomain: "livra-platform.firebaseapp.com",
  projectId: "livra-platform",
  storageBucket: "livra-platform.firebasestorage.app",
  messagingSenderId: "87412508510",
  appId: "1:87412508510:web:6c5c0c9afe48013e6571cf",
  measurementId: "G-9XGSLZ8ZQD",
};

const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let _auth: ReturnType<typeof getAuth>;
if (Platform.OS === "web") {
  _auth = getAuth(firebaseApp);
} else {
  try {
    const { getReactNativePersistence } = require("firebase/auth");
    _auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(firebaseApp);
  }
}

export const auth = _auth;
export default firebaseApp;
