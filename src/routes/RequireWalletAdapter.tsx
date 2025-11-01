import { Outlet } from "react-router-dom";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";

/**
 * Route guard that waits for Privy wallet adapter to be ready.
 * Shows loading screen while initializing.
 * This should wrap all routes that depend on wallet state.
 */
export default function RequireWalletAdapter() {
  const { adapterReady } = useWalletAdapter();

  if (!adapterReady) {
    return <DumpLoadingScreen />;
  }

  return <Outlet />;
}
