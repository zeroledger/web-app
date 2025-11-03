import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { lazy } from "react";

const RootRoute = lazy(() => import("./routes/RootRoute"));
const LinkWalletRoute = lazy(() => import("./routes/LinkWalletRoute"));
const AuthorizationRoute = lazy(() => import("./routes/AuthorizationRoute"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));

const Router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    errorElement: <Error />,
  },
  {
    path: "/link-wallet",
    element: <LinkWalletRoute />,
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
