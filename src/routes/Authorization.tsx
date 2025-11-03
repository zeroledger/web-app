import ViewAccountAuthorization from "@src/components/ViewAccountAuthorization/ViewAccountAuthorization";
import PageContainer from "@src/components/PageContainer";
import { Outlet } from "react-router-dom";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";

export default function Authorization() {
  const { authorized } = useContext(LedgerContext);
  if (authorized) {
    return <Outlet />;
  }
  return (
    <PageContainer>
      <ViewAccountAuthorization />
    </PageContainer>
  );
}
