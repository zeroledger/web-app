import { RouterProvider } from "react-router-dom";
import { ClientProvider } from "@src/context/client.context";
import { DecoyProvider } from "@src/context/decoy.context";
import router from "./router";

function App() {
  return (
    <ClientProvider>
      <DecoyProvider>
        <RouterProvider router={router} />
      </DecoyProvider>
    </ClientProvider>
  );
}

export default App;
