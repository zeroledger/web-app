import { usePrevious } from "@src/hooks/usePrevious";
import { toViemAccount, usePrivy, useWallets } from "@privy-io/react-auth";
import { type Address, Chain } from "viem";
import { useCallback, useEffect, useState } from "react";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export function useWalletAdapter() {
  const { wallets } = useWallets();
  const { logout, exportWallet, authenticated, login: privyLogin } = usePrivy();
  // const { connectWallet } = useConnectWallet();
  const [targetChain, setTargetChain] = useState<Chain>(SUPPORTED_CHAINS[0]);

  const wallet = wallets[0];

  const prevWallet = usePrevious(wallet);

  const isWalletNetworkChanged = wallet?.chainId !== prevWallet?.chainId;
  const isWalletAddressChanged = wallet?.address !== prevWallet?.address;

  const isWalletChanged = isWalletNetworkChanged || isWalletAddressChanged;

  const walletChainId = Number(wallet?.chainId.split(":")[1]);
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

  const getAccount = useCallback(() => {
    return wallet.walletClientType === "privy"
      ? toViemAccount({ wallet })
      : (wallet.address as Address);
  }, [wallet]);
  const getProvider = useCallback(
    () => wallet?.getEthereumProvider(),
    [wallet],
  );

  return {
    wallets,
    wallet,
    getAccount,
    getProvider,
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
  };
}
