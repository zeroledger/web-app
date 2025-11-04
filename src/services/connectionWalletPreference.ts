import { APP_PREFIX_KEY } from "@src/common.constants";

export const CONNECTION_WALLET_PREF_KEY = `${APP_PREFIX_KEY}.connectionWallet`;

export const getConnectionWalletPreference = (): boolean | null => {
  const pref = localStorage.getItem(CONNECTION_WALLET_PREF_KEY);
  if (pref === null) return null;
  return pref === "true";
};

export const setConnectionWalletPreference = (value: boolean) => {
  localStorage.setItem(CONNECTION_WALLET_PREF_KEY, value.toString());
};

export const resetConnectionWalletPreference = () => {
  localStorage.removeItem(CONNECTION_WALLET_PREF_KEY);
};
