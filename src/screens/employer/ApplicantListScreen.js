import React, { useEffect } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import ApplicantCard from "../../components/cards/ApplicantCard";
import colors from "../../constants/colors";
import { fetchApplicants, updateApplicantStatus } from "../../redux/slices/employerSlice";

export default function ApplicantListScreen({ route }) {
  const dispatch = useDispatch();
  const { applicants } = useSelector((state) => state.employer);
  const jobId = route?.params?.jobId;
  const jobTitle = route?.params?.jobTitle || "Applicants";

  useEffect(() => {
    if (jobId) {
      dispatch(fetchApplicants(jobId));
    }
  }, [dispatch, jobId]);

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call unavailable", "Dialer could not be opened.");
    });
  };

  const handleStatusChange = async (applicantId, status) => {
    await dispatch(updateApplicantStatus({ applicationId: applicantId, status }));
    if (jobId) {
      dispatch(fetchApplicants(jobId));
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>{jobTitle}</Text>
        <Text style={styles.subtitle}>Update applicant status from this workspace.</Text>
      </View>

      <View style={{ gap: 12 }}>
        {applicants.map((applicant) => (
          <ApplicantCard
            key={applicant.id}
            applicant={applicant}
            onCall={() => handleCall(applicant.phone)}
            onStatusChange={(status) => handleStatusChange(applicant.id, status)}
          />
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
});
