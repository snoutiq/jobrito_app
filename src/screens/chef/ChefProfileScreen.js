import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";

export default function ChefProfileScreen({ route }) {
  const chef = route?.params?.chef;

  const handleCalendly = () => {
    if (chef?.calendlyUrl) {
      Linking.openURL(chef.calendlyUrl);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.card}>
        <View style={styles.photo}>
          <Text style={styles.photoText}>{chef?.name?.charAt(0) || "C"}</Text>
        </View>
        <Text style={styles.title}>{chef?.name}</Text>
        <Text style={styles.subtitle}>{chef?.specialty}</Text>
        <Text style={styles.meta}>Experience: {chef?.experience}</Text>
        <Text style={styles.meta}>City: {chef?.city}</Text>
        <Text style={styles.meta}>Mobile: {chef?.mobile}</Text>
        <Text style={styles.meta}>Email: {chef?.email}</Text>
        <Text style={styles.meta}>Availability: {chef?.availability}</Text>
        <Text style={styles.bio}>{chef?.bio}</Text>
        <AppButton title="Open Calendly Link" onPress={handleCalendly} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoText: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  bio: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
});
