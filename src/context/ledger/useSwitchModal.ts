import { useEffect } from "react";
import { useModal } from "@src/hooks/useModal";
import { EvmClients } from "@src/services/Clients";

export const useSwitchModal = (
  evmClients: EvmClients | undefined,
  chainSupported: boolean,
) => {
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

  return {
    isSwitchChainModalOpen,
    openSwitchChainModal,
    closeSwitchChainModal,
  };
};
