import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
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
  const [evmClientServicePromise, setEvmClientServicePromise] = useState<
    Promise<EvmClientService> | undefined
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
    if (chainId !== chain.id) {
      setTargetChain(chain);
      openModal();
    }
  }, [chainId, openModal]);

  useEffect(() => {
    if (!wallet) {
      closeModal();
    }
  }, [wallet, closeModal]);

  const initializeEvmClientService = useCallback(
    async (evmClientService: EvmClientService) => {
      const promise = evmClientService.open();
      setEvmClientServicePromise(promise);
      setEvmClientService(evmClientService);
    },
    [],
  );

  const closeEvmClientService = useCallback(async () => {
    if (evmClientServicePromise) {
      (await evmClientServicePromise).close();
    }
    setEvmClientServicePromise(undefined);
    setEvmClientService(undefined);
  }, [evmClientServicePromise]);

  const value = useMemo(
    () => ({
      evmClientServicePromise,
      evmClientService,
      initializeEvmClientService,
      isSwitchChainModalOpen: isOpen,
      openSwitchChainModal: openModal,
      closeSwitchChainModal: closeModal,
      targetChain,
      closeEvmClientService,
    }),
    [
      evmClientService,
      isOpen,
      openModal,
      closeModal,
      targetChain,
      evmClientServicePromise,
      initializeEvmClientService,
      closeEvmClientService,
    ],
  );

  return (
    <EvmClientsContext.Provider value={value}>
      {children}
    </EvmClientsContext.Provider>
  );
};
