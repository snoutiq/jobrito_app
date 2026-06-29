import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CallbackModal({
  visible,
  onClose,
  onConfirm,
}) {
  const [step, setStep] = useState("select");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("morning");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    { id: "morning", label: "Morning: 9 AM - 12 PM", icon: "sunny-outline" },
    { id: "afternoon", label: "Afternoon: 12 PM - 3 PM", icon: "sunny" },
    { id: "late_afternoon", label: "Late Afternoon: 3 PM - 6 PM", icon: "partly-sunny-outline" },
    { id: "evening", label: "Evening: 6 PM - 9 PM", icon: "moon-outline" },
  ];

  useEffect(() => {
    if (visible) {
      setStep("select");
      setSelectedTimeSlot("morning");
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const success = await onConfirm(selectedTimeSlot);
      if (success) {
        setStep("success");
      }
    } catch (err) {
      console.error("Apply callback error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSlotLabel = (slotId) => {
    if (slotId === "not_specified") return "your preferred time";
    const slot = timeSlots.find((s) => s.id === slotId);
    return slot ? slot.label : "your preferred time";
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {step === "select" ? (
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>When should we call you?</Text>
            <Text style={styles.modalSubtitle}>
              Select a time range that works best for a quick recruiter callback.
            </Text>

            {/* Time Slot Radio List */}
            <View style={styles.slotsList}>
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                    onPress={() => setSelectedTimeSlot(slot.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.slotLeft}>
                      <Ionicons
                        name={slot.icon}
                        size={18}
                        color={isSelected ? "#15803D" : "#64748B"}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.slotLabelText, isSelected && styles.slotLabelTextSelected]}>
                        {slot.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#22C55E" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Confirm time buttons */}
            <TouchableOpacity
              style={[styles.modalConfirmBtn, isSubmitting && styles.modalConfirmBtnDisabled]}
              onPress={isSubmitting ? null : handleConfirm}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmBtnText}>Confirm Time</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSkipBtn, isSubmitting && { opacity: 0.5 }]}
              onPress={isSubmitting ? null : onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.modalContainer, { alignItems: "center", paddingVertical: 28 }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
            </View>
            
            <Text style={[styles.modalTitle, { textAlign: "center", marginBottom: 8 }]}>
              Applied Successfully!
            </Text>
            <Text style={[styles.modalSubtitle, { textAlign: "center", marginBottom: 20 }]}>
              Your application has been submitted. The recruiter will contact you during {"\n"}
              <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                {getSlotLabel(selectedTimeSlot)}
              </Text>.
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { width: "100%", marginTop: 0 }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 20,
  },
  slotsList: {
    gap: 10,
    marginBottom: 20,
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  slotItemSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#F2FBF5",
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  slotLabelTextSelected: {
    color: "#15803D",
    fontWeight: "700",
  },
  modalConfirmBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 8,
  },
  modalConfirmBtnDisabled: {
    backgroundColor: "#A7F3D0",
  },
  modalConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalSkipBtn: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSkipBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
});
