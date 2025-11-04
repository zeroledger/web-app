import {
  toViemAccount,
  useConnectWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { type Address, Chain } from "viem";
import { useCallback, useEffect, useState } from "react";
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
  SUPPORTED_CHAINS,
  TOKEN_ADDRESS,
} from "@src/common.constants";
import { EvmClients } from "@src/services/Clients";
import { deriveLocalAccount } from "@src/utils/deriveLocalWallet";
import { initialize, type Ledger } from "@src/services/ledger";
import { ViewAccount } from "@src/services/Account";
import { setConnectionWalletPreference } from "@src/services/connectionWalletPreference";

const viewAccount = new ViewAccount(APP_PREFIX_KEY);

export function useLedgerWallets() {
  const { wallets, ready } = useWallets();
  const { logout, exportWallet, authenticated, login: privyLogin } = usePrivy();

  const [ledger, setLedger] = useState<Ledger>();
  const [authorized, setAuthorized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [targetChain, setTargetChain] = useState<Chain>(SUPPORTED_CHAINS[0]);
  const [chainSupported, setChainSupported] = useState<boolean>(true);
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const [evmClients, setEvmClients] = useState<EvmClients>();

  const [isExternalWalletConnecting, setIsExternalWalletConnecting] =
    useState(false);

  const { connectWallet } = useConnectWallet({
    onSuccess: () => {
      setIsExternalWalletConnecting(false);
      setConnectionWalletPreference(true);
    },
    onError: () => {
      setIsExternalWalletConnecting(false);
    },
  });

  useEffect(() => {
    if (!embeddedWallet || !ready) {
      return;
    }
    const init = async () => {
      setIsConnecting(true);
      const externalAccount =
        externalWallet?.walletClientType === "privy"
          ? await toViemAccount({ wallet: externalWallet! })
          : (externalWallet?.address as Address | undefined);
      const walletChainId = externalWallet
        ? Number(externalWallet?.chainId.split(":")[1])
        : SUPPORTED_CHAINS[0].id;

      const switchToChain = SUPPORTED_CHAINS.find(
        (c) => c.id === walletChainId,
      );
      const chain = switchToChain ?? SUPPORTED_CHAINS[0];
      const evmClients = new EvmClients(
        WS_RPC[chain.id],
        RPC[chain.id],
        pollingInterval[chain.id],
        chain,
      );
      const embeddedClient = evmClients.setEmbeddedClient({
        account: await toViemAccount({ wallet: embeddedWallet }),
        provider: await embeddedWallet.getEthereumProvider(),
      });
      const primaryAccount = externalAccount
        ? externalAccount
        : await deriveLocalAccount(
            embeddedClient,
            embeddedWallet.address as Address,
          );
      evmClients.setPrimaryClient({
        account: primaryAccount,
        provider: externalAccount
          ? await externalWallet?.getEthereumProvider()
          : undefined,
      });

      const primaryAddress = evmClients.primaryClient()!.account.address;

      // Sign typed data with embedded wallet to create ViewAccount
      const signature = await viewAccount!.signViewAccountCreation(
        evmClients.embeddedClient()!,
        primaryAddress,
        VAULT_ADDRESS,
      );

      // Create ViewAccount from signature
      viewAccount!.createFromSignature(signature);

      const newLedger = await initialize(
        viewAccount!,
        evmClients,
        APP_PREFIX_KEY,
        TES_URL,
        VAULT_ADDRESS,
        TOKEN_ADDRESS,
        INVOICE_FACTORY_ADDRESS,
        FAUCET_URL,
        INIT_SYNC_BLOCK,
      );
      const primaryWalletAddress = evmClients.primaryClient()!.account.address;
      let isAuthorized = false;
      if (viewAccount!.hasAuthorization(primaryWalletAddress)) {
        await viewAccount!.loadAuthorization(primaryWalletAddress);
        isAuthorized = true;
      }
      setAuthorized(isAuthorized);
      setChainSupported(!!switchToChain);
      setTargetChain(chain);
      setLedger(newLedger);
      setEvmClients(evmClients);
      setIsConnecting(false);
      setIsExternalWalletConnecting(false);
    };
    init();
  }, [embeddedWallet, externalWallet, ready]);

  const connect = useCallback(async () => {
    if (authenticated) {
      await logout();
    }
    privyLogin({
      loginMethods: ["wallet"],
    });
  }, [authenticated, privyLogin, logout]);

  const signIn = useCallback(async () => {
    if (authenticated) {
      await logout();
    }
    privyLogin({ loginMethods: ["email"] });
  }, [authenticated, privyLogin, logout]);

  const connectExternalWallet = useCallback(async () => {
    setIsExternalWalletConnecting(true);
    connectWallet();
  }, [connectWallet]);

  const reset = useCallback(() => {
    setLedger(undefined);
    setEvmClients(undefined);
    setAuthorized(false);
    setChainSupported(true);
  }, [setLedger, setEvmClients]);

  useEffect(() => {
    if (!embeddedWallet) {
      reset();
    }
  }, [embeddedWallet, reset]);

  return {
    initializing: !ready || isConnecting,
    targetChain,
    logout,
    exportWallet,
    connect,
    signIn,
    connectExternalWallet,
    evmClients,
    ledger,
    reset,
    chainSupported,
    viewAccount,
    authorized,
    setAuthorized,
    isExternalWalletConnecting,
  };
}
