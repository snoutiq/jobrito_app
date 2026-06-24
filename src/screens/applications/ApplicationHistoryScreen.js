import React, { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../constants/colors";
import { fetchApplicationHistory } from "../../redux/slices/applicationSlice";
import { sampleFeedJobs } from "../../services/jobApi";

const filterTabs = ["All", "Full Time", "Part time", "Immediate Joining"];

const categories = [
  {
    label: "Culinary",
    icon: "restaurant-outline",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDQUDkXQr3AMosv1KNfFb-ELu3VTVgD_p1C7SQe13HcZryzVWiC7ZVcH3sg2voAWOKGTLXCj8I2RFWtt6M-x9HRqU0ucu7EKTjx-4lQSH5o7kB6DYBKYwx7_tBdbSznp8KnrXpD2mSfJ1NjL7DGNBvZ2BpVWPSCJsjdrijwLOO4uRp6FdUq1H6mlCzzxKqfQd34p_Zr99694pROHSQ30B8KihItTHwyfevO_gXWSZiTl_efnZObS-LsZ6sxn_ae9MvlDIxt4Dvu5ra_",
  },
  {
    label: "Service",
    icon: "briefcase-outline",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBkkg9Z2IG-Z0aFnl8qpBShEvLfssWDjSwWc1vjZLjYm5z4MgtNbaRsP4U0R7-qguVqjpvhDFqX31I9CgNYhYB1mUaQLBABvr_MaC4ll0qz927Goy2zO-all3bUZty7SgNGgC0Mg7mGnvpmhi1Q6UHm8-k6JYIdJ0BT1Yu5ePAm4y0DabMKuG9yHX1Ewpp6eCvvN9BvtaHANUV6q3Sk_C5HhyLbMDguvEXxzWQFFaE96lQymWG11aMqWHOBEaDOWohhONhPiWxVOmXC",
  },
  {
    label: "Bar & Nightlife",
    icon: "wine-outline",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBNKv8u8RDfpLUyP_xmNQqlMjMhMssqXOqO71KR9jbQn2UNLMCseWyY_PboR8wJB85m3_aiqDoBwzmj-l319qBEgOCAADm8B0RjBJzaK3kGFzL4NMSqMDbHWPADhnhyiODj7zwPk_BYWgDtktdPp6oMPkHEYomzL04hH-X_60A-t7y3N_YNbaQN2ZwVAkxHC0wWR8WOTCzEdLC_8X228SDFfi1Mzoz1MT1ZMDOe7XzRaCNco87u0vgAN8khIIhptMJL7AoPHfMXAJt9",
  },
];

const formatAppliedTime = (appliedOn) => {
  if (!appliedOn) return "Recently";
  const date = new Date(appliedOn);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffDays = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function ApplicationHistoryScreen() {
  const dispatch = useDispatch();
  const { history } = useSelector((state) => state.application);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchApplicationHistory());
  }, [dispatch]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    return history.filter((item) => {
      const matchesQuery =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.employer?.toLowerCase().includes(query);
      const matchesFilter =
        activeFilter === "All" ||
        item.status === activeFilter ||
        item.category === activeFilter;
      return matchesQuery && matchesFilter;
    });
  }, [history, search, activeFilter]);

  const suggestedJobs = useMemo(() => sampleFeedJobs.slice(0, 2), []);

  return (
    <ScreenWrapper contentStyle={styles.page}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.mutedText} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Job Title, Employer, or Location"
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveFilter(tab)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              {isActive ? (
                <Ionicons name="checkmark" size={12} color={colors.white} />
              ) : null}
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Applications</Text>
        <Pressable onPress={() => setActiveFilter("All")}>
          <Text style={styles.sectionAction}>Clear all</Text>
        </Pressable>
      </View>

      {filteredHistory.length ? (
        <View style={styles.listGroup}>
          {filteredHistory.map((item) => (
            <View key={item.id} style={styles.applicationCard}>
              <View style={styles.applicationTop}>
                <View style={styles.applicationIcon}>
                  <Ionicons name="briefcase" size={16} color={colors.primary} />
                </View>
                <View style={styles.applicationTextBlock}>
                  <Text style={styles.applicationTitle}>{item.title}</Text>
                  <Text style={styles.applicationMeta}>{item.employer}</Text>
                </View>
                <Text style={styles.timeText}>{formatAppliedTime(item.appliedOn)}</Text>
              </View>
              <View style={styles.applicationFooter}>
                <StatusBadge status={item.status} />
                <Text style={styles.appliedText}>Applied on {item.appliedOn}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="No applications yet"
          subtitle="Applied jobs will appear here with status updates."
        />
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggested job categories</Text>
      </View>
      <View style={styles.categoryGrid}>
        {categories.map((item, index) => {
          const isWide = index === 2;
          return (
            <Pressable
              key={item.label}
              style={[
                styles.categoryCard,
                isWide ? styles.categoryCardWide : styles.categoryCardHalf,
              ]}
            >
              <ImageBackground
                source={{ uri: item.image }}
                style={styles.categoryImage}
                imageStyle={styles.categoryImageFill}
                resizeMode="cover"
              >
              <View style={styles.categoryShade} />
              <View style={styles.categoryContent}>
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={item.icon} size={18} color={colors.white} />
                </View>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </View>
              </ImageBackground>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended for you</Text>
      </View>
      <View style={styles.recommendList}>
        {suggestedJobs.map((job, index) => (
          <View
            key={job.id}
            style={[styles.recommendCard, index === 0 && styles.recommendCardTop]}
          >
            <View style={styles.recommendLeft}>
                <View
                  style={[
                    styles.recommendIcon,
                    {
                      backgroundColor:
                        index === 0 ? colors.primarySoft : colors.card,
                    },
                  ]}
                >
                <Ionicons
                  name={index === 0 ? "restaurant-outline" : "wine-outline"}
                  size={18}
                  color={index === 0 ? colors.primary : colors.primary}
                />
              </View>
              <View style={styles.recommendTextBlock}>
                <Text style={styles.recommendTitle}>
                  {index === 0 ? "Head Chef" : "Mixologist"}
                </Text>
                <Text style={styles.recommendCompany}>
                  {index === 0
                    ? "LeAustre Brasserie + Central London"
                    : "The Sky Lounge - Manchester"}
                </Text>
                <View style={styles.recommendMetaRow}>
                  <View style={styles.recommendMetaItem}>
                    <Ionicons name="cash-outline" size={12} color={colors.primary} />
                    <Text style={styles.recommendMetaText}>
                      {index === 0 ? "INR 5L - 8L/yr" : "GBP 18K - 26K"}
                    </Text>
                  </View>
                  <View style={styles.recommendMetaItem}>
                    <Ionicons name="location-outline" size={12} color={colors.primary} />
                    <Text style={styles.recommendMetaText}>
                      {index === 0 ? "Delhi NCR" : "Immediate"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.tagPill,
                {
                  backgroundColor:
                    index === 0 ? colors.primarySoft : colors.primarySoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  {
                    color: index === 0 ? colors.primary : colors.primaryDark,
                  },
                ]}
              >
                {index === 0 ? "TOP MATCH" : "Active Now"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 18,
    gap: 14,
  },
  searchBar: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  listGroup: {
    gap: 10,
  },
  applicationCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  applicationTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  applicationIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
  },
  applicationTextBlock: {
    flex: 1,
    gap: 4,
  },
  applicationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  applicationMeta: {
    color: colors.mutedText,
    fontSize: 12,
  },
  timeText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  applicationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  appliedText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    minHeight: 84,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    backgroundColor: colors.border,
  },
  categoryCardHalf: {
    width: "48.5%",
  },
  categoryCardWide: {
    width: "100%",
    minHeight: 96,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  categoryImageFill: {
    borderRadius: 16,
  },
  categoryShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  categoryContent: {
    position: "relative",
    zIndex: 1,
    gap: 8,
    padding: 12,
  },
  categoryLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  recommendList: {
    gap: 10,
  },
  recommendCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  recommendCardTop: {
    backgroundColor: colors.background,
  },
  recommendLeft: {
    flexDirection: "row",
    gap: 10,
  },
  recommendIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendTextBlock: {
    flex: 1,
    gap: 4,
  },
  recommendTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  recommendCompany: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 16,
  },
  recommendMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recommendMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recommendMetaText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  tagPill: {
    alignSelf: "flex-end",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: "900",
  },
});
