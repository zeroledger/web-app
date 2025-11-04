import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { lazy } from "react";

const RootRoute = lazy(() => import("./routes/RootRoute"));
const ConnectWalletRoute = lazy(() => import("./routes/ConnectWalletRoute"));
const AuthorizationRoute = lazy(() => import("./routes/AuthorizationRoute"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));

const Router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    errorElement: <Error />,
  },
  {
    path: "/connect-wallet",
    element: <ConnectWalletRoute />,
    errorElement: <Error />,
  },
  {
    path: "/authorization",
    element: <AuthorizationRoute />,
    errorElement: <Error />,
  },
  {
    path: "/panel",
    element: <PanelRoute />,
    errorElement: <Error />,
  },
  {
    path: "/panel/:tab",
    element: <PanelRoute />,
    errorElement: <Error />,
  },
]);

export default Router;
