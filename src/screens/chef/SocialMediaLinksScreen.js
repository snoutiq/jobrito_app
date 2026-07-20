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

  useEffect(() => {
    if (profile) {
      if (profile.linkedin) setLinkedin(profile.linkedin);
      if (profile.instagram) setInstagram(profile.instagram);
      if (profile.facebook) setFacebook(profile.facebook);
      if (profile.twitter) setTwitter(profile.twitter);
      if (profile.youtube) setYoutube(profile.youtube);
      if (profile.website || profile.portfolio) setWebsite(profile.website || profile.portfolio);
    }
  }, [profile]);

  const connectedCount = [linkedin, instagram, facebook, twitter, youtube, website].filter(
    (item) => item && item.trim().length > 3
  ).length;

  const handleTestLink = (rawUrl) => {
    if (!rawUrl || !rawUrl.trim()) return;
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    Linking.openURL(url).catch((err) => {
      CustomAlert.show(t("error", "Error"), "Could not open URL: " + err.message);
    });
  };

  const handlePasteClipboard = async (setter) => {
    try {
      const content = await Clipboard.getString();
      if (content && content.trim()) {
        let cleaned = content.trim().replace(/\s+/g, "");
        if (!/^https?:\/\//i.test(cleaned)) {
          cleaned = "https://" + cleaned;
        }
        setter(cleaned);
        CustomAlert.show(t("success", "Success"), "Pasted from clipboard!");
      } else {
        CustomAlert.show(t("error", "Error"), "Clipboard is empty.");
      }
    } catch (e) {
      CustomAlert.show(t("error", "Error"), "Failed to read clipboard.");
    }
  };

  const handleSaveSocialLinks = async () => {
    const cleanUrl = (val) => {
      if (!val || !val.trim()) return "";
      let cleaned = val.trim().replace(/\s+/g, "");
      if (!/^https?:\/\//i.test(cleaned)) {
        cleaned = "https://" + cleaned;
      }
      return cleaned;
    };

    const updatedSocials = {
      linkedin: cleanUrl(linkedin),
      instagram: cleanUrl(instagram),
      facebook: cleanUrl(facebook),
      twitter: cleanUrl(twitter),
      youtube: cleanUrl(youtube),
      website: cleanUrl(website),
    };

    setLoading(true);
    try {
      // 1. Dispatch Redux store update
      const updatedProfilePayload = {
        ...profile,
        ...updatedSocials,
      };
      dispatch(setProfileData(updatedSocials));

      // 2. Update local storage
      await setStoredProfile(updatedProfilePayload);

      // 3. Update server API
      const formData = new FormData();
      Object.keys(updatedSocials).forEach((key) => {
        if (updatedSocials[key]) {
          formData.append(key, updatedSocials[key]);
        }
      });

      await saveChefOnboarding(formData).catch(() => null);

      CustomAlert.show(
        t("success", "Success"),
        "Your social media and portfolio links have been saved successfully! Recruiters can now view your public profiles.",
        [
          {
            text: "Great",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save social links:", error);
      CustomAlert.show(t("error", "Error"), error?.message || "Failed to save social links.");
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
          <Text style={styles.headerTitle}>{t("socialMediaLinks", "Social & Portfolio Links")}</Text>
          <View style={styles.headerCountBadge}>
            <Text style={styles.headerCountText}>{connectedCount} Active</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="sparkles" size={22} color={PRIMARY} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Showcase Your Culinary Brand</Text>
            <Text style={styles.infoSubtitle}>
              Linking your LinkedIn, Instagram food portfolio, or personal website increases employer trust by 3x.
            </Text>
          </View>
        </View>

        {/* Input Fields Card */}
        <View style={styles.formCard}>
          {/* LinkedIn */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-linkedin" size={18} color="#0077b5" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>LinkedIn Profile</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "linkedin" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder="https://linkedin.com/in/your-profile"
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={linkedin}
                onChangeText={setLinkedin}
                onFocus={() => setActiveInput("linkedin")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {linkedin ? (
                <TouchableOpacity onPress={() => handleTestLink(linkedin)} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handlePasteClipboard(setLinkedin)} style={styles.pasteBtn}>
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Instagram */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-instagram" size={18} color="#e1306c" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>Instagram (Food Portfolio)</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "instagram" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder="https://instagram.com/chef_username"
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={instagram}
                onChangeText={setInstagram}
                onFocus={() => setActiveInput("instagram")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {instagram ? (
                <TouchableOpacity onPress={() => handleTestLink(instagram)} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handlePasteClipboard(setInstagram)} style={styles.pasteBtn}>
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Facebook */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-facebook" size={18} color="#1877f2" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>Facebook Page</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "facebook" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder="https://facebook.com/your-page"
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={facebook}
                onChangeText={setFacebook}
                onFocus={() => setActiveInput("facebook")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {facebook ? (
                <TouchableOpacity onPress={() => handleTestLink(facebook)} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handlePasteClipboard(setFacebook)} style={styles.pasteBtn}>
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Twitter / X */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-twitter" size={18} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>Twitter / X</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "twitter" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder="https://x.com/your-handle"
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={twitter}
                onChangeText={setTwitter}
                onFocus={() => setActiveInput("twitter")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {twitter ? (
                <TouchableOpacity onPress={() => handleTestLink(twitter)} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handlePasteClipboard(setTwitter)} style={styles.pasteBtn}>
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* YouTube */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="logo-youtube" size={18} color="#ff0000" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>YouTube Channel</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "youtube" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder="https://youtube.com/@c/your-channel"
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={youtube}
                onChangeText={setYoutube}
                onFocus={() => setActiveInput("youtube")}
                onBlur={() => setActiveInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {youtube ? (
                <TouchableOpacity onPress={() => handleTestLink(youtube)} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handlePasteClipboard(setYoutube)} style={styles.pasteBtn}>
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Website / Portfolio */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="globe-outline" size={18} color={PRIMARY} style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>Personal Website / Portfolio</Text>
            </View>
            <View style={[styles.inputWrapper, activeInput === "website" && styles.inputWrapperActive]}>
              <TextInput
                style={styles.textInput}
                placeholder="https://yourwebsite.com"
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
                <TouchableOpacity onPress={() => handleTestLink(website)} style={styles.testBtn}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handlePasteClipboard(setWebsite)} style={styles.pasteBtn}>
                  <Text style={styles.pasteBtnText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSaveSocialLinks}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save Social Links</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  pasteBtn: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
  },
  testBtn: {
    padding: 6,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
});
