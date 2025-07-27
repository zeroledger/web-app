import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWallets } from "@privy-io/react-auth";

const PrivateRoutes = () => {
  const { wallets } = useWallets();
  const { viewAccount } = useContext(ViewAccountContext);
  const { evmClientService } = useContext(EvmClientsContext);
  const { ledgerService } = useContext(LedgerContext);
  return viewAccount && evmClientService && ledgerService && wallets.length ? (
    <Outlet />
  ) : (
    <Navigate to="/" />
  );
};
export default PrivateRoutes;
