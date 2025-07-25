import { RouterProvider } from "react-router-dom";
import { LedgerProvider } from "@src/context/ledger.context";
import { PrivyContextProvider } from "@src/context/privy.context";
import router from "./router";

function App() {
  return (
    <PrivyContextProvider>
      <LedgerProvider>
        <RouterProvider router={router} />
      </LedgerProvider>
    </PrivyContextProvider>
  );
}

export default App;
