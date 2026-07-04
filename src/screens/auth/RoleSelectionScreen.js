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
      style={{ backgroundColor: "#F7F9FB" }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <Image
          source={{ uri: chefGroupImage }}
          style={styles.heroImage}
          resizeMode="cover"
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
                <Ionicons name={getRoleIcon(role)} size={22} color={active ? "#FFFFFF" : "#22C55E"} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                  {t(`roleSelection.${role.toLowerCase().replace(" ", "")}`)}
                </Text>
                <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                  {t(`roleSelection.description.${role.toLowerCase().replace(" ", "")}`)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={active ? "#22C55E" : "#cbd5e1"} />
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
    backgroundColor: "#F7F9FB",
  },
  hero: {
    alignItems: "center",
    marginBottom: 8,
  },
  heroImage: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
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
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionCardInactive: {
    borderColor: "#e2e8f0",
    shadowColor: "transparent",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E6F7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconCircleActive: {
    backgroundColor: "#22C55E",
  },
  optionText: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  optionTitleActive: {
    color: "#15803d",
  },
  optionDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  optionDescActive: {
    color: "#166534",
  },
});
