import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { lazy } from "react";

const RootRoute = lazy(() => import("./routes/RootRoute"));
const SignInRoute = lazy(() => import("./routes/SignInRoute"));
const LinkWalletRoute = lazy(() => import("./routes/LinkWalletRoute"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));
const Authorization = lazy(() => import("./routes/Authorization"));

const Router = createBrowserRouter([
  {
    element: <RootRoute />,
    path: "/",
    errorElement: <Error />,
    children: [
      {
        path: "/sign-in",
        element: <SignInRoute />,
        errorElement: <Error />,
        children: [
          {
            path: "/link-wallet",
            element: <LinkWalletRoute />,
            errorElement: <Error />,
            children: [
              {
                path: "/authorization",
                element: <Authorization />,
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
    ],
  },
]);

export default Router;
