import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";

const PRIMARY_GREEN = "#22C55E";

const NOTIFICATIONS = [];

export default function EmployerNotificationsScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Ionicons name="notifications-outline" size={22} color={PRIMARY_GREEN} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>{t("notifications", "Notifications")}</Text>
              <Text style={styles.summaryText}>
                Stay updated on applicants, profile status, and job posts.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <View style={[styles.iconWrap, { backgroundColor: `${item.tint}1A` }]}>
              <Ionicons name={item.icon} size={22} color={item.tint} />
            </View>
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>You will see applicant and job updates here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  summaryText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  notificationCard: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  itemTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  time: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  message: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
  },
});


