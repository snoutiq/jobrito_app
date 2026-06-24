import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#22C55E";

export default function CompleteProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  useLayoutEffect(() => {
    if (navigation && navigation.setOptions) {
      navigation.setOptions({ headerShown: false });
    }
  }, [navigation]);

  const next = () => {
    if (step < 6) setStep(step + 1);
  };

  const prev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const progress = step === 6 ? 100 : ((step - 1) / 5) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {step !== 6 && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={prev}>
              <Ionicons name="arrow-back" size={24} color="#111" />
            </TouchableOpacity>

            <Text style={styles.title}>{t("completeProfile")}</Text>

            <TouchableOpacity>
              <Text style={styles.skip}>{t("skip")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.stepText}>{t("step", { current: step, total: 5 })}</Text>

            <Text style={styles.complete}>
              {Math.round(progress)}% Complete
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
        </>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {step === 1 && <PhotoStep next={next} t={t} />}
        {step === 2 && <PersonalStep next={next} t={t} />}
        {step === 3 && <ExperienceStep next={next} t={t} />}
        {step === 4 && <LocationStep next={next} t={t} />}
        {step === 5 && <CategoryStep next={next} t={t} />}
        {step === 6 && <SuccessStep t={t} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoStep({ next, t }) {
  return (
    <View style={styles.content}>
      <Text style={styles.heading}>{t("completeProfile.photo.heading")}</Text>

      <Text style={styles.subHeading}>
        {t("completeProfile.photo.subHeading")}
      </Text>

      <View style={styles.avatarBox}>
        <Ionicons name="camera-outline" size={60} color="#999" />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 {t("proTip")}</Text>

        <Text>
          {t("completeProfile.photo.tip")}
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>{t("uploadPhoto")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>{t("takePhoto")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={next}>
        <Text style={styles.later}>{t("maybeLater")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function PersonalStep({ next, t }) {
  return (
    <View style={styles.content}>
      <Text style={styles.label}>{t("fullName")}</Text>

      <TextInput
        placeholder={t("enterFullName")}
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 30 }]}>
        {t("selectGender")}
      </Text>

      <View style={styles.genderRow}>
        <GenderCard icon="male" title={t("male")} />
        <GenderCard icon="female" title={t("female")} />
        <GenderCard icon="person" title={t("other")} />
      </View>

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function GenderCard({ icon, title }) {
  return (
    <TouchableOpacity style={styles.genderCard}>
      <Ionicons name={icon} size={28} color="#0F7A37" />
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}

function ExperienceStep({ next, t }) {
  return (
    <View style={styles.content}>
      <Text style={styles.question}>
        {t("completeProfile.experience.question1")}
      </Text>

      <TouchableOpacity style={styles.input}>
        <Text>{t("selectYearsOfExperience")}</Text>
      </TouchableOpacity>

      <Text style={styles.question}>
        {t("completeProfile.experience.question2")}
      </Text>

      <TextInput
        placeholder={t("typeCurrentEmployer")}
        style={styles.input}
      />

      <Text style={styles.question}>
        {t("completeProfile.experience.question3")}
      </Text>

      <Option title={t("fullTimeJob")} />
      <Option title={t("partTimeJob")} />
      <Option title={t("contractWork")} />
      <Option title={t("freelanceProjects")} />

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function LocationStep({ next, t }) {
  return (
    <View style={styles.content}>
      <Text style={styles.heading}>
        {t("completeProfile.location.heading")}
      </Text>

      <Option title={t("india")} />
      <Option title={t("overseas")} />
      <Option title={t("both")} />

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>{t("continue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function CategoryStep({ next, t }) {
  const jobs = [
    "Kitchen Production",
    "Restaurant Operations",
    "Cafe & Beverage",
    "QSR & Fast Food",
    "Catering & Banquet",
  ];

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>
        {t("completeProfile.category.heading")}
      </Text>

      {jobs.map((item) => (
        <Option key={item} title={item} />
      ))}

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function SuccessStep({ t }) {
  return (
    <View style={styles.success}>
      <Ionicons
        name="checkmark-circle"
        size={120}
        color={PRIMARY}
      />

      <Text style={styles.successTitle}>
        {t("completeProfile.success")}
      </Text>

      <Text style={styles.successText}>
        {t("completeProfile.success.subTitle")}
      </Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          {t("returnToCommunityFeed")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function Option({ title }) {
  return (
    <TouchableOpacity style={styles.option}>
      <Text>{title}</Text>

      <Ionicons
        name="ellipse-outline"
        size={24}
        color="#999"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
  },

  skip: {
    color: "#0F7A37",
    fontSize: 16,
    fontWeight: "600",
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  stepText: {
    fontWeight: "600",
  },

  complete: {
    color: "#0F7A37",
    fontWeight: "700",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    borderRadius: 12,
  },

  progressFill: {
    height: 6,
    backgroundColor: PRIMARY,
    borderRadius: 10,
  },

  content: {
    padding: 20,
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },

  subHeading: {
    color: "#666",
    lineHeight: 22,
  },

  avatarBox: {
    height: 180,
    width: 180,
    borderRadius: 90,
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },

  tipCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  tipTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
    marginTop: 10,
  },

  label: {
    fontWeight: "600",
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  genderCard: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  question: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },

  option: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  button: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  later: {
    textAlign: "center",
    marginTop: 18,
    fontWeight: "600",
  },

  success: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  successTitle: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 20,
  },

  successText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
  },
});