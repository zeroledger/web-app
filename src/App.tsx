import { RouterProvider } from "react-router-dom";
import { ClientProvider } from "@src/context/client.context";
import { ControllerProvider } from "@src/context/controller.context";
import router from "./router";

function App() {
  return (
    <ClientProvider>
      <ControllerProvider>
        <RouterProvider router={router} />
      </ControllerProvider>
    </ClientProvider>
  );
}

export default App;
