import { LedgerContext } from "@src/context/ledger/ledger.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const AuthorizedRoutes = () => {
  const { authorized, password } = useContext(LedgerContext);
  return authorized && password ? <Outlet /> : <Navigate to="/authorization" />;
};
export default AuthorizedRoutes;
