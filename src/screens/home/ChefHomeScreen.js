import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Clipboard,
  Share,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { fetchFeedJobs, toggleSaveJob, fetchSavedJobs } from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";
import CallbackModal from "../../components/common/CallbackModal";

export default function ChefHomeScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { feedJobs, savedJobs, applyingJobId } = useSelector((state) => state.job);
  const [activeFilter, setActiveFilter] = useState("all");

  // Modals state
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Favorites, copy link states (local UI feedback overlays)
  const [favorites, setFavorites] = useState({});
  const [copiedJobId, setCopiedJobId] = useState(null);

  useEffect(() => {
    dispatch(fetchFeedJobs(activeFilter));
  }, [dispatch, activeFilter]);

  useEffect(() => {
    dispatch(fetchSavedJobs());
  }, [dispatch]);

  useEffect(() => {
    if (feedJobs) {
      const favs = {};
      feedJobs.forEach((job) => {
        const isSavedInList = (savedJobs || []).some((sj) => String(sj.id) === String(job.id));
        favs[job.id] = job.saved || job.is_saved || isSavedInList || false;
      });
      setFavorites(favs);
    }
  }, [feedJobs, savedJobs]);

  const toggleFavorite = async (id) => {
    const isFav = !favorites[id];
    setFavorites((prev) => ({ ...prev, [id]: isFav }));
    if (isFav) {
      Alert.alert("Liked", "Job added to your favorites list.");
    } else {
      Alert.alert("Removed", "Job removed from your favorites list.");
    }

    try {
      await dispatch(toggleSaveJob(id)).unwrap();
    } catch (error) {
      setFavorites((prev) => ({ ...prev, [id]: !isFav }));
      Alert.alert("Error", error || "Failed to save job.");
    }
  };

  const handleApplyPress = (job) => {
    setSelectedJob(job);
    setShowCallModal(true);
  };

  const copyToClipboard = (jobId) => {
    Clipboard.setString(`https://jobrito.com/jobs/${jobId}`);
    setCopiedJobId(jobId);
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  const handleCall = (job) => {
    const phoneNumber = job.creator?.mobile_number || job.mobile_number || job.phone || "+919876543210";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert("Error", "Could not open dialer: " + err.message);
    });
  };

  const handleShare = async (title, company) => {
    try {
      await Share.share({
        message: `Check out this opening on Jobrito: ${title} at ${company}!`,
      });
    } catch (error) {
      Alert.alert("Unable to share", "Please try again.");
    }
  };

  const formatPostedTime = (postedDate) => {
    if (!postedDate) return "Today";
    const posted = new Date(postedDate);
    if (Number.isNaN(posted.getTime())) return "Today";
    const diffMs = Date.now() - posted.getTime();
    const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const filters = [
    { label: t("filters.all", "All"), value: "all" },
    { label: t("filters.india", "India Jobs"), value: "india" },
    { label: t("filters.overseas", "Overseas Jobs"), value: "overseas" },
    { label: t("filters.training", "Training Opportunities"), value: "training" },
    { label: t("filters.referral", "Referral Opportunities"), value: "referral" },
    { label: t("filters.community", "Community Job Posts"), value: "community" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header (DO NOT TOUCH THIS) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.communityAvatar}>
            <Text style={styles.avatarText}>J</Text>
          </View>
          <View>
            <Text style={styles.communityName}>Jobrito Community</Text>
            <Text style={styles.memberCount}>8,421 members</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => Alert.alert("Options", "Jobrito Community options")}>
          <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Filter Timeline Bar */}
      <View style={styles.filterBar}>
        <Ionicons name="pin" size={18} color="#15803D" style={styles.pinIcon} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {filters.map((f) => {
            const isSelected = activeFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setActiveFilter(f.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Feed Content */}
      <ScrollView contentContainerStyle={styles.feedScroll} showsVerticalScrollIndicator={false}>
        {/* Today separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorBadge}>
            <Text style={styles.separatorText}>TODAY</Text>
          </View>
          <View style={styles.separatorLine} />
        </View>

        {feedJobs.map((job) => {
          const isFav = favorites[job.id] || false;
          const isApplied = job.applied || false;
          const isApplying = applyingJobId === job.id;
          const isCopied = copiedJobId === job.id;
          const isPinned = job.is_pinned || false;

          const isReferral = job.category === "referral";
          const hasMultipleActions = job.category === "overseas";

          return (
            <View key={job.id} style={[styles.card, isPinned && styles.pinnedCard]}>
              {/* Pinned label indicator */}
              {isPinned && (
                <View style={styles.pinnedIndicator}>
                  <Ionicons name="pin" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.pinnedLabelText}>Pinned</Text>
                </View>
              )}

              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  {isReferral ? (
                    <Text style={styles.referralHeader}>Referral Job Post</Text>
                  ) : (
                    <Text style={styles.employerNameGreen}>{job.company}</Text>
                  )}
                  <Text style={styles.jobTitle}>{job.title}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(job.id)} style={styles.favBtn}>
                  <Ionicons
                    name={isFav ? "star" : "star-outline"}
                    size={22}
                    color={isFav ? "#EAB308" : "#94A3B8"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color="#64748B" />
                  <Text style={styles.detailText}>Location: {job.location}</Text>
                </View>
                {job.salary && (
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>Salary: {job.salary}</Text>
                  </View>
                )}
                {job.experience && (
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>Contract: {job.experience}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.jobDescription}>{job.description}</Text>

              {/* Action buttons rendering */}
              {isReferral ? (
                <View style={styles.twoActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnLight}
                    onPress={() => handleCall(job)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={16} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnTextGreen}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnLight}
                    onPress={() => handleShare(job.title, job.company)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social" size={16} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnTextGreen}>Share</Text>
                  </TouchableOpacity>
                </View>
              ) : hasMultipleActions ? (
                <View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.applyBtn, isApplied && styles.appliedBtn]}
                      onPress={() => (isApplied || isApplying ? null : handleApplyPress(job))}
                      disabled={isApplied || isApplying}
                      activeOpacity={0.7}
                    >
                      {isApplying ? (
                        <ActivityIndicator size="small" color="#15803D" />
                      ) : (
                        <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                          {isApplied ? "✓ Applied" : "Apply Now"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.twoActionsRow, { marginTop: 12 }]}>
                    <TouchableOpacity
                      style={[styles.actionBtnLight, { backgroundColor: "#F1F5F9" }]}
                      onPress={() => handleCall(job)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={16} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnTextGrey}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnLight, { backgroundColor: "#F1F5F9" }]}
                      onPress={() => handleShare(job.title, job.company)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-social" size={16} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnTextGrey}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.applyBtn, isApplied && styles.appliedBtn]}
                      onPress={() => (isApplied || isApplying ? null : handleApplyPress(job))}
                      disabled={isApplied || isApplying}
                      activeOpacity={0.7}
                    >
                      {isApplying ? (
                        <ActivityIndicator size="small" color="#15803D" />
                      ) : (
                        <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                          {isApplied ? "✓ Applied" : "Apply Now"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.linkCopiedBox} onPress={() => copyToClipboard(job.id)}>
                    <Ionicons name="link" size={16} color="#64748B" />
                    <Text style={styles.linkCopiedText}>
                      {isCopied ? "Link copied" : "Copy job link"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.timeText}>{formatPostedTime(job.postedDate)}</Text>
            </View>
          );
        })}

        {/* Bottom banner warning/informational */}
        <View style={styles.bottomBanner}>
          <Ionicons name="sync" size={18} color="#0284C7" style={{ marginRight: 10 }} />
          <Text style={styles.bottomBannerText}>
            Keep checking the feed regularly for new updates
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert("Create Post", "Write a new job alert or community discussion post.")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CallbackModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={async (timeSlot) => {
          if (selectedJob) {
            try {
              await dispatch(applyJob({ jobId: selectedJob.id, preferredCallTime: timeSlot })).unwrap();
              return true;
            } catch (err) {
              Alert.alert("Application Error", err || "Failed to apply to job");
              return false;
            }
          }
          return false;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  communityName: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0F172A",
  },
  memberCount: {
    fontSize: 12,
    color: "#64748B",
  },
  headerRight: {
    padding: 6,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  pinIcon: {
    marginRight: 12,
  },
  filterPills: {
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillSelected: {
    backgroundColor: "#15803D",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  filterPillTextSelected: {
    color: "#FFFFFF",
  },
  feedScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 80,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  separatorBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  separatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  pinnedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  pinnedLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  employerNameGreen: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 2,
  },
  referralHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0F172A",
  },
  favBtn: {
    padding: 2,
  },
  detailsBlock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "550",
  },
  jobDescription: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  appliedBtn: {
    backgroundColor: "#E2E8F0",
    borderColor: "#CBD5E1",
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
  },
  appliedBtnText: {
    color: "#64748B",
  },
  twoActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionBtnLight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  actionBtnTextGreen: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
  },
  actionBtnTextGrey: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  linkCopiedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  linkCopiedText: {
    fontSize: 12,
    fontWeight: "650",
    color: "#475569",
  },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 4,
  },
  bottomBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    padding: 12,
    justifyContent: "center",
    marginTop: 8,
  },
  bottomBannerText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 20,
  },
  slotsList: {
    gap: 10,
    marginBottom: 20,
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  slotItemSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#F2FBF5",
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  slotLabelTextSelected: {
    color: "#15803D",
    fontWeight: "700",
  },
  modalConfirmBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 8,
  },
  modalConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalSkipBtn: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  starActionBtn: {
    width: 44,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});