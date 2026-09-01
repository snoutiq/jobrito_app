import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

export default function ChefConnectFiltersScreen({ navigation, route }) {
  const { t } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ChefConnectDiscovery");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [navigation])
  );

  const initialFilters = route?.params?.filters || {
    employment: [],
    experience: "",
    operations: [],
    cuisines: [],
    business: [],
    regional: [],
  };

  const [selectedEmployment, setSelectedEmployment] = useState(initialFilters.employment);
  const [selectedExperience, setSelectedExperience] = useState(initialFilters.experience);
  const [selectedOperations, setSelectedOperations] = useState(initialFilters.operations);
  const [selectedCuisines, setSelectedCuisines] = useState(initialFilters.cuisines);
  const [selectedBusiness, setSelectedBusiness] = useState(initialFilters.business);
  const [selectedRegional, setSelectedRegional] = useState(initialFilters.regional);

  // Accordion toggle states
  const [expandedSection, setExpandedSection] = useState("employment");

  const employmentOptions = [
    "Full Time",
    "Part Time",
    "Freelance Chef",
    "Consultant",
    "Project Based",
    "Temporary Assignment",
    "Overseas Ready"
  ];
  const experienceOptions = ["1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"];
  const operationsOptions = [
    "Soft Opening Consultant",
    "Kitchen Setup Expert",
    "Menu Engineering Specialist",
    "SOP Writer",
    "Recipe Standardization",
    "Cost Control Specialist",
    "Food Cost Analyst",
    "Vendor Sourcing Expert",
    "Hygiene & HACCP Specialist"
  ];
  const cuisinesOptions = [
    "Italian Chef",
    "Continental Chef",
    "Multi Cuisine Chef",
    "Indian Chef",
    "South Indian Chef",
    "North Indian Chef",
    "Chinese Chef",
    "Arabic Chef",
    "Bakery Chef",
    "Pastry Chef",
    "Pizza Chef",
    "Grill Chef",
    "Tandoor Chef",
    "BBQ Chef",
    "Seafood Chef",
    "Healthy Cuisine Chef",
    "Fusion Chef"
  ];
  const businessOptions = [
    "Brand Development Chef",
    "Cloud Kitchen Consultant",
    "Restaurant Turnaround Specialist",
    "QSR Development Expert",
    "Café Concept Creator",
    "Menu Innovation Expert",
    "New Product Development"
  ];
  const regionalOptions = [
    "Saudi Arabia Experience",
    "UAE Experience",
    "GCC Experience",
    "India Experience",
    "International Experience"
  ];

  const toggleFilter = (item, selectedList, setSelectedList) => {
    if (selectedList.includes(item)) {
      setSelectedList(selectedList.filter((x) => x !== item));
    } else {
      setSelectedList([...selectedList, item]);
    }
  };

  const handleReset = () => {
    setSelectedEmployment([]);
    setSelectedExperience("");
    setSelectedOperations([]);
    setSelectedCuisines([]);
    setSelectedBusiness([]);
    setSelectedRegional([]);
  };

  const handleApply = () => {
    const appliedFilters = {
      employment: selectedEmployment,
      experience: selectedExperience,
      operations: selectedOperations,
      cuisines: selectedCuisines,
      business: selectedBusiness,
      regional: selectedRegional,
    };
    navigation.navigate({
      name: "ChefConnectDiscovery",
      params: { filters: appliedFilters },
      merge: true,
    });
  };

  const renderSectionHeader = (title, count, sectionKey) => {
    const isExpanded = expandedSection === sectionKey;
    return (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpandedSection(isExpanded ? null : sectionKey)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sectionTitleText, isExpanded && { color: PRIMARY_GREEN }]}>
          {title} {count > 0 ? `(${count})` : ""}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={isExpanded ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.6)"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("ChefConnectDiscovery")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("chefConnectFilters")}</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>{t("reset")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employment Preference Section */}
        <View style={styles.filterSection}>
          {renderSectionHeader(t("employmentPreference"), selectedEmployment.length, "employment")}
          {expandedSection === "employment" && (
            <View style={styles.pillsContainer}>
              {employmentOptions.map((opt) => {
                const isSelected = selectedEmployment.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleFilter(opt, selectedEmployment, setSelectedEmployment)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {t(opt, opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Experience Level Section */}
        <View style={styles.filterSection}>
          {renderSectionHeader(t("experienceLevel"), selectedExperience ? 1 : 0, "experience")}
          {expandedSection === "experience" && (
            <View style={styles.pillsContainer}>
              {experienceOptions.map((opt) => {
                const isSelected = selectedExperience === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setSelectedExperience(isSelected ? "" : opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {t(opt, opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Operational Expertise Section */}
        <View style={styles.filterSection}>
          {renderSectionHeader(t("operationalExpertise"), selectedOperations.length, "operations")}
          {expandedSection === "operations" && (
            <View style={styles.pillsContainer}>
              {operationsOptions.map((opt) => {
                const isSelected = selectedOperations.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleFilter(opt, selectedOperations, setSelectedOperations)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {t(opt, opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Cuisine Specialization Section */}
        <View style={styles.filterSection}>
          {renderSectionHeader(t("cuisineSpecialization"), selectedCuisines.length, "cuisines")}
          {expandedSection === "cuisines" && (
            <View style={styles.pillsContainer}>
              {cuisinesOptions.map((opt) => {
                const isSelected = selectedCuisines.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleFilter(opt, selectedCuisines, setSelectedCuisines)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {t(opt, opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Business & Brand Development Section */}
        {/* <View style={styles.filterSection}>
          {renderSectionHeader(t("businessBrandDev"), selectedBusiness.length, "business")}
          {expandedSection === "business" && (
            <View style={styles.pillsContainer}>
              {businessOptions.map((opt) => {
                const isSelected = selectedBusiness.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleFilter(opt, selectedBusiness, setSelectedBusiness)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {t(opt, opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View> */}

        <View style={styles.divider} />

        {/* Regional Experience Section */}
        <View style={styles.filterSection}>
          {renderSectionHeader(t("regionalExperience"), selectedRegional.length, "regional")}
          {expandedSection === "regional" && (
            <View style={styles.pillsContainer}>
              {regionalOptions.map((opt) => {
                const isSelected = selectedRegional.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleFilter(opt, selectedRegional, setSelectedRegional)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {t(opt, opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
          <Text style={styles.applyButtonText}>{t("applyfilters")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    borderBottomWidth: 1,
    borderColor: "#f2f2f3",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: normalize(4),
    marginRight: normalize(8),
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0a0504",
  },
  resetButton: {
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(6),
  },
  resetButtonText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#153e69",
  },
  scrollContent: {
    paddingBottom: normalize(34),
  },
  filterSection: {
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleText: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0a0504",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
    marginTop: normalize(10),
  },
  pill: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(18),
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  pillSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: PRIMARY_GREEN,
  },
  pillText: {
    fontSize: normalize(11.5),
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  pillTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#f2f2f3",
  },
  footer: {
    padding: normalize(14),
    borderTopWidth: 1,
    borderColor: "#f2f2f3",
    backgroundColor: "#ffffff",
  },
  applyButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: normalize(10),
    paddingVertical: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: normalize(13.5),
    fontWeight: "700",
  },
});
