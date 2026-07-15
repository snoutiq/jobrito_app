import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { ROLE_LIST, ROLES } from "../../constants/roles";
import { setActiveRole } from "../../redux/slices/userSlice";
import { getStoredLanguage, setStoredRole } from "../../services/storage";
import { setSeenRoleSelection } from "../../services/storage";

const chefGroupImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuABCVpzBFOuuIbQlQ-a1EzsPrSmAJ_09nJyJ0ducLegQTYzeixlmVz7dss05JjXB1ytoWOzZoXrzlNVbZdrPtaNN7rOv2DWU5Dkj4hBv2DbJPn1-IOlzIcP5QTCfsiDJaWB-HUEJU_MOc1ffbiTQZebvMAcZRKYqZww3rJGBzhaWaEFHZBLfflIZE2wcaBYukFPrGryvk4hU5OiPZ-VSWJvdprV4L8BUimOYP3A-VguJM_cD_VSrLIKBZugQDi0L4F2HQ40nBprtmM3";

export default function RoleSelectionScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const storedRole = useSelector((state) => state.user.activeRole);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const checkStoredLanguage = async () => {
      const language = await getStoredLanguage();
      console.log("Language stored in AsyncStorage:", language);
    };

    checkStoredLanguage();
  }, []);

  const handleSelect = async (role) => {
    setSelectedRole(role);
    dispatch(setActiveRole(role));
    await setStoredRole(role);
    await setSeenRoleSelection();
    
    // Tiny delay so the user can see the green selection highlight before transitioning
    setTimeout(() => {
      if (role === ROLES.CHEF) {
        navigation.navigate("ChefIntroduction");
      } else {
        navigation.navigate("Login");
      }
    }, 250);
  };

  const displayOrder = [ROLES.CHEF, ROLES.JOB_SEEKER, ROLES.EMPLOYER];

  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.CHEF:
        return "restaurant";
      case ROLES.JOB_SEEKER:
        return "briefcase";
      case ROLES.EMPLOYER:
        return "add-circle-outline";
      default:
        return "person";
    }
  };

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#f2f2f3" }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/Jobrito full logo.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t("intro.title")}</Text>
        <Text style={styles.subtitle}>{t("intro.subtitle")}</Text>
      </View>

      <View style={styles.cardContainer}>
        {displayOrder.map((role) => {
          const active = selectedRole === role;
          return (
            <Pressable
              key={role}
              onPress={() => handleSelect(role)}
              style={[
                styles.optionCard,
                active ? styles.optionCardActive : styles.optionCardInactive,
              ]}
            >
              <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                <Ionicons name={getRoleIcon(role)} size={22} color={active ? "#ffffff" : "#153e69"} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                  {t(`roleSelection.${role.toLowerCase().replace(/_/g, "").replace(" ", "")}`)}
                </Text>
                <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                  {t(`roleSelection.description.${role.toLowerCase().replace(/_/g, "").replace(" ", "")}`)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={active ? "#153e69" : "rgba(10, 5, 4, 0.15)"} />
            </Pressable>
          );
        })}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 24,
    backgroundColor: "#f2f2f3",
  },
  hero: {
    alignItems: "center",
    marginBottom: 8,
  },
  heroImage: {
    width: 350,
    height: 150,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0a0504",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  cardContainer: {
    gap: 4,
    marginBottom: 16,
    paddingTop: 8,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionCardActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  optionCardInactive: {
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e7eff7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconCircleActive: {
    backgroundColor: "#153e69",
  },
  optionText: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  optionTitleActive: {
    color: "#153e69",
  },
  optionDesc: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  optionDescActive: {
    color: "#153e69",
  },
});
