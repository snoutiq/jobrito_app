import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#153e69";

export default function HelpSupportScreen({ navigation }) {
  const { t } = useTranslation();
  const supportEmail = "jobritoapp@gmail.com";

  const handleEmail = () => {
    Linking.openURL(`mailto:${supportEmail}`).catch(() => {
      CustomAlert.show("Error", "Mail client could not be opened.");
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("helpAndSupport", "HELP & SUPPORT")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>{t("needHelpQuestion", "Need help or have a question?")}</Text>
          <Text style={styles.introSub}>{t("supportAssistText", "Our support team is here to assist you.")}</Text>
        </View>

        {/* Support Section Card */}
        <View style={styles.sectionCard}>
          {/* Email Support */}
          <TouchableOpacity
            style={styles.cardRow}
            activeOpacity={0.8}
            onPress={handleEmail}
          >
            <View style={[styles.iconBox, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
              <Ionicons name="mail-outline" size={22} color={PRIMARY_GREEN} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{t("emailSupport", "Email Support")}</Text>
              <Text style={styles.emailValue}>{supportEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Support Hours */}
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="time-outline" size={22} color="#F97316" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{t("supportHoursTitle", "Support Hours")}</Text>
              <Text style={styles.valueTitle}>{t("supportDays", "Monday – Saturday")}</Text>
              <Text style={styles.valueSub}>{t("supportTimings", "10:00 AM – 6:00 PM IST")}</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0a0504",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  introCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 18,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  introSub: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  emailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY_GREEN,
    textDecorationLine: "underline",
  },
  valueTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.8)",
  },
  valueSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
  },
});
