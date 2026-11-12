import { useCurrentUser } from "@/hooks/useCurrentUser";
import { STAFF_ROLES } from "@/hooks/useCurrentUser";
import { API_BASE_URL } from "@/config/api";
import { tokenStore } from "@/utils/tokenStore";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const STATUS_CHIP: Record<string, { bg: string; fg: string }> = {
  scheduled: { bg: "#e3effc", fg: "#0d5cab" },
  pending: { bg: "#fdf0dc", fg: "#8a4b00" },
  in_progress: { bg: "#e3f4e6", fg: "#1b6b2a" },
  completed: { bg: "#eceff2", fg: "#3d4852" },
  cancelled: { bg: "#eceff2", fg: "#3d4852" },
  no_show: { bg: "#fde7e7", fg: "#a31d1d" },
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
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "waiting" | "done">("all");

  const allowed = !!user && STAFF_ROLES.includes(user.role);
  // Doctors see their own day; everyone else on the front desk can check in.
  // The server still enforces the real permission (checkin.manage).
  const canCheckIn = allowed;

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

  // Check a patient in (or undo it) with the same endpoint the web Check-in
  // page uses. The server sets the visit to in-progress and clears no-show.
  const setArrived = async (row: ScheduleRow, arrived: boolean) => {
    const name = row.patient.full_name || "the patient";
    setBusyId(row.appointment.id);
    try {
      const token = await tokenStore.getItem("access_token");
      const res = await fetch(
        `${API_BASE_URL}/api/check-in/update-status/${row.appointment.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ arrived }),
        }
      );
      if (!res.ok) {
        Alert.alert(
          res.status === 403 ? "Not allowed" : "Error",
          res.status === 403
            ? "Your account doesn't have permission to check patients in."
            : `Could not ${arrived ? "check in" : "undo the check-in for"} ${name}. Nothing was changed.`
        );
        return;
      }
      const updated = await res.json();
      setRows((prev) =>
        prev.map((r) =>
          r.appointment.id === row.appointment.id
            ? {
                ...r,
                appointment: {
                  ...r.appointment,
                  arrived: updated.arrived ?? arrived,
                  no_show: updated.no_show ?? false,
                  status: updated.status ?? r.appointment.status,
                },
              }
            : r
        )
      );
    } catch {
      Alert.alert("Network error", "Could not reach the server. Try again.");
    } finally {
      setBusyId(null);
    }
  };

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

  const weekStart = day.clone().startOf("isoWeek");
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    weekStart.clone().add(i, "day")
  );

  const isWaiting = (r: ScheduleRow) =>
    ["scheduled", "pending"].includes(r.appointment.status) && !r.appointment.arrived;
  const isDone = (r: ScheduleRow) => r.appointment.status === "completed";
  const waitingCount = rows.filter(isWaiting).length;
  const doneCount = rows.filter(isDone).length;
  const visibleRows = rows.filter((r) =>
    filter === "waiting" ? isWaiting(r) : filter === "done" ? isDone(r) : true
  );
  // Highlight the next visit that still needs a check-in.
  const nextId = rows.find(isWaiting)?.appointment.id;

  const Chip = ({ id, label }: { id: "all" | "waiting" | "done"; label: string }) => (
    <TouchableOpacity
      onPress={() => setFilter(id)}
      style={[styles.chip, filter === id && styles.chipOn]}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, filter === id && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>My Day</Text>
        <Text style={styles.countText}>
          {rows.length} appointment{rows.length === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={styles.weekRow}>
        <TouchableOpacity
          style={styles.weekNav}
          onPress={() => setDay(day.clone().subtract(7, "day"))}
          accessibilityLabel="Previous week"
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.weekDays}>
          {weekDays.map((d) => {
            const sel = d.isSame(day, "day");
            return (
              <TouchableOpacity
                key={d.format("YYYY-MM-DD")}
                onPress={() => setDay(d.clone().startOf("day"))}
                style={[styles.dayPill, sel && styles.dayPillOn]}
                accessibilityLabel={d.format("dddd, MMMM D")}
              >
                <Text style={[styles.dayName, sel && styles.dayOn]}>{d.format("ddd")}</Text>
                <Text style={[styles.dayNum, sel && styles.dayOn]}>{d.format("D")}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.weekNav}
          onPress={() => setDay(day.clone().add(7, "day"))}
          accessibilityLabel="Next week"
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search patient, MRN or visit"
        placeholderTextColor="#8b95a0"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <View style={styles.chips}>
        <Chip id="all" label={`All ${rows.length}`} />
        <Chip id="waiting" label={`Waiting ${waitingCount}`} />
        <Chip id="done" label={`Done ${doneCount}`} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(r) => String(r.appointment.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={visibleRows.length ? styles.list : styles.emptyWrap}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {error ||
                (rows.length
                  ? "No visits match this filter."
                  : "No appointments for this day.")}
            </Text>
          }
          ListFooterComponent={
            truncated ? (
              <Text style={styles.muted}>Showing first results. Narrow with search.</Text>
            ) : undefined
          }
          renderItem={({ item }) => {
            const a = item.appointment;
            const chip = STATUS_CHIP[a.status] || STATUS_CHIP.completed;
            const isNext = a.id === nextId;
            const dim = a.status === "completed" || a.status === "cancelled";
            return (
              <View
                style={[styles.card, isNext && styles.cardNext, dim && styles.cardDim]}
              >
                <View style={styles.timeCol}>
                  <Text style={[styles.time, dim && styles.timeDim]}>
                    {moment(a.start).format("h:mm")}
                  </Text>
                  <Text style={[styles.ampm, dim && styles.timeDim]}>
                    {moment(a.start).format("A")}
                  </Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>
                    {item.patient.full_name || "Unknown patient"}
                  </Text>
                  <Text style={styles.meta}>
                    {[a.title, `${a.duration_minutes} min`].filter(Boolean).join(" · ")}
                  </Text>
                  {!!(a.provider_name || a.unit_name) && (
                    <Text style={styles.meta}>
                      {[a.provider_name, a.unit_name].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                  <View style={styles.badges}>
                    <Text style={[styles.badge, { backgroundColor: chip.bg, color: chip.fg }]}>
                      {statusLabel(a.status)}
                    </Text>
                    {a.arrived && (
                      <Text style={[styles.badge, STATUS_CHIP.in_progress && { backgroundColor: STATUS_CHIP.in_progress.bg, color: STATUS_CHIP.in_progress.fg }]}>
                        Arrived
                      </Text>
                    )}
                    {a.no_show && (
                      <Text style={[styles.badge, { backgroundColor: STATUS_CHIP.no_show.bg, color: STATUS_CHIP.no_show.fg }]}>
                        No show
                      </Text>
                    )}
                    {canCheckIn &&
                      (a.arrived && a.status === "in_progress" ? (
                        <TouchableOpacity
                          style={styles.undoBtn}
                          disabled={busyId === a.id}
                          onPress={() => setArrived(item, false)}
                        >
                          <Text style={styles.undoText}>
                            {busyId === a.id ? "Working..." : "Undo check-in"}
                          </Text>
                        </TouchableOpacity>
                      ) : ["scheduled", "pending", "no_show"].includes(a.status) &&
                        !a.arrived ? (
                        <TouchableOpacity
                          style={styles.checkInBtn}
                          disabled={busyId === a.id}
                          onPress={() => setArrived(item, true)}
                        >
                          <Text style={styles.checkInText}>
                            {busyId === a.id ? "Working..." : "Check in"}
                          </Text>
                        </TouchableOpacity>
                      ) : null)}
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
  muted: { color: "#5b6670", textAlign: "center", fontSize: 15 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 20,
  },
  screenTitle: { fontSize: 24, fontWeight: "700", color: "#11181C" },
  countText: { fontSize: 13, fontWeight: "500", color: "#5b6670" },
  weekRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  weekNav: { width: 28, alignItems: "center", justifyContent: "center", height: 48 },
  navText: { fontSize: 28, color: "#1976d2", lineHeight: 30 },
  weekDays: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  dayPill: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 14 },
  dayPillOn: { backgroundColor: "#1976d2" },
  dayName: { fontSize: 11, fontWeight: "600", color: "#5b6670" },
  dayNum: { fontSize: 17, fontWeight: "600", color: "#5b6670", marginTop: 2 },
  dayOn: { color: "#fff", fontWeight: "700" },
  search: {
    height: 46,
    borderWidth: 1,
    borderColor: "#c5ccd4",
    borderRadius: 12,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 12,
    fontSize: 15,
    color: "#11181C",
  },
  chips: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 12 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#f5f7fa",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: "#1976d2" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#3d4852" },
  chipTextOn: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 },
  emptyWrap: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e3e8ee",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  cardNext: { borderWidth: 2, borderColor: "#1976d2", backgroundColor: "#f7fbff" },
  cardDim: { opacity: 0.78 },
  timeCol: { width: 52, alignItems: "center" },
  time: { fontSize: 18, fontWeight: "700", color: "#1976d2" },
  ampm: { fontSize: 11, fontWeight: "600", color: "#1976d2" },
  timeDim: { color: "#5b6670" },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: "600", color: "#11181C" },
  meta: { fontSize: 12, color: "#5b6670", marginTop: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8, gap: 6 },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#e3f4e6",
    color: "#1b6b2a",
  },
  checkInBtn: {
    marginLeft: "auto",
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#1976d2",
    alignItems: "center",
    justifyContent: "center",
  },
  checkInText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  undoBtn: {
    marginLeft: "auto",
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c9dcf2",
    alignItems: "center",
    justifyContent: "center",
  },
  undoText: { color: "#0d5cab", fontWeight: "600", fontSize: 14 },
});
