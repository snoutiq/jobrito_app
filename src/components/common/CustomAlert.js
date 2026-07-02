import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Global reference holder for triggering the alert from anywhere
let customAlertRef = null;

export const registerAlertRef = (ref) => {
  customAlertRef = ref;
};

// Static helper object that matches React Native's Alert API
export const CustomAlert = {
  show: (title, message, buttons = []) => {
    if (customAlertRef) {
      customAlertRef.show(title, message, buttons);
    } else {
      // Fallback if ref is not mounted yet
      const { Alert } = require("react-native");
      Alert.alert(title, message, buttons);
    }
  },
};

// CustomAlertComponent to be placed at the root level of the app (e.g. in RootNavigator or App)
export const CustomAlertComponent = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState([]);

  useImperativeHandle(ref, () => ({
    show: (newTitle, newMessage, newButtons = []) => {
      setTitle(newTitle);
      setMessage(newMessage);
      setButtons(newButtons.length > 0 ? newButtons : [{ text: "OK", onPress: () => {} }]);
      setVisible(true);
    },
  }));

  const handleButtonPress = (onPressCallback) => {
    setVisible(false);
    if (onPressCallback) {
      // Run callback after modal hides to avoid transition conflicts
      setTimeout(() => {
        onPressCallback();
      }, 100);
    }
  };

  const getAlertIcon = () => {
    const lowercaseTitle = title.toLowerCase();
    const lowercaseMessage = message.toLowerCase();

    // Check if error/delete/close/remove related
    if (
      lowercaseTitle.includes("error") ||
      lowercaseTitle.includes("failed") ||
      lowercaseTitle.includes("delete") ||
      lowercaseTitle.includes("close") ||
      lowercaseTitle.includes("remove") ||
      lowercaseTitle.includes("cancel") ||
      lowercaseMessage.includes("error") ||
      lowercaseMessage.includes("failed")
    ) {
      return <Ionicons name="alert-circle" size={44} color="#EF4444" />;
    }
    // Check if success/complete related
    if (
      lowercaseTitle.includes("success") ||
      lowercaseTitle.includes("complete") ||
      lowercaseTitle.includes("done") ||
      lowercaseTitle.includes("save") ||
      lowercaseMessage.includes("success") ||
      lowercaseMessage.includes("complete")
    ) {
      return <Ionicons name="checkmark-circle" size={44} color="#10B981" />;
    }
    // Default info icon
    return <Ionicons name="information-circle" size={44} color="#3B82F6" />;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.alertCard}>
          <View style={styles.iconContainer}>
            {getAlertIcon()}
          </View>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          <View style={[styles.buttonWrapper, buttons.length > 2 && styles.buttonWrapperVertical]}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";

              let btnStyle = styles.defaultBtn;
              let txtStyle = styles.defaultBtnText;

              if (isDestructive) {
                btnStyle = styles.destructiveBtn;
                txtStyle = styles.destructiveBtnText;
              } else if (isCancel) {
                btnStyle = styles.cancelBtn;
                txtStyle = styles.cancelBtnText;
              }

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  style={[styles.btn, btnStyle]}
                  onPress={() => handleButtonPress(btn.onPress)}
                >
                  <Text style={[styles.btnText, txtStyle]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  iconContainer: {
    marginBottom: 14,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonWrapper: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  buttonWrapperVertical: {
    flexDirection: "column",
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "800",
  },
  defaultBtn: {
    backgroundColor: "#22C55E",
  },
  defaultBtnText: {
    color: "#FFFFFF",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: {
    color: "#475569",
  },
  destructiveBtn: {
    backgroundColor: "#EF4444",
  },
  destructiveBtnText: {
    color: "#FFFFFF",
  },
});
