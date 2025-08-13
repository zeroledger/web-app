import { useEffect } from "react";
import { useModal } from "@src/hooks/useModal";
import { usePrivyWalletAdapter } from "./usePrivyWalletAdapter";
import { EvmClients } from "@src/services/Clients";

export const useSwitchModal = (evmClients: EvmClients | undefined) => {
  const { wallet, targetChain, setTargetChain, chainSupported } =
    usePrivyWalletAdapter();
  const {
    isOpen: isSwitchChainModalOpen,
    openModal: openSwitchChainModal,
    closeModal: closeSwitchChainModal,
  } = useModal();

  useEffect(() => {
    if (isSwitchChainModalOpen && chainSupported) {
      console.log("close");
      closeSwitchChainModal();
    }
  }, [isSwitchChainModalOpen, closeSwitchChainModal, chainSupported]);

  useEffect(() => {
    if (!chainSupported && evmClients && !isSwitchChainModalOpen) {
      console.log("open");
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
