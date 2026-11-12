import { API_BASE_URL } from "@/config/api";
import { STAFF_ROLES, useCurrentUser } from "@/hooks/useCurrentUser";
import { tokenStore } from "@/utils/tokenStore";
import { router } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Appointment {
  id: number;
  title?: string;
  patient_name?: string;
  doctor_name?: string;
  provider_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_datetime?: string;
  duration_minutes?: number;
  duration?: number;
  status: string;
  arrived?: boolean;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  scheduled: { bg: "#e3effc", fg: "#0d5cab", label: "Scheduled" },
  pending: { bg: "#fdf0dc", fg: "#8a4b00", label: "Pending" },
  in_progress: { bg: "#e3f4e6", fg: "#1b6b2a", label: "In progress" },
  completed: { bg: "#eceff2", fg: "#3d4852", label: "Completed" },
  no_show: { bg: "#fde7e7", fg: "#a31d1d", label: "No show" },
  cancelled: { bg: "#eceff2", fg: "#3d4852", label: "Cancelled" },
};

const DONE_STATUSES = ["completed", "cancelled", "no_show"];

// The backend sends either appointment_datetime or the older date/time pair.
const startOf = (a: Appointment): moment.Moment | null => {
  if (a.appointment_datetime) {
    const m = moment(a.appointment_datetime);
    return m.isValid() ? m : null;
  }
  if (a.appointment_date && a.appointment_time) {
    const m = moment(`${a.appointment_date} ${a.appointment_time}`, [
      "YYYY-MM-DD HH:mm:ss",
      "YYYY-MM-DD HH:mm",
    ]);
    return m.isValid() ? m : null;
  }
  return null;
};

function greeting() {
  const h = moment().hour();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user, loading } = useCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPatient = user?.role === "patient";
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const canRegister =
    !!user &&
    ["doctor", "admin", "system_admin", "registrar"].includes(user.role);

  const loadToday = useCallback(async () => {
    setError(null);
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) return;
      const today = moment().format("YYYY-MM-DD");
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        setError("Could not load today's appointments.");
        return;
      }
      const data = await response.json();
      const list: Appointment[] = Array.isArray(data) ? data : data.results || [];
      // Keep only today in the phone's own time zone, soonest first.
      const todays = list
        .filter((a) => {
          const m = a && startOf(a);
          return !!m && m.isSame(moment(), "day");
        })
        .sort((a, b) => startOf(a)!.valueOf() - startOf(b)!.valueOf());
      setAppointments(todays);
    } catch {
      setError("Network error. Pull down to try again.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingAppointments(true);
    loadToday().finally(() => setLoadingAppointments(false));
  }, [user, loadToday]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadToday();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  const now = moment();
  const open = appointments.filter((a) => !DONE_STATUSES.includes(a.status));
  // "Up next" is the first open visit that hasn't ended yet.
  const upcoming = open.filter((a) => {
    const s = startOf(a)!;
    const end = s.clone().add(a.duration_minutes || a.duration || 30, "minutes");
    return end.isAfter(now);
  });
  const next = upcoming[0];
  const later = upcoming.slice(1, 4);
  const checkedIn = appointments.filter(
    (a) => a.arrived || a.status === "in_progress"
  ).length;

  const personName = (a: Appointment) =>
    isPatient
      ? `Dr. ${a.doctor_name || a.provider_name || "—"}`
      : a.patient_name || "Unknown patient";

  const chip = (status: string) => {
    const st = STATUS_STYLE[status] || STATUS_STYLE.scheduled;
    return (
      <Text style={[styles.chip, { backgroundColor: st.bg, color: st.fg }]}>
        {st.label}
      </Text>
    );
  };

  const nextStart = next ? startOf(next)! : null;
  const minsAway = nextStart ? nextStart.diff(now, "minutes") : 0;
  const awayLabel =
    minsAway <= 0
      ? "Now"
      : minsAway < 60
      ? `In ${minsAway} min`
      : `In ${Math.floor(minsAway / 60)} h ${minsAway % 60} min`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.date}>{moment().format("dddd, MMM D")}</Text>
      <Text style={styles.greeting}>
        {greeting()}, {user?.firstName || user?.username}
      </Text>
      {!!user?.organization && <Text style={styles.org}>{user.organization}</Text>}

      {!isPatient && (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: "#1976d2" }]}>
              {appointments.length}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: "#1b6b2a" }]}>{checkedIn}</Text>
            <Text style={styles.statLabel}>Checked in</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.action, styles.actionPrimary]}
          onPress={() => router.push("/(tabs)/appointments")}
        >
          <Text style={styles.actionPrimaryText}>
            {isPatient ? "My appointments" : "New visit"}
          </Text>
        </TouchableOpacity>
        {canRegister && (
          <TouchableOpacity
            style={[styles.action, styles.actionSecondary]}
            onPress={() => router.push("/register-patient")}
          >
            <Text style={styles.actionSecondaryText}>Register patient</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.section}>Up next</Text>
      {loadingAppointments ? (
        <ActivityIndicator style={{ marginTop: 12 }} color="#1976d2" />
      ) : error ? (
        <Text style={styles.muted}>{error}</Text>
      ) : next && nextStart ? (
        <View style={styles.nextCard}>
          <View style={styles.nextTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextTime}>{nextStart.format("h:mm A")}</Text>
              <Text style={styles.nextName}>{personName(next)}</Text>
              <Text style={styles.nextMeta}>
                {[next.title, `${next.duration_minutes || next.duration || 30} min`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            <Text style={styles.awayChip}>{awayLabel}</Text>
          </View>
          {isStaff && (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => router.push("/(tabs)/my-schedule")}
            >
              <Text style={styles.nextBtnText}>Open My Day</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.muted}>
          {appointments.length ? "No more appointments today." : "No appointments scheduled for today."}
        </Text>
      )}

      {later.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.section}>Later today</Text>
            <TouchableOpacity
              onPress={() =>
                router.push(isStaff ? "/(tabs)/my-schedule" : "/(tabs)/appointments")
              }
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {later.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowTime}>{startOf(a)!.format("h:mm A")}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{personName(a)}</Text>
                {!!a.title && <Text style={styles.rowMeta}>{a.title}</Text>}
              </View>
              {chip(a.status)}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  date: { fontSize: 13, color: "#5b6670", fontWeight: "500" },
  greeting: { fontSize: 26, fontWeight: "700", color: "#11181C", marginTop: 2 },
  org: { fontSize: 13, color: "#5b6670", marginTop: 4 },
  stats: { flexDirection: "row", gap: 10, marginTop: 18 },
  stat: { flex: 1, backgroundColor: "#f5f7fa", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  statNum: { fontSize: 24, fontWeight: "700", color: "#11181C" },
  statLabel: { fontSize: 12, color: "#5b6670", fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  action: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionPrimary: { backgroundColor: "#1976d2" },
  actionPrimaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  actionSecondary: { backgroundColor: "#e8f1fb" },
  actionSecondaryText: { color: "#0d5cab", fontWeight: "600", fontSize: 14 },
  section: { fontSize: 13, fontWeight: "600", color: "#5b6670", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 22, marginBottom: 8 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  seeAll: { color: "#0d5cab", fontWeight: "600", fontSize: 13, paddingVertical: 8 },
  muted: { color: "#666", fontSize: 15, marginTop: 4 },
  nextCard: { borderWidth: 1.5, borderColor: "#1976d2", backgroundColor: "#f7fbff", borderRadius: 16, padding: 16 },
  nextTop: { flexDirection: "row", alignItems: "flex-start" },
  nextTime: { fontSize: 22, fontWeight: "700", color: "#1976d2" },
  nextName: { fontSize: 16, fontWeight: "600", color: "#11181C", marginTop: 2 },
  nextMeta: { fontSize: 13, color: "#5b6670", marginTop: 2 },
  awayChip: { backgroundColor: "#e3effc", color: "#0d5cab", fontSize: 12, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: "hidden" },
  nextBtn: { marginTop: 12, minHeight: 44, borderRadius: 10, backgroundColor: "#1976d2", alignItems: "center", justifyContent: "center" },
  nextBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#e3e8ee", borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 8 },
  rowTime: { width: 64, fontSize: 14, fontWeight: "700", color: "#1976d2" },
  rowName: { fontSize: 15, fontWeight: "600", color: "#11181C" },
  rowMeta: { fontSize: 12, color: "#5b6670" },
  chip: { fontSize: 11, fontWeight: "600", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
});
