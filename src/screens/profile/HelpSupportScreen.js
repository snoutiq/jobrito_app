import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#153e69";

export default function HelpSupportScreen({ navigation }) {
  const { t } = useTranslation();
  const supportPhone = "+91 99999 99999";
  const supportEmail = "support@jobrito.com";

  const handleCall = () => {
    Linking.openURL(`tel:${supportPhone}`).catch(() => {
      CustomAlert.show("Error", "Call dialer could not be opened.");
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${supportEmail}`).catch(() => {
      CustomAlert.show("Error", "Mail client could not be opened.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("helpSupportTitle")}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          {t("helpSupportSubtitle")}
        </Text>

        {/* Contact Cards */}
        <View style={styles.contactGroup}>
          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={handleCall}
          >
            <View style={[styles.iconBox, { backgroundColor: "#e7eff7" }]}>
              <Ionicons name="call-outline" size={22} color={PRIMARY_GREEN} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t("callUs")}</Text>
              <Text style={styles.contactValue}>{supportPhone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={handleEmail}
          >
            <View style={[styles.iconBox, { backgroundColor: "#EEF4FF" }]}>
              <Ionicons name="mail-outline" size={22} color="#153e69" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t("emailSupport")}</Text>
              <Text style={styles.contactValue}>{supportEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          {t("supportHours")}
        </Text>
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
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0a0504",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  contactGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 24,
    overflow: "hidden",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.4)",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: 16,
  },
  footerNote: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.4)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
