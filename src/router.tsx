import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { LoadingScreen } from "./components/LoadingScreen";
import { lazy } from "react";

const Auth = lazy(() => import("./routes/Auth"));
const PrivateRoutes = lazy(() => import("./routes/PrivateRoutes"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));
const Authorization = lazy(() => import("./routes/Authorization"));

const Router = createBrowserRouter([
  {
    path: "/",
    element: (
      <LoadingScreen>
        <Auth />
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
      {
        path: "/view-account-authorization",
        element: (
          <LoadingScreen>
            <Authorization />
          </LoadingScreen>
        ),
      },
    ],
  },
]);

export default Router;
