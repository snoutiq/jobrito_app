import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * Shared Global Navigation Reference
 * Extracted into a standalone module to prevent circular dependency (require cycles)
 * between App.js and services like deepLinking.js.
 */
export const navigationRef = createNavigationContainerRef();
