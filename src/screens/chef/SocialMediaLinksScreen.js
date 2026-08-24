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
  Modal,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setProfileData } from "../../redux/slices/userSlice";
import { setStoredProfile } from "../../services/storage";
import { saveChefOnboarding, saveUserSocials } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;

function normalize(size) {
  const newSize = size * scale;
  return Math.round(newSize);
}

const PRIMARY = "#153e69";

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
    let cleaned = url.trim().replace(/\/$/, ""); 
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
      const updatedProfilePayload = {
        ...profile,
        ...updatedSocials,
        customSocialLinks,
      };
      dispatch(setProfileData({ ...updatedSocials, customSocialLinks }));
      await setStoredProfile(updatedProfilePayload);

      const formData = new FormData();
      Object.keys(updatedSocials).forEach((key) => {
        const val = updatedSocials[key] || "";
        formData.append(key, val);
        formData.append(`${key}_link`, val);
        formData.append(`${key}Link`, val);
      });

      customSocialLinks.forEach((item) => {
        const key = item.platform.toLowerCase();
        formData.append(key, item.link);
        formData.append(`${key}_link`, item.link);
        formData.append(`${key}Link`, item.link);
      });

      await saveChefOnboarding(formData).catch(() => null);

      const others = customSocialLinks.map((item) => ({
        title: item.platform,
        url: item.link,
      }));

      const socialsPayload = {
        instagram: updatedSocials.instagram || "",
        linkedin: updatedSocials.linkedin || "",
        facebook: updatedSocials.facebook || "",
        twitter: updatedSocials.twitter || "",
        youtube: updatedSocials.youtube || "",
        website: updatedSocials.website || "",
        others: others,
      };

      await saveUserSocials(socialsPayload);

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

  const platformsList = [
    {
      id: "linkedin",
      icon: "logo-linkedin",
      iconColor: "#0a66c2",
      title: t("linkedInProfileTitle", "LinkedIn Profile"),
      subTitle: t("linkedInProfileSub", "Help businesses see your professional profile."),
      placeholder: t("linkedInPlaceholder", "linkedin.com/in/your-profile"),
      prefix: "linkedin.com/in/",
      value: linkedin,
      setter: setLinkedin,
    },
    {
      id: "instagram",
      icon: "logo-instagram",
      iconColor: "#e1306c",
      title: t("instagramProfileTitle", "Instagram (Food Portfolio)"),
      subTitle: t("instagramProfileSub", "Help businesses see your food portfolio."),
      placeholder: t("instagramPlaceholder", "instagram.com/chef_username"),
      prefix: "instagram.com/",
      value: instagram,
      setter: setInstagram,
    },
    {
      id: "facebook",
      icon: "logo-facebook",
      iconColor: "#1877f2",
      title: t("facebookPageTitle", "Facebook Page"),
      subTitle: t("facebookPageSub", "Share your updates and connect with more businesses."),
      placeholder: t("facebookPlaceholder", "facebook.com/your-page"),
      prefix: "facebook.com/",
      value: facebook,
      setter: setFacebook,
    },
    {
      id: "twitter",
      icon: "logo-twitter",
      iconColor: "#000000",
      title: t("twitterProfileTitle", "Twitter / X"),
      subTitle: t("twitterProfileSub", "Share your thoughts and professional insights."),
      placeholder: t("twitterPlaceholder", "x.com/your-handle"),
      prefix: "x.com/",
      value: twitter,
      setter: setTwitter,
    },
    {
      id: "youtube",
      icon: "logo-youtube",
      iconColor: "#ff0000",
      title: t("youtubeChannelTitle", "YouTube Channel"),
      subTitle: t("youtubeChannelSub", "Help businesses see your professional food videos."),
      placeholder: t("youtubePlaceholder", "youtube.com/@your-channel"),
      prefix: "youtube.com/@",
      value: youtube,
      setter: setYoutube,
    },
    {
      id: "website",
      icon: "globe-outline",
      iconColor: "#2563eb",
      title: t("personalWebsiteTitle", "Personal Website / Portfolio"),
      subTitle: t("personalWebsiteSub", "Showcase your work, experience and achievements."),
      placeholder: t("personalWebsitePlaceholder", "https://yourwebsite.com"),
      prefix: "",
      value: website,
      setter: setWebsite,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtnCircle}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={normalize(20)} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>{t("myProfile", "My Profile")}</Text>
        <View style={{ width: normalize(36) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerBox}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="share-social-outline" size={normalize(22)} color="#4f46e5" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>
              {t("socialMediaLinksTitle", "Social Media Links")}
            </Text>
            <Text style={styles.bannerDesc}>
              {t("socialMediaLinksDesc", "Connect your social profiles to showcase your work, achievements and culinary journey to potential businesses.")}
            </Text>
          </View>
        </View>

        <View style={styles.mainFormCard}>
          {platformsList.map((item) => (
            <View key={item.id} style={styles.platformFieldBlock}>
              <View style={styles.platformHeaderRow}>
                <Ionicons name={item.icon} size={normalize(20)} color={item.iconColor} style={{ marginRight: normalize(8) }} />
                <View style={styles.platformHeaderTextCol}>
                  <Text style={styles.platformTitle}>{item.title}</Text>
                  <Text style={styles.platformSub}>{item.subTitle}</Text>
                </View>
              </View>

              <View style={[styles.modernInputWrapper, activeInput === item.id && styles.modernInputWrapperActive]}>
                <TextInput
                  style={styles.modernTextInput}
                  placeholder={item.placeholder}
                  placeholderTextColor="#94a3b8"
                  value={item.value}
                  onChangeText={(text) => handleInputChange(text, item.id, item.setter)}
                  onFocus={() => setActiveInput(item.id)}
                  onBlur={() => setActiveInput(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={item.id === "website" ? "url" : "default"}
                />
                {item.value ? (
                  <TouchableOpacity onPress={() => handleTestLink(item.value, item.id)} style={styles.testLinkBtn}>
                    <Ionicons name="open-outline" size={normalize(18)} color="#153e69" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}

          {customSocialLinks.map((item) => (
            <View key={item.id} style={styles.customSocialRow}>
              <View style={styles.customSocialLeft}>
                <View style={styles.customSocialIconCircle}>
                  <Ionicons name="link-outline" size={normalize(18)} color="#153e69" />
                </View>
                <View style={{ marginLeft: normalize(10), flex: 1 }}>
                  <Text style={styles.customSocialPlatform}>{item.platform}</Text>
                  <Text style={styles.customSocialUrl} numberOfLines={1}>{item.link}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCustomSocialLinks(prev => prev.filter(x => x.id !== item.id))}
                style={{ padding: normalize(6) }}
              >
                <Ionicons name="trash-outline" size={normalize(18)} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addMoreDashedCard}
            activeOpacity={0.8}
            onPress={() => {
              setEditingPlatform("Add More");
              setCustomPlatformName("");
              setTempLink("");
              setSocialModalVisible(true);
            }}
          >
            <View style={styles.addMoreLeftRow}>
              <View style={styles.addMorePlusCircle}>
                <Ionicons name="add" size={normalize(20)} color="#6366f1" />
              </View>
              <View style={{ marginLeft: normalize(12) }}>
                <Text style={styles.addMoreCardTitle}>{t("addMoreLinkTitle", "Add More Link")}</Text>
                <Text style={styles.addMoreCardSub}>{t("addMoreLinkSub", "Add website, portfolio or any other link")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.whyConnectCardBox}>
          <View style={styles.whyConnectIconCircle}>
            <Ionicons name="checkmark-circle" size={normalize(24)} color="#16a34a" />
          </View>
          <View style={styles.whyConnectTextCol}>
            <Text style={styles.whyConnectTitle}>{t("whyConnectProfilesTitle", "Why connect your profiles?")}</Text>
            <Text style={styles.whyConnectSub}>
              {t("whyConnectProfilesSub", "It builds credibility, increases visibility and helps businesses better understand your expertise and style.")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveSolidBtn, loading && styles.saveSolidBtnDisabled]}
          onPress={handleSaveSocialLinks}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: normalize(8) }}>
              <Text style={styles.saveSolidBtnText}>{t("saveLinks", "Save Links")}</Text>
              <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

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
              <Text style={styles.modalInputLabel}>Platform Name</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  value={customPlatformName}
                  onChangeText={setCustomPlatformName}
                  placeholder="e.g. Behance, GitHub, Pinterest"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalTextInput}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: normalize(12) }]}>
              <Text style={styles.modalInputLabel}>Link / Handle</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  value={tempLink}
                  onChangeText={setTempLink}
                  placeholder="https://..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  style={styles.modalTextInput}
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
    backgroundColor: "#f8fafc",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingTop: normalize(12),
    paddingBottom: normalize(14),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerBackBtnCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBarTitle: {
    fontSize: normalize(16.5),
    fontWeight: "800",
    color: "#0f172a",
  },
  scrollContent: {
    padding: normalize(16),
    gap: normalize(16),
    paddingBottom: normalize(40),
  },

  bannerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#e0e7ff",
    borderRadius: normalize(18),
    padding: normalize(16),
  },
  bannerIconCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(14),
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#1e1b4b",
    marginBottom: normalize(4),
  },
  bannerDesc: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#475569",
    lineHeight: normalize(18),
  },

  mainFormCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(18),
    padding: normalize(16),
    gap: normalize(16),
  },
  platformFieldBlock: {
    flexDirection: "column",
  },
  platformHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: normalize(8),
  },
  platformHeaderTextCol: {
    flex: 1,
  },
  platformTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  platformSub: {
    fontSize: normalize(11.5),
    fontWeight: "500",
    color: "#64748b",
  },
  modernInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(14),
    height: normalize(46),
  },
  modernInputWrapperActive: {
    borderColor: "#153e69",
    backgroundColor: "#ffffff",
  },
  modernTextInput: {
    flex: 1,
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0f172a",
  },
  testLinkBtn: {
    padding: normalize(4),
    marginLeft: normalize(6),
  },

  addMoreDashedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#faf5ff",
    borderWidth: 1.5,
    borderColor: "#ede9fe",
    borderRadius: normalize(14),
    padding: normalize(14),
    marginTop: normalize(4),
  },
  addMoreLeftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addMorePlusCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreCardTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: normalize(2),
  },
  addMoreCardSub: {
    fontSize: normalize(11.5),
    fontWeight: "500",
    color: "#64748b",
  },

  customSocialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: normalize(10),
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  customSocialLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customSocialIconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  customSocialPlatform: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#0f172a",
  },
  customSocialUrl: {
    fontSize: normalize(11.5),
    color: "#64748b",
    marginTop: normalize(1),
  },

  whyConnectCardBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    borderRadius: normalize(16),
    padding: normalize(14),
  },
  whyConnectIconCircle: {
    marginRight: normalize(12),
    marginTop: normalize(2),
  },
  whyConnectTextCol: {
    flex: 1,
  },
  whyConnectTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#14532d",
    marginBottom: normalize(2),
  },
  whyConnectSub: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#166534",
    lineHeight: normalize(17),
  },

  saveSolidBtn: {
    width: "100%",
    backgroundColor: "#002b5c",
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize(4),
    shadowColor: "#002b5c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveSolidBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveSolidBtnText: {
    fontSize: normalize(15.5),
    fontWeight: "800",
    color: "#ffffff",
  },

  socialModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(24),
  },
  socialModalCard: {
    width: "100%",
    maxWidth: normalize(340),
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(12),
    elevation: 5,
  },
  socialModalTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: normalize(4),
  },
  inputGroup: {},
  modalInputLabel: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(6),
  },
  modalInputWrapper: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    height: normalize(44),
    justifyContent: "center",
  },
  modalTextInput: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0f172a",
  },
  socialModalActions: {
    flexDirection: "row",
    gap: normalize(10),
    marginTop: normalize(12),
  },
  socialModalButton: {
    flex: 1,
    height: normalize(44),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  socialModalCancel: {
    backgroundColor: "#f1f5f9",
  },
  socialModalCancelText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#64748b",
  },
  socialModalSave: {
    backgroundColor: "#153e69",
  },
  socialModalSaveText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#ffffff",
  },
});
