import { useContext, useState, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";

export const useResetWalletModal = () => {
  const { ledgerService } = useContext(LedgerContext);
  const { viewAccount } = useContext(ViewAccountContext);
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const handleResetWallet = useCallback(async () => {
    try {
      console.log("[zeroledger-app] resetting wallet");
      viewAccount?.reset();
      await ledgerService?.reset();
      window.location.reload();
    } catch (error) {
      console.error("[zeroledger-app] Failed to clear data:", error);
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
