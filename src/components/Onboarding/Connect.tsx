import { usePrivy } from "@privy-io/react-auth";
import { Button, primaryButtonStyle } from "@src/components/Button";
import WelcomeBanner from "./WelcomeBanner";

export default function Connect() {
  const { login } = usePrivy();

  return (
    <>
      <WelcomeBanner />
      <div className="mt-5 mx-auto">
        <Button className={primaryButtonStyle} onClick={login}>
          Connect
        </Button>
      </div>
    </>
  );
}
