import { ReactNode, useEffect, useMemo, useState } from "react";
import { EvmClientService } from "@src/services/core/evmClient.service";
import { WS_RPC } from "@src/common.constants";
import { RPC } from "@src/common.constants";
import { pollingInterval } from "@src/common.constants";
import { useWallets } from "@privy-io/react-auth";
import { EvmClientsContext } from "./evmClients.context";
import { SUPPORTED_CHAINS } from "@src/common.constants";
import { catchService } from "@src/services/core/catch.service";
import { useModal } from "@src/hooks/useModal";
import { Chain } from "viem";

export const EvmClientsProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [error, setError] = useState<Error>();
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
    let evmClientService: EvmClientService | undefined;
    const create = async () => {
      try {
        console.log("[zeroledger-app] creating evm client service");
        const chain =
          SUPPORTED_CHAINS.find((c) => c.id === chainId) ?? SUPPORTED_CHAINS[0];
        if (chainId !== chain.id) {
          setTargetChain(chain);
          openModal();
        }
        evmClientService = new EvmClientService(
          WS_RPC[chain.id],
          RPC[chain.id],
          pollingInterval[chain.id],
          chain,
          wallet,
        );
        await evmClientService.open();
        setEvmClientService(evmClientService);
      } catch (error) {
        catchService.catch(error as Error);
        setError(error as Error);
      }
    };
    if (wallet) {
      create();
    }
    return () => evmClientService?.close();
  }, [wallet, chainId, openModal]);

  useEffect(() => {
    if (!wallet) {
      closeModal();
    }
  }, [wallet, closeModal]);

  const value = useMemo(
    () => ({
      evmClientService,
      error,
      isSwitchChainModalOpen: isOpen,
      openSwitchChainModal: openModal,
      closeSwitchChainModal: closeModal,
      targetChain,
    }),
    [evmClientService, error, isOpen, openModal, closeModal, targetChain],
  );

  return (
    <EvmClientsContext.Provider value={value}>
      {children}
    </EvmClientsContext.Provider>
  );
};
