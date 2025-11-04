import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
import PageContainer from "@src/components/PageContainer";
import SignIn from "@src/components/Onboarding/SignIn";
import { getConnectionWalletPreference } from "@src/services/connectionWalletPreference";

/**
 * Root route "/" - Shows sign in if not initialized, redirects to appropriate route if initialized.
 * Requirements: None (always accessible)
 */
export default function RootRoute() {
  const { evmClients, initializing, authorized } = useContext(LedgerContext);

  // Still initializing
  if (initializing) {
    return <DumpLoadingScreen />;
  }

  // Not signed in yet - show sign in
  if (!evmClients) {
    return (
      <PageContainer>
        <SignIn />
      </PageContainer>
    );
  }

  // No connection wallet preference - redirect to connect wallet
  if (getConnectionWalletPreference() === null) {
    return <Navigate to="/connect-wallet" replace />;
  }

  if (!authorized) {
    return <Navigate to="/authorization" replace />;
  }

  return <Navigate to="/panel/wallet" replace />;
}
