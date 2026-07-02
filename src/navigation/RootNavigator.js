import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import i18n from "../i18n";

import SplashScreen from "../screens/auth/SplashScreen";
import OnboardingNavigator from "./OnboardingNavigator";
import MainTabs from "./MainTabs";
import { CustomAlertComponent, registerAlertRef } from "../components/common/CustomAlert";

import {
  getStoredLanguage,
  getStoredProfile,
  getStoredRole,
  getToken,
} from "../services/storage";

import {
  setActiveRole,
  setProfileData,
} from "../redux/slices/userSlice";

import { setTokenState } from "../redux/slices/authSlice";

export default function RootNavigator() {
  const dispatch = useDispatch();

  const reduxToken = useSelector((state) => state.auth.token);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole
  );
  const sessionResetKey = useSelector(
    (state) => state.auth.sessionResetKey
  );

  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const [
          token,
          role,
          profile,
          language,
        ] = await Promise.all([
          getToken(),
          getStoredRole(),
          getStoredProfile(),
          getStoredLanguage(),
        ]);

        if (!mounted) return;

        if (token) {
          dispatch(setTokenState(token));
        }

        if (role) {
          dispatch(setActiveRole(role));
        }

        if (profile) {
          dispatch(setProfileData(profile));
        }

        if (language) {
          await i18n.changeLanguage(language);
        }

      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [dispatch, sessionResetKey]);

  if (bootstrapping) {
    return <SplashScreen />;
  }

  if (reduxToken && !activeRole) return <SplashScreen />;

  if (reduxToken) {
    console.log("RootNavigator -> MainTabs", reduxToken);
    return (
      <>
        <MainTabs key="main" />
        <CustomAlertComponent ref={registerAlertRef} />
      </>
    );
  }

  console.log("RootNavigator -> Onboarding");
  return (
    <>
      <OnboardingNavigator key="onboarding" />
      <CustomAlertComponent ref={registerAlertRef} />
    </>
  );
}
