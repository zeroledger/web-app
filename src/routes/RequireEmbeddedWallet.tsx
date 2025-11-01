import { Navigate, Outlet } from "react-router-dom";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";

/**
 * Route guard that ensures user has an embedded wallet.
 * Redirects to / if user doesn't have an embedded wallet.
 */
export default function RequireEmbeddedWallet() {
  const { embeddedWallet } = useWalletAdapter();

  // If user has embedded wallet but no external wallet and hasn't chosen yet
  if (!embeddedWallet) {
    console.log("No embedded wallet");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
