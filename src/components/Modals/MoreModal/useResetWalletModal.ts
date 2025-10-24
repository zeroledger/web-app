import { useContext, useState } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";

export const useResetWalletModal = () => {
  const { ledger, viewAccount, evmClients } = useContext(LedgerContext);
  const { wallet, logout } = useWalletAdapter();
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);

  const handleResetWallet = debounce(async () => {
    try {
      const externalClient = evmClients?.externalClient();
      viewAccount?.reset(externalClient!.account.address);
      await ledger?.watcher.reset();
      await logout();
      wallet?.disconnect();
      window.location.reload();
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  const onResetWalletModalOpen = () => {
    setIsResetWalletModalOpen(true);
  };

  const onResetWalletModalClose = () => {
    setIsResetWalletModalOpen(false);
  };

  return {
    isResetWalletModalOpen,
    onResetWalletModalOpen,
    onResetWalletModalClose,
    handleResetWallet,
  };
};
