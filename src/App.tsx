import { RouterProvider } from "react-router-dom";
import { lazy } from "react";
import router from "./router";
import { LoadingScreen } from "./components/LoadingScreen";
import { EvmClientsProvider } from "@src/context/evmClients/evmClients.provider";
import { ViewAccountProvider } from "@src/context/viewAccount/viewAccount.provider";

const PrivyContextProvider = lazy(() =>
  import("@src/context/privy.context").then((module) => ({
    default: module.PrivyContextProvider,
  })),
);

const LedgerProvider = lazy(() =>
  import("@src/context/ledger/ledger.provider").then((module) => ({
    default: module.LedgerProvider,
  })),
);

const Notification = lazy(() =>
  import("@src/components/Notification").then((module) => ({
    default: module.Notification,
  })),
);

const SwitchChainModal = lazy(
  () => import("@src/components/Modals/SwitchChainModal/SwitchChainModal"),
);

function App() {
  return (
    <LoadingScreen>
      <PrivyContextProvider>
        <EvmClientsProvider>
          <ViewAccountProvider>
            <LoadingScreen>
              <LedgerProvider>
                <LoadingScreen>
                  <RouterProvider router={router} />
                  <Notification />
                  <SwitchChainModal />
                </LoadingScreen>
              </LedgerProvider>
            </LoadingScreen>
          </ViewAccountProvider>
        </EvmClientsProvider>
      </PrivyContextProvider>
    </LoadingScreen>
  );
}

export default App;
