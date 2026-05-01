import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

export const db = getFirestore(firebaseApp);
export default firebaseApp;
