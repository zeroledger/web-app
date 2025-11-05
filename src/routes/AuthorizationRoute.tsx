import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import PageContainer from "@src/components/PageContainer";
import ViewAccountAuthorization from "@src/components/ViewAccountAuthorization/ViewAccountAuthorization";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";

/**
 * Authorization route "/authorization"
 * Requirements: User signed in, has linking preference, NOT yet authorized
 */
export default function AuthorizationRoute() {
  const { evmClients, initializing, authorized, connectionWalletPreference } =
    useContext(LedgerContext);

  // Still initializing
  if (initializing) {
    return <DumpLoadingScreen />;
  }

  // Not signed in - redirect to root
  if (!evmClients) {
    return <Navigate to="/" replace />;
  }

  // No connection wallet preference - redirect to connect wallet
  if (connectionWalletPreference === null) {
    return <Navigate to="/connect-wallet" replace />;
  }

  // Already authorized - redirect to panel
  if (authorized) {
    return <Navigate to="/panel/wallet" replace />;
  }

  // Show authorization
  return (
    <PageContainer>
      <ViewAccountAuthorization />
    </PageContainer>
  );
}
