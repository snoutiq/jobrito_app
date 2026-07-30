import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import colors from "../constants/colors";
import { ROLES } from "../constants/roles";
import HomeScreen from "../screens/home/HomeScreen";
import ApplicationHistoryScreen from "../screens/applications/ApplicationHistoryScreen";
import PostJobScreen from "../screens/jobs/PostJobScreen";
import PostReferralJobScreen from "../screens/jobs/PostReferralJobScreen";
import ChefConnectDiscoveryScreen from "../screens/chef/ChefConnectDiscoveryScreen";
import ChefConnectFiltersScreen from "../screens/chef/ChefConnectFiltersScreen";
import ChefProfileDetailsScreen from "../screens/chef/ChefProfileDetailsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import TalentSettingsScreen from "../screens/profile/TalentSettingsScreen";
import HelpSupportScreen from "../screens/profile/HelpSupportScreen";
import JobDetailsScreen from "../screens/jobs/JobDetailsScreen";
import ApplicantListScreen from "../screens/employer/ApplicantListScreen";
import ApplicantDetailScreen from "../screens/employer/ApplicantDetailScreen";
import ChefProfileScreen from "../screens/chef/ChefProfileScreen";
import AppointmentRequestsScreen from "../screens/chef/AppointmentRequestsScreen";
import UpcomingConsultationsScreen from "../screens/chef/UpcomingConsultationsScreen";
import CalendlyIntegrationScreen from "../screens/chef/CalendlyIntegrationScreen";
import SocialMediaLinksScreen from "../screens/chef/SocialMediaLinksScreen";
import RoleSwitcherScreen from "../screens/profile/RoleSwitcherScreen";
import LanguageScreen from "../screens/profile/LanguageScreen";
import PersonalInformationScreen from "../screens/profile/PersonalInformationScreen";
import EmployerDashboardScreen from "../screens/employer/EmployerDashboardScreen";
import CompleteProfileScreen from "../screens/profile/CompleteProfileScreen";
import EmployerHomeScreen from "../screens/home/EmployerHomeScreen";
import ChefHomeScreen from "../screens/home/ChefHomeScreen";
import EmployerCompleteProfileScreen from "../screens/employer/EmployerCompleteProfileScreen";
import MyJobsScreen from "../screens/employer/MyJobsScreen";
import EmployerNotificationsScreen from "../screens/employer/EmployerNotificationsScreen";
import ChefCompleteProfileScreen from "../screens/chef/ChefCompleteProfileScreen";
import SavedJobsScreen from "../screens/jobs/SavedJobsScreen";
import SplashScreen from "../screens/auth/SplashScreen";
import ProfileViewsScreen from "../screens/chef/ProfileViewsScreen";
import ProjectRequestsScreen from "../screens/chef/ProjectRequestsScreen";
import { setProfileData } from "../redux/slices/userSlice";
import MyJobDetailsScreen from "../screens/employer/MyJobDetailsScreen";
import NotificationDetailsScreen from "../screens/employer/NotificationDetailsScreen";


const Stack = createNativeStackNavigator();

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
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("profileTab") }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: t("jobDetails") }}
      />
      <Stack.Screen
        name="MyJobDetails"
        component={MyJobDetailsScreen}
        options={{ title: t("jobDetails") }}
      />
      <Stack.Screen
        name="ApplicantList"
        component={ApplicantListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChefProfile"
        component={ChefProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcherScreen}
        options={{ title: t("roleSwitcher") }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ headerShown: false }}
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
      <Stack.Screen
        name="Post Referral Job"
        component={PostReferralJobScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyJobs"
        component={MyJobsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TalentSettings"
        component={TalentSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmployerNotifications"
        component={EmployerNotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationDetails"
        component={NotificationDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole
  );

  const isJobSeeker =
    activeRole === ROLES.JOB_SEEKER || activeRole === "job_seeker";
  const isEmployer = activeRole === ROLES.EMPLOYER || activeRole === "employer";
  const isChef = activeRole === ROLES.CHEF || activeRole === "chef";

  const employerOnboardingCompleted = useSelector(
    (state) => state.user.profile?.employerOnboardingCompleted
  );

  const chefOnboardingCompleted = useSelector(
    (state) => state.user.profile?.chefOnboardingCompleted
  );

  if (isEmployer && !employerOnboardingCompleted) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="EmployerCompleteProfile"
          component={EmployerCompleteProfileScreen}
        />
        <Stack.Screen
          name="EmployerFirstJobPost"
          component={PostJobScreen}
        />
      </Stack.Navigator>
    );
  }

  if (isChef && !chefOnboardingCompleted) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="ChefCompleteProfile"
          component={ChefCompleteProfileScreen}
        />
      </Stack.Navigator>
    );
  }

  if (isJobSeeker) {
    return <HomeOnlyStack key={activeRole ?? "job_seeker"} />;
  }

  let TabsComponent = EmployerHomeScreen; // Default to Employer (no bottom tabs)
  if (isChef) {
    TabsComponent = ChefHomeScreen; // Direct dashboard screen, no bottom tabs!
  } else if (isEmployer) {
    TabsComponent = EmployerHomeScreen;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
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
        name="MyJobDetails"
        component={MyJobDetailsScreen}
        options={{ title: t("jobDetails") }}
      />
      <Stack.Screen
        name="ApplicantList"
        component={ApplicantListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChefProfile"
        component={ChefProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentRequests"
        component={AppointmentRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpcomingConsultations"
        component={UpcomingConsultationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CalendlyIntegration"
        component={CalendlyIntegrationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SocialMediaLinks"
        component={SocialMediaLinksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileViews"
        component={ProfileViewsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProjectRequests"
        component={ProjectRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcherScreen}
        options={{ title: t("roleSwitcher") }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PersonalInformation"
        component={PersonalInformationScreen}
        options={{ title: t("personalInformation") }}
      />
      <Stack.Screen
        name="ChefConnectDiscovery"
        component={ChefConnectDiscoveryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChefConnectFilters"
        component={ChefConnectFiltersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChefProfileDetails"
        component={ChefProfileDetailsScreen}
        options={{ headerShown: false }}
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
      <Stack.Screen
        name="MyJobs"
        component={MyJobsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChefCompleteProfile"
        component={ChefCompleteProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmployerCompleteProfile"
        component={EmployerCompleteProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("profileTab") }}
      />
      <Stack.Screen
        name="Post Job"
        component={PostJobScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Post Referral Job"
        component={PostReferralJobScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Applications"
        component={ApplicationHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SavedJobs"
        component={SavedJobsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmployerNotifications"
        component={EmployerNotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationDetails"
        component={NotificationDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TalentSettings"
        component={TalentSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplicantDetail"
        component={ApplicantDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}



