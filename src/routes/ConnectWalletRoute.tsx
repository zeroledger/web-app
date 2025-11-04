import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import PageContainer from "@src/components/PageContainer";
import ConnectWallet from "@src/components/Onboarding/ConnectWallet";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
import { getConnectionWalletPreference } from "@src/services/connectionWalletPreference";

/**
 * Link wallet route "/link-wallet"
 * Requirements: User signed in (has evmClients) AND no linking preference set
 */
export default function LinkWalletRoute() {
  const { evmClients, initializing } = useContext(LedgerContext);

  // Still initializing
  if (initializing) {
    return <DumpLoadingScreen />;
  }

  // Not signed in - redirect to root
  if (!evmClients) {
    return <Navigate to="/" replace />;
  }

  // Already made choice - redirect to authorization
  if (getConnectionWalletPreference() !== null) {
    return <Navigate to="/authorization" replace />;
  }

  // Show link wallet choice
  return (
    <PageContainer>
      <ConnectWallet />
    </PageContainer>
  );
}
