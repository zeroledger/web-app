import { usePrevious } from "@src/hooks/usePrevious";
import { useWallets } from "@privy-io/react-auth";
import { Chain } from "viem";
import { useEffect, useState } from "react";
import { SUPPORTED_CHAINS } from "@src/common.constants";

export function usePrivyWalletAdapter() {
  const { wallets } = useWallets();
  const [targetChain, setTargetChain] = useState<Chain>(SUPPORTED_CHAINS[0]);

  const wallet = wallets[0];

  const prevWallet = usePrevious(wallet);

  const isWalletChanged =
    wallet?.address !== prevWallet?.address ||
    wallet?.chainId !== prevWallet?.chainId;

  const walletChainId = Number(wallet?.chainId.split(":")[1]);
  const chainSupported = targetChain.id === walletChainId;

  useEffect(() => {
    const chain =
      SUPPORTED_CHAINS.find((c) => c.id === walletChainId) ??
      SUPPORTED_CHAINS[0];
    setTargetChain(chain);
  }, [walletChainId]);

  return {
    wallet,
    prevWallet,
    isWalletChanged,
    walletChainId,
    chainSupported,
    targetChain,
    setTargetChain,
  };
}
