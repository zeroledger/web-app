import { createContext } from "react";

export interface UserSettings {
  showTransactionPreview: boolean;
  hideDecoyTransactions: boolean;
}

export const defaultUserSettings: UserSettings = {
  showTransactionPreview: true, // Default to showing preview
  hideDecoyTransactions: true, // Default to hide decoy transactions
};

export const SettingsContext = createContext<{
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}>({
  settings: defaultUserSettings,
  updateSettings: () => {},
  resetSettings: () => {},
});
