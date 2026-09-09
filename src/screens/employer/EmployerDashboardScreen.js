import React, { useEffect, useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, RefreshControl } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import StatusBadge from "../../components/common/StatusBadge";
import colors from "../../constants/colors";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { fetchProfile } from "../../redux/slices/userSlice";
import AppButton from "../../components/buttons/AppButton";

export default function EmployerDashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { stats, submittedJobs } = useSelector((state) => state.employer);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.allSettled([
      dispatch(fetchEmployerDashboard()),
      dispatch(fetchProfile()),
    ]);
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#6366f1"]}
          tintColor="#6366f1"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("employerDashboardTitle", "Employer Dashboard")}</Text>
        <Text style={styles.subtitle}>{t("employerDashboardSubtitle", "Review job submissions and applicant progress.")}</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <DashboardStatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <View style={{ gap: 12 }}>
        {submittedJobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.meta}>{job.location}</Text>
              </View>
              <StatusBadge status={job.status} />
            </View>
            <Text style={styles.meta}>{t("applicants", "Applicants")}: {job.applicants}</Text>
            <AppButton
              title={t("viewApplicants", "View Applicants")}
              onPress={() => navigation.navigate("ApplicantList", { jobId: job.id, jobTitle: job.title })}
            />
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  jobTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: colors.mutedText,
    fontSize: 13,
  },
});
