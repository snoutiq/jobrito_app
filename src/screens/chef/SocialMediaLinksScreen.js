import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  ActivityIndicator,
  Clipboard,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import colors from "../../constants/colors";
import { setProfileData } from "../../redux/slices/userSlice";
import { setStoredProfile } from "../../services/storage";
import { saveChefOnboarding } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY = "#153e69";
const SECONDARY = "#f2f2f3";
const NEUTRAL = "#0a0504";

export default function SocialMediaLinksScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  // Custom Social Links States
  const [customSocialLinks, setCustomSocialLinks] = useState([]);
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState("");
  const [customPlatformName, setCustomPlatformName] = useState("");
  const [tempLink, setTempLink] = useState("");

  const extractUsername = (url, platform) => {
    if (!url) return "";
    let cleaned = url.trim().replace(/\/$/, ""); // remove trailing slash
    
    // Remove protocol
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?/, "");
    
    if (platform === "linkedin") {
      cleaned = cleaned.replace(/^linkedin\.com\/in\//i, "");
    } else if (platform === "instagram") {
      cleaned = cleaned.replace(/^instagram\.com\//i, "");
    } else if (platform === "facebook") {
      cleaned = cleaned.replace(/^facebook\.com\//i, "");
    } else if (platform === "twitter") {
      cleaned = cleaned.replace(/^(twitter|x)\.com\//i, "");
    } else if (platform === "youtube") {
      cleaned = cleaned.replace(/^youtube\.com\/(@|c\/)?/i, "");
    }
    
    return cleaned;
  };

  const handleInputChange = (text, platform, setter) => {
    const username = extractUsername(text, platform);
    setter(username);
  };

  useEffect(() => {
    if (profile) {
      if (profile.linkedin) setLinkedin(extractUsername(profile.linkedin, "linkedin"));
      if (profile.instagram) setInstagram(extractUsername(profile.instagram, "instagram"));
      if (profile.facebook) setFacebook(extractUsername(profile.facebook, "facebook"));
      if (profile.twitter) setTwitter(extractUsername(profile.twitter, "twitter"));
      if (profile.youtube) setYoutube(extractUsername(profile.youtube, "youtube"));
      if (profile.website || profile.portfolio) setWebsite(profile.website || profile.portfolio);

      // Load custom social links from profile response
      const standardKeys = ["linkedin", "instagram", "facebook", "twitter", "youtube", "website", "portfolio", "calendly", "calendly_link"];
      const socialsObj = profile.socials || {};
      const foundCustoms = [];
      Object.keys(socialsObj).forEach((k) => {
        if (!standardKeys.includes(k.toLowerCase()) && socialsObj[k]) {
          foundCustoms.push({
            id: k,
            platform: k.charAt(0).toUpperCase() + k.slice(1),
            link: socialsObj[k]
          });
        }
      });
      setCustomSocialLinks(foundCustoms);
    }
  }, [profile]);

  const connectedCount = [linkedin, instagram, facebook, twitter, youtube, website].filter(
    (item) => item && item.trim().length > 0
  ).length;

  const handleTestLink = (value, platform) => {
    if (!value || !value.trim()) return;
    let url = value.trim();
    if (platform === "linkedin") {
      url = `https://linkedin.com/in/${url}`;
    } else if (platform === "instagram") {
      url = `https://instagram.com/${url}`;
    } else if (platform === "facebook") {
      url = `https://facebook.com/${url}`;
    } else if (platform === "twitter") {
      url = `https://x.com/${url}`;
    } else if (platform === "youtube") {
      url = `https://youtube.com/@${url}`;
    } else {
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
    }
    Linking.openURL(url).catch((err) => {
      CustomAlert.show(t("error", "Error"), "Could not open URL: " + err.message);
    });
  };



  const handleSaveSocialLinks = async () => {
    const formatUrl = (val, platform) => {
      if (!val || !val.trim()) return "";
      let cleaned = val.trim().replace(/\s+/g, "");
      if (platform === "linkedin") {
        return `https://linkedin.com/in/${cleaned.replace(/^\//, "")}`;
      } else if (platform === "instagram") {
        return `https://instagram.com/${cleaned.replace(/^\//, "")}`;
      } else if (platform === "facebook") {
        return `https://facebook.com/${cleaned.replace(/^\//, "")}`;
      } else if (platform === "twitter") {
        return `https://x.com/${cleaned.replace(/^\//, "")}`;
      } else if (platform === "youtube") {
        return `https://youtube.com/@${cleaned.replace(/^@|^\//, "")}`;
      } else {
        if (!/^https?:\/\//i.test(cleaned)) {
          cleaned = "https://" + cleaned;
        }
        return cleaned;
      }
    };

    const updatedSocials = {
      linkedin: formatUrl(linkedin, "linkedin"),
      instagram: formatUrl(instagram, "instagram"),
      facebook: formatUrl(facebook, "facebook"),
      twitter: formatUrl(twitter, "twitter"),
      youtube: formatUrl(youtube, "youtube"),
      website: formatUrl(website, "website"),
    };

    setLoading(true);
    try {
      // 1. Dispatch Redux store update
      const updatedProfilePayload = {
        ...profile,
        ...updatedSocials,
        customSocialLinks,
      };
      dispatch(setProfileData({ ...updatedSocials, customSocialLinks }));

      // 2. Update local storage
      await setStoredProfile(updatedProfilePayload);

      // 3. Update server API
      const formData = new FormData();
      Object.keys(updatedSocials).forEach((key) => {
        const val = updatedSocials[key] || "";
        formData.append(key, val);
        formData.append(`${key}_link`, val);
        formData.append(`${key}Link`, val);
      });

      // Append custom social links to FormData
      customSocialLinks.forEach((item) => {
        const key = item.platform.toLowerCase();
        formData.append(key, item.link);
        formData.append(`${key}_link`, item.link);
        formData.append(`${key}Link`, item.link);
      });

      await saveChefOnboarding(formData).catch(() => null);

      CustomAlert.show(
        t("success", "Success"),
        t("socials.successSave", "Your social media and portfolio links have been saved successfully! Recruiters can now view your public profiles."),
        [
          {
            text: t("great", "Great"),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save social links:", error);
      CustomAlert.show(t("error", "Error"), error?.message || t("socials.failedSave", "Failed to save social links."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={NEUTRAL} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t("socials.title", "Social Media Links")}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="sparkles" size={22} color={PRIMARY} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t("socials.title", "Social Media Links")}</Text>
            <Text style={styles.infoSubtitle}>
              {t("socials.subtitle", "Connect your social profiles to increase your visibility to top employers.")}
            </Text>
          </View>
        </View>

        {/* Input Fields Card */}
        <View style={styles.formCard}>
          {/* LinkedIn */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-linkedin" size={18} color="#0077b5" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>{t("socials.labelLinkedIn", "LinkedIn Profile")}</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "linkedin" && styles.inputWrapperActive]}>
              <Text style={styles.prefixText}>linkedin.com/in/</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("socials.placeholderLinkedIn", "your-profile")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={linkedin}
                onChangeText={(text) => handleInputChange(text, "linkedin", setLinkedin)}
                onFocus={() => setActiveInput("linkedin")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {linkedin ? (
                <TouchableOpacity onPress={() => handleTestLink(linkedin, "linkedin")} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Instagram */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-instagram" size={18} color="#e1306c" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>{t("socials.labelInstagram", "Instagram (Food Portfolio)")}</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "instagram" && styles.inputWrapperActive]}>
              <Text style={styles.prefixText}>instagram.com/</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("socials.placeholderInstagram", "chef_username")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={instagram}
                onChangeText={(text) => handleInputChange(text, "instagram", setInstagram)}
                onFocus={() => setActiveInput("instagram")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {instagram ? (
                <TouchableOpacity onPress={() => handleTestLink(instagram, "instagram")} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Facebook */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-facebook" size={18} color="#1877f2" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>{t("socials.labelFacebook", "Facebook Page")}</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "facebook" && styles.inputWrapperActive]}>
              <Text style={styles.prefixText}>facebook.com/</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("socials.placeholderFacebook", "your-page")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={facebook}
                onChangeText={(text) => handleInputChange(text, "facebook", setFacebook)}
                onFocus={() => setActiveInput("facebook")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {facebook ? (
                <TouchableOpacity onPress={() => handleTestLink(facebook, "facebook")} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Twitter / X */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-twitter" size={18} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>{t("socials.labelTwitter", "Twitter / X")}</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "twitter" && styles.inputWrapperActive]}>
              <Text style={styles.prefixText}>x.com/</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("socials.placeholderTwitter", "your-handle")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={twitter}
                onChangeText={(text) => handleInputChange(text, "twitter", setTwitter)}
                onFocus={() => setActiveInput("twitter")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {twitter ? (
                <TouchableOpacity onPress={() => handleTestLink(twitter, "twitter")} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* YouTube */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-youtube" size={18} color="#ff0000" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>{t("socials.labelYouTube", "YouTube Channel")}</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "youtube" && styles.inputWrapperActive]}>
              <Text style={styles.prefixText}>youtube.com/@</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("socials.placeholderYouTube", "your-channel")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={youtube}
                onChangeText={(text) => handleInputChange(text, "youtube", setYoutube)}
                onFocus={() => setActiveInput("youtube")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {youtube ? (
                <TouchableOpacity onPress={() => handleTestLink(youtube, "youtube")} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Website / Portfolio */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="globe-outline" size={18} color={PRIMARY} style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>{t("socials.labelWebsite", "Personal Website / Portfolio")}</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "website" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder={t("socials.placeholderWebsite", "https://yourwebsite.com")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={website}
                onChangeText={setWebsite}
                onFocus={() => setActiveInput("website")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {website ? (
                <TouchableOpacity onPress={() => handleTestLink(website, "website")} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Dynamically Rendered Custom Links */}
          {customSocialLinks.map((item) => (
            <View key={item.id} style={styles.customSocialRow}>
              <View style={styles.customSocialLeft}>
                <View style={[styles.socialIconCircle, { backgroundColor: "rgba(21, 62, 105, 0.08)" }]}>
                  <Ionicons name="link-outline" size={18} color={PRIMARY} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.customSocialPlatform}>{item.platform}</Text>
                  <Text style={styles.customSocialUrl} numberOfLines={1}>{item.link}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setCustomSocialLinks(prev => prev.filter(x => x.id !== item.id));
                }}
                style={{ padding: 6 }}
              >
                <Ionicons name="trash-outline" size={18} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add More Button Row */}
          <TouchableOpacity
            style={styles.addMoreRow}
            activeOpacity={0.7}
            onPress={() => {
              setEditingPlatform("Add More");
              setCustomPlatformName("");
              setTempLink("");
              setSocialModalVisible(true);
            }}
          >
            <View style={styles.addMoreLeft}>
              <View style={[styles.socialIconCircle, { backgroundColor: "rgba(21, 62, 105, 0.08)" }]}>
                <Ionicons name="add" size={20} color={PRIMARY} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.addMoreText}>{t("addMore", "Add More")}</Text>
                <Text style={styles.addMoreSubtitle}>Website, Portfolio or other links</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSaveSocialLinks}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>{t("socials.btnSave", "Save Social Links")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Link Modal */}
      <Modal
        visible={socialModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSocialModalVisible(false)}
      >
        <View style={styles.socialModalOverlay}>
          <View style={styles.socialModalCard}>
            <Text style={styles.socialModalTitle}>
              Add Custom Link
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Platform Name</Text>
              <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                <TextInput
                  value={customPlatformName}
                  onChangeText={setCustomPlatformName}
                  placeholder="e.g. Behance, GitHub, Pinterest"
                  placeholderTextColor="rgba(10, 5, 4, 0.4)"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>Link / Handle</Text>
              <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                <TextInput
                  value={tempLink}
                  onChangeText={setTempLink}
                  placeholder="https://..."
                  placeholderTextColor="rgba(10, 5, 4, 0.4)"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.socialModalActions}>
              <TouchableOpacity
                style={[styles.socialModalButton, styles.socialModalCancel]}
                onPress={() => setSocialModalVisible(false)}
              >
                <Text style={styles.socialModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialModalButton, styles.socialModalSave]}
                onPress={() => {
                  const val = tempLink.trim();
                  const plat = customPlatformName.trim();
                  if (!plat || !val) {
                    Alert.alert("Error", "Please fill in both platform name and link.");
                    return;
                  }
                  const newLink = {
                    id: Date.now().toString(),
                    platform: plat,
                    link: val
                  };
                  setCustomSocialLinks(prev => [...prev, newLink]);
                  setCustomPlatformName("");
                  setTempLink("");
                  setSocialModalVisible(false);
                }}
              >
                <Text style={styles.socialModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: NEUTRAL,
  },
  headerCountBadge: {
    backgroundColor: "rgba(21, 62, 105, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: NEUTRAL,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    gap: 14,
  },
  inputGroup: {},
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: NEUTRAL,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SECONDARY,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapperActive: {
    borderColor: PRIMARY,
    backgroundColor: "#ffffff",
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: NEUTRAL,
    fontWeight: "600",
  },

  testBtn: {
    padding: 6,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    minHeight: 52,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  prefixText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.45)",
    fontWeight: "600",
    marginRight: 2,
  },
  
  // Custom Links and Modal Styles
  customSocialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  customSocialLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customSocialPlatform: {
    fontSize: 13,
    fontWeight: "700",
    color: NEUTRAL,
  },
  customSocialUrl: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 1,
  },
  socialIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 6,
  },
  addMoreLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  addMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },
  addMoreSubtitle: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 1,
  },
  socialModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  socialModalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  socialModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: NEUTRAL,
    textAlign: "center",
    marginBottom: 4,
  },
  socialModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  socialModalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  socialModalCancel: {
    backgroundColor: SECONDARY,
  },
  socialModalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  socialModalSave: {
    backgroundColor: PRIMARY,
  },
  socialModalSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
