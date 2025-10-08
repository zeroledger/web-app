import { usePrevious } from "@src/hooks/usePrevious";
import { useConnectWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { Chain } from "viem";
import { /* useCallback, */ useEffect, useState } from "react";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export function useWalletAdapter() {
  const { wallets } = useWallets();
  const { logout, exportWallet /* authenticated, login */ } = usePrivy();
  const { connectWallet } = useConnectWallet();
  const [targetChain, setTargetChain] = useState<Chain>(SUPPORTED_CHAINS[0]);

  const wallet = wallets[0];

  const prevWallet = usePrevious(wallet);

  const isWalletNetworkChanged = wallet?.chainId !== prevWallet?.chainId;
  const isWalletAddressChanged = wallet?.address !== prevWallet?.address;

  const isWalletChanged = isWalletNetworkChanged || isWalletAddressChanged;

  const walletChainId = Number(wallet?.chainId.split(":")[1]);
  const chainSupported = targetChain.id === walletChainId;

  console.log("e", window.ethereum);

  useEffect(() => {
    const chain =
      SUPPORTED_CHAINS.find((c) => c.id === walletChainId) ??
      SUPPORTED_CHAINS[0];
    setTargetChain(chain);
  }, [walletChainId]);

  // const properLogin = useCallback(async () => {
  //   if (authenticated) {
  //     await logout();
  //   }
  //   login();
  // }, [authenticated, login, logout]);

  return {
    wallets,
    wallet,
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
    login: connectWallet,
  };
}
