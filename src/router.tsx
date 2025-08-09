import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { LoadingScreen } from "./components/LoadingScreen";
import { lazy } from "react";

const Root = lazy(() => import("./routes/Root"));
const PrivateRoutes = lazy(() => import("./routes/PrivateRoutes"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));
const Authorization = lazy(() => import("./routes/Authorization"));
const AuthorizedRoutes = lazy(() => import("./routes/AuthorizedRoutes"));

const Router = createBrowserRouter([
  {
    path: "/",
    element: (
      <LoadingScreen>
        <Root />
      </LoadingScreen>
    ),
    errorElement: <Error />,
  },
  {
    element: (
      <LoadingScreen>
        <PrivateRoutes />
      </LoadingScreen>
    ),
    errorElement: <Error />,
    children: [
      {
        path: "/authorization",
        element: (
          <LoadingScreen>
            <Authorization />
          </LoadingScreen>
        ),
        errorElement: <Error />,
      },
      {
        element: (
          <LoadingScreen>
            <AuthorizedRoutes />
          </LoadingScreen>
        ),
        errorElement: <Error />,
        children: [
          {
            path: "/panel",
            element: (
              <LoadingScreen>
                <PanelRoute />
              </LoadingScreen>
            ),
          },
          {
            path: "/panel/:tab",
            element: (
              <LoadingScreen>
                <PanelRoute />
              </LoadingScreen>
            ),
          },
        ],
      },
    ],
  },
]);

export default Router;
