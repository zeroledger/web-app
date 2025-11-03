import { usePrevious } from "@src/hooks/usePrevious";
import { toViemAccount, usePrivy, useWallets } from "@privy-io/react-auth";
import { type Address, Chain } from "viem";
import { useCallback, useEffect, useState } from "react";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export function useWalletAdapter() {
  const { wallets, ready } = useWallets();
  const {
    logout,
    exportWallet,
    authenticated,
    login: privyLogin,
    linkWallet,
  } = usePrivy();
  const [targetChain, setTargetChain] = useState<Chain>(SUPPORTED_CHAINS[0]);

  // Embedded wallet is always the Privy-created wallet
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  // Primary wallet is the external wallet if linked, otherwise the embedded wallet
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const primaryWallet = externalWallet ?? embeddedWallet;

  // For backward compatibility, keep 'wallet' as primary wallet
  const wallet = primaryWallet;

  const prevWallet = usePrevious(primaryWallet);

  const isWalletNetworkChanged = primaryWallet?.chainId !== prevWallet?.chainId;
  const isWalletAddressChanged = primaryWallet?.address !== prevWallet?.address;

  const isWalletChanged = isWalletNetworkChanged || isWalletAddressChanged;

  const walletChainId = Number(primaryWallet?.chainId.split(":")[1]);
  const chainSupported = targetChain.id === walletChainId;

  useEffect(() => {
    const chain =
      SUPPORTED_CHAINS.find((c) => c.id === walletChainId) ??
      SUPPORTED_CHAINS[0];
    setTargetChain(chain);
  }, [walletChainId]);

  const connect = useCallback(async () => {
    if (authenticated) {
      await logout();
    }
    privyLogin({
      loginMethods: ["wallet"],
    });
  }, [authenticated, privyLogin, logout]);

  const signIn = useCallback(async () => {
    if (authenticated) {
      await logout();
    }
    privyLogin({ loginMethods: ["email"] });
  }, [authenticated, privyLogin, logout]);

  const linkExternalWallet = linkWallet;

  const getPrimaryAccount = useCallback(() => {
    return primaryWallet!.walletClientType === "privy"
      ? toViemAccount({ wallet: primaryWallet! })
      : (primaryWallet!.address as Address);
  }, [primaryWallet]);
  const getPrimaryProvider = useCallback(
    () => primaryWallet?.getEthereumProvider(),
    [primaryWallet],
  );
  const getEmbeddedAccount = useCallback(
    () => toViemAccount({ wallet: embeddedWallet! }),
    [embeddedWallet],
  );
  const getEmbeddedProvider = useCallback(
    () => embeddedWallet?.getEthereumProvider(),
    [embeddedWallet],
  );

  return {
    wallets,
    wallet,
    embeddedWallet,
    primaryWallet,
    externalWallet,
    adapterReady: ready,
    getPrimaryAccount,
    getPrimaryProvider,
    getEmbeddedAccount,
    getEmbeddedProvider,
    prevWallet,
    isWalletChanged,
    isWalletNetworkChanged,
    isWalletAddressChanged,
    walletChainId,
    chainSupported,
    targetChain,
    setTargetChain,
    logout,
    exportWallet,
    connect,
    signIn,
    linkExternalWallet,
  };
}
