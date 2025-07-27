import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { Auth, PrivateRoutes, PanelRoute, Authorization } from "./routes";

const Router = createBrowserRouter([
  {
    path: "/",
    element: <Auth />,
    errorElement: <Error />,
  },
  {
    element: <PrivateRoutes />,
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
      {
        path: "/view-account-authorization",
        element: <Authorization />,
      },
    ],
  },
]);

export default Router;
