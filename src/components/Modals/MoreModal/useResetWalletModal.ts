import { useContext, useState } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { catchService } from "@src/services/core/catch.service";
import debounce from "debounce";
import { resetLinkWalletPreference } from "@src/services/linkWalletPreference";

export const useResetWalletModal = () => {
  const { ledger, viewAccount, evmClients } = useContext(LedgerContext);
  const { primaryWallet, logout } = useWalletAdapter();
  const [isResetWalletModalOpen, setIsResetWalletModalOpen] = useState(false);

  const handleResetWallet = debounce(async () => {
    try {
      const externalClient = evmClients?.externalClient();
      viewAccount?.reset(externalClient!.account.address);
      resetLinkWalletPreference();
      await ledger?.watcher.reset();
      await logout();
      primaryWallet?.disconnect();
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
