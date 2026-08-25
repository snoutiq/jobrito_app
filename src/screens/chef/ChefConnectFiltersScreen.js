import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_NAVY = "#0f2342";
const PRIMARY_BLUE = "#1d4ed8";

export default function ChefConnectFiltersScreen({ navigation, route }) {
  const { t } = useTranslation();

  const initialFilters = route?.params?.filters || null;

  const [selectedEmployment, setSelectedEmployment] = useState(
    Array.isArray(initialFilters?.employment) ? initialFilters.employment : []
  );
  const [selectedExperience, setSelectedExperience] = useState(
    Array.isArray(initialFilters?.experienceList)
      ? initialFilters.experienceList
      : Array.isArray(initialFilters?.experience)
      ? initialFilters.experience
      : typeof initialFilters?.experience === "string" && initialFilters.experience
      ? [initialFilters.experience]
      : []
  );
  const [selectedOperations, setSelectedOperations] = useState(
    Array.isArray(initialFilters?.operations) ? initialFilters.operations : []
  );
  const [selectedCuisines, setSelectedCuisines] = useState(
    Array.isArray(initialFilters?.cuisines) ? initialFilters.cuisines : []
  );
  const [selectedBusiness, setSelectedBusiness] = useState(
    Array.isArray(initialFilters?.business) ? initialFilters.business : []
  );
  const [selectedRegional, setSelectedRegional] = useState(
    Array.isArray(initialFilters?.regional) ? initialFilters.regional : []
  );
  const [selectedLocationPref, setSelectedLocationPref] = useState(
    Array.isArray(initialFilters?.locationPreference) ? initialFilters.locationPreference : []
  );

  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Filter Options Data
  const employmentOptions = [
    "Full Time",
    "Part Time",
    "Freelance Chef",
    "Consultant",
    "Project Based",
    "Contract",
    "Temporary Assignment",
    "Seasonal / On Call",
  ];

  const experienceOptions = [
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Executive Level",
  ];

  const operationsOptions = [
    "Kitchen Management",
    "Menu Development",
    "Costing & Budgeting",
    "Inventory Management",
    "Food Safety & Compliance",
    "Team Leadership",
    "Franchise Operations",
    "Others",
  ];

  const cuisinesOptions = [
    "Indian",
    "Continental",
    "Italian",
    "Asian",
    "Bakery",
    "Arabian",
    "Mediterranean",
    "Others",
  ];

  const businessOptions = [
    "Concept Development",
    "Branding",
    "Franchising",
    "Scaling & Growth",
    "P&L Management",
    "Investor Relations",
  ];

  const regionalOptions = [
    "Saudi Arabia",
    "India",
    "Gulf Countries",
    "Global",
  ];

  const formatOpt = (opt) => {
    if (!opt) return "";
    return t(`filterOpts.${opt}`, t(opt, opt));
  };

  const locationPrefOptions = [
    { id: "Saudi Arabia", label: formatOpt("Saudi Arabia"), icon: "🇸🇦" },
    { id: "India", label: formatOpt("India"), icon: "🇮🇳" },
    { id: "Global", label: formatOpt("Global"), icon: "🌐" },
  ];

  const toggleArrayFilter = (item, selectedList, setSelectedList) => {
    if (selectedList.includes(item)) {
      setSelectedList(selectedList.filter((x) => x !== item));
    } else {
      setSelectedList([...selectedList, item]);
    }
  };

  const handleResetAll = () => {
    setSelectedEmployment([]);
    setSelectedExperience([]);
    setSelectedOperations([]);
    setSelectedCuisines([]);
    setSelectedBusiness([]);
    setSelectedRegional([]);
    setSelectedLocationPref([]);
  };

  const handleSelectAllLocations = () => {
    if (selectedLocationPref.length === locationPrefOptions.length) {
      setSelectedLocationPref([]);
    } else {
      setSelectedLocationPref(locationPrefOptions.map((x) => x.id));
    }
  };

  const totalAppliedCount =
    selectedEmployment.length +
    selectedExperience.length +
    selectedOperations.length +
    selectedCuisines.length +
    selectedBusiness.length +
    selectedRegional.length +
    selectedLocationPref.length;

  const handleApply = () => {
    setShowSummaryModal(false);
    const appliedFilters = {
      employment: selectedEmployment,
      experience: selectedExperience[0] || "",
      experienceList: selectedExperience,
      operations: selectedOperations,
      cuisines: selectedCuisines,
      business: selectedBusiness,
      regional: selectedRegional,
      locationPreference: selectedLocationPref,
    };
    navigation.navigate("ChefConnectDiscovery", { filters: appliedFilters });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={normalize(22)} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("myProfile", "My Profile")}</Text>
        <View style={styles.headerLogoRow}>
          <Ionicons name="restaurant-outline" size={normalize(18)} color="#153e69" style={{ marginRight: normalize(4) }} />
          <View>
            <Text style={styles.headerLogoTextTop}>Chef</Text>
            <Text style={styles.headerLogoTextSub}>Connect</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Title & Reset Row */}
        <View style={styles.titleResetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>{t("advancedFiltersTitle", "Advanced Filters")}</Text>
            <Text style={styles.mainSubtitle}>
              {t("advancedFiltersSub", "Refine your search. Results update instantly.")}
            </Text>
          </View>
          <TouchableOpacity onPress={handleResetAll} style={styles.resetBtn} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={normalize(14)} color="#1d4ed8" style={{ marginRight: normalize(4) }} />
            <Text style={styles.resetBtnText}>{t("resetAll", "Reset All")}</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Employment Preference (3-Column Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="briefcase-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("employmentPreference", "Employment Preference")}</Text>
              <Text style={styles.sectionSubtext}>{t("selectOneOrMore", "Select one or more")}</Text>
            </View>
          </View>
          <View style={styles.grid3ColRow}>
            {employmentOptions.map((opt) => {
              const isSelected = selectedEmployment.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.card3Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(opt, selectedEmployment, setSelectedEmployment)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.card3ColText, isSelected && styles.cardTextSelected]}
                    numberOfLines={2}
                  >
                    {formatOpt(opt)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(12)}
                      color="#1d4ed8"
                      style={styles.checkmarkIconInline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Experience Level (3-Column Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("experienceLevel", "Experience Level")}</Text>
              <Text style={styles.sectionSubtext}>{t("selectOneOrMore", "Select one or more")}</Text>
            </View>
          </View>
          <View style={styles.grid3ColRow}>
            {experienceOptions.map((opt) => {
              const isSelected = selectedExperience.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.card3Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(opt, selectedExperience, setSelectedExperience)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.card3ColText, isSelected && styles.cardTextSelected]}
                    numberOfLines={2}
                  >
                    {formatOpt(opt)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(12)}
                      color="#1d4ed8"
                      style={styles.checkmarkIconInline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Operational Expertise (3-Column Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="settings-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("operationalExpertise", "Operational Expertise")}</Text>
              <Text style={styles.sectionSubtext}>{t("selectOneOrMore", "Select one or more")}</Text>
            </View>
          </View>
          <View style={styles.grid3ColRow}>
            {operationsOptions.map((opt) => {
              const isSelected = selectedOperations.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.card3Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(opt, selectedOperations, setSelectedOperations)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.card3ColText, isSelected && styles.cardTextSelected]}
                    numberOfLines={2}
                  >
                    {formatOpt(opt)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(12)}
                      color="#1d4ed8"
                      style={styles.checkmarkIconInline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Cuisine Specialization (4-Column Grid!) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="restaurant-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("cuisineSpecialization", "Cuisine Specialization")}</Text>
              <Text style={styles.sectionSubtext}>{t("selectOneOrMore", "Select one or more")}</Text>
            </View>
          </View>
          <View style={styles.grid4ColRow}>
            {cuisinesOptions.map((opt) => {
              const isSelected = selectedCuisines.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.card4Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(opt, selectedCuisines, setSelectedCuisines)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.card4ColText, isSelected && styles.cardTextSelected]}
                    numberOfLines={2}
                  >
                    {formatOpt(opt)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(13)}
                      color="#1d4ed8"
                      style={styles.checkmarkIconInline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Business & Brand Development (3-Column Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="trending-up-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("businessBrandDev", "Business & Brand Development")}</Text>
              <Text style={styles.sectionSubtext}>{t("selectOneOrMore", "Select one or more")}</Text>
            </View>
          </View>
          <View style={styles.grid3ColRow}>
            {businessOptions.map((opt) => {
              const isSelected = selectedBusiness.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.card3Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(opt, selectedBusiness, setSelectedBusiness)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.card3ColText, isSelected && styles.cardTextSelected]}
                    numberOfLines={2}
                  >
                    {formatOpt(opt)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(12)}
                      color="#1d4ed8"
                      style={styles.checkmarkIconInline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Regional Experience (3-Column Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="globe-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("regionalExperience", "Regional Experience")}</Text>
              <Text style={styles.sectionSubtext}>{t("selectOneOrMore", "Select one or more")}</Text>
            </View>
          </View>
          <View style={styles.grid3ColRow}>
            {regionalOptions.map((opt) => {
              const isSelected = selectedRegional.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.card3Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(opt, selectedRegional, setSelectedRegional)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.card3ColText, isSelected && styles.cardTextSelected]}
                    numberOfLines={2}
                  >
                    {formatOpt(opt)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(14)}
                      color="#1d4ed8"
                      style={styles.checkmarkIconInline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 7. Location Preference (3-Column Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={normalize(16)} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t("locationPreference", "Location Preference")}</Text>
              <Text style={styles.sectionSubtext}>{t("whereChefOpenToWork", "Where the chef is open to work")}</Text>
            </View>
            <TouchableOpacity onPress={handleSelectAllLocations} activeOpacity={0.8}>
              <Text style={styles.selectAllText}>{t("selectAll", "Select All")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid3ColRow}>
            {locationPrefOptions.map((item) => {
              const isSelected = selectedLocationPref.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card3Col, isSelected && styles.cardSelected]}
                  onPress={() => toggleArrayFilter(item.id, selectedLocationPref, setSelectedLocationPref)}
                  activeOpacity={0.8}
                >
                  <View style={styles.locationCardContent}>
                    {item.icon === "🌐" ? (
                      <Ionicons name="globe-outline" size={normalize(14)} color="#1d4ed8" style={{ marginRight: normalize(3) }} />
                    ) : (
                      <Text style={{ fontSize: normalize(13), marginRight: normalize(3) }}>{item.icon}</Text>
                    )}
                    <Text
                      style={[styles.card3ColText, isSelected && styles.cardTextSelected, { flexShrink: 1 }]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkbox" : "square-outline"}
                    size={normalize(14)}
                    color={isSelected ? "#1d4ed8" : "#cbd5e1"}
                    style={{ marginLeft: normalize(3) }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Footer */}
      <View style={styles.footerContainer}>
        {/* Summary Pill Box */}
        <TouchableOpacity
          style={styles.summaryPillBox}
          onPress={() => setShowSummaryModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={normalize(16)} color="#0f172a" style={{ marginRight: normalize(6) }} />
          <Text style={styles.summaryCountText}>
            {totalAppliedCount} {t("filtersApplied", "Filters Applied")}
          </Text>
          <View style={styles.viewSummaryBtn}>
            <Text style={styles.viewSummaryBtnText}>{t("viewSummary", "View Summary")}</Text>
            <Ionicons name="chevron-up" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(3) }} />
          </View>
        </TouchableOpacity>

        {/* Apply Primary Button */}
        <TouchableOpacity style={styles.applyPrimaryBtn} onPress={handleApply} activeOpacity={0.85}>
          <Text style={styles.applyPrimaryBtnText}>{t("applyFilters", "Apply Filters")}</Text>
        </TouchableOpacity>
      </View>

      {/* Applied Filters Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="options-outline" size={normalize(18)} color="#1d4ed8" style={{ marginRight: normalize(8) }} />
                <View>
                  <Text style={styles.modalTitle}>{t("appliedSummaryTitle", "Applied Filters Summary")}</Text>
                  <Text style={styles.modalSubtitle}>
                    {totalAppliedCount} {t("selectedTotal", "selected in total")}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)} activeOpacity={0.8} style={{ padding: normalize(4) }}>
                <Ionicons name="close" size={normalize(22)} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {totalAppliedCount === 0 ? (
                <View style={styles.emptySummaryView}>
                  <Ionicons name="funnel-outline" size={normalize(44)} color="#cbd5e1" style={{ marginBottom: normalize(8) }} />
                  <Text style={styles.emptySummaryTitle}>{t("noFiltersSelected", "No filters selected yet")}</Text>
                  <Text style={styles.emptySummarySub}>{t("selectFiltersHint", "Tap options on the screen to refine your chef search.")}</Text>
                </View>
              ) : (
                <View style={{ gap: normalize(14) }}>
                  {/* Employment */}
                  {selectedEmployment.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("employmentPreference", "Employment Preference")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedEmployment.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedEmployment, setSelectedEmployment)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Experience */}
                  {selectedExperience.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("experienceLevel", "Experience Level")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedExperience.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedExperience, setSelectedExperience)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Operations */}
                  {selectedOperations.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("operationalExpertise", "Operational Expertise")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedOperations.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedOperations, setSelectedOperations)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Cuisines */}
                  {selectedCuisines.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("cuisineSpecialization", "Cuisine Specialization")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedCuisines.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedCuisines, setSelectedCuisines)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Business */}
                  {selectedBusiness.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("businessBrandDev", "Business & Brand Development")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedBusiness.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedBusiness, setSelectedBusiness)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Regional */}
                  {selectedRegional.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("regionalExperience", "Regional Experience")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedRegional.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedRegional, setSelectedRegional)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Location Preference */}
                  {selectedLocationPref.length > 0 && (
                    <View>
                      <Text style={styles.summaryCategoryTitle}>{t("locationPreference", "Location Preference")}</Text>
                      <View style={styles.summaryChipsWrap}>
                        {selectedLocationPref.map((item) => (
                          <View key={item} style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>{formatOpt(item)}</Text>
                            <TouchableOpacity onPress={() => toggleArrayFilter(item, selectedLocationPref, setSelectedLocationPref)}>
                              <Ionicons name="close-circle" size={normalize(14)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions Footer */}
            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.modalClearBtn} onPress={handleResetAll} activeOpacity={0.8}>
                <Text style={styles.modalClearBtnText}>{t("clearAll", "Clear All")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalApplyBtn} onPress={handleApply} activeOpacity={0.85}>
                <Text style={styles.modalApplyBtnText}>{t("applyFilters", "Apply Filters")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: normalize(52),
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: {
    padding: normalize(4),
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  headerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogoTextTop: {
    fontSize: normalize(10.5),
    fontWeight: "900",
    color: "#153e69",
    lineHeight: normalize(12),
  },
  headerLogoTextSub: {
    fontSize: normalize(10.5),
    fontWeight: "900",
    color: "#16a34a",
    lineHeight: normalize(12),
  },
  scrollBody: {
    padding: normalize(14),
    paddingBottom: normalize(90),
  },

  // Title & Reset
  titleResetRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: normalize(18),
  },
  mainTitle: {
    fontSize: normalize(18),
    fontWeight: "800",
    color: "#0f172a",
  },
  mainSubtitle: {
    fontSize: normalize(11.5),
    color: "#64748b",
    marginTop: normalize(2),
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(6),
  },
  resetBtnText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#1d4ed8",
  },

  // Section Styling
  sectionContainer: {
    marginBottom: normalize(20),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(10),
  },
  iconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  sectionTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtext: {
    fontSize: normalize(10.5),
    color: "#64748b",
    marginTop: normalize(1),
  },
  selectAllText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#1d4ed8",
  },

  // 3-Column Grid Layout
  grid3ColRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
  },
  card3Col: {
    width: "31.8%",
    minHeight: normalize(38),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(4),
    paddingVertical: normalize(4),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // 4-Column Grid Layout (Cuisine)
  grid4ColRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(5),
  },
  card4Col: {
    width: "23.5%",
    minHeight: normalize(38),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(3),
    paddingVertical: normalize(4),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Selected State
  cardSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#1d4ed8",
    borderWidth: 1.5,
  },

  card3ColText: {
    fontSize: normalize(9.5),
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    flexShrink: 1,
  },
  card4ColText: {
    fontSize: normalize(9),
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    flexShrink: 1,
  },
  cardTextSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  checkmarkIconInline: {
    marginLeft: normalize(3),
  },

  locationCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  // Bottom Footer
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: normalize(10),
  },
  summaryPillBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(10),
  },
  summaryCountText: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#0f172a",
    marginRight: normalize(6),
  },
  viewSummaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  viewSummaryBtnText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#1d4ed8",
  },
  applyPrimaryBtn: {
    backgroundColor: PRIMARY_NAVY,
    borderRadius: normalize(10),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  applyPrimaryBtnText: {
    color: "#ffffff",
    fontSize: normalize(12.5),
    fontWeight: "800",
  },

  // Summary Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: normalize(16),
    maxHeight: "75%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingBottom: normalize(12),
  },
  modalTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: normalize(11),
    color: "#64748b",
    marginTop: 1,
  },
  modalScrollBody: {
    paddingVertical: normalize(14),
  },
  emptySummaryView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(28),
  },
  emptySummaryTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
  },
  emptySummarySub: {
    fontSize: normalize(11),
    color: "#64748b",
    marginTop: normalize(2),
    textAlign: "center",
  },
  summaryCategoryTitle: {
    fontSize: normalize(11.5),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(6),
  },
  summaryChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: normalize(6),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  summaryChipText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#1d4ed8",
  },
  modalFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingTop: normalize(12),
    marginTop: normalize(8),
  },
  modalClearBtn: {
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: normalize(11),
    paddingHorizontal: normalize(16),
    alignItems: "center",
    justifyContent: "center",
  },
  modalClearBtnText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#475569",
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: PRIMARY_NAVY,
    borderRadius: normalize(10),
    paddingVertical: normalize(11),
    alignItems: "center",
    justifyContent: "center",
  },
  modalApplyBtnText: {
    color: "#ffffff",
    fontSize: normalize(12.5),
    fontWeight: "800",
  },
});
