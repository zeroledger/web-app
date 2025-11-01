import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";

const RequireViewAccount = () => {
  const { viewAccount } = useContext(LedgerContext);
  return viewAccount?.getViewAccount() ? <Outlet /> : <Navigate to="/" />;
};
export default RequireViewAccount;
