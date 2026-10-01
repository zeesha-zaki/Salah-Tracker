import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View
} from "react-native";

import { calculateStats, Stats } from "./src/analytics";
import {
  addDays,
  dateToKey,
  formatDate,
  formatShortDate,
  isToday,
  keyToDate,
  monthLabel
} from "./src/dateUtils";
import { getDay, loadRecords, saveRecords, updatePrayer } from "./src/storage";
import { PRAYERS, PrayerId, PrayerStatus, Records } from "./src/types";

type Tab = "today" | "stats";

const STATUS_ORDER: (PrayerStatus | null)[] = [null, "prayed", "delayed", "missed"];

const STATUS_META: Record<
  PrayerStatus,
  { label: string; icon: string; color: string; background: string }
> = {
  prayed: {
    label: "Prayed",
    icon: "✓",
    color: "#3F7655",
    background: "#E3F1E7"
  },
  delayed: {
    label: "Delayed",
    icon: "◷",
    color: "#A66A00",
    background: "#FFF0D2"
  },
  missed: {
    label: "Missed",
    icon: "×",
    color: "#B44A4A",
    background: "#F8E2E2"
  }
};

const EXEMPT_META = {
  label: "Exempt",
  icon: "—",
  color: "#76668E",
  background: "#EEE9F4"
};

function cycleStatus(current: PrayerStatus | null): PrayerStatus {
  const index = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length] as PrayerStatus;
}

export default function App() {
  const systemDark = useColorScheme() === "dark";
  const [records, setRecords] = useState<Records>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tab, setTab] = useState<Tab>("today");
  const [statsMode, setStatsMode] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);

  // Calm, neutral palette that automatically adapts to Android light/dark mode.
  const colors = useMemo(
    () =>
      systemDark
        ? {
            background: "#111512",
            card: "#1B211D",
            text: "#F1F4F0",
            muted: "#AEB7AF",
            border: "#303930",
            sage: "#8DB49A",
            sageDark: "#233B2C",
            tab: "#252D27"
          }
        : {
            background: "#F5F7F5",
            card: "#FFFFFF",
            text: "#1E2520",
            muted: "#6C756E",
            border: "#E2E7E2",
            sage: "#477A5A",
            sageDark: "#E5F0E8",
            tab: "#E8ECE8"
          },
    [systemDark]
  );

  const dateKey = dateToKey(selectedDate);
  const day = getDay(records, dateKey);

  useEffect(() => {
    loadRecords().then((loaded) => {
      setRecords(loaded);
      setLoading(false);
    });
  }, []);

  const persist = async (next: Records) => {
    setRecords(next);
    await saveRecords(next);
  };

  const setPrayerStatus = async (prayer: PrayerId) => {
    if (day.exempt) return;

    const nextStatus = cycleStatus(day.prayers[prayer]);
    const next = updatePrayer(records, dateKey, prayer, nextStatus);
    await persist(next);
  };

  const setExempt = async (value: boolean) => {
    const next: Records = {
      ...records,
      [dateKey]: {
        ...day,
        exempt: value
      }
    };
    await persist(next);
  };

  const stats = calculateStats(records, statsMode, selectedDate);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.sage} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Loading your local tracker…
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={systemDark ? "light-content" : "dark-content"} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.appTitle, { color: colors.text }]}>Salah Tracker</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Simple. Private. Offline.
            </Text>
          </View>
        </View>

        {tab === "today" ? (
          <Dashboard
            colors={colors}
            selectedDate={selectedDate}
            day={day}
            onPrevious={() => setSelectedDate((d) => addDays(d, -1))}
            onNext={() => setSelectedDate((d) => addDays(d, 1))}
            onToday={() => setSelectedDate(new Date())}
            onPrayer={setPrayerStatus}
            onExempt={setExempt}
          />
        ) : (
          <StatsScreen
            colors={colors}
            stats={stats}
            mode={statsMode}
            setMode={setStatsMode}
            anchorDate={selectedDate}
          />
        )}

        <View style={[styles.bottomTabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TabButton
            label="Today"
            icon="☀"
            active={tab === "today"}
            colors={colors}
            onPress={() => setTab("today")}
          />
          <TabButton
            label="Stats"
            icon="◔"
            active={tab === "stats"}
            colors={colors}
            onPress={() => setTab("stats")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Dashboard({
  colors,
  selectedDate,
  day,
  onPrevious,
  onNext,
  onToday,
  onPrayer,
  onExempt
}: {
  colors: Record<string, string>;
  selectedDate: Date;
  day: ReturnType<typeof getDay>;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onPrayer: (id: PrayerId) => void;
  onExempt: (value: boolean) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dateRow}>
        <Pressable
          accessibilityLabel="Previous day"
          style={[styles.arrowButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onPrevious}
        >
          <Text style={[styles.arrow, { color: colors.text }]}>‹</Text>
        </Pressable>

        <Pressable onPress={onToday} style={styles.dateCenter}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {isToday(selectedDate) ? "Today" : formatShortDate(selectedDate)}
          </Text>
          <Text style={[styles.fullDate, { color: colors.muted }]}>
            {formatDate(selectedDate)}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Next day"
          style={[styles.arrowButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onNext}
        >
          <Text style={[styles.arrow, { color: colors.text }]}>›</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.exemptionCard,
          {
            backgroundColor: day.exempt ? "#EEE9F4" : colors.card,
            borderColor: day.exempt ? "#D8CDE5" : colors.border
          }
        ]}
      >
        <View style={styles.exemptionText}>
          <Text style={[styles.exemptionTitle, { color: colors.text }]}>
            Exemption Period
          </Text>
          <Text style={[styles.exemptionDescription, { color: colors.muted }]}>
            Mark this day as exempt. Prayer entries will be locked and excluded from stats.
          </Text>
        </View>
        <Switch
          value={day.exempt}
          onValueChange={onExempt}
          trackColor={{ false: colors.border, true: "#BDAFCF" }}
          thumbColor={day.exempt ? "#76668E" : "#FFFFFF"}
          accessibilityLabel="Exemption Period"
        />
      </View>

      {day.exempt && (
        <View style={[styles.infoBanner, { backgroundColor: colors.sageDark }]}>
          <Text style={[styles.infoText, { color: colors.sage }]}>
            This day is exempt. All five prayers are excluded from your statistics.
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily prayers</Text>

      {PRAYERS.map((prayer) => {
        const status = day.prayers[prayer.id];

        return (
          <PrayerCard
            key={prayer.id}
            name={prayer.name}
            status={status}
            exempt={day.exempt}
            colors={colors}
            onPress={() => onPrayer(prayer.id)}
          />
        );
      })}
    </ScrollView>
  );
}

function PrayerCard({
  name,
  status,
  exempt,
  colors,
  onPress
}: {
  name: string;
  status: PrayerStatus | null;
  exempt: boolean;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  const meta = exempt ? EXEMPT_META : status ? STATUS_META[status] : null;

  return (
    <Pressable
      disabled={exempt}
      onPress={onPress}
      style={({ pressed }) => [
        styles.prayerCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed && !exempt ? 0.75 : 1
        }
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${meta?.label ?? "Not logged"}`}
    >
      <View>
        <Text style={[styles.prayerName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.tapHint, { color: colors.muted }]}>
          {exempt ? "Excluded from statistics" : "Tap to change status"}
        </Text>
      </View>

      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: meta?.background ?? colors.tab
          }
        ]}
      >
        <Text
          style={[
            styles.statusIcon,
            { color: meta?.color ?? colors.muted }
          ]}
        >
          {meta?.icon ?? "•"}
        </Text>
        <Text style={[styles.statusLabel, { color: meta?.color ?? colors.muted }]}>
          {meta?.label ?? "Not logged"}
        </Text>
      </View>
    </Pressable>
  );
}

function StatsScreen({
  colors,
  stats,
  mode,
  setMode,
  anchorDate
}: {
  colors: Record<string, string>;
  stats: Stats;
  mode: "week" | "month";
  setMode: (mode: "week" | "month") => void;
  anchorDate: Date;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.statsHeading, { color: colors.text }]}>Your progress</Text>
      <Text style={[styles.statsSubheading, { color: colors.muted }]}>
        {mode === "week" ? "Current week" : monthLabel(anchorDate)}
      </Text>

      <View style={[styles.segment, { backgroundColor: colors.tab }]}>
        <SegmentButton
          label="Week"
          active={mode === "week"}
          colors={colors}
          onPress={() => setMode("week")}
        />
        <SegmentButton
          label="Month"
          active={mode === "month"}
          colors={colors}
          onPress={() => setMode("month")}
        />
      </View>

      <View style={[styles.bigStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.bigNumber, { color: colors.text }]}>
          {Math.round(stats.prayedPct)}%
        </Text>
        <Text style={[styles.bigLabel, { color: colors.muted }]}>Prayed on time</Text>
        <ProgressBar value={stats.prayedPct} color="#477A5A" background={colors.tab} />
        <Text style={[styles.denominator, { color: colors.muted }]}>
          {stats.eligible} eligible prayers · {stats.checkedDays} checked day{stats.checkedDays === 1 ? "" : "s"}
        </Text>
      </View>

      <StatRow
        label="Prayed on time"
        count={stats.prayed}
        percentage={stats.prayedPct}
        color="#477A5A"
        colors={colors}
      />
      <StatRow
        label="Delayed"
        count={stats.delayed}
        percentage={stats.delayedPct}
        color="#A66A00"
        colors={colors}
      />
      <StatRow
        label="Missed"
        count={stats.missed}
        percentage={stats.missedPct}
        color="#B44A4A"
        colors={colors}
      />

      <View style={[styles.exemptSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.exemptSummaryTitle, { color: colors.text }]}>Exempt prayers</Text>
        <Text style={[styles.exemptSummaryCount, { color: "#76668E" }]}>
          {stats.exempt}
        </Text>
        <Text style={[styles.exemptSummaryHint, { color: colors.muted }]}>
          Exempt prayers are removed from the calculation entirely — they never count as missed.
        </Text>
      </View>

      <View style={[styles.formulaCard, { backgroundColor: colors.sageDark }]}>
        <Text style={[styles.formulaTitle, { color: colors.text }]}>How the percentage works</Text>
        <Text style={[styles.formula, { color: colors.muted }]}>
          Prayed ÷ ((checked days × 5) − exempt prayers)
        </Text>
      </View>
    </ScrollView>
  );
}

function StatRow({
  label,
  count,
  percentage,
  color,
  colors
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={[styles.statRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statRowTop}>
        <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{Math.round(percentage)}%</Text>
      </View>
      <ProgressBar value={percentage} color={color} background={colors.tab} />
      <Text style={[styles.countText, { color: colors.muted }]}>
        {count} prayer{count === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

function ProgressBar({
  value,
  color,
  background
}: {
  value: number;
  color: string;
  background: string;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: background }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }
        ]}
      />
    </View>
  );
}

function SegmentButton({
  label,
  active,
  colors,
  onPress
}: {
  label: string;
  active: boolean;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        active && { backgroundColor: colors.card }
      ]}
    >
      <Text style={[styles.segmentText, { color: active ? colors.text : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TabButton({
  label,
  icon,
  active,
  colors,
  onPress
}: {
  label: string;
  icon: string;
  active: boolean;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && { backgroundColor: colors.sageDark }]}
    >
      <Text style={[styles.tabIcon, { color: active ? colors.sage : colors.muted }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { color: active ? colors.sage : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18 },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  appTitle: { fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { marginTop: 2, fontSize: 13 },
  scrollContent: { paddingTop: 10, paddingBottom: 120 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  arrow: { fontSize: 32, lineHeight: 34, fontWeight: "300" },
  dateCenter: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  dateText: { fontSize: 19, fontWeight: "750" },
  fullDate: { fontSize: 12, marginTop: 2, textAlign: "center" },
  exemptionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center"
  },
  exemptionText: { flex: 1, paddingRight: 12 },
  exemptionTitle: { fontSize: 16, fontWeight: "750" },
  exemptionDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  infoBanner: { borderRadius: 13, padding: 12, marginTop: 10 },
  infoText: { fontSize: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "750", marginTop: 22, marginBottom: 9 },
  prayerCard: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  prayerName: { fontSize: 16, fontWeight: "700" },
  tapHint: { fontSize: 11, marginTop: 4 },
  statusPill: {
    minWidth: 106,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  statusIcon: { fontSize: 18, fontWeight: "800", marginRight: 6 },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  bottomTabs: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    padding: 6
  },
  tabButton: {
    flex: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  tabIcon: { fontSize: 17 },
  tabLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  statsHeading: { fontSize: 24, fontWeight: "800", marginTop: 8 },
  statsSubheading: { fontSize: 13, marginTop: 3, marginBottom: 15 },
  segment: {
    height: 44,
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    marginBottom: 14
  },
  segmentButton: {
    flex: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentText: { fontSize: 13, fontWeight: "700" },
  bigStatCard: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: "center" },
  bigNumber: { fontSize: 42, fontWeight: "850", letterSpacing: -1 },
  bigLabel: { fontSize: 13, marginTop: -1, marginBottom: 17 },
  denominator: { fontSize: 11, marginTop: 10 },
  progressTrack: { width: "100%", height: 8, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  statRow: { borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 10 },
  statRowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
  statLabel: { fontSize: 14, fontWeight: "700" },
  statValue: { fontSize: 14, fontWeight: "800" },
  countText: { fontSize: 11, marginTop: 7 },
  exemptSummary: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 10 },
  exemptSummaryTitle: { fontSize: 14, fontWeight: "700" },
  exemptSummaryCount: { fontSize: 28, fontWeight: "850", marginTop: 2 },
  exemptSummaryHint: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  formulaCard: { borderRadius: 18, padding: 16, marginTop: 10 },
  formulaTitle: { fontSize: 13, fontWeight: "750" },
  formula: { fontSize: 12, lineHeight: 18, marginTop: 5 }
});
