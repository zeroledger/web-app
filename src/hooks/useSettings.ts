import { useContext } from "react";
import { SettingsContext } from "@src/context/settings.context";

/**
 * Hook to access and manage user settings
 * @returns settings object and update function
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
};
