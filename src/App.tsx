import { RouterProvider } from "react-router-dom";
import { lazy } from "react";
import router from "./router";
import { LoadingScreen } from "./components/LoadingScreen";

const PrivyContextProvider = lazy(() =>
  import("@src/context/privy.context").then((module) => ({
    default: module.PrivyContextProvider,
  })),
);

const EvmClientsProvider = lazy(() =>
  import("@src/context/evmClients/evmClients.provider").then((module) => ({
    default: module.EvmClientsProvider,
  })),
);

const ViewAccountProvider = lazy(() =>
  import("@src/context/viewAccount/viewAccount.provider").then((module) => ({
    default: module.ViewAccountProvider,
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
        <LoadingScreen>
          <EvmClientsProvider>
            <LoadingScreen>
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
            </LoadingScreen>
          </EvmClientsProvider>
        </LoadingScreen>
      </PrivyContextProvider>
    </LoadingScreen>
  );
}

export default App;
