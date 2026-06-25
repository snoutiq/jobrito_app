import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";

export default function ChefHomeScreen() {
  const [activeFilter, setActiveFilter] = useState(1);
  
  // Job cards states
  const [favorites, setFavorites] = useState({ 1: false, 2: false, 3: false });
  const [appliedJobs, setAppliedJobs] = useState({ 1: false, 3: false });
  const [linkCopied, setLinkCopied] = useState(false);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleApply = (id) => {
    setAppliedJobs((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        Alert.alert("Success", "You have successfully applied to this job!");
      }
      return { ...prev, [id]: nextState };
    });
  };

  const copyToClipboard = () => {
    Clipboard.setString("https://jobrito.com/jobs/continental-chef-dubai");
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCall = (company) => {
    Alert.alert("Dialing...", `Calling recruiting partner of ${company} at +91 98765 43210`);
  };

  const handleShare = (title) => {
    Alert.alert("Share", `Link for "${title}" copied to share sheet!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
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
          {[1, 2, 3, 4, 5].map((num) => {
            const isSelected = activeFilter === num;
            return (
              <TouchableOpacity
                key={num}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setActiveFilter(num)}
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

        {/* Job Card 1 - Grand Hyatt Dubai */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.employerNameGreen}>Grand Hyatt Dubai</Text>
              <Text style={styles.jobTitle}>Continental Chef Required</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(1)} style={styles.favBtn}>
              <Ionicons
                name={favorites[1] ? "star" : "star-outline"}
                size={22}
                color={favorites[1] ? "#EAB308" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsBlock}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>Location: Dubai, UAE</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>Salary: AED 3500 + Housing</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>Contract: 2 Years</Text>
            </View>
          </View>

          <Text style={styles.jobDescription}>
            Looking for professional and experienced chef to join our team.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.applyBtn, appliedJobs[1] && styles.appliedBtn]}
              onPress={() => toggleApply(1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.applyBtnText, appliedJobs[1] && styles.appliedBtnText]}>
                {appliedJobs[1] ? "Applied" : "Apply Now"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.linkCopiedBox} onPress={copyToClipboard}>
            <Ionicons name="link" size={16} color="#64748B" />
            <Text style={styles.linkCopiedText}>
              {linkCopied ? "Link copied" : "Copy job link"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.timeText}>09:42 AM</Text>
        </View>

        {/* Job Card 2 - Bombay Cafe */}
        <View style={[styles.card, styles.highlightedCard]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.referralHeader}>Referral Job Post</Text>
              <Text style={styles.jobTitleBold}>Bombay Cafe</Text>
              <Text style={styles.jobTitle}>Pastry Chef Required</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(2)} style={styles.favBtn}>
              <Ionicons
                name={favorites[2] ? "star" : "star-outline"}
                size={22}
                color={favorites[2] ? "#EAB308" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsBlock}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>Location: Bandra, Mumbai</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>Salary: INR 35000 + Housing</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>Contract: 2 Years</Text>
            </View>
          </View>

          <Text style={styles.jobDescription}>
            Looking for experienced baker/chef to join our team.
          </Text>

          <View style={styles.twoActionsRow}>
            <TouchableOpacity
              style={styles.actionBtnLight}
              onPress={() => handleCall("Bombay Cafe")}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnTextGreen}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnLight}
              onPress={() => handleShare("Pastry Chef - Bombay Cafe")}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={16} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnTextGreen}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.timeText}>10:15 AM</Text>
        </View>

        {/* Job Card 3 - Global Talent Overseas */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.employerNameGreen}>Global Talent Overseas</Text>
              <Text style={styles.jobTitle}>Kitchen Helpers (Riyadh)</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(3)} style={styles.favBtn}>
              <Ionicons
                name={favorites[3] ? "star" : "star-outline"}
                size={22}
                color={favorites[3] ? "#EAB308" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.jobDescription, { marginTop: 10 }]}>
            Kitchen Helpers (Riyadh)
          </Text>
          <Text style={styles.jobDescription}>
            Bulk hiring for mega-event hospitality project.
          </Text>
          <Text style={[styles.jobDescription, { fontWeight: "bold", color: "#1E293B" }]}>
            Free Visa & Flights.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.applyBtn, appliedJobs[3] && styles.appliedBtn]}
              onPress={() => toggleApply(3)}
              activeOpacity={0.7}
            >
              <Text style={[styles.applyBtnText, appliedJobs[3] && styles.appliedBtnText]}>
                {appliedJobs[3] ? "Applied" : "Apply Now"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.twoActionsRow, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.actionBtnLight, { backgroundColor: "#F1F5F9" }]}
              onPress={() => handleCall("Global Talent Overseas")}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnTextGrey}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtnLight, { backgroundColor: "#F1F5F9" }]}
              onPress={() => handleShare("Kitchen Helpers Riyadh")}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnTextGrey}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.timeText}>11:05 AM</Text>
        </View>

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
    paddingBottom: 80, // Space for FAB
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
  highlightedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
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
  jobTitleBold: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
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
});