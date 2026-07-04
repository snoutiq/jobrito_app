import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/auth/WelcomeScreen";
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import ChefIntroductionScreen from "../screens/auth/ChefIntroductionScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import OtpScreen from "../screens/auth/OtpScreen";

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Role" component={RoleSelectionScreen} />
      <Stack.Screen name="ChefIntroduction" component={ChefIntroductionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}