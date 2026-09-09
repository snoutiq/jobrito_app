/**
 * Phone Number formatting and country code parsing utilities
 */

export const COUNTRY_DIAL_OPTIONS = [
  { name: "India", code: "+91", flag: "🇮🇳", digits: 10, label: "🇮🇳 +91" },
  { name: "United States", code: "+1", flag: "🇺🇸", digits: 10, label: "🇺🇸 +1" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧", digits: 10, label: "🇬🇧 +44" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", digits: 9, label: "🇦🇪 +971" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", digits: 9, label: "🇸🇦 +966" },
  { name: "Canada", code: "+1", flag: "🇨🇦", digits: 10, label: "🇨🇦 +1" },
  { name: "Australia", code: "+61", flag: "🇦🇺", digits: 9, label: "🇦🇺 +61" },
  { name: "Singapore", code: "+65", flag: "🇸🇬", digits: 8, label: "🇸🇬 +65" },
];

export const DIAL_CODE_LABELS = COUNTRY_DIAL_OPTIONS.map((c) => c.label);

export const getDialOptionByCode = (countryCode) => {
  const cleanCode = String(countryCode || "").replace(/\D/g, "");
  if (cleanCode === "1") return "🇺🇸 +1";
  if (cleanCode === "44") return "🇬🇧 +44";
  if (cleanCode === "971") return "🇦🇪 +971";
  if (cleanCode === "966") return "🇸🇦 +966";
  if (cleanCode === "61") return "🇦🇺 +61";
  if (cleanCode === "65") return "🇸🇬 +65";
  return "🇮🇳 +91";
};

export const getTargetDigitsForDialCode = (dialCodeStr) => {
  const str = String(dialCodeStr || "");
  if (str.includes("+65")) return 8;
  if (str.includes("+966") || str.includes("+971") || str.includes("+61")) return 9;
  return 10;
};

export const parseCountryAndNumber = (digits, fallbackCode = "91") => {
  if (!digits) return { countryCode: String(fallbackCode).replace(/\D/g, "") || "91", nationalNumber: "" };

  const cleanDigits = String(digits).replace(/\D/g, "");

  // 3-digit country codes: UAE (971), KSA (966), Kuwait (965), Qatar (974), Bahrain (973), Oman (968), Bangladesh (880), Nepal (977)
  const threeDigitCodes = ["971", "966", "965", "974", "973", "968", "880", "977"];
  for (const code of threeDigitCodes) {
    if (cleanDigits.startsWith(code) && cleanDigits.length >= code.length + 7) {
      return { countryCode: code, nationalNumber: cleanDigits.slice(code.length) };
    }
  }

  // 2-digit country codes: UK (44), India (91), Australia (61), Singapore (65), Malaysia (60), Philippines (63), Pakistan (92), Sri Lanka (94)
  const twoDigitCodes = ["44", "91", "61", "65", "60", "63", "92", "94"];
  for (const code of twoDigitCodes) {
    if (cleanDigits.startsWith(code) && cleanDigits.length >= code.length + 8) {
      return { countryCode: code, nationalNumber: cleanDigits.slice(code.length) };
    }
  }

  // 1-digit country codes: US / Canada (1) + 10 digits = 11 digits
  if (cleanDigits.startsWith("1") && cleanDigits.length === 11) {
    return { countryCode: "1", nationalNumber: cleanDigits.slice(1) };
  }

  // 10 digits starting with 6, 7, 8, 9 (standard Indian mobile without country prefix)
  if (cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits)) {
    return { countryCode: "91", nationalNumber: cleanDigits };
  }

  // 9 digits starting with 5 (standard GCC / KSA / UAE mobile without country prefix)
  if (cleanDigits.length === 9 && cleanDigits.startsWith("5")) {
    const defaultGcc = fallbackCode === "971" ? "971" : "966";
    return { countryCode: defaultGcc, nationalNumber: cleanDigits };
  }

  // Fallback
  const cleanFallback = String(fallbackCode).replace(/\D/g, "") || "91";
  return { countryCode: cleanFallback, nationalNumber: cleanDigits };
};

/**
 * Strips leading country code or leading 0 from input
 */
export const stripCountryPrefix = (input, dialCodeStr) => {
  if (!input) return "";
  let digits = String(input).replace(/\D/g, "");
  const cleanCode = String(dialCodeStr || "").replace(/\D/g, "");

  // If starts with selected country code and is longer than local phone digits
  if (cleanCode && digits.startsWith(cleanCode)) {
    const targetDigits = getTargetDigitsForDialCode(dialCodeStr);
    if (digits.length > targetDigits) {
      digits = digits.slice(cleanCode.length);
    }
  }

  // Handle all other known country codes if pasted
  const allCodes = ["971", "966", "965", "974", "973", "968", "44", "91", "61", "65"];
  for (const code of allCodes) {
    if (digits.startsWith(code) && digits.length >= code.length + 8) {
      digits = digits.slice(code.length);
      break;
    }
  }

  // Handle US/Canada 1 + 10 digits = 11 digits
  if (digits.startsWith("1") && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Handle leading 0
  if (digits.startsWith("0") && digits.length > 8) {
    digits = digits.slice(1);
  }

  return digits;
};

/**
 * Formats phone number into international standard +<code > <number>
 * E.g. "18598000648" -> "+1 8598000648"
 *      "8602180000"  -> "+91 8602180000"
 */
export const formatDisplayPhoneNumber = (rawPhone, fallbackCode = "91") => {
  if (!rawPhone) return "-";
  const str = String(rawPhone).trim();
  if (!str || str === "-") return "-";

  const digits = str.replace(/\D/g, "");
  if (!digits) return str;

  const parsed = parseCountryAndNumber(digits, fallbackCode);
  return `+${parsed.countryCode} ${parsed.nationalNumber}`;
};
