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
  const { evmClients, initializing, authorized, linkNeeded } =
    useContext(LedgerContext);

  // Still initializing
  if (initializing) {
    return <DumpLoadingScreen />;
  }

  // Not signed in - redirect to root
  if (!evmClients) {
    return <Navigate to="/" replace />;
  }

  // No linking preference - redirect to link wallet
  if (linkNeeded) {
    return <Navigate to="/link-wallet" replace />;
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
