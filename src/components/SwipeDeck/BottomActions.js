import React from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;

export default function BottomActions({
  onReject,
  onAccept,
  onCall,
  onDetails,
  disabled = false,
}) {
  return (
    <View style={styles.container}>
      {/* Details Button (Medium) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnDetails, disabled && styles.btnDisabled]}
        onPress={onDetails}
        disabled={disabled}
        accessibilityLabel="View applicant details"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Ionicons name="eye" size={IS_SMALL_DEVICE ? 22 : 28} color="#153e69" />
      </TouchableOpacity>

      {/* Accept Button (Large, Green border) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnAccept, disabled && styles.btnDisabled]}
        onPress={onAccept}
        disabled={disabled}
        accessibilityLabel="Shortlist applicant"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={IS_SMALL_DEVICE ? 22 : 28} color="#4CAF50" />
      </TouchableOpacity>

      {/* Call Button (Medium) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnCall, disabled && styles.btnDisabled]}
        onPress={onCall}
        disabled={disabled}
        accessibilityLabel="Call applicant"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Ionicons name="call" size={IS_SMALL_DEVICE ? 22 : 28} color="#153e69" />
      </TouchableOpacity>

      {/* Reject Button (Large, Orange border) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnReject, disabled && styles.btnDisabled]}
        onPress={onReject}
        disabled={disabled}
        accessibilityLabel="Reject applicant"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={IS_SMALL_DEVICE ? 22 : 28} color="#f57f20" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: IS_SMALL_DEVICE ? 14 : 20,
    paddingVertical: IS_SMALL_DEVICE ? 8 : 12,
    width: "100%",
  },
  btn: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    // Soft glass shadows
    shadowColor: "rgba(10, 5, 4, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  btnReject: {
    width: IS_SMALL_DEVICE ? 54 : 64,
    height: IS_SMALL_DEVICE ? 54 : 64,
    borderRadius: IS_SMALL_DEVICE ? 27 : 32,
    borderColor: "#f57f20",
  },
  btnCall: {
    width: IS_SMALL_DEVICE ? 54 : 64,
    height: IS_SMALL_DEVICE ? 54 : 64,
    borderRadius: IS_SMALL_DEVICE ? 27 : 32,
    borderColor: "rgba(21, 62, 105, 0.15)",
  },
  btnDetails: {
    width: IS_SMALL_DEVICE ? 54 : 64,
    height: IS_SMALL_DEVICE ? 54 : 64,
    borderRadius: IS_SMALL_DEVICE ? 27 : 32,
    borderColor: "rgba(21, 62, 105, 0.15)",
  },
  btnAccept: {
    width: IS_SMALL_DEVICE ? 54 : 64,
    height: IS_SMALL_DEVICE ? 54 : 64,
    borderRadius: IS_SMALL_DEVICE ? 27 : 32,
    borderColor: "#4CAF50",
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
