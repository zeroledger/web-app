import { useContext, useState, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { useWallets } from "@privy-io/react-auth";

export const useResetWalletModal = () => {
  const { ledgerService } = useContext(LedgerContext);
  const { viewAccount } = useContext(ViewAccountContext);
  const { evmClientService } = useContext(EvmClientsContext);
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();
  const { wallets } = useWallets();

  const handleResetWallet = useCallback(async () => {
    try {
      console.log("[zeroledger-app] resetting wallet");
      await viewAccount?.reset(evmClientService!.writeClient!.account.address!);
      await ledgerService?.reset();
      setIsResetWalletModalOpen(false);
      wallets.forEach((wallet) => {
        wallet.disconnect();
      });
      enableSwipe();
      window.location.reload();
    } catch (error) {
      console.error("[zeroledger-app] Failed to clear data:", error);
    }
  }, [ledgerService, enableSwipe, viewAccount, evmClientService, wallets]);

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
