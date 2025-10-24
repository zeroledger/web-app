import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";

const PrivateRoutes = () => {
  const { password } = useContext(LedgerContext);
  return password ? <Outlet /> : <Navigate to="/" />;
};
export default PrivateRoutes;
