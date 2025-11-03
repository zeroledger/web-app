import { lazy, useContext } from "react";
import { Navigate } from "react-router-dom";
import {
  LoadingScreen,
  DumpLoadingScreen,
} from "@src/components/LoadingScreen";
import PageContainer from "@src/components/PageContainer";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { getLinkWalletPreference } from "@src/services/linkWalletPreference";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));
const PanelProvider = lazy(() =>
  import("@src/components/Panel/context/panel/panel.provider").then(
    ({ PanelProvider }) => ({ default: PanelProvider }),
  ),
);

/**
 * Panel route "/panel" and "/panel/:tab"
 * Requirements: User signed in, has linking preference, AND authorized
 */
export default function PanelRoute() {
  const { evmClients, initializing, authorized } = useContext(LedgerContext);
  const linkWalletPref = getLinkWalletPreference();

  // Still initializing
  if (initializing) {
    return <DumpLoadingScreen />;
  }

  // Not signed in - redirect to root
  if (!evmClients) {
    return <Navigate to="/" replace />;
  }

  // No linking preference - redirect to link wallet
  if (linkWalletPref === null) {
    return <Navigate to="/link-wallet" replace />;
  }

  // Not authorized yet - redirect to authorization
  if (!authorized) {
    return <Navigate to="/authorization" replace />;
  }

  // All requirements met - show panel
  return (
    <PageContainer>
      <LoadingScreen message="Preparing wallet modules...">
        <PanelProvider>
          <LoadingScreen message="Loading panel dashboard...">
            <Panel />
          </LoadingScreen>
        </PanelProvider>
      </LoadingScreen>
    </PageContainer>
  );
}
