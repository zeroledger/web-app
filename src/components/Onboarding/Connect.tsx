import { usePrivy } from "@privy-io/react-auth";
import { Button, primaryButtonStyle } from "@src/components/Button";
import WelcomeBanner from "./WelcomeBanner";
import { useCallback } from "react";

export default function Connect() {
  const { login, authenticated, logout } = usePrivy();

  const properLogin = useCallback(async () => {
    if (authenticated) {
      await logout();
    }
    login();
  }, [authenticated, login, logout]);

  return (
    <>
      <WelcomeBanner />
      <div className="mt-5 mx-auto">
        <Button className={primaryButtonStyle} onClick={properLogin}>
          Connect
        </Button>
      </div>
    </>
  );
}
