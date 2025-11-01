import { APP_PREFIX_KEY } from "@src/common.constants";

export const LINK_WALLET_PREF_KEY = `${APP_PREFIX_KEY}.linkExternalWallet`;

export const getLinkWalletPreference = (): boolean | null => {
  const pref = localStorage.getItem(LINK_WALLET_PREF_KEY);
  if (pref === null) return null;
  return pref === "true";
};

export const setLinkWalletPreference = (value: boolean) => {
  localStorage.setItem(LINK_WALLET_PREF_KEY, value.toString());
};
