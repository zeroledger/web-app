import { useContext, useState } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";

export const useResetWalletModal = () => {
  const { ledger, viewAccount, evmClients, wallet, logout } =
    useContext(LedgerContext);
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);

  const handleResetWallet = debounce(async () => {
    try {
      const externalClient = await evmClients?.externalClient();
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
