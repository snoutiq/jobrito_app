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

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    // Delay resetting step to select so it doesn't flicker during fade out
    setTimeout(() => {
      setStep("select");
    }, 300);
  };

  const handleSuccessClose = () => {
    handleClose();
  };

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
      onRequestClose={handleClose}
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
                        color={isSelected ? "#153e69" : "rgba(10, 5, 4, 0.6)"}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.slotLabelText, isSelected && styles.slotLabelTextSelected]}>
                        {slot.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#153e69" : "rgba(10, 5, 4, 0.15)"}
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
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.modalConfirmBtnText}>Confirm Time</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSkipBtn, isSubmitting && { opacity: 0.5 }]}
              onPress={isSubmitting ? null : handleClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.modalContainer, { alignItems: "center", paddingVertical: 28 }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#153e69" />
            </View>
            
            <Text style={[styles.modalTitle, { textAlign: "center", marginBottom: 8 }]}>
              Applied Successfully!
            </Text>
            <Text style={[styles.modalSubtitle, { textAlign: "center", marginBottom: 20 }]}>
              Your application has been submitted. The recruiter will contact you during {"\n"}
              <Text style={{ fontWeight: "700", color: "#0a0504" }}>
                {getSlotLabel(selectedTimeSlot)}
              </Text>.
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { width: "100%", marginTop: 0 }]}
              onPress={handleSuccessClose}
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
    backgroundColor: "#ffffff",
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
    color: "#0a0504",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
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
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  slotItemSelected: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  slotLabelTextSelected: {
    color: "#153e69",
    fontWeight: "700",
  },
  modalConfirmBtn: {
    backgroundColor: "#153e69",
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
    color: "#ffffff",
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
    color: "rgba(10, 5, 4, 0.6)",
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

