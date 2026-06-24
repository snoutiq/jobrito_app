import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppInput from "../../components/inputs/AppInput";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";
import { submitCommunityJob } from "../../redux/slices/jobSlice";
import StatusBadge from "../../components/common/StatusBadge";

const initialForm = {
  employerName: "",
  contactPerson: "",
  contactNumber: "",
  email: "",
  jobTitle: "",
  jobCategory: "",
  city: "",
  experienceRequired: "",
  openings: "",
  salary: "",
  jobDescription: "",
};

export default function PostJobScreen() {
  const dispatch = useDispatch();
  const { loading, communityJobResult } = useSelector((state) => state.job);
  const [form, setForm] = useState(initialForm);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.employerName || !form.jobTitle || !form.contactNumber) {
      Alert.alert("Required fields missing", "Please complete the required fields.");
      return;
    }
    const result = await dispatch(submitCommunityJob(form));
    if (submitCommunityJob.fulfilled.match(result)) {
      Alert.alert("Submitted", "Job submitted and marked as Pending Approval.");
      setForm(initialForm);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Post a Community Job</Text>
        <Text style={styles.subtitle}>
          Community submissions are created locally with a pending approval state.
        </Text>
      </View>

      <View style={styles.card}>
        <AppInput label="Employer Name" value={form.employerName} onChangeText={(value) => updateField("employerName", value)} />
        <AppInput label="Contact Person" value={form.contactPerson} onChangeText={(value) => updateField("contactPerson", value)} />
        <AppInput label="Contact Number" value={form.contactNumber} onChangeText={(value) => updateField("contactNumber", value)} keyboardType="phone-pad" />
        <AppInput label="Email optional" value={form.email} onChangeText={(value) => updateField("email", value)} keyboardType="email-address" />
        <AppInput label="Job Title" value={form.jobTitle} onChangeText={(value) => updateField("jobTitle", value)} />
        <AppInput label="Job Category" value={form.jobCategory} onChangeText={(value) => updateField("jobCategory", value)} />
        <AppInput label="City" value={form.city} onChangeText={(value) => updateField("city", value)} />
        <AppInput label="Experience Required" value={form.experienceRequired} onChangeText={(value) => updateField("experienceRequired", value)} />
        <AppInput label="Number of Openings" value={form.openings} onChangeText={(value) => updateField("openings", value)} keyboardType="number-pad" />
        <AppInput label="Salary optional" value={form.salary} onChangeText={(value) => updateField("salary", value)} />
        <AppInput label="Job Description" value={form.jobDescription} onChangeText={(value) => updateField("jobDescription", value)} multiline numberOfLines={4} />
        <AppButton title="Submit Job" onPress={handleSubmit} loading={loading} />
      </View>

      {communityJobResult?.status ? (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Submission Status</Text>
          <StatusBadge status={communityJobResult.status} />
        </View>
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    color: colors.text,
    fontWeight: "700",
  },
});
