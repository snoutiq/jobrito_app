import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_NAVY = "#153e69";

export default function FaqScreen({ navigation }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIds, setExpandedIds] = useState({});

  const categories = [
    { id: "all", label: t("faq.cat.all", "All") },
    { id: "general", label: t("faq.cat.general", "General") },
    { id: "applying", label: t("faq.cat.applying", "Applying") },
    { id: "jobFeed", label: t("faq.cat.jobFeed", "Job Feed") },
    { id: "saveShare", label: t("faq.cat.saveShare", "Save & Share") },
    { id: "employerComm", label: t("faq.cat.employerComm", "Employer") },
    { id: "matching", label: t("faq.cat.matching", "Matching") },
    { id: "profile", label: t("faq.cat.profile", "Profile") },
    { id: "notifications", label: t("faq.cat.notifications", "Notifications") },
    { id: "supportSafety", label: t("faq.cat.supportSafety", "Support") },
    { id: "trainingOverseas", label: t("faq.cat.trainingOverseas", "Training & Overseas") },
  ];

  const faqData = [
    // General
    {
      id: "q1",
      cat: "general",
      catLabel: t("faq.cat.general", "General"),
      question: t("faq.q1", "What is Jobrito?"),
      answer: t(
        "faq.a1",
        "Jobrito connects hospitality professionals with employers looking for Talent across restaurants, cafés, hotels, QSRs, cloud kitchens, catering and other hospitality businesses."
      ),
    },
    {
      id: "q2",
      cat: "general",
      catLabel: t("faq.cat.general", "General"),
      question: t("faq.q2", "How do I find a job on Jobrito?"),
      answer: t(
        "faq.a2",
        "Browse the Job Feed to see available opportunities. You can review the job details and apply directly from the job card."
      ),
    },
    {
      id: "q3",
      cat: "general",
      catLabel: t("faq.cat.general", "General"),
      question: t("faq.q3", "Do I need to complete my profile before applying?"),
      answer: t(
        "faq.a3",
        "Yes. A complete and updated profile helps employers understand your experience, skills and availability."
      ),
    },

    // Applying for Jobs
    {
      id: "q4",
      cat: "applying",
      catLabel: t("faq.cat.applying", "Applying for Jobs"),
      question: t("faq.q4", "How do I apply for a job?"),
      answer: t("faq.a4", "Open a job you are interested in and tap Apply Now."),
    },
    {
      id: "q5",
      cat: "applying",
      catLabel: t("faq.cat.applying", "Applying for Jobs"),
      question: t("faq.q5", "Can I apply for more than one job?"),
      answer: t(
        "faq.a5",
        "Yes. You can apply for multiple jobs that match your experience and interests."
      ),
    },
    {
      id: "q6",
      cat: "applying",
      catLabel: t("faq.cat.applying", "Applying for Jobs"),
      question: t("faq.q6", "Can I cancel or withdraw my application?"),
      answer: t("faq.a6", "Applications cannot be withdrawn after submission."),
    },
    {
      id: "q7",
      cat: "applying",
      catLabel: t("faq.cat.applying", "Applying for Jobs"),
      question: t("faq.q7", "How can I know the status of my application?"),
      answer: t(
        "faq.a7",
        "You can check your applications and their current status from your Talent dashboard/profile area."
      ),
    },

    // Job Feed
    {
      id: "q8",
      cat: "jobFeed",
      catLabel: t("faq.cat.jobFeed", "Job Feed"),
      question: t("faq.q8", "What are Pinned Jobs?"),
      answer: t(
        "faq.a8",
        "Pinned Jobs are priority opportunities selected by the Jobrito Admin team and highlighted for Talent."
      ),
    },
    {
      id: "q9",
      cat: "jobFeed",
      catLabel: t("faq.cat.jobFeed", "Job Feed"),
      question: t("faq.q9", "What are Live Jobs?"),
      answer: t(
        "faq.a9",
        "Live Jobs are current job opportunities posted by employers and available for Talent to apply."
      ),
    },
    {
      id: "q10",
      cat: "jobFeed",
      catLabel: t("faq.cat.jobFeed", "Job Feed"),
      question: t("faq.q10", "What is shown by default in my Job Feed?"),
      answer: t("faq.a10", "Your Job Feed shows Live Jobs by default."),
    },
    {
      id: "q11",
      cat: "jobFeed",
      catLabel: t("faq.cat.jobFeed", "Job Feed"),
      question: t("faq.q11", "How can I view Pinned Jobs?"),
      answer: t(
        "faq.a11",
        "Use the Job Feed filter and select Pinned Jobs to view priority opportunities selected by the Jobrito team."
      ),
    },
    {
      id: "q12",
      cat: "jobFeed",
      catLabel: t("faq.cat.jobFeed", "Job Feed"),
      question: t("faq.q12", "Can I apply for a Pinned Job?"),
      answer: t(
        "faq.a12",
        "Yes. Pinned Jobs can be viewed and applied for just like other available jobs."
      ),
    },
    {
      id: "q13",
      cat: "jobFeed",
      catLabel: t("faq.cat.jobFeed", "Job Feed"),
      question: t("faq.q13", "Are Pinned Jobs more important than Live Jobs?"),
      answer: t(
        "faq.a13",
        "Pinned Jobs are highlighted by the Jobrito team as priority opportunities. However, you can apply for any job that matches your profile and interests."
      ),
    },

    // Save, Share & Refer
    {
      id: "q14",
      cat: "saveShare",
      catLabel: t("faq.cat.saveShare", "Save, Share & Refer"),
      question: t("faq.q14", "Can I save a job for later?"),
      answer: t("faq.a14", "Yes. Tap the Bookmark icon to save a job and review it later."),
    },
    {
      id: "q15",
      cat: "saveShare",
      catLabel: t("faq.cat.saveShare", "Save, Share & Refer"),
      question: t("faq.q15", "How do I remove a saved job?"),
      answer: t(
        "faq.a15",
        "Tap the Bookmark icon again to remove the job from your saved list."
      ),
    },
    {
      id: "q16",
      cat: "saveShare",
      catLabel: t("faq.cat.saveShare", "Save, Share & Refer"),
      question: t("faq.q16", "Can I share a job with someone?"),
      answer: t(
        "faq.a16",
        "Yes. Tap the Share icon on the job and share it through your preferred app."
      ),
    },
    {
      id: "q17",
      cat: "saveShare",
      catLabel: t("faq.cat.saveShare", "Save, Share & Refer"),
      question: t("faq.q17", "Can I refer a job opening?"),
      answer: t(
        "faq.a17",
        "Yes. You can post one job referral per day by tapping the + button on the Job Feed. Add the job, business and contact details to help spread the word about opportunities within the Jobrito community."
      ),
    },

    // Employer & Communication
    {
      id: "q18",
      cat: "employerComm",
      catLabel: t("faq.cat.employerComm", "Employer & Communication"),
      question: t("faq.q18", "How will an employer contact me?"),
      answer: t(
        "faq.a18",
        "If an employer is interested in your application, they may contact you using the contact details you provided and during the time slot you selected when applying for the job."
      ),
    },
    {
      id: "q19",
      cat: "employerComm",
      catLabel: t("faq.cat.employerComm", "Employer & Communication"),
      question: t("faq.q19", "Can I contact an employer directly?"),
      answer: t(
        "faq.a19",
        "No. You cannot contact an employer directly at first. You can exchange contact details only after the employer selects your application and chooses to contact you."
      ),
    },

    // Job Matching
    {
      id: "q20",
      cat: "matching",
      catLabel: t("faq.cat.matching", "Job Matching"),
      question: t("faq.q20", "What does the Match % mean?"),
      answer: t(
        "faq.a20",
        "The Match % indicates how closely your profile matches the requirements and details of a particular job."
      ),
    },
    {
      id: "q21",
      cat: "matching",
      catLabel: t("faq.cat.matching", "Job Matching"),
      question: t("faq.q21", "Why am I seeing jobs from other cities or countries?"),
      answer: t(
        "faq.a21",
        "Jobrito shows opportunities based on the job location preferences selected in your profile. If an employer posts a job for an overseas location, it may be shown to you if that location matches your preferences. If you select India Only, overseas jobs will not be shown in your Job Feed."
      ),
    },
    {
      id: "q22",
      cat: "matching",
      catLabel: t("faq.cat.matching", "Job Matching"),
      question: t("faq.q22", "Can I apply for jobs outside my current location?"),
      answer: t(
        "faq.a22",
        "Yes, where the employer accepts applications from your location and you meet the job requirements."
      ),
    },

    // Profile & Account
    {
      id: "q23",
      cat: "profile",
      catLabel: t("faq.cat.profile", "Profile & Account"),
      question: t("faq.q23", "How do I update my profile?"),
      answer: t("faq.a23", "Go to your profile and edit the information you want to update."),
    },
    {
      id: "q24",
      cat: "profile",
      catLabel: t("faq.cat.profile", "Profile & Account"),
      question: t("faq.q24", "Why should I keep my profile updated?"),
      answer: t(
        "faq.a24",
        "An updated profile helps employers better understand your experience and improves the relevance of job opportunities shown to you."
      ),
    },
    {
      id: "q25",
      cat: "profile",
      catLabel: t("faq.cat.profile", "Profile & Account"),
      question: t("faq.q25", "How do I change my phone number or account details?"),
      answer: t(
        "faq.a25",
        "Go to your profile/settings and update the information available for editing. For restricted account changes, contact Jobrito Support."
      ),
    },

    // Notifications
    {
      id: "q26",
      cat: "notifications",
      catLabel: t("faq.cat.notifications", "Notifications"),
      question: t("faq.q26", "How do I manage notifications?"),
      answer: t(
        "faq.a26",
        "You can manage your Jobrito notifications from Settings & Support."
      ),
    },
    {
      id: "q27",
      cat: "notifications",
      catLabel: t("faq.cat.notifications", "Notifications"),
      question: t("faq.q27", "How will I know when a relevant job is available?"),
      answer: t(
        "faq.a27",
        "Jobrito may send notifications about relevant job opportunities and important updates based on your profile and preferences."
      ),
    },

    // Support & Safety
    {
      id: "q28",
      cat: "supportSafety",
      catLabel: t("faq.cat.supportSafety", "Support & Safety"),
      question: t("faq.q28", "How do I contact Jobrito Support?"),
      answer: t(
        "faq.a28",
        "Go to Settings & Support → Help & Support to contact the Jobrito support team."
      ),
    },
    {
      id: "q29",
      cat: "supportSafety",
      catLabel: t("faq.cat.supportSafety", "Support & Safety"),
      question: t("faq.q29", "Is my personal information safe?"),
      answer: t(
        "faq.a29",
        "Jobrito uses your information to provide its services, connect you with relevant opportunities and support your account. See the Privacy Policy for more information."
      ),
    },
    {
      id: "q30",
      cat: "supportSafety",
      catLabel: t("faq.cat.supportSafety", "Support & Safety"),
      question: t("faq.q30", "How do I delete my Jobrito account?"),
      answer: t(
        "faq.a30",
        "Go to Settings & Support → Privacy & Security and select Delete Account."
      ),
    },

    // Training & Overseas
    {
      id: "q31",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q31", "What are Training & Overseas Opportunities?"),
      answer: t(
        "faq.a31",
        "These are upcoming training programs and overseas group hiring opportunities shared through Jobrito."
      ),
    },
    {
      id: "q32",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q32", "What is an overseas training program?"),
      answer: t(
        "faq.a32",
        "It is a training opportunity designed to help hospitality professionals prepare for potential overseas employment opportunities."
      ),
    },
    {
      id: "q33",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q33", "How will I know about upcoming programs?"),
      answer: t(
        "faq.a33",
        "Whenever an overseas training or group hiring opportunity is available, an agency may post the program through the Jobrito Job Feed. These posts will be visible to Talents who have selected overseas opportunities."
      ),
    },
    {
      id: "q34",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q34", "Can I apply for these opportunities?"),
      answer: t(
        "faq.a34",
        "Yes. When a program or overseas hiring opportunity is open, you can view the details and follow the application instructions provided."
      ),
    },
    {
      id: "q35",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q35", "Are these regular job postings?"),
      answer: t(
        "faq.a35",
        "No. Training programs and overseas group hiring are separate from regular employer job postings on the Job Feed."
      ),
    },
    {
      id: "q36",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q36", "Can completing a training program guarantee an overseas job?"),
      answer: t(
        "faq.a36",
        "No. Training participation does not guarantee employment. Overseas opportunities depend on the specific hiring program, employer requirements and selection process."
      ),
    },
    {
      id: "q37",
      cat: "trainingOverseas",
      catLabel: t("faq.cat.trainingOverseas", "Training & Overseas"),
      question: t("faq.q37", "Where can I find these opportunities?"),
      answer: t(
        "faq.a37",
        "You can access them through the Training & Overseas filter/section in Jobrito."
      ),
    },
  ];

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.cat === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("faq.screenTitle", "Frequently Asked Questions")}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Subheader Banner */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerTitle}>{t("faq.bannerTitle", "How can we help you?")}</Text>
        <Text style={styles.bannerSubTitle}>
          {t("faq.bannerSub", "Find quick answers about using Jobrito.")}
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("faq.searchPlaceholder", "Search questions or topics...")}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills horizontal scroll */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pillItem, isActive && styles.pillItemActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* FAQs List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t("faq.noResults", "No matching questions found")}</Text>
            <Text style={styles.emptySubText}>
              {t("faq.noResultsSub", "Try adjusting your search terms or filter.")}
            </Text>
          </View>
        ) : (
          filteredFaqs.map((item, index) => {
            const isExpanded = !!expandedIds[item.id];
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.questionRow}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.questionText}>
                    {index + 1}. {item.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#153e69"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerWrapper}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  bannerContainer: {
    backgroundColor: PRIMARY_NAVY,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  bannerSubTitle: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
  },
  pillsWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
  },
  pillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pillItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  pillItemActive: {
    backgroundColor: PRIMARY_NAVY,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  pillTextActive: {
    color: "#ffffff",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  faqCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 12,
    lineHeight: 21,
  },
  answerWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 12,
    backgroundColor: "#f8fafc",
  },
  answerText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
});
