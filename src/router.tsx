import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { LoadingScreen } from "./components/LoadingScreen";
import { lazy, Suspense } from "react";

const Auth = lazy(() => import("./routes/Auth"));
const PrivateRoutes = lazy(() => import("./routes/PrivateRoutes"));
const PanelRoute = lazy(() => import("./routes/PanelRoute"));
const Authorization = lazy(() => import("./routes/Authorization"));

const Router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <Auth />
      </Suspense>
    ),
    errorElement: <Error />,
  },
  {
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <PrivateRoutes />
      </Suspense>
    ),
    errorElement: <Error />,
    children: [
      {
        path: "/panel",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <PanelRoute />
          </Suspense>
        ),
      },
      {
        path: "/panel/:tab",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <PanelRoute />
          </Suspense>
        ),
      },
      {
        path: "/view-account-authorization",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Authorization />
          </Suspense>
        ),
      },
    ],
  },
]);

export default Router;
