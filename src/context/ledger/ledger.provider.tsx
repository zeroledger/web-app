import { useMemo, ReactNode } from "react";
import { LedgerContext } from "./ledger.context";
import { TOKEN_ADDRESS, SCAN_URL } from "@src/common.constants";
import { useSwitchModal } from "./useSwitchModal";
import { useEnsProfile } from "./useEnsProfile";
import { useLedgerWallets } from "./useLedgerWallets";

export const LedgerProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const {
    initializing,
    targetChain,
    logout,
    exportWallet,
    connect,
    signIn,
    connectExternalWallet,
    isExternalWalletConnecting,
    evmClients,
    ledger,
    reset,
    chainSupported,
    viewAccount,
    authorized,
    setAuthorized,
    connectionWalletPreference,
    setConnectionWalletPreference,
    resetConnectionWalletPreference,
  } = useLedgerWallets();

  const {
    isSwitchChainModalOpen,
    openSwitchChainModal,
    closeSwitchChainModal,
  } = useSwitchModal(evmClients, chainSupported);

  const { data: ensProfile, isLoading: isEnsLoading } = useEnsProfile(
    evmClients?.primaryClient()?.account.address,
  );

  const value = useMemo(
    () => ({
      // wallet
      logout,
      exportWallet,
      connect,
      signIn,
      connectExternalWallet,
      isExternalWalletConnecting,
      connectionWalletPreference,
      setConnectionWalletPreference,
      resetConnectionWalletPreference,
      viewAccount,
      // Ledger
      initializing,
      ledger,
      // Switch Chain Modal
      isSwitchChainModalOpen,
      openSwitchChainModal,
      closeSwitchChainModal,
      targetChain,
      // EVM Clients
      evmClients,
      // Authorization
      authorized,
      setAuthorized,
      // Ens Profile
      ensProfile,
      isEnsLoading,
      // Reset
      reset,
      // Token Address
      tokenAddress: TOKEN_ADDRESS,
      // Explorer base URL for current chain
      scanUrl: SCAN_URL[targetChain.id] ?? "",
    }),
    [
      initializing,
      logout,
      exportWallet,
      connect,
      signIn,
      connectExternalWallet,
      isExternalWalletConnecting,
      connectionWalletPreference,
      setConnectionWalletPreference,
      resetConnectionWalletPreference,
      viewAccount,
      ledger,
      isSwitchChainModalOpen,
      openSwitchChainModal,
      closeSwitchChainModal,
      targetChain,
      authorized,
      evmClients,
      reset,
      ensProfile,
      isEnsLoading,
      setAuthorized,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};
