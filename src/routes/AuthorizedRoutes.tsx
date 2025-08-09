import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const AuthorizedRoutes = () => {
  const { authorized, password } = useContext(ViewAccountContext);
  return authorized && password ? <Outlet /> : <Navigate to="/authorization" />;
};
export default AuthorizedRoutes;
