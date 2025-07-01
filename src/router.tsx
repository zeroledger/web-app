import { createBrowserRouter } from "react-router-dom";
import Error from "@src/components/Error";
import { Auth, PrivateRoutes } from "./routes";
import PanelRoute from "./routes/PanelRoute";

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
    ],
  },
]);

export default Router;
