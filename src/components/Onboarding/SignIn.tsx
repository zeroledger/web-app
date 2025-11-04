import { Button } from "@headlessui/react";
import { primaryButtonStyles } from "@src/components/styles/Button.styles";
import WelcomeBanner from "./WelcomeBanner";
import { MdEmail } from "react-icons/md";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";

export default function SignIn() {
  const { signIn } = useContext(LedgerContext);

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
