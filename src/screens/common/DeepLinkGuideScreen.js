import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { DEEP_LINK_LIST, handleDeepLinkUrl } from "../../services/deepLinking";
import colors from "../../constants/colors";

export default function DeepLinkGuideScreen() {
  const navigation = useNavigation();

  const handleTestLink = (url) => {
    handleDeepLinkUrl(url);
  };

  const handleCopyLink = (url) => {
    try {
      Clipboard.setString(url);
      Alert.alert("Copied!", `Deep Link copied to clipboard:\n${url}`);
    } catch (e) {
      Alert.alert("Deep Link URL", url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Deep Links</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBanner}>
          <Ionicons name="link-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Backend Notification Setup</Text>
            <Text style={styles.bannerSubtitle}>
              Share these URL formats with your backend developer. When sending push notifications via Firebase / FCM / Expo, include the deep link in the notification payload under {"\"deep_link\""} or {"\"url\""}.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Deep Link Routes</Text>

        {DEEP_LINK_LIST.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.categoryText}>{item.category}</Text>
              <View style={styles.screenBadge}>
                <Text style={styles.screenBadgeText}>{item.screen}</Text>
              </View>
            </View>

            <Text style={styles.urlLabel}>Deep Link URL Scheme:</Text>
            <Text style={styles.urlText}>{item.url}</Text>

            <Text style={styles.urlLabel}>Web URL Format:</Text>
            <Text style={styles.urlText}>{item.webUrl}</Text>

            <Text style={styles.urlLabel}>FCM Payload Data Format:</Text>
            <View style={styles.jsonBox}>
              <Text style={styles.jsonText}>{JSON.stringify(item.payload, null, 2)}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.testBtn}
                activeOpacity={0.8}
                onPress={() => handleTestLink(item.url)}
              >
                <Ionicons name="open-outline" size={16} color="#ffffff" />
                <Text style={styles.testBtnText}>Test Link inside App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.8}
                onPress={() => handleCopyLink(item.url)}
              >
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <Text style={styles.copyBtnText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.1)",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0a0504",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "rgba(21, 62, 105, 0.06)",
    borderColor: "rgba(21, 62, 105, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0504",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0504",
    flex: 1,
  },
  screenBadge: {
    backgroundColor: "#f2f4f7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  screenBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
  },
  urlText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: "rgba(21, 62, 105, 0.04)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  jsonBox: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 10,
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#38bdf8",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 10,
  },
  testBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  copyBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 10,
  },
  copyBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});
