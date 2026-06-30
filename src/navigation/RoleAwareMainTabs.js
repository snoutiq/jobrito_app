import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import SavedJobsScreen from "../screens/jobs/SavedJobsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
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
          title: "Home",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationHistoryScreen}
        options={{
          headerShown: true,
          title: "Applications",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Tab.Screen
        name="Post Job"
        component={PostJobScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ChefConnect"
        component={ChefConnectScreen}
        options={{
          headerShown: true,
          title: "Chef",
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
          title: "Profile",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
    </Tab.Navigator>
  );
}

function HomeOnlyStack() {
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
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          title: "Home",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: "Job Details" }}
      />
      <Stack.Screen
        name="ApplicantList"
        component={ApplicantListScreen}
        options={{ title: "Applicants" }}
      />
      <Stack.Screen
        name="ChefProfile"
        component={ChefProfileScreen}
        options={{ title: "Chef Profile" }}
      />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcherScreen}
        options={{ title: "Switch Role" }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ title: "Language" }}
      />
      <Stack.Screen
        name="PersonalInformation"
        component={PersonalInformationScreen}
        options={{ title: "Personal Information" }}
      />
      <Stack.Screen
        name="EmployerDashboard"
        component={EmployerDashboardScreen}
        options={{ title: "Employer Dashboard" }}
      />
      <Stack.Screen
        name="Applications"
        component={ApplicationHistoryScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SavedJobs"
        component={SavedJobsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Post Job"
        component={PostJobScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function RoleAwareMainTabs() {
  const activeRole =
    useSelector((state) => state.auth.user?.active_role) ||
    useSelector((state) => state.user.activeRole);
  const isJobSeeker =
    activeRole === ROLES.JOB_SEEKER || activeRole === "job_seeker";

  if (isJobSeeker) {
    return <HomeOnlyStack />;
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
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: "Job Details" }}
      />
      <Stack.Screen
        name="ApplicantList"
        component={ApplicantListScreen}
        options={{ title: "Applicants" }}
      />
      <Stack.Screen
        name="ChefProfile"
        component={ChefProfileScreen}
        options={{ title: "Chef Profile" }}
      />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcherScreen}
        options={{ title: "Switch Role" }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ title: "Language" }}
      />
      <Stack.Screen
        name="PersonalInformation"
        component={PersonalInformationScreen}
        options={{ title: "Personal Information" }}
      />
      <Stack.Screen
        name="EmployerDashboard"
        component={EmployerDashboardScreen}
        options={{ title: "Employer Dashboard" }}
      />
    </Stack.Navigator>
  );
}
