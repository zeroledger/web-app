import { Navigate, Outlet } from "react-router-dom";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { getLinkWalletPreference } from "@src/components/Onboarding/linkWalletPreference";

/**
 * Route guard that ensures user has made a choice about linking external wallet.
 * Redirects to /link-wallet if:
 * - User has embedded wallet (signed in)
 * - User doesn't have external wallet linked
 * - User hasn't made a choice yet (preference is null)
 */
export default function RequireLinkWalletChoice() {
  const { embeddedWallet, externalWallet } = useWalletAdapter();
  const linkWalletPref = getLinkWalletPreference();

  // If user has embedded wallet but no external wallet and hasn't chosen yet
  if (embeddedWallet && !externalWallet && linkWalletPref === null) {
    return <Navigate to="/link-wallet" replace />;
  }

  return <Outlet />;
}
