import { LedgerContext } from "@src/context/ledger/ledger.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const RequireAuthorization = () => {
  const { authorized } = useContext(LedgerContext);
  return authorized ? <Outlet /> : <Navigate to="/authorization" />;
};
export default RequireAuthorization;
