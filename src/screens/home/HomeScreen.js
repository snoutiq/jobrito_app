import React, { useEffect, useLayoutEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import JobCard from "../../components/cards/JobCard";
import colors from "../../constants/colors";
import { fetchFeedJobs } from "../../redux/slices/jobSlice";

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { feedJobs } = useSelector((state) => state.job);
  const { profile } = useSelector((state) => state.user);
  const activeRole = useSelector((state) => state.auth.user?.active_role);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activePage, setActivePage] = useState(1);

  const filters = [
    { label: t("home.filters.all"), value: "All" },
    { label: t("home.filters.india"), value: "India Jobs" },
    { label: t("home.filters.overseas"), value: "Overseas Jobs" },
    { label: t("home.filters.training"), value: "Training Opportunities" },
    { label: t("home.filters.referrals"), value: "Referral Opportunities" },
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.brandWrap}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>J</Text>
          </View>
          <Text style={styles.brandText}>JobRito</Text>
        </View>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("Profile")}
          hitSlop={10}
          style={styles.menuButton}
        >
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation]);

  console.log("HomeScreen data:", {
    activeRole,
    profile,
    activeFilter,
  });

  useEffect(() => {
    dispatch(fetchFeedJobs(activeFilter));
  }, [activeFilter, dispatch]);

  return (
    <ScreenWrapper contentStyle={styles.content}>
      <View style={styles.paginationWrap}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Pressable
            key={item}
            style={[
              styles.pageCircle,
              activePage === item && styles.pageCircleActive,
            ]}
            onPress={() => setActivePage(item)}
          >
            <Text
              style={[
                styles.pageText,
                activePage === item && styles.pageTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.jobList}>
        {feedJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onPress={() => navigation.navigate("JobDetails", { jobId: job.id })}
          />
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
    paddingTop: 0,
    gap: 14,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandIconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F6FB",
    marginRight: 4,
  },
  paginationWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#D8D8D8",
  },
  pageCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  pageCircleActive: {
    backgroundColor: "#0A7B32",
  },
  pageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  pageTextActive: {
    color: "#fff",
  },
  sectionHeader: {
    alignItems: "center",
  },
  sectionLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
  },
  filters: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  filterDotActive: {
    backgroundColor: "#fff",
  },
  filterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  filterTextActive: {
    color: "#fff",
  },
  jobList: {
    gap: 18,
  },
});
