import { useContext, useState, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { Logger } from "@src/utils/logger";

const logger = new Logger("useResetWalletModal");

export const useResetWalletModal = () => {
  const { ledgerService } = useContext(LedgerContext);
  const { viewAccount } = useContext(ViewAccountContext);
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const handleResetWallet = useCallback(async () => {
    try {
      logger.log("resetting wallet");
      viewAccount?.reset();
      await ledgerService?.reset();
      window.location.reload();
    } catch (error) {
      logger.error(`Failed to reset wallet: ${error}`);
    }
  }, [ledgerService, viewAccount]);

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
