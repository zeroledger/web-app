import { Navigate } from "react-router-dom";
import PageContainer from "@src/components/PageContainer";
import SignIn from "@src/components/Onboarding/SignIn";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";

/**
 * Root route - entry point of the application.
 * Shows SignIn if no wallets, otherwise redirects to /initializing.
 */
export default function Root() {
  const { wallets } = useWalletAdapter();

  // Show SignIn if no wallets
  if (wallets.length === 0) {
    return (
      <PageContainer>
        <SignIn />
      </PageContainer>
    );
  }

  // User has wallets, redirect to initializing route
  // (which will handle link-wallet check via route guard)
  return <Navigate to="/initializing" replace />;
}
