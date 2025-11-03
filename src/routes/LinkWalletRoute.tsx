import { Outlet } from "react-router-dom";
import PageContainer from "@src/components/PageContainer";
import LinkWallet from "@src/components/Onboarding/LinkWallet";
import { getLinkWalletPreference } from "@src/services/linkWalletPreference";

export default function LinkWalletRoute() {
  const linkWalletPref = getLinkWalletPreference();

  if (linkWalletPref !== null) {
    return <Outlet />;
  }

  return (
    <PageContainer>
      <LinkWallet />
    </PageContainer>
  );
}
