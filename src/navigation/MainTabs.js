import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import colors from "../constants/colors";
import { ROLES } from "../constants/roles";
import HomeScreen from "../screens/home/HomeScreen";
import ApplicationHistoryScreen from "../screens/applications/ApplicationHistoryScreen";
import PostJobScreen from "../screens/jobs/PostJobScreen";
import ChefConnectScreen from "../screens/chef/ChefConnectScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import JobDetailsScreen from "../screens/jobs/JobDetailsScreen";
import ApplicantListScreen from "../screens/employer/ApplicantListScreen";
import ChefProfileScreen from "../screens/chef/ChefProfileScreen";
import RoleSwitcherScreen from "../screens/profile/RoleSwitcherScreen";
import LanguageScreen from "../screens/profile/LanguageScreen";
import PersonalInformationScreen from "../screens/profile/PersonalInformationScreen";
import EmployerDashboardScreen from "../screens/employer/EmployerDashboardScreen";
import CompleteProfileScreen from "../screens/profile/CompleteProfileScreen";
import EmployerHomeScreen from "../screens/home/EmployerHomeScreen";
import ChefHomeScreen from "../screens/home/ChefHomeScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: "#fff",
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "home-outline",
            Applications: "file-tray-full-outline",
            "Post Job": "add-circle-outline",
            ChefConnect: "people-outline",
            Profile: "person-circle-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: t("home"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationHistoryScreen}
        options={{
          headerShown: true,
          title: t("applications"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Post Job"
        component={PostJobScreen}
        options={{
          headerShown: true,
          title: t("postJob"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="ChefConnect"
        component={ChefConnectScreen}
        options={{
          headerShown: true,
          title: t("chefConnect"),
          headerTitleAlign: "center",
          headerTitleContainerStyle: { paddingBottom: 0 },
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: t("profile"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
    </Tab.Navigator>
  );
}

function EmployerTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: "#fff",
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "home-outline",
            Applications: "file-tray-full-outline",
            "Post Job": "add-circle-outline",
            ChefConnect: "people-outline",
            Profile: "person-circle-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={EmployerHomeScreen}
        options={{
          headerShown: true,
          title: t("employerHome"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationHistoryScreen}
        options={{
          headerShown: true,
          title: t("applications"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Post Job"
        component={PostJobScreen}
        options={{
          headerShown: true,
          title: t("postJob"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="ChefConnect"
        component={ChefConnectScreen}
        options={{
          headerShown: true,
          title: t("chefConnect"),
          headerTitleAlign: "center",
          headerTitleContainerStyle: { paddingBottom: 0 },
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: t("profile"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
    </Tab.Navigator>
  );
}

function ChefTabs() {
  const { t } = useTranslation();
  // For now, ChefTabs is the same as EmployerTabs but with a different Home screen.
  // You can customize this further later.
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={ChefHomeScreen} />
      <Tab.Screen name="Applications" component={ApplicationHistoryScreen} />
      <Tab.Screen name="Post Job" component={PostJobScreen} />
      <Tab.Screen name="ChefConnect" component={ChefConnectScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function HomeOnlyStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      initialRouteName="Home" // ← ADD this
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: t("home"),
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("profile") }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: t("jobDetails") }}
      />
      <Stack.Screen
        name="ApplicantList"
        component={ApplicantListScreen}
        options={{ title: t("applicantList") }}
      />
      <Stack.Screen
        name="ChefProfile"
        component={ChefProfileScreen}
        options={{ title: t("chefProfile") }}
      />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcherScreen}
        options={{ title: t("roleSwitcher") }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ title: "Language" }}
      />
      <Stack.Screen
        name="PersonalInformation"
        component={PersonalInformationScreen}
        options={{ title: t("personalInformation") }}
      />
      <Stack.Screen
        name="EmployerDashboard"
        component={EmployerDashboardScreen}
        options={{ title: t("employerDashboard") }}
      />
      <Stack.Screen
        name="CompleteProfileScreen"
        component={CompleteProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  const { t } = useTranslation();
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole
  );

  const isJobSeeker =
    activeRole === ROLES.JOB_SEEKER || activeRole === "job_seeker";
  const isEmployer = activeRole === ROLES.EMPLOYER || activeRole === "employer";
  const isChef = activeRole === ROLES.CHEF || activeRole === "chef";

  if (isJobSeeker) {
    return <HomeOnlyStack key={activeRole ?? "job_seeker"} />;
  }

  let TabsComponent = EmployerTabs; // Default to Employer
  if (isChef) {
    TabsComponent = ChefTabs;
  } else if (isEmployer) {
    TabsComponent = EmployerTabs;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabsComponent}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: t("jobDetails") }}
      />
      <Stack.Screen
        name="ApplicantList"
        component={ApplicantListScreen}
        options={{ title: t("applicantList") }}
      />
      <Stack.Screen
        name="ChefProfile"
        component={ChefProfileScreen}
        options={{ title: t("chefProfile") }}
      />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcherScreen}
        options={{ title: t("roleSwitcher") }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ title: t("language") }}
      />
      <Stack.Screen
        name="PersonalInformation"
        component={PersonalInformationScreen}
        options={{ title: t("personalInformation") }}
      />
      <Stack.Screen
        name="EmployerDashboard"
        component={EmployerDashboardScreen}
        options={{ title: t("employerDashboard") }}
      />
      <Stack.Screen
        name="CompleteProfileScreen"
        component={CompleteProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
