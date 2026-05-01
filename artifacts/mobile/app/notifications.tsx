import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";
import {
  getNotifications,
  markNotificationRead,
  type FsNotification,
} from "@/lib/firestore";

const NAVY  = "#0A1628";
const NAVY2 = "#0F1E36";
const NAVY3 = "#162440";
const GOLD  = "#C9A84C";
const MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

function iconFor(type: string): { name: string; color: string } {
  switch (type) {
    case "welcome":     return { name: "gift",          color: GOLD };
    case "transaction": return { name: "arrow-down-left", color: "#22C55E" };
    case "loan":        return { name: "credit-card",   color: "#54A0FF" };
    case "savings":     return { name: "layers",        color: "#C084FC" };
    default:            return { name: "bell",          color: GOLD };
  }
}

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString("en-UG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const { phone } = useAuth();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;

  const [notifs, setNotifs]     = useState<FsNotification[]>([]);
  const [loading, setLoading]   = useState(true);

  const loadNotifs = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    const data = await getNotifications(phone);
    setNotifs(data);
    setLoading(false);
  }, [phone]);

  useFocusEffect(useCallback(() => { loadNotifs(); }, [loadNotifs]));

  const handleTap = async (n: FsNotification) => {
    if (!n.read && n.id) {
      await markNotificationRead(phone, n.id);
      setNotifs((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
  };

  const markAllRead = async () => {
    const unread = notifs.filter((n) => !n.read);
    await Promise.all(unread.map((n) => n.id && markNotificationRead(phone, n.id)));
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <View style={[s.headerBar, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.8}>
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GOLD} />
        </View>
      ) : notifs.length === 0 ? (
        <View style={s.center}>
          <Feather name="bell-off" size={48} color={MUTED} />
          <Text style={s.emptyText}>No notifications yet</Text>
          <Text style={s.emptySubText}>
            Transaction alerts and updates will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {notifs.map((n, i) => {
            const { name, color } = iconFor(n.type);
            return (
              <TouchableOpacity
                key={n.id || i}
                style={[s.notifRow, !n.read && s.unreadRow]}
                onPress={() => handleTap(n)}
                activeOpacity={0.8}
              >
                <View style={[s.notifIcon, { backgroundColor: color + "22" }]}>
                  <Feather name={name as any} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.notifTop}>
                    <Text style={s.notifTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {!n.read && <View style={s.dot} />}
                  </View>
                  <Text style={s.notifBody} numberOfLines={2}>
                    {n.body}
                  </Text>
                  <Text style={s.notifTime}>{formatTimestamp(n.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY3,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  unreadCount: {
    color: GOLD,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  markAllText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 70,
    textAlign: "right",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubText: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  unreadRow: {
    backgroundColor: NAVY2,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    flexShrink: 0,
  },
  notifBody: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 6,
  },
  notifTime: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
