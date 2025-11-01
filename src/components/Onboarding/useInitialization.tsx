import { useContext, useState, useEffect, useCallback, useRef } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { useNavigate } from "react-router-dom";
import {
  APP_PREFIX_KEY,
  FAUCET_URL,
  pollingInterval,
  TES_URL,
  RPC,
  WS_RPC,
  VAULT_ADDRESS,
  INIT_SYNC_BLOCK,
  INVOICE_FACTORY_ADDRESS,
} from "@src/common.constants";
import { EvmClients } from "@src/services/Clients";
import { initialize } from "@src/services/ledger";
import { Address } from "viem";

export const useInitialization = () => {
  const {
    embeddedWallet,
    primaryWallet,
    getPrimaryAccount,
    getPrimaryProvider,
    getEmbeddedAccount,
    getEmbeddedProvider,
    isWalletChanged,
  } = useWalletAdapter();
  const {
    setEvmClients,
    setLedger,
    setAuthorized,
    targetChain,
    viewAccount,
    tokenAddress,
  } = useContext(LedgerContext);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const initializationAttempted = useRef(false);

  const navigate = useNavigate();

  const init = useCallback(async () => {
    if (!targetChain || !embeddedWallet || !primaryWallet) {
      return;
    }

    // Prevent multiple simultaneous initializations
    if (initializationAttempted.current) {
      return;
    }

    try {
      initializationAttempted.current = true;
      setIsConnecting(true);

      const primaryWalletAddress = primaryWallet.address as Address;

      // Get providers for both primary and embedded wallets
      const [
        primaryAccount,
        primaryProvider,
        embeddedAccount,
        embeddedProvider,
      ] = await Promise.all([
        getPrimaryAccount(),
        getPrimaryProvider(),
        getEmbeddedAccount(),
        getEmbeddedProvider(),
      ]);

      // Create EvmClients with BOTH primary and embedded wallet providers
      const newEvmClientService = new EvmClients(
        WS_RPC[targetChain.id],
        RPC[targetChain.id],
        pollingInterval[targetChain.id],
        targetChain,
        {
          account: primaryAccount,
          provider: primaryProvider,
        },
        {
          account: embeddedAccount,
          provider: embeddedProvider,
        },
      );
      setEvmClients(newEvmClientService);

      // Sign typed data with embedded wallet to create ViewAccount
      const signature = await viewAccount!.signViewAccountCreation(
        newEvmClientService,
        primaryWalletAddress,
        VAULT_ADDRESS,
      );

      // Create ViewAccount from signature
      await viewAccount!.createFromSignature(signature);

      const newLedger = await initialize(
        primaryWallet,
        viewAccount!,
        newEvmClientService,
        APP_PREFIX_KEY,
        TES_URL,
        VAULT_ADDRESS,
        tokenAddress,
        INVOICE_FACTORY_ADDRESS,
        FAUCET_URL,
        INIT_SYNC_BLOCK,
      );
      setLedger(newLedger);

      // Check if authorization already exists
      if (viewAccount!.hasAuthorization(primaryWalletAddress)) {
        await viewAccount!.loadAuthorization(primaryWalletAddress);
        setAuthorized(true);
        navigate("/panel/wallet");
      } else {
        // Need to authorize
        const isViewAccountValid =
          await newLedger.tesService.validateViewAccount(primaryWalletAddress);
        if (!isViewAccountValid) {
          throw new Error("Failed to validate ViewAccount");
        }
        setAuthorized(false);
        navigate("/authorization");
      }
    } catch (e) {
      const err = e as Error;
      console.error(err);
      setError(err);
      // Reset flag on error to allow retry
      initializationAttempted.current = false;
    } finally {
      setIsConnecting(false);
    }
  }, [
    // Removed isConnecting from dependencies to prevent re-creation
    embeddedWallet,
    primaryWallet,
    targetChain,
    setEvmClients,
    setLedger,
    setAuthorized,
    viewAccount,
    navigate,
    tokenAddress,
    getPrimaryAccount,
    getPrimaryProvider,
    getEmbeddedAccount,
    getEmbeddedProvider,
  ]);

  // Run initialization once when component mounts and dependencies are ready
  useEffect(() => {
    if (!isConnecting) {
      init();
    }
  }, [isConnecting, init]);

  // Reset initialization flag when wallet or network actually changes
  useEffect(() => {
    if (isWalletChanged) {
      initializationAttempted.current = false;
    }
  }, [isWalletChanged]);

  return { isConnecting, error, setError, init };
};
