const normalizeCompletionPercent = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  if (parsed < 0) return 0;
  if (parsed > 100) return 100;

  return Math.round(parsed);
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

export const getProfileCompletionPercent = (profile, formValues = {}) => {
  const apiPercent = normalizeCompletionPercent(
    profile?.completeness ??
      profile?.profile_completeness ??
      profile?.completionPercentage ??
      profile?.completion_percentage
  );

  if (apiPercent !== null && apiPercent > 0) {
    return apiPercent;
  }

  const checks = [
    { value: formValues.photo ?? profile?.profile_photo_path ?? profile?.profile_photo },
    { value: formValues.fullName ?? profile?.full_name ?? profile?.name },
    { value: formValues.gender ?? profile?.gender },
    { value: formValues.experienceRange ?? profile?.experience_range ?? profile?.experience_years ?? profile?.experience },
    { value: formValues.currentEmployer ?? profile?.current_employer ?? profile?.currentEmployer },
    { value: formValues.city ?? profile?.city ?? profile?.job_location ?? profile?.jobLocation },
    { value: formValues.locationPreference ?? profile?.location_preference ?? profile?.locationPreference },
    { value: formValues.preferredRole ?? profile?.preferred_role ?? profile?.preferredRole },
  ];

  const filled = checks.filter((item) => hasMeaningfulValue(item.value)).length;
  return Math.round((filled / checks.length) * 100);
};
