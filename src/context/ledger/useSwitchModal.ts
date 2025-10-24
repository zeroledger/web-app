import { useEffect } from "react";
import { useModal } from "@src/hooks/useModal";
import { useWalletAdapter } from "./useWalletAdapter";
import { EvmClients } from "@src/services/Clients";

export const useSwitchModal = (evmClients: EvmClients | undefined) => {
  const { wallet, targetChain, setTargetChain, chainSupported } =
    useWalletAdapter();
  const {
    isOpen: isSwitchChainModalOpen,
    openModal: openSwitchChainModal,
    closeModal: closeSwitchChainModal,
  } = useModal();

  useEffect(() => {
    if (isSwitchChainModalOpen && chainSupported) {
      closeSwitchChainModal();
    }
  }, [isSwitchChainModalOpen, closeSwitchChainModal, chainSupported]);

  useEffect(() => {
    if (!chainSupported && evmClients && !isSwitchChainModalOpen) {
      openSwitchChainModal();
    }
  }, [
    chainSupported,
    openSwitchChainModal,
    evmClients,
    isSwitchChainModalOpen,
  ]);

  useEffect(() => {
    if (!wallet && isSwitchChainModalOpen) {
      closeSwitchChainModal();
    }
  }, [wallet, closeSwitchChainModal, isSwitchChainModalOpen]);

  return {
    isSwitchChainModalOpen,
    openSwitchChainModal,
    closeSwitchChainModal,
    targetChain,
    setTargetChain,
  };
};
