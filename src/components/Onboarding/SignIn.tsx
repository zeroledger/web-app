import { Button } from "@headlessui/react";
import { primaryButtonStyles } from "@src/components/styles/Button.styles";
import WelcomeBanner from "./WelcomeBanner";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { MdEmail } from "react-icons/md";

export default function SignIn() {
  const { signIn } = useWalletAdapter();

  return (
    <>
      <WelcomeBanner />
      <p className="text-center text-sm text-white/60 p-4">
        Get started by signing in with your email.
      </p>
      <div className="max-w-xs flex w-full justify-center">
        <Button className={primaryButtonStyles.small} onClick={signIn}>
          Sign in with <MdEmail className="ml-1" />
        </Button>
      </div>
    </>
  );
}
