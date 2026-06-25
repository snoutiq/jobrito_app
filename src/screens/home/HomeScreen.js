import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Clipboard,
  Pressable,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { fetchFeedJobs } from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { feedJobs } = useSelector((state) => state.job);
  const [activePage, setActivePage] = useState(1);

  // Modals state
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("morning");

  // Favorites, applied, copy link states (local UI feedback overlays)
  const [favorites, setFavorites] = useState({});
  const [appliedJobs, setAppliedJobs] = useState({});
  const [copiedJobId, setCopiedJobId] = useState(null);

  const timeSlots = [
    { id: "morning", label: "Morning: 9 AM - 12 PM", icon: "sunny-outline" },
    { id: "afternoon", label: "Afternoon: 12 PM - 3 PM", icon: "sunny" },
    { id: "late_afternoon", label: "Late Afternoon: 3 PM - 6 PM", icon: "partly-sunny-outline" },
    { id: "evening", label: "Evening: 6 PM - 9 PM", icon: "moon-outline" },
  ];

  // Set original header configuration (DO NOT touch this header layout)
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

  useEffect(() => {
    dispatch(fetchFeedJobs("All"));
  }, [dispatch]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const isFav = !prev[id];
      if (isFav) {
        Alert.alert("Liked", "Job added to your favorites list.");
      }
      return { ...prev, [id]: isFav };
    });
  };

  const handleApplyPress = (job) => {
    setSelectedJob(job);
    setSelectedTimeSlot("morning"); // Reset default
    setShowCallModal(true);
  };

  const handleConfirmTime = async () => {
    if (!selectedJob) return;
    
    // Dispatch apply to backend with preferred call time slot
    dispatch(applyJob({ jobId: selectedJob.id, preferredCallTime: selectedTimeSlot }));
    
    // Mark as locally applied
    setAppliedJobs((prev) => ({ ...prev, [selectedJob.id]: true }));
    
    setShowCallModal(false);
    setShowSuccessModal(true);
  };

  const handleSkipTime = () => {
    if (!selectedJob) return;

    // Dispatch apply with "not_specified" preference
    dispatch(applyJob({ jobId: selectedJob.id, preferredCallTime: "not_specified" }));
    
    // Mark as locally applied
    setAppliedJobs((prev) => ({ ...prev, [selectedJob.id]: true }));
    
    setSelectedTimeSlot("not_specified");
    setShowCallModal(false);
    setShowSuccessModal(true);
  };

  const copyToClipboard = (jobId) => {
    Clipboard.setString(`https://jobrito.com/jobs/${jobId}`);
    setCopiedJobId(jobId);
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  const handleCall = (company) => {
    Alert.alert("Dialing...", `Calling recruiting partner of ${company} at +91 98765 43210`);
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

  const getSlotLabel = (slotId) => {
    if (slotId === "not_specified") return "your preferred time";
    const slot = timeSlots.find((s) => s.id === slotId);
    return slot ? slot.label : "your preferred time";
  };

  return (
    <ScreenWrapper contentStyle={styles.content}>
      {/* Pagination timeline bar with pin icon */}
      <View style={styles.filterBar}>
        <Ionicons name="pin" size={18} color="#15803D" style={styles.pinIcon} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {[1, 2, 3, 4, 5].map((num) => {
            const isSelected = activePage === num;
            return (
              <TouchableOpacity
                key={num}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setActivePage(num)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* JobList feed */}
      <ScrollView contentContainerStyle={styles.feedScroll} showsVerticalScrollIndicator={false}>

        {feedJobs.map((job) => {
          const isFav = favorites[job.id] || false;
          const isApplied = appliedJobs[job.id] || false;
          const isCopied = copiedJobId === job.id;
          const isPinned = job.is_pinned || false;

          // Grand Hyatt and Global Talent are "Apply" jobs. Bombay Cafe is "Call & Share" referral.
          const isReferral = job.type === "Referral Opportunities" || job.employer === "Bombay Cafe";
          const hasMultipleActions = job.employer === "Global Talent Overseas" || job.id === "job-3";

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
                    <Text style={styles.employerName}>{job.employer}</Text>
                  )}
                  <Text style={styles.jobTitle}>{job.title}</Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={15} color="#64748B" />
                  <Text style={styles.detailText}>Location: {job.location}</Text>
                </View>
                {job.salary && (
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={15} color="#64748B" />
                    <Text style={styles.detailText}>Salary: {job.salary}</Text>
                  </View>
                )}
                {job.experience && (
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={15} color="#64748B" />
                    <Text style={styles.detailText}>Contract: {job.experience}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.jobDescription}>{job.description}</Text>

              {/* Action buttons rendering */}
              {isReferral ? (
                // Bombay Cafe type Referral
                <View style={styles.twoActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnLight}
                    onPress={() => handleCall(job.employer)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={16} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnTextGreen}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnLight}
                    onPress={() => handleShare(job.title, job.employer)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social" size={16} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnTextGreen}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.starActionBtn}
                    onPress={() => toggleFavorite(job.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFav ? "star" : "star-outline"}
                      size={20}
                      color={isFav ? "#EAB308" : "#475569"}
                    />
                  </TouchableOpacity>
                </View>
              ) : hasMultipleActions ? (
                // Global Talent Overseas style card (both Apply and Call/Share)
                <View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.applyBtn, isApplied && styles.appliedBtn]}
                      onPress={() => (isApplied ? null : handleApplyPress(job))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                        {isApplied ? "Applied" : "Apply Now"}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.starActionBtn}
                      onPress={() => toggleFavorite(job.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isFav ? "star" : "star-outline"}
                        size={20}
                        color={isFav ? "#EAB308" : "#475569"}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.twoActionsRow, { marginTop: 10 }]}>
                    <TouchableOpacity
                      style={[styles.actionBtnLight, { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }]}
                      onPress={() => handleCall(job.employer)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={16} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnTextGrey}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnLight, { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }]}
                      onPress={() => handleShare(job.title, job.employer)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-social" size={16} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnTextGrey}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Grand Hyatt type card (Apply + Link copy button)
                <View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.applyBtn, isApplied && styles.appliedBtn]}
                      onPress={() => (isApplied ? null : handleApplyPress(job))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                        {isApplied ? "Applied" : "Apply Now"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.starActionBtn}
                      onPress={() => toggleFavorite(job.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isFav ? "star" : "star-outline"}
                        size={20}
                        color={isFav ? "#EAB308" : "#475569"}
                      />
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

              <Text style={styles.timeText}>09:42 AM</Text>
            </View>
          );
        })}

        {/* Bottom Informational Updates Banner */}
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
        onPress={() => Alert.alert("Create Post", "Write a new job alert or community post.")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* MODAL 1: CALLBACK TIME PREFERENCE DIALOG */}
      <Modal
        visible={showCallModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCallModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>When should we call you?</Text>
            <Text style={styles.modalSubtitle}>
              Select a time range that works best for a quick recruiter callback.
            </Text>

            {/* Time Slot Radio List */}
            <View style={styles.slotsList}>
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                    onPress={() => setSelectedTimeSlot(slot.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.slotLeft}>
                      <Ionicons
                        name={slot.icon}
                        size={18}
                        color={isSelected ? "#15803D" : "#64748B"}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.slotLabelText, isSelected && styles.slotLabelTextSelected]}>
                        {slot.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#22C55E" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Confirm time buttons */}
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleConfirmTime}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmBtnText}>Confirm Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSkipBtn}
              onPress={handleSkipTime}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: SUCCESS FEEDBACK OVERLAY */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { alignItems: "center", paddingVertical: 28 }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
            </View>
            
            <Text style={[styles.modalTitle, { textAlign: "center", marginBottom: 8 }]}>
              Applied Successfully!
            </Text>
            <Text style={[styles.modalSubtitle, { textAlign: "center", marginBottom: 20 }]}>
              Your application has been submitted. The recruiter will contact you during {"\n"}
              <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                {getSlotLabel(selectedTimeSlot)}
              </Text>.
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { width: "100%", marginTop: 0 }]}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    flex: 1,
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
    width: 32,
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
    paddingBottom: 85,
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 10,
  },
  employerName: {
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
    padding: 10,
    marginVertical: 10,
    gap: 6,
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
    lineHeight: 18,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  appliedBtn: {
    backgroundColor: "#C8E6C9",
    borderColor: "#A5D6A7",
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
  },
  appliedBtnText: {
    color: "#1E293B",
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
    paddingVertical: 10,
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
    marginTop: 8,
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
  modalSkipBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
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
