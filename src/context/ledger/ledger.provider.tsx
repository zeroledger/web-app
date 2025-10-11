import { useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import { LedgerContext } from "./ledger.context";
import { APP_PREFIX_KEY, TOKEN_ADDRESS } from "@src/common.constants";
import { type Ledger } from "@src/services/ledger";
import { EvmClients } from "@src/services/Clients";
import { useViewAccountAuthorization } from "./useViewAccountAuthorization";
import { useWalletAdapter } from "./useWalletAdapter";
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
  const { wallet } = useWalletAdapter();

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
      // Token Address
      tokenAddress: TOKEN_ADDRESS,
    }),
    [
      ledger,
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
