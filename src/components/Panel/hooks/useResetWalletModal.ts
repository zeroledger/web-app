import { useContext, useState, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { Logger } from "@src/utils/logger";

const logger = new Logger("useResetWalletModal");

export const useResetWalletModal = () => {
  const { ledger, viewAccount, evmClients } = useContext(LedgerContext);
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const handleResetWallet = useCallback(async () => {
    try {
      logger.log("resetting wallet");
      const externalClient = await evmClients?.externalClient();
      viewAccount?.reset(externalClient!.account.address);
      await ledger?.reset();
      window.location.reload();
    } catch (error) {
      logger.error(`Failed to reset wallet: ${error}`);
    }
  }, [ledger, viewAccount, evmClients]);

  const onResetWalletModalOpen = () => {
    setIsResetWalletModalOpen(true);
    disableSwipe();
  };

  const onResetWalletModalClose = () => {
    setIsResetWalletModalOpen(false);
    enableSwipe();
  };

  return {
    isResetWalletModalOpen,
    onResetWalletModalOpen,
    onResetWalletModalClose,
    handleResetWallet,
  };
};
