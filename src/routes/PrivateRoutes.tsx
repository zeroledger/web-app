import { LedgerContext } from "@src/context/ledger.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const PrivateRoutes = () => {
  const { initialized } = useContext(LedgerContext);
  return initialized ? <Outlet /> : <Navigate to="/" />;
};
export default PrivateRoutes;
