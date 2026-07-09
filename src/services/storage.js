import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  token: "@jobconnect/token",
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

export const getToken = () => AsyncStorage.getItem(KEYS.token);
export const setToken = (token) => AsyncStorage.setItem(KEYS.token, token);
export const removeToken = () => AsyncStorage.removeItem(KEYS.token);

export const getStoredRole = () => AsyncStorage.getItem(KEYS.role);
export const setStoredRole = (role) => AsyncStorage.setItem(KEYS.role, role);

export const getStoredProfile = async () => {
  const value = await AsyncStorage.getItem(KEYS.profile);
  return value ? JSON.parse(value) : null;
};

export const setStoredProfile = (profile) =>
  AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));

export const getStoredLanguage = () => AsyncStorage.getItem(KEYS.language);
export const setStoredLanguage = (language) =>
  AsyncStorage.setItem(KEYS.language, language);
export const removeStoredLanguage = () => AsyncStorage.removeItem(KEYS.language);

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
  await AsyncStorage.multiRemove([
    KEYS.token,
    KEYS.role,
    KEYS.profile,
    KEYS.language,
    KEYS.seenOnboarding,
    KEYS.seenIntro,
    KEYS.seenRoleSelection,
    KEYS.employerOnboardingCompleted,
    KEYS.chefOnboardingCompleted,
    KEYS.chefOnboardingStep,
  ]);
};

export const clearSession = clearAuthStorage;
