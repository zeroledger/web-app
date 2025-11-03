import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
import PageContainer from "@src/components/PageContainer";
import SignIn from "@src/components/Onboarding/SignIn";

/**
 * Root route "/" - Shows sign in if not initialized, redirects to appropriate route if initialized.
 * Requirements: None (always accessible)
 */
export default function RootRoute() {
  const { evmClients, initializing, authorized, linkNeeded } =
    useContext(LedgerContext);

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

  // Signed in - redirect based on state
  if (linkNeeded) {
    return <Navigate to="/link-wallet" replace />;
  }

  if (!authorized) {
    return <Navigate to="/authorization" replace />;
  }

  return <Navigate to="/panel/wallet" replace />;
}
