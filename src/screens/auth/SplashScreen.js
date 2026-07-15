import React from "react";
import { StyleSheet, Image } from "react-native";
import colors from "../../constants/colors";
import AppLoader from "../../components/common/AppLoader";
import ScreenWrapper from "../../components/common/ScreenWrapper";

export default function SplashScreen() {
  return (
    <ScreenWrapper scroll={false} contentStyle={styles.container}>
      <Image
        source={require("../../assets/Jobrito full logo.png")}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <AppLoader label="Loading..." />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  logoImage: {
    width: 350,
    height: 150,
    alignSelf: "center",
    marginBottom: 20,
  },
});
