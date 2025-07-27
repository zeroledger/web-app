import { RouterProvider } from "react-router-dom";
import { LedgerProvider } from "@src/context/ledger/ledger.provider";
import { PrivyContextProvider } from "@src/context/privy.context";
import router from "./router";
import { ViewAccountProvider } from "./context/viewAccount/viewAccount.provider";
import { EvmClientsProvider } from "./context/evmClients/evmClients.provider";

function App() {
  return (
    <PrivyContextProvider>
      <EvmClientsProvider>
        <ViewAccountProvider>
          <LedgerProvider>
            <RouterProvider router={router} />
          </LedgerProvider>
        </ViewAccountProvider>
      </EvmClientsProvider>
    </PrivyContextProvider>
  );
}

export default App;
