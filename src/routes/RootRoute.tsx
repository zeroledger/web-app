import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
import PageContainer from "@src/components/PageContainer";
import SignIn from "@src/components/Onboarding/SignIn";
import { getLinkWalletPreference } from "@src/services/linkWalletPreference";

/**
 * Root route "/" - Shows sign in if not initialized, redirects to appropriate route if initialized.
 * Requirements: None (always accessible)
 */
export default function RootRoute() {
  const { evmClients, initializing, authorized } = useContext(LedgerContext);
  const linkWalletPref = getLinkWalletPreference();

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
  if (linkWalletPref === null) {
    return <Navigate to="/link-wallet" replace />;
  }

  if (!authorized) {
    return <Navigate to="/authorization" replace />;
  }

  return <Navigate to="/panel/wallet" replace />;
}
