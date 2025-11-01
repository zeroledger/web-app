import { Navigate } from "react-router-dom";
import PageContainer from "@src/components/PageContainer";
import LinkWallet from "@src/components/Onboarding/LinkWallet";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { getLinkWalletPreference } from "@src/services/linkWalletPreference";

/**
 * Link wallet route - requires user to be signed in (have wallets).
 * If no wallets, redirect to root.
 */
export default function LinkWalletRoute() {
  const { wallets } = useWalletAdapter();
  const linkWalletPref = getLinkWalletPreference();

  // Can't link wallet if not signed in
  if (wallets.length === 0) {
    return <Navigate to="/" replace />;
  }

  if (linkWalletPref !== null) {
    return <Navigate to="/panel" replace />;
  }

  return (
    <PageContainer>
      <LinkWallet />
    </PageContainer>
  );
}
