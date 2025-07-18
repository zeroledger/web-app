import { LedgerContext } from "@src/context/ledger.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const PrivateRoutes = () => {
  const { connected } = useContext(LedgerContext);
  return connected ? <Outlet /> : <Navigate to="/" />;
};
export default PrivateRoutes;
