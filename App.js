import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import * as Notifications from "expo-notifications";
import "./src/i18n";
import store from "./src/redux/store";
import RootNavigator from "./src/navigation/RootNavigator";
import { Text, TextInput, Modal, View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold
} from "@expo-google-fonts/instrument-sans";

// Map font weights to specific Instrument Sans fonts
const getFontFamilyForWeight = (weight) => {
  if (weight === "bold" || weight === "700" || weight === "800" || weight === "900") return "InstrumentSans_700Bold";
  if (weight === "500") return "InstrumentSans_500Medium";
  if (weight === "600") return "InstrumentSans_600SemiBold";
  return "InstrumentSans_400Regular";
};

// Monkey patch Text render to automatically apply Inter font based on weight
if (Text.render) {
  const originalTextRender = Text.render;
  Text.render = function (...args) {
    const origin = originalTextRender.apply(this, args);
    const style = origin.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : (style || {});
    const fontFamily = getFontFamilyForWeight(flatStyle.fontWeight);
    return React.cloneElement(origin, {
      style: [{ fontFamily }, style],
    });
  };
} else {
  if (!Text.defaultProps) Text.defaultProps = {};
  Text.defaultProps.style = { fontFamily: "InstrumentSans_400Regular", ...Text.defaultProps.style };
}

// Monkey patch TextInput render to automatically apply Inter font based on weight
if (TextInput.render) {
  const originalTextInputRender = TextInput.render;
  TextInput.render = function (...args) {
    const origin = originalTextInputRender.apply(this, args);
    const style = origin.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : (style || {});
    const fontFamily = getFontFamilyForWeight(flatStyle.fontWeight);
    return React.cloneElement(origin, {
      style: [{ fontFamily }, style],
    });
  };
} else {
  if (!TextInput.defaultProps) TextInput.defaultProps = {};
  TextInput.defaultProps.style = { fontFamily: "InstrumentSans_400Regular", ...TextInput.defaultProps.style };
}


// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  const [showModal, setShowModal] = React.useState(false);

  useEffect(() => {
    async function checkPermission() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus === 'granted') {
          return;
        }
        const prompted = await AsyncStorage.getItem("@notification_modal_prompted");
        if (prompted === "true") {
          return;
        }
        setShowModal(true);
      } catch (err) {
        console.warn("Error checking notification permissions:", err);
      }
    }
    const timer = setTimeout(checkPermission, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if the app was opened by a notification when it was closed/killed
    async function checkInitialNotification() {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          console.log("🔔 [App opened from killed state by notification]:", JSON.stringify(response, null, 2));
          const checkReady = setInterval(() => {
            if (navigationRef.isReady()) {
              clearInterval(checkReady);
              navigationRef.navigate("EmployerNotifications");
            }
          }, 250);
          setTimeout(() => clearInterval(checkReady), 10000);
        }
      } catch (err) {
        console.warn("Failed to check last notification response:", err);
      }
    }
    checkInitialNotification();

    // Listen for notifications received while the app is in the foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 [Foreground Notification Received]:", JSON.stringify(notification, null, 2));
      console.log("🔔 [Notification Data]:", JSON.stringify(notification.request.content.data, null, 2));
    });

    // Listen for when a user interacts with/taps a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🔔 [Notification Interacted/Tapped]:", JSON.stringify(response, null, 2));
      console.log("🔔 [Interacted Notification Data]:", JSON.stringify(response.notification.request.content.data, null, 2));
      
      try {
        if (navigationRef.isReady()) {
          navigationRef.navigate("EmployerNotifications");
        } else {
          const checkReady = setInterval(() => {
            if (navigationRef.isReady()) {
              clearInterval(checkReady);
              navigationRef.navigate("EmployerNotifications");
            }
          }, 250);
          setTimeout(() => clearInterval(checkReady), 10000);
        }
      } catch (err) {
        console.warn("Failed to navigate on notification tap:", err);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            "Update Available",
            "A new version of the app is available. Would you like to update and reload now?",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Update Now",
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (error) {
                    Alert.alert("Error", "Could not download the update. Please try again.");
                  }
                }
              }
            ]
          );
        }
      } catch (error) {
        // ignore update errors in development environment
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
        <Image
          source={require("./src/assets/Jobrito full logo.png")}
          style={{ width: 350, height: 150 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="dark" />
            <RootNavigator />

            <Modal
              visible={showModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <View style={styles.bellIconCircle}>
                    <Ionicons name="notifications-outline" size={32} color="#153e69" />
                  </View>
                  
                  <Text style={styles.modalTitle}>Enable Push Notifications</Text>
                  <Text style={styles.modalSubtitle}>
                    Stay updated on job matches, application responses, and direct recruiter messages in real-time.
                  </Text>

                  <TouchableOpacity
                    style={styles.allowButton}
                    activeOpacity={0.8}
                    onPress={async () => {
                      try {
                        const { status } = await Notifications.requestPermissionsAsync();
                        console.log("Notification permission status:", status);
                      } catch (e) {
                        console.warn(e);
                      } finally {
                        try {
                          await AsyncStorage.setItem("@notification_modal_prompted", "true");
                        } catch (err) {}
                        setShowModal(false);
                      }
                    }}
                  >
                    <Text style={styles.allowButtonText}>Allow Notifications</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipButton}
                    activeOpacity={0.7}
                    onPress={async () => {
                      try {
                        await AsyncStorage.setItem("@notification_modal_prompted", "true");
                      } catch (err) {}
                      setShowModal(false);
                    }}
                  >
                    <Text style={styles.skipButtonText}>Maybe Later</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </NavigationContainer>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 5, 4, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  bellIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 24,
    textAlign: "center",
  },
  allowButton: {
    backgroundColor: "#153e69",
    width: "100%",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#153e69",
  },
  allowButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  skipButton: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
});
