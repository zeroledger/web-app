import { ReactNode, useEffect, useMemo, useState } from "react";
import { type EvmClientService } from "@src/services/core/evmClient.service";
import { useWallets } from "@privy-io/react-auth";
import { EvmClientsContext } from "./evmClients.context";
import { SUPPORTED_CHAINS } from "@src/common.constants";
import { useModal } from "@src/hooks/useModal";
import { Chain } from "viem";

export const EvmClientsProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [evmClientService, setEvmClientService] = useState<
    EvmClientService | undefined
  >(undefined);
  const { wallets } = useWallets();
  const { isOpen, openModal, closeModal } = useModal();
  const [targetChain, setTargetChain] = useState<Chain>(SUPPORTED_CHAINS[0]);

  const wallet = wallets[0];
  const chainId = Number(wallet?.chainId.split(":")[1]);

  useEffect(() => {
    if (isOpen && chainId === targetChain.id) {
      closeModal();
    }
  }, [isOpen, chainId, targetChain.id, closeModal]);

  useEffect(() => {
    const chain =
      SUPPORTED_CHAINS.find((c) => c.id === chainId) ?? SUPPORTED_CHAINS[0];
    if (chainId !== chain.id && evmClientService) {
      setTargetChain(chain);
      openModal();
    }
  }, [chainId, openModal, evmClientService]);

  useEffect(() => {
    if (!wallet) {
      closeModal();
    }
  }, [wallet, closeModal]);

  const value = useMemo(
    () => ({
      setEvmClientService,
      evmClientService,
      isSwitchChainModalOpen: isOpen,
      openSwitchChainModal: openModal,
      closeSwitchChainModal: closeModal,
      targetChain,
    }),
    [
      evmClientService,
      setEvmClientService,
      isOpen,
      openModal,
      closeModal,
      targetChain,
    ],
  );

  return (
    <EvmClientsContext.Provider value={value}>
      {children}
    </EvmClientsContext.Provider>
  );
};
