import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { lazy } from "react";

const Root = lazy(() => import("./routes/Root"));
const RequireWalletAdapter = lazy(
  () => import("./routes/RequireWalletAdapter"),
);
const RequireEmbeddedWallet = lazy(
  () => import("./routes/RequireEmbeddedWallet"),
);
const LinkWalletRoute = lazy(() => import("./routes/LinkWalletRoute"));
const InitializingRoute = lazy(() => import("./routes/InitializingRoute"));
const RequireLinkWalletChoice = lazy(
  () => import("./routes/RequireLinkWalletChoice"),
);
const RequireViewAccount = lazy(() => import("./routes/RequireViewAccount"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));
const Authorization = lazy(() => import("./routes/Authorization"));
const RequireAuthorization = lazy(
  () => import("./routes/RequireAuthorization"),
);

const Router = createBrowserRouter([
  {
    // Route guard: Requires Privy adapter to be ready
    element: <RequireWalletAdapter />,
    children: [
      {
        path: "/",
        element: <Root />,
        errorElement: <Error />,
      },
      {
        // Route guard: Requires user to have made link-wallet choice
        element: <RequireEmbeddedWallet />,
        children: [
          {
            path: "/link-wallet",
            element: <LinkWalletRoute />,
            errorElement: <Error />,
          },
          {
            // Route guard: Requires user to have made link-wallet choice
            element: <RequireLinkWalletChoice />,
            children: [
              {
                path: "/initializing",
                element: <InitializingRoute />,
                errorElement: <Error />,
              },
            ],
          },
        ],
      },
      {
        // Route guard: Requires ViewAccount to exist
        element: <RequireViewAccount />,
        errorElement: <Error />,
        children: [
          {
            path: "/authorization",
            element: <Authorization />,
            errorElement: <Error />,
          },
          {
            // Route guard: Requires authorization
            element: <RequireAuthorization />,
            errorElement: <Error />,
            children: [
              {
                path: "/panel",
                element: <PanelRoute />,
              },
              {
                path: "/panel/:tab",
                element: <PanelRoute />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default Router;
