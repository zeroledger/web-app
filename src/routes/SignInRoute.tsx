import PageContainer from "@src/components/PageContainer";
import SignIn from "@src/components/Onboarding/SignIn";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { Outlet } from "react-router-dom";

export default function SignInRoute() {
  const { evmClients } = useContext(LedgerContext);

  if (!evmClients) {
    return (
      <PageContainer>
        <SignIn />
      </PageContainer>
    );
  }

  return <Outlet />;
}
