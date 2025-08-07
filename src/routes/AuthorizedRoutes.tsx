import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const AuthorizedRoutes = () => {
  const { authorized } = useContext(ViewAccountContext);
  return authorized ? (
    <Outlet />
  ) : (
    <Navigate to="/view-account-authorization" />
  );
};
export default AuthorizedRoutes;
