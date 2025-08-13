import { useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import { LedgerContext } from "./ledger.context";
import { APP_PREFIX_KEY } from "@src/common.constants";
import { type Ledger } from "@src/services/ledger";
import { EvmClients } from "@src/services/Clients";
import { useViewAccountAuthorization } from "./useViewAccountAuthorization";
import { usePrivyWalletAdapter } from "./usePrivyWalletAdapter";
import { useSwitchModal } from "./useSwitchModal";
import { ViewAccount } from "@src/services/Account";
import { useEnsProfile } from "./useEnsProfile";
import { Address } from "viem";

const viewAccount = new ViewAccount(APP_PREFIX_KEY);

export const LedgerProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [ledger, setLedger] = useState<Ledger>();
  const {
    password,
    setPassword,
    authorized,
    resetViewAccountAuthorization,
    setAuthorized,
  } = useViewAccountAuthorization();
  const [evmClients, setEvmClients] = useState<EvmClients>();
  const {
    wallet,
    isWalletChanged,
    chainSupported,
    isWalletNetworkChanged,
    isWalletAddressChanged,
  } = usePrivyWalletAdapter();

  const {
    isSwitchChainModalOpen,
    openSwitchChainModal,
    closeSwitchChainModal,
    targetChain,
    setTargetChain,
  } = useSwitchModal(evmClients);

  const { data: ensProfile, isLoading: isEnsLoading } = useEnsProfile(
    wallet?.address as Address | undefined,
  );

  const reset = useCallback(() => {
    setLedger(undefined);
    setEvmClients(undefined);
    resetViewAccountAuthorization();
  }, [setLedger, setEvmClients, resetViewAccountAuthorization]);

  useEffect(() => {
    if (!wallet) {
      reset();
    }
  }, [wallet, reset]);

  const value = useMemo(
    () => ({
      // Ledger
      ledger,
      setLedger,
      // Wallet
      wallet,
      isWalletChanged,
      isWalletNetworkChanged,
      isWalletAddressChanged,
      chainSupported,
      // Switch Chain Modal
      isSwitchChainModalOpen,
      openSwitchChainModal,
      closeSwitchChainModal,
      setTargetChain,
      targetChain,
      // EVM Clients
      evmClients,
      setEvmClients,
      // Password
      password,
      setPassword,
      // Authorization
      authorized,
      setAuthorized,
      // View Account
      viewAccount,
      resetViewAccountAuthorization,
      // Ens Profile
      ensProfile,
      isEnsLoading,
      // Reset
      reset,
    }),
    [
      ledger,
      wallet,
      isWalletNetworkChanged,
      isWalletAddressChanged,
      isWalletChanged,
      isSwitchChainModalOpen,
      openSwitchChainModal,
      closeSwitchChainModal,
      setTargetChain,
      targetChain,
      password,
      setPassword,
      authorized,
      setAuthorized,
      evmClients,
      chainSupported,
      resetViewAccountAuthorization,
      setLedger,
      setEvmClients,
      reset,
      ensProfile,
      isEnsLoading,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
};

/**
 * connect -> pass -> auth -> page: page should check this and do navigation (done)
 * connect -> pass -> page: page should check this and do navigation (done)
 * auth -> change wallet -> pass -> auth: auth page should reset password and redirect to pass page (done)
 * page -> change wallet to not authorized -> pass -> auth -> page: page should check this and do navigation
 * page -> change wallet to auth with different pass -> pass -> auth -> page: page should check this and do navigation
 * page -> change wallet to auth with same pass -> page: page should check this and do navigation
 */
