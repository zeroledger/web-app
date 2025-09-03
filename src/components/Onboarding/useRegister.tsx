import { useCallback, useContext, useState } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useNavigate } from "react-router-dom";
import {
  APP_PREFIX_KEY,
  FAUCET_URL,
  pollingInterval,
  TES_URL,
  RPC,
  WS_RPC,
  VAULT_ADDRESS,
  TOKEN_ADDRESS,
} from "@src/common.constants";
import { EvmClients } from "@src/services/Clients";
import { initialize } from "@src/services/ledger";

export const useRegister = () => {
  const {
    setEvmClients,
    setLedger,
    setAuthorized,
    setPassword,
    targetChain,
    wallet,
    viewAccount,
  } = useContext(LedgerContext);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();

  const navigate = useNavigate();

  const open = useCallback(
    async (password: string) => {
      try {
        setIsConnecting(true);
        setPassword(password);
        const newEvmClientService = new EvmClients(
          WS_RPC[targetChain.id],
          RPC[targetChain.id],
          pollingInterval[targetChain.id],
          targetChain,
          wallet!,
        );
        setEvmClients(newEvmClientService);

        const externalClient = await newEvmClientService.externalClient();

        const newLedger = await initialize(
          wallet!,
          viewAccount!,
          newEvmClientService!,
          APP_PREFIX_KEY,
          TES_URL,
          VAULT_ADDRESS,
          TOKEN_ADDRESS,
          FAUCET_URL,
        );
        setLedger(newLedger);
        if (
          viewAccount!.hasEncryptedViewAccount(externalClient.account.address)
        ) {
          await viewAccount!.unlockViewAccount(
            externalClient.account.address,
            password,
          );
          setAuthorized(true);
          navigate("/panel/wallet");
        } else {
          viewAccount!.prepareViewAccount(
            externalClient.account.address,
            password,
          );
          setAuthorized(false);
          navigate("/authorization");
        }
      } catch (e) {
        const err = e as Error;
        const isInvalidPassword = err.message === "aes/gcm: invalid ghash tag";
        if (isInvalidPassword) {
          setError(new Error("Unexpected error"));
        } else {
          console.error(err);
          setError(err);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [
      setPassword,
      setEvmClients,
      setLedger,
      setAuthorized,
      setError,
      targetChain,
      wallet,
      viewAccount,
      navigate,
    ],
  );

  return { open, isConnecting, error, setError };
};
