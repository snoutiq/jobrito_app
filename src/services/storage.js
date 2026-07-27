import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  token: "jobconnect_token",
  refreshToken: "jobconnect_refresh_token",
  role: "@jobconnect/role",
  profile: "@jobconnect/profile",
  language: "@jobconnect/language",
  seenOnboarding: "@jobconnect/seen_onboarding",
  seenIntro: "@jobconnect/seen_intro",
  seenRoleSelection: "@jobconnect/seen_role_selection",
  employerOnboardingCompleted: "@jobconnect/employer_onboarding_completed",
  chefOnboardingCompleted: "@jobconnect/chef_onboarding_completed",
  chefOnboardingStep: "@jobconnect/chef_onboarding_step",
};

// Fast In-Memory Cache variables
let cacheToken = null;
let cacheRefreshToken = null;
let cacheRole = null;
let cacheLanguage = null;

export const getToken = async () => {
  if (cacheToken !== null) return cacheToken;
  cacheToken = await SecureStore.getItemAsync(KEYS.token);
  return cacheToken;
};

export const setToken = async (token) => {
  cacheToken = token;
  await SecureStore.setItemAsync(KEYS.token, token);
};

export const removeToken = async () => {
  cacheToken = null;
  await SecureStore.deleteItemAsync(KEYS.token);
};

export const getRefreshToken = async () => {
  if (cacheRefreshToken !== null) return cacheRefreshToken;
  cacheRefreshToken = await SecureStore.getItemAsync(KEYS.refreshToken);
  return cacheRefreshToken;
};

export const setRefreshToken = async (token) => {
  cacheRefreshToken = token;
  await SecureStore.setItemAsync(KEYS.refreshToken, token);
};

export const removeRefreshToken = async () => {
  cacheRefreshToken = null;
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
};

export const getStoredRole = async () => {
  if (cacheRole !== null) return cacheRole;
  cacheRole = await AsyncStorage.getItem(KEYS.role);
  return cacheRole;
};

export const setStoredRole = async (role) => {
  cacheRole = role;
  await AsyncStorage.setItem(KEYS.role, role);
};

export const getStoredProfile = async () => {
  const value = await AsyncStorage.getItem(KEYS.profile);
  return value ? JSON.parse(value) : null;
};

export const setStoredProfile = (profile) =>
  AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));

export const getStoredLanguage = async () => {
  if (cacheLanguage !== null) return cacheLanguage;
  cacheLanguage = await AsyncStorage.getItem(KEYS.language);
  return cacheLanguage;
};

export const setStoredLanguage = async (language) => {
  cacheLanguage = language;
  await AsyncStorage.setItem(KEYS.language, language);
};

export const removeStoredLanguage = async () => {
  cacheLanguage = null;
  await AsyncStorage.removeItem(KEYS.language);
};

export const getSeenOnboarding = () => AsyncStorage.getItem(KEYS.seenOnboarding);
export const setSeenOnboarding = () =>
  AsyncStorage.setItem(KEYS.seenOnboarding, "true");
export const removeSeenOnboarding = () => AsyncStorage.removeItem(KEYS.seenOnboarding);

export const getSeenIntro = () => AsyncStorage.getItem(KEYS.seenIntro);
export const setSeenIntro = () => AsyncStorage.setItem(KEYS.seenIntro, "true");
export const removeSeenIntro = () => AsyncStorage.removeItem(KEYS.seenIntro);

export const getSeenRoleSelection = () =>
  AsyncStorage.getItem(KEYS.seenRoleSelection);
export const setSeenRoleSelection = () =>
  AsyncStorage.setItem(KEYS.seenRoleSelection, "true");
export const removeSeenRoleSelection = () =>
  AsyncStorage.removeItem(KEYS.seenRoleSelection);

export const getEmployerOnboardingCompleted = () =>
  AsyncStorage.getItem(KEYS.employerOnboardingCompleted);
export const setEmployerOnboardingCompleted = () =>
  AsyncStorage.setItem(KEYS.employerOnboardingCompleted, "true");
export const removeEmployerOnboardingCompleted = () =>
  AsyncStorage.removeItem(KEYS.employerOnboardingCompleted);

export const getChefOnboardingCompleted = () =>
  AsyncStorage.getItem(KEYS.chefOnboardingCompleted);
export const setChefOnboardingCompleted = () =>
  AsyncStorage.setItem(KEYS.chefOnboardingCompleted, "true");
export const removeChefOnboardingCompleted = () =>
  AsyncStorage.removeItem(KEYS.chefOnboardingCompleted);

export const getChefOnboardingStep = () =>
  AsyncStorage.getItem(KEYS.chefOnboardingStep);
export const setChefOnboardingStep = (step) =>
  AsyncStorage.setItem(KEYS.chefOnboardingStep, String(step));
export const removeChefOnboardingStep = () =>
  AsyncStorage.removeItem(KEYS.chefOnboardingStep);

export const clearAuthStorage = async () => {
  // Reset In-Memory Cache
  cacheToken = null;
  cacheRefreshToken = null;
  cacheRole = null;
  cacheLanguage = null;

  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.token),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    AsyncStorage.multiRemove([
      KEYS.role,
      KEYS.profile,
      KEYS.language,
      KEYS.seenOnboarding,
      KEYS.seenIntro,
      KEYS.seenRoleSelection,
      KEYS.employerOnboardingCompleted,
      KEYS.chefOnboardingCompleted,
      KEYS.chefOnboardingStep,
    ]),
  ]);
};

export const clearSession = clearAuthStorage;
