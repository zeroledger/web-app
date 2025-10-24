import React, { useState, useCallback, useEffect } from "react";
import {
  SettingsContext,
  UserSettings,
  defaultUserSettings,
} from "./settings.context";
import { APP_PREFIX_KEY } from "@src/common.constants";

const SETTINGS_STORAGE_KEY = `${APP_PREFIX_KEY}.userSettings`;

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultUserSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
    }
  }, []);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save user settings:", error);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultUserSettings);
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to reset user settings:", error);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
