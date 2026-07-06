import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const PRIMARY_GREEN = "#22C55E";

export default function ChefConnectFiltersScreen({ navigation, route }) {
  const { t } = useTranslation();

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
    navigation.navigate("ChefConnectDiscovery", { filters: appliedFilters });
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
          color={isExpanded ? PRIMARY_GREEN : "#64748B"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("chefConnectFilters")}</Text>
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
                      {opt}
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
                      {opt}
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
                      {opt}
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
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Business & Brand Development Section */}
        <View style={styles.filterSection}>
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
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

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
                      {opt}
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
          <Text style={styles.applyButtonText}>{t("applyFilters")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  pillSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: PRIMARY_GREEN,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  pillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  applyButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
