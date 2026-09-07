import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import EmptyState from "../../components/common/EmptyState";
import { fetchApplicationHistory } from "../../redux/slices/applicationSlice";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const formatAppliedTime = (appliedOn, t) => {
  if (!appliedOn) return t("applications.recently", "Recently");
  const date = new Date(appliedOn);
  if (Number.isNaN(date.getTime())) return t("applications.recently", "Recently");

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return t("applications.today", "Today");
  if (diffDays === 1) return t("applications.yesterday", "Yesterday");
  if (diffDays < 7) return t("applications.daysAgo", "{{count}} days ago", { count: diffDays });
  if (diffDays >= 7 && diffDays < 14) return t("applications.weeksAgo", "1 week ago");

  const options = { day: "numeric", month: "short" };
  return date.toLocaleDateString("en-US", options);
};

const getDisplayStatusText = (statusStr, t) => {
  if (!statusStr) return t("status.applied", "APPLIED");
  const s = statusStr.toUpperCase().trim();
  if (s === "APPLIED") return t("status.applied", "APPLIED");
  if (s === "NEW" || s === "UNDER REVIEW" || s === "UNDER_REVIEW") {
    return t("status.underReview", "UNDER REVIEW");
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return t("status.notAMatch", "NOT A MATCH");
  }
  if (s === "SHORTLISTED") return t("status.shortlisted", "SHORTLISTED");
  if (s === "CONTACTED") return t("status.contacted", "CONTACTED");
  if (s === "JOB CLOSED") return t("status.jobClosed", "JOB CLOSED");
  return t(`status.${s.toLowerCase()}`, s);
};

const getStatusBadgeStyle = (statusStr) => {
  if (!statusStr) return { bg: "#eff6ff", text: "#153e69" };
  const s = statusStr.toUpperCase().trim();
  if (s === "APPLIED") return { bg: "#eff6ff", text: "#153e69" };
  if (s === "NEW" || s === "UNDER REVIEW" || s === "UNDER_REVIEW") {
    return { bg: "#fff7ed", text: "#ea580c" };
  }
  if (s === "SHORTLISTED" || s === "CONTACTED") {
    return { bg: "#f0fdf4", text: "#16a34a" };
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return { bg: "#fef2f2", text: "#dc2626" };
  }
  return { bg: "#f1f5f9", text: "#64748b" };
};

export default function ApplicationHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.user || state.user?.profile);
  const { history, loading } = useSelector((state) => state.application);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchApplicationHistory(user?.id));
  }, [dispatch, user?.id]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) => {
      const jobObj = item.job || {};
      const title = String(item.title || jobObj.title || "").toLowerCase();
      const company = String(item.employer || jobObj.company || "").toLowerCase();
      const location = String(item.location || jobObj.location || "").toLowerCase();

      return (
        title.includes(query) ||
        company.includes(query) ||
        location.includes(query)
      );
    });
  }, [history, search]);

  const renderItem = ({ item }) => {
    const jobObj = item.job || {};
    const titleText = item.title || jobObj.title || "Job Opportunity";
    const companyText = item.employer || jobObj.company || "Sheriff’s Kitchen";
    const locationText = item.location || jobObj.location || "Mapusa, Goa, India";
    const appliedTimeText = formatAppliedTime(item.appliedOn || item.applied_at || item.created_at, t);

    const displayStatus = getDisplayStatusText(item.status || "APPLIED", t);
    const badgeStyle = getStatusBadgeStyle(item.status || "APPLIED");

    const jobType =
      jobObj.job_type ||
      item.job_type ||
      (jobObj.is_training ? "Training / Program" : "Full-Time");

    const isTraining = Boolean(jobObj.is_training || jobObj.category === "training" || item.is_training || item.category === "training");

    const rawSecText = String(
      jobObj.salary ||
      item.salary ||
      jobObj.experience_range ||
      item.experience_range ||
      ""
    ).trim();

    const secondaryPillText = (!rawSecText || rawSecText.toLowerCase().includes("stipend"))
      ? t("bestInIndustry", "Best in Industry")
      : rawSecText;

    const secondaryPillIcon = "wallet-outline";

    const appIdStr = `#${item.id || item.application_id || "123456"}`;

    return (
      <Pressable
        onPress={() => {
          navigation.navigate("ApplicationJobDetails", {
            jobId: item.jobId || item.job?.id || item.job_id || item.id,
            job: item.job,
            application: item,
          });
        }}
        style={styles.jobCard}
      >
        {/* Card Header Row */}
        <View style={styles.cardHeaderRow}>
          {/* Title & Company Info */}
          <View style={styles.titleTextWrap}>
            <Text style={styles.jobTitleText} numberOfLines={1}>
              {titleText}
            </Text>

            {!isTraining && (
              <View style={styles.companyRow}>
                <Text style={styles.companyNameText} numberOfLines={1}>
                  {companyText}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={normalize(14)}
                  color="#153e69"
                  style={{ marginLeft: normalize(3) }}
                />
              </View>
            )}

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={normalize(12)} color="#64748b" />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText} • {appliedTimeText}
              </Text>
            </View>
          </View>

          {/* Status Badge Pill */}
          <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        {/* Tag Pills Row */}
        <View style={styles.pillsRow}>
          <View style={styles.tagPill}>
            <Ionicons
              name={isTraining ? "book-outline" : "briefcase-outline"}
              size={normalize(13)}
              color="#475569"
            />
            <Text style={styles.tagPillText}>{jobType}</Text>
          </View>

          {!isTraining && (
            <View style={styles.tagPill}>
              <Ionicons name={secondaryPillIcon} size={normalize(13)} color="#475569" />
              <Text style={styles.tagPillText}>{secondaryPillText}</Text>
            </View>
          )}
        </View>

        {/* Card Bottom Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.appIdText}>
            {t("applicationId", "Application ID")}: {appIdStr}
          </Text>

          <TouchableOpacity
            style={styles.viewDetailsBtn}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate("ApplicationJobDetails", {
                jobId: item.jobId || item.job?.id || item.job_id || item.id,
                job: item.job,
                application: item,
              });
            }}
          >
            <Text style={styles.viewDetailsBtnText}>
              {t("viewDetails", "View Details")}
            </Text>
            <Ionicons name="arrow-forward" size={normalize(14)} color="#153e69" />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={normalize(22)} color="#0f2942" />
          </TouchableOpacity>

          <View style={[styles.headerTitleWrap, { alignItems: "center" }]}>
            <Text style={[styles.mainTitle, { textAlign: "center" }]}>{t("myApplications", "My Applications")}</Text>
            <Text style={[styles.subTitle, { textAlign: "center" }]}>
              {t("trackJobsSubtitle", "Track jobs you have applied for")}
            </Text>
          </View>
          <View style={{ width: normalize(22) }} />
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={normalize(18)} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("searchApplications", "Search applications")}
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={normalize(16)} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main List Area */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={
            <EmptyState
              title={loading ? t("loading", "Loading...") : t("noApplicationsFound", "No applications found")}
              subtitle={
                loading
                  ? t("pleaseWait", "Please wait...")
                  : search
                  ? t("tryChangingSearch", "Try changing your search query.")
                  : t("appliedJobsShowHere", "Your applied jobs will show up here.")
              }
            />
          }
          ListFooterComponent={
            <View style={styles.noticeBox}>
              <Ionicons
                name="information-circle"
                size={normalize(24)}
                color="#153e69"
                style={{ marginTop: 1 }}
              />
              <View style={styles.noticeTextWrap}>
                <Text style={styles.noticeTitle}>
                  {t("cantFindApplication", "Can't find an application?")}
                </Text>
                <Text style={styles.noticeSub}>
                  {t("makeSureLoggedIn", "Make sure you're logged in with the correct account.")}
                </Text>
              </View>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },

  // Top Header
  topHeader: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  backBtn: {
    padding: normalize(2),
  },
  headerTitleWrap: {
    flex: 1,
  },
  mainTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f2942",
    letterSpacing: 0.2,
  },
  subTitle: {
    fontSize: normalize(12),
    color: "#64748b",
    fontWeight: "500",
    marginTop: normalize(1),
  },

  // Search
  searchSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchBarContainer: {
    height: normalize(44),
    backgroundColor: "#f8fafc",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(12),
    gap: normalize(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(13),
    color: "#0f2942",
    paddingVertical: 0,
  },

  // List Content
  listContentContainer: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(12),
    paddingBottom: normalize(40),
    gap: normalize(12),
  },

  // Card Styles
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    borderWidth: 1,
    borderColor: "#eaedf1",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(12),
  },
  titleTextWrap: {
    flex: 1,
  },
  jobTitleText: {
    fontSize: normalize(15.5),
    fontWeight: "800",
    color: "#0f2942",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(2),
  },
  companyNameText: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: "#475569",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
    marginTop: normalize(4),
  },
  locationText: {
    fontSize: normalize(11.5),
    color: "#64748b",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(12),
  },
  statusBadgeText: {
    fontSize: normalize(10.5),
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // Pills Row
  pillsRow: {
    flexDirection: "row",
    gap: normalize(8),
    marginTop: normalize(12),
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    backgroundColor: "#f8fafc",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
  },
  tagPillText: {
    fontSize: normalize(11.5),
    fontWeight: "600",
    color: "#475569",
  },

  // Card Bottom Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: normalize(14),
    paddingTop: normalize(10),
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  appIdText: {
    fontSize: normalize(11.5),
    color: "#64748b",
    fontWeight: "500",
  },
  viewDetailsBtn: {
    height: normalize(34),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(10),
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#153e69",
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  viewDetailsBtnText: {
    fontSize: normalize(12.5),
    fontWeight: "800",
    color: "#153e69",
  },

  // Notice Box
  noticeBox: {
    backgroundColor: "#eff6ff",
    borderRadius: normalize(14),
    padding: normalize(14),
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: normalize(10),
    marginTop: normalize(8),
  },
  noticeTextWrap: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0f2942",
    marginBottom: normalize(2),
  },
  noticeSub: {
    fontSize: normalize(11.5),
    color: "#475569",
    fontWeight: "500",
  },
});
