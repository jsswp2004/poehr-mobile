import { useCurrentUser } from "@/hooks/useCurrentUser";
import { STAFF_ROLES } from "@/hooks/useCurrentUser";
import { API_BASE_URL } from "@/config/api";
import { tokenStore } from "@/utils/tokenStore";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ScheduleRow {
  appointment: {
    id: number;
    start: string;
    end: string;
    duration_minutes: number;
    title: string;
    description?: string;
    status: string;
    arrived?: boolean;
    no_show?: boolean;
    unit_name?: string;
    provider_id?: number;
    provider_name?: string;
  };
  patient: {
    full_name?: string;
    mrn?: string;
    [key: string]: any;
  };
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#1976d2",
  pending: "#ed6c02",
  in_progress: "#2e7d32",
  completed: "#616161",
  no_show: "#c62828",
};

const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function MyScheduleScreen() {
  const { user, loading: userLoading } = useCurrentUser();
  const [day, setDay] = useState(moment().startOf("day"));
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const allowed = !!user && STAFF_ROLES.includes(user.role);

  const load = useCallback(async () => {
    if (!allowed) return;
    setError(null);
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        setError("Please log in again.");
        return;
      }
      // Use the phone's own day so late-evening visits land on the right date.
      const start = day.clone().startOf("day");
      const end = start.clone().add(1, "day");
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_BASE_URL}/api/my-schedule/?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        setError(
          res.status === 403
            ? "Your role doesn't have a schedule."
            : "Could not load your schedule."
        );
        setRows([]);
        return;
      }
      const data = await res.json();
      setRows(data.results || []);
      setTruncated(!!data.truncated);
    } catch {
      setError("Network error. Pull down to try again.");
    }
  }, [allowed, day, search]);

  // Reload when the day changes; debounce typing in the search box.
  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    const t = setTimeout(() => {
      load().finally(() => setLoading(false));
    }, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, allowed, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (userLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          My Schedule is available to staff accounts.
        </Text>
      </View>
    );
  }

  const isToday = day.isSame(moment(), "day");

  return (
    <View style={styles.container}>
      <View style={styles.dayBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setDay(day.clone().subtract(1, "day"))}
          accessibilityLabel="Previous day"
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDay(moment().startOf("day"))}>
          <Text style={styles.dayTitle}>{day.format("ddd, MMM D, YYYY")}</Text>
          <Text style={styles.daySub}>
            {isToday ? "Today" : "Tap for today"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setDay(day.clone().add(1, "day"))}
          accessibilityLabel="Next day"
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search patient, MRN or visit"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.appointment.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={rows.length ? styles.list : styles.emptyWrap}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {error || "No appointments for this day."}
            </Text>
          }
          ListHeaderComponent={
            rows.length ? (
              <Text style={styles.count}>
                {rows.length} appointment{rows.length === 1 ? "" : "s"}
                {truncated ? " (showing first results)" : ""}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const a = item.appointment;
            const color = STATUS_COLORS[a.status] || "#616161";
            return (
              <View style={styles.card}>
                <View style={styles.timeCol}>
                  <Text style={styles.time}>{moment(a.start).format("h:mm")}</Text>
                  <Text style={styles.ampm}>{moment(a.start).format("A")}</Text>
                  <Text style={styles.dur}>{a.duration_minutes} min</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>
                    {item.patient.full_name || "Unknown patient"}
                  </Text>
                  {!!a.title && <Text style={styles.title}>{a.title}</Text>}
                  <Text style={styles.meta}>
                    {[a.provider_name, a.unit_name].filter(Boolean).join(" · ")}
                  </Text>
                  <View style={styles.badges}>
                    <Text style={[styles.badge, { backgroundColor: color }]}>
                      {statusLabel(a.status)}
                    </Text>
                    {a.arrived && (
                      <Text style={[styles.badge, { backgroundColor: "#2e7d32" }]}>
                        Arrived
                      </Text>
                    )}
                    {a.no_show && (
                      <Text style={[styles.badge, { backgroundColor: "#c62828" }]}>
                        No show
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: "#666", textAlign: "center", fontSize: 15 },
  dayBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navBtn: { padding: 10 },
  navText: { fontSize: 30, color: "#1976d2", lineHeight: 32 },
  dayTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", color: "#11181C" },
  daySub: { fontSize: 12, color: "#666", textAlign: "center" },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyWrap: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  count: { color: "#666", fontSize: 13, marginBottom: 8 },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  timeCol: { width: 64, alignItems: "center", marginRight: 12 },
  time: { fontSize: 20, fontWeight: "700", color: "#1976d2" },
  ampm: { fontSize: 12, color: "#1976d2" },
  dur: { fontSize: 11, color: "#888", marginTop: 4 },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#11181C" },
  title: { fontSize: 14, color: "#333", marginTop: 2 },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 6 },
  badge: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
});
