import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
import { Outlet } from "react-router-dom";

export default function RootRoute() {
  const { initializing } = useContext(LedgerContext);

  if (initializing) {
    return <DumpLoadingScreen />;
  }

  return <Outlet />;
}
