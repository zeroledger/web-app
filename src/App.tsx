import { RouterProvider } from "react-router-dom";
import { ClientProvider } from "@src/context/client.context";
import { PryxProvider } from "@src/context/pryx.context";
import router from "./router";

function App() {
  return (
    <ClientProvider>
      <PryxProvider>
        <RouterProvider router={router} />
      </PryxProvider>
    </ClientProvider>
  );
}

export default App;
