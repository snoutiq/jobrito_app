/**
 * Phone Number formatting and country code parsing utilities
 */

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
