import { router } from "expo-router";
import { useEffect } from "react";

export default function OtpScreen() {
  useEffect(() => {
    router.replace("/auth");
  }, []);
  return null;
}
