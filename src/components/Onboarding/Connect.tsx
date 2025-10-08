import { Button } from "@headlessui/react";
import { primaryButtonStyle } from "@src/components/styles/Button.styles";
import WelcomeBanner from "./WelcomeBanner";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";

export default function Connect() {
  const { login } = useWalletAdapter();

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
