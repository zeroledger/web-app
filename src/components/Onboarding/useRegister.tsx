import { useContext, useState, useEffect } from "react";
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
} from "@src/common.constants";
import { EvmClients } from "@src/services/Clients";
import { initialize } from "@src/services/ledger";
import debounce from "debounce";

export const useRegister = () => {
  const { wallet, getAccount, getProvider } = useWalletAdapter();
  const {
    setEvmClients,
    setLedger,
    setAuthorized,
    setPassword,
    targetChain,
    viewAccount,
    ledger,
    tokenAddress,
  } = useContext(LedgerContext);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);

  const navigate = useNavigate();

  // Trigger registration when password is set
  const open = debounce((password: string) => {
    setPendingPassword(password);
  }, 50);

  // Run registration logic when password is pending
  useEffect(() => {
    const runRegistration = async () => {
      if (!pendingPassword || !wallet || !targetChain) {
        return;
      }
      try {
        setIsConnecting(true);
        setPassword(pendingPassword);
        const [account, provider] = await Promise.all([
          getAccount(),
          getProvider(),
        ]);

        const newEvmClientService = new EvmClients(
          WS_RPC[targetChain.id],
          RPC[targetChain.id],
          pollingInterval[targetChain.id],
          targetChain,
          {
            account,
            provider,
            silentSigner: wallet.walletClientType === "privy",
          },
        );
        setEvmClients(newEvmClientService);

        const externalClient = newEvmClientService.externalClient();

        const newLedger = await initialize(
          wallet,
          viewAccount!,
          newEvmClientService,
          APP_PREFIX_KEY,
          TES_URL,
          VAULT_ADDRESS,
          tokenAddress,
          FAUCET_URL,
          INIT_SYNC_BLOCK,
        );
        setLedger(newLedger);

        if (
          viewAccount!.hasEncryptedViewAccount(externalClient.account.address)
        ) {
          await viewAccount!.unlockViewAccount(
            externalClient.account.address,
            pendingPassword,
          );
          setAuthorized(true);
          navigate("/panel/wallet");
        } else {
          viewAccount!.prepareViewAccount(
            externalClient.account.address,
            pendingPassword,
          );
          const isViewAccountValid =
            await newLedger.tesService.validateViewAccount(
              externalClient.account.address,
            );
          if (!isViewAccountValid) {
            throw new Error("Invalid password");
          }
          setAuthorized(false);
          navigate("/authorization");
        }
      } catch (e) {
        const err = e as Error;
        const isInvalidPassword = err.message === "aes/gcm: invalid ghash tag";
        if (isInvalidPassword) {
          setError(new Error("Invalid password"));
        } else {
          console.error(err);
          setError(err);
        }
      } finally {
        setIsConnecting(false);
        setPendingPassword(null); // Clear pending password
      }
    };

    if (!isConnecting) {
      runRegistration();
    }
  }, [
    pendingPassword,
    wallet,
    targetChain,
    setPassword,
    setEvmClients,
    setLedger,
    setAuthorized,
    viewAccount,
    navigate,
    ledger,
    isConnecting,
    tokenAddress,
    getAccount,
    getProvider,
  ]);

  return { open, isConnecting, error, setError };
};
