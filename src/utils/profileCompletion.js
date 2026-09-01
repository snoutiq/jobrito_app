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

export const getProfileCompletionPercent = (profile) => {
  const apiPercent = normalizeCompletionPercent(
    profile?.completeness ??
      profile?.profile_completeness ??
      profile?.completionPercentage ??
      profile?.completion_percentage
  );

  return apiPercent ?? 0;
};
