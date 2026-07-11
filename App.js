import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import * as Notifications from "expo-notifications";
import "./src/i18n";
import store from "./src/redux/store";
import RootNavigator from "./src/navigation/RootNavigator";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Listen for notifications received while the app is in the foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 [Foreground Notification Received]:", JSON.stringify(notification, null, 2));
      console.log("🔔 [Notification Data]:", JSON.stringify(notification.request.content.data, null, 2));
    });

    // Listen for when a user interacts with/taps a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🔔 [Notification Interacted/Tapped]:", JSON.stringify(response, null, 2));
      console.log("🔔 [Interacted Notification Data]:", JSON.stringify(response.notification.request.content.data, null, 2));
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
