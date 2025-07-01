import { ClientContext } from "@src/context/client.context";
import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

const PrivateRoutes = () => {
  const { loggedIn } = useContext(ClientContext);
  return loggedIn ? <Outlet /> : <Navigate to="/" />;
};
export default PrivateRoutes;
