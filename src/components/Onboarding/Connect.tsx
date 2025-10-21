import { Button } from "@headlessui/react";
import { primaryButtonStyle } from "@src/components/styles/Button.styles";
import WelcomeBanner from "./WelcomeBanner";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { MdEmail } from "react-icons/md";
import { SiWalletconnect } from "react-icons/si";
import clsx from "clsx";
import { ENABLE_EMBEDDED_WALLETS } from "@src/common.constants";

const buttonOverrideStyles = "py-1.5 px-1.5 text-sm/4 w-38";

export default function Connect() {
  const { connect, signIn } = useWalletAdapter();

  const containerClass = clsx(
    "max-w-xs flex w-full flex",
    !ENABLE_EMBEDDED_WALLETS && "justify-center",
    ENABLE_EMBEDDED_WALLETS && "justify-between",
  );

  return (
    <>
      <WelcomeBanner />
      <p className="text-center text-sm text-white/60 p-4">
        Get started by connecting your wallet or signing in with your email.
      </p>
      <div className={containerClass}>
        <Button
          className={clsx(
            primaryButtonStyle,
            ENABLE_EMBEDDED_WALLETS && buttonOverrideStyles,
          )}
          onClick={connect}
        >
          Connect {ENABLE_EMBEDDED_WALLETS && <SiWalletconnect />}
        </Button>
        {ENABLE_EMBEDDED_WALLETS && (
          <Button
            className={clsx(primaryButtonStyle, buttonOverrideStyles)}
            onClick={signIn}
          >
            Sign in with <MdEmail />
          </Button>
        )}
      </div>
    </>
  );
}
